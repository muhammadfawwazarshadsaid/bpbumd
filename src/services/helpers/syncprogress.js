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

  // ── 1. Update Rencana Aksi (Action Plan) berdasarkan Sub Rencana Aksi ──
  if (actionPlanId) {
    await client.query(`
      UPDATE action_plans ap
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND((COUNT(*) FILTER (WHERE status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
           FROM sub_action_plans WHERE action_plan_id = ap.id), 0
        ),
        start_date = COALESCE(
          (SELECT MIN(created_at) FROM sub_action_plans WHERE action_plan_id = ap.id), 
          ap.start_date
        ),
        end_date = CASE 
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id) > 0 
               AND (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND status != 'selesai') = 0 
          THEN (SELECT MAX(updated_at) FROM sub_action_plans WHERE action_plan_id = ap.id AND status = 'selesai')
          ELSE NULL
        END,
        status = CASE
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id) > 0 AND (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id AND status != 'selesai') = 0 THEN 
            CASE 
              WHEN ap.target_end_date IS NOT NULL AND (SELECT MAX(updated_at) FROM sub_action_plans WHERE action_plan_id = ap.id AND status = 'selesai')::DATE > ap.target_end_date THEN 'selesai terlambat'
              ELSE 'selesai'
            END
          WHEN ap.target_end_date < CURRENT_DATE THEN 'terlambat'
          WHEN (SELECT COUNT(*) FROM sub_action_plans WHERE action_plan_id = ap.id) = 0 THEN 'belum mulai'
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
        (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
         FROM sub_action_plans sap
         JOIN action_plans ap ON ap.id = sap.action_plan_id
         WHERE ap.activity_group_id = ag.id), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id WHERE ap.activity_group_id = ag.id) > 0 AND (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id WHERE ap.activity_group_id = ag.id AND sap.status != 'selesai') = 0 THEN 
          CASE WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND status = 'selesai terlambat') > 0 THEN 'selesai terlambat' ELSE 'selesai' END
        WHEN (SELECT COUNT(*) FROM action_plans WHERE activity_group_id = ag.id AND status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id WHERE ap.activity_group_id = ag.id) = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [agId]);

  // ── 3. Update Strategi berdasarkan Rencana Aksi ──
  await client.query(`
    UPDATE strategies s
    SET 
      progress_percentage = COALESCE(
        (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
         FROM sub_action_plans sap
         JOIN action_plans ap ON ap.id = sap.action_plan_id
         JOIN activity_groups ag ON ag.id = ap.activity_group_id
         WHERE ag.strategy_id = s.id), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id WHERE ag.strategy_id = s.id) > 0 AND (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id WHERE ag.strategy_id = s.id AND sap.status != 'selesai') = 0 THEN 
          CASE WHEN (SELECT COUNT(*) FROM action_plans ap JOIN activity_groups ag ON ag.id = ap.activity_group_id WHERE ag.strategy_id = s.id AND ap.status = 'selesai terlambat') > 0 THEN 'selesai terlambat' ELSE 'selesai' END
        WHEN (SELECT COUNT(*) FROM action_plans ap JOIN activity_groups ag ON ag.id = ap.activity_group_id WHERE ag.strategy_id = s.id AND ap.status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id WHERE ag.strategy_id = s.id) = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [sId]);

  // ── 4. Update Aspek berdasarkan Rencana Aksi ──
  await client.query(`
    UPDATE aspects a
    SET 
      progress_percentage = COALESCE(
        (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
         FROM sub_action_plans sap
         JOIN action_plans ap ON ap.id = sap.action_plan_id
         JOIN activity_groups ag ON ag.id = ap.activity_group_id
         JOIN strategies s ON s.id = ag.strategy_id
         WHERE s.aspect_id = a.id), 0
      ),
      status = CASE
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id JOIN strategies s ON s.id = ag.strategy_id WHERE s.aspect_id = a.id) > 0 AND (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id JOIN strategies s ON s.id = ag.strategy_id WHERE s.aspect_id = a.id AND sap.status != 'selesai') = 0 THEN 
          CASE WHEN (SELECT COUNT(*) FROM action_plans ap JOIN activity_groups ag ON ag.id = ap.activity_group_id JOIN strategies s ON s.id = ag.strategy_id WHERE s.aspect_id = a.id AND ap.status = 'selesai terlambat') > 0 THEN 'selesai terlambat' ELSE 'selesai' END
        WHEN (SELECT COUNT(*) FROM action_plans ap JOIN activity_groups ag ON ag.id = ap.activity_group_id JOIN strategies s ON s.id = ag.strategy_id WHERE s.aspect_id = a.id AND ap.status = 'terlambat') > 0 THEN 'terlambat'
        WHEN (SELECT COUNT(*) FROM sub_action_plans sap JOIN action_plans ap ON ap.id = sap.action_plan_id JOIN activity_groups ag ON ag.id = ap.activity_group_id JOIN strategies s ON s.id = ag.strategy_id WHERE s.aspect_id = a.id) = 0 THEN 'belum mulai'
        ELSE 'dalam progres'
      END
    WHERE id = $1
  `, [aId]);
}

module.exports = { syncProgressHierarchy };