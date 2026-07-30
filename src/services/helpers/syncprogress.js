/**
 * Fungsi untuk menyinkronkan progress_percentage dari bawah ke atas.
 * @param {object} client - Koneksi database (pool.connect())
 * @param {number} actionPlanId - ID Action Plan (opsional jika dihapus)
 * @param {number} fallbackActivityGroupId - ID Activity Group (digunakan khusus saat Action Plan dihapus)
 */
async function syncProgressHierarchy(client, actionPlanId, fallbackActivityGroupId = null) {
  let agId = fallbackActivityGroupId;
  let sId = null;
  let aId = null;

  // ── 0. Update status Sub Rencana Aksi berdasarkan persetujuan (approvals) ──
  await client.query(`
    UPDATE sub_action_plans sap
    SET status = CASE
      WHEN EXISTS (
        SELECT 1 FROM sub_action_plan_approvals sapa 
        WHERE sapa.sub_action_plan_id = sap.id AND sapa.status IN ('ditolak', 'tolak')
      ) OR EXISTS (
        SELECT 1 FROM documents d
        WHERE d.sub_action_plan_id = sap.id AND d.status = 'ditolak'
      ) THEN 'ditolak'
      WHEN (
        SELECT COUNT(*) FROM sub_action_plan_approvals sapa 
        WHERE sapa.sub_action_plan_id = sap.id
      ) > 0 AND NOT EXISTS (
        SELECT 1 FROM sub_action_plan_approvals sapa 
        WHERE sapa.sub_action_plan_id = sap.id AND sapa.status != 'setujui'
      ) THEN 'selesai'
      WHEN EXISTS (
        SELECT 1 FROM sub_action_plan_approvals sapa 
        WHERE sapa.sub_action_plan_id = sap.id AND sapa.status = 'setujui'
      ) THEN 'verifikasi'
      WHEN sap.status = 'belum mulai' THEN 'belum mulai'
      ELSE 'pengajuan'
    END
    WHERE sap.deleted_at IS NULL
      AND ($1::BIGINT IS NULL OR sap.action_plan_id = $1)
  `, [actionPlanId || null]);

  // ── 1. Update Rencana Aksi (Action Plan) berdasarkan Sub Rencana Aksi ATAU Dokumen ──
  if (actionPlanId) {
    await client.query(`
      UPDATE action_plans ap
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND((SUM(CASE WHEN status = 'pengajuan' THEN 30 WHEN status = 'verifikasi' THEN 65 WHEN status = 'selesai' THEN 100 ELSE 0 END))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC, 2)
           FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL),
          (SELECT ROUND((SUM(CASE WHEN status = 'terverifikasi' THEN 100 WHEN status = 'verifikasi' THEN 65 WHEN status = 'diunggah' THEN 30 ELSE 0 END))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC, 2)
           FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL),
          0
        ),
        start_date = COALESCE(
          (SELECT MIN(created_at) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL), 
          (SELECT MIN(uploaded_at) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL),
          ap.start_date
        ),
        end_date = CASE 
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL) > 0 
               AND (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status != 'selesai') = 0 
          THEN (SELECT MAX(updated_at) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status = 'selesai')
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL) = 0
               AND (SELECT COUNT(*) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL AND status = 'terverifikasi') > 0
          THEN (SELECT MAX(updated_at) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL AND status = 'terverifikasi')
          ELSE NULL
        END,
        status = CASE
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL) > 0 AND (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status != 'selesai') = 0 THEN 
            CASE 
              WHEN ap.target_end_date IS NOT NULL AND (SELECT MAX(updated_at) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status = 'selesai')::DATE > ap.target_end_date THEN 'selesai terlambat'
              ELSE 'selesai'
            END
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL) = 0
               AND (SELECT COUNT(*) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL AND status = 'terverifikasi') > 0 THEN 'selesai'
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status = 'ditolak') > 0
               AND (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status NOT IN ('ditolak', 'belum mulai')) = 0 THEN 'ditolak'
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL) = 0
               AND (SELECT COUNT(*) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL AND status = 'ditolak') > 0 THEN 'ditolak'
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND deleted_at IS NULL AND status != 'belum mulai') = 0
               AND (SELECT COUNT(*) FROM documents WHERE action_plan_id = ap.id AND sub_action_plan_id IS NULL) = 0 THEN 'belum mulai'
          WHEN ap.target_end_date < CURRENT_DATE THEN 'terlambat'
          ELSE 'dalam progres'
        END
      WHERE id = $1
    `, [actionPlanId]);

    // Ambil ID hirarki di atasnya
    const rel = await client.query(`
      SELECT ag.id AS ag_id, s.id AS s_id, a.id AS a_id
      FROM action_plans ap
      JOIN activity_groups ag ON ag.id = ap.activity_group_id
      JOIN strategies s ON s.id = ag.strategy_id
      JOIN aspects a ON a.id = s.aspect_id
      WHERE ap.id = $1
    `, [actionPlanId]);

    if (rel.rowCount > 0) {
      agId = rel.rows[0].ag_id;
      sId = rel.rows[0].s_id;
      aId = rel.rows[0].a_id;
    }
  }

  // Jika Action Plan dihapus, kita ambil hirarki dari fallback Activity Group
  if (!actionPlanId && fallbackActivityGroupId) {
    const rel = await client.query(`
      SELECT s.id AS s_id, a.id AS a_id
      FROM activity_groups ag
      JOIN strategies s ON s.id = ag.strategy_id
      JOIN aspects a ON a.id = s.aspect_id
      WHERE ag.id = $1
    `, [fallbackActivityGroupId]);

    if (rel.rowCount > 0) {
      sId = rel.rows[0].s_id;
      aId = rel.rows[0].a_id;
    }
  }

  // Jika tidak ditemukan hirarki, hentikan proses
  if (!agId) return;

  // ── 2. Update Activity Group berdasarkan Rencana Aksi ──
  await client.query(`
    UPDATE activity_groups ag
    SET 
      progress_percentage = COALESCE(
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(ap.weight, 0)) = 0 THEN 
               COALESCE(ROUND(AVG(ap.progress_percentage), 2), 0)
             ELSE ROUND(SUM((ap.progress_percentage * COALESCE(ap.weight, 0)) / 100.0), 2)
           END
         FROM action_plans ap
         WHERE ap.activity_group_id = ag.id AND ap.deleted_at IS NULL), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND deleted_at IS NULL) > 0 AND (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND deleted_at IS NULL AND status != 'selesai') = 0 THEN 
          CASE WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND deleted_at IS NULL AND status = 'selesai terlambat') > 0 THEN 'selesai terlambat' ELSE 'selesai' END
        WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND deleted_at IS NULL AND status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND deleted_at IS NULL AND status != 'belum mulai') = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [agId]);

  // ── 3. Update Strategi berdasarkan Rencana Aksi ──
  await client.query(`
    UPDATE strategies s
    SET 
      progress_percentage = COALESCE(
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(ag.weight, 0)) = 0 THEN 
               COALESCE(ROUND(AVG(ag.progress_percentage), 2), 0)
             ELSE ROUND(SUM((ag.progress_percentage * COALESCE(ag.weight, 0)) / 100.0), 2)
           END
         FROM activity_groups ag
         WHERE ag.strategy_id = s.id), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM activity_groups ag WHERE ag.strategy_id = s.id) > 0 AND (SELECT COUNT(*) FROM activity_groups ag WHERE ag.strategy_id = s.id AND ag.status != 'selesai') = 0 THEN 'selesai'
        WHEN (SELECT COUNT(*) FROM activity_groups ag WHERE ag.strategy_id = s.id AND ag.status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM activity_groups ag WHERE ag.strategy_id = s.id AND ag.status != 'belum mulai') = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [sId]);

  // ── 4. Update Aspek berdasarkan Rencana Aksi ──
  await client.query(`
    UPDATE aspects a
    SET 
      progress_percentage = COALESCE(
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(s.weight, 0)) = 0 THEN 
               COALESCE(ROUND(AVG(s.progress_percentage), 2), 0)
             ELSE ROUND(SUM((s.progress_percentage * COALESCE(s.weight, 0)) / 100.0), 2)
           END
         FROM strategies s
         WHERE s.aspect_id = a.id), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM strategies s WHERE s.aspect_id = a.id) > 0 AND (SELECT COUNT(*) FROM strategies s WHERE s.aspect_id = a.id AND s.status != 'selesai') = 0 THEN 'selesai'
        WHEN (SELECT COUNT(*) FROM strategies s WHERE s.aspect_id = a.id AND s.status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM strategies s WHERE s.aspect_id = a.id AND s.status != 'belum mulai') = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [aId]);
}

module.exports = { syncProgressHierarchy };