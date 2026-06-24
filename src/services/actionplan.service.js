"use strict";

const { pool } = require("../config/database");
const { syncProgressHierarchy } = require("./helpers/syncprogress.js");

function isHqUser(user) {
  return user.company_type === "bpbumd" || user.company_type === "lainnya";
}

function getCompanyScope(user) {
  if (isHqUser(user)) {
    return null;
  }

  return user.company_id;
}

function toNumber(value) {
  return Number(value || 0);
}

/**
 * GET /api/action-plans/:actionPlanId
 *
 * Returns the full action plan detail page data:
 *  - cards (status, progress breakdown, PIC utama, target selesai, bukti)
 *  - informasi_rencana_aksi (output, indicator, dates, blocked)
 *  - kpis
 *  - riwayat_aktivitas
 *  - sub_rencana_aksi
 *  - dokumen
 */
async function getActionPlanDetail(user, actionPlanId) {
  const companyScopeId = getCompanyScope(user);
  const client = await pool.connect();

  try {
    // ── 1. Validate action plan exists and user has access ──
    const actionPlan = await getActionPlan(
      client,
      actionPlanId,
      companyScopeId,
    );

    if (!actionPlan) {
      const error = new Error("Rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    // ── 2. Fetch all data in parallel ──
    const [
      progressBreakdown,
      documentSummary,
      kpis,
      riwayatAktivitas,
      subRencanaAksi,
      dokumen,
    ] = await Promise.all([
      getProgressBreakdown(client, actionPlanId),
      getDocumentSummary(client, actionPlanId),
      getKpis(client, actionPlanId),
      getRiwayatAktivitas(client, actionPlanId),
      getSubRencanaAksi(client, actionPlanId, user.id),
      getDokumen(client, actionPlanId),
    ]);

    // ── 3. Calculate overdue days ──
    const overdueDays = calculateOverdueDays(
      actionPlan.target_end_date,
      actionPlan.end_date,
    );

    // ── 4. Build cards ──
    const cards = {
      status_rencana_aksi: {
        status: actionPlan.status,
        updated_at: actionPlan.updated_at,
      },

      progres: {
        progress_percentage: actionPlan.progress_percentage,
        breakdown: progressBreakdown,
      },

      pic_utama: actionPlan.pic_utama,

      target_selesai: {
        target_end_date: actionPlan.target_end_date,
        overdue_days: overdueDays,
      },

      bukti: documentSummary,
    };

    // ── 5. Build informasi rencana aksi ──
    const informasiRencanaAksi = {
      output: actionPlan.output,
      penilaian_rencana_aksi: actionPlan.indicator,
      tanggal_mulai: actionPlan.start_date,
      target_tanggal_selesai: actionPlan.target_end_date,
      aktual_tanggal_selesai: actionPlan.end_date,
      is_blocked: actionPlan.is_blocked,
    };

    return {
      action_plan: {
        action_plan_id: actionPlan.action_plan_id,
        action_plan_name: actionPlan.action_plan_name,
        code_order: actionPlan.code_order,
        weight: actionPlan.weight,
        company_id: actionPlan.company_id,
      },

      cards,

      informasi_rencana_aksi: informasiRencanaAksi,

      kpis,

      riwayat_aktivitas: riwayatAktivitas,

      sub_rencana_aksi: subRencanaAksi,

      dokumen,
    };
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
//  ACTION PLAN BASE
// ─────────────────────────────────────────────

async function getActionPlan(client, actionPlanId, companyScopeId) {
  const result = await client.query(
    `
      SELECT
        ap.id              AS action_plan_id,
        ap.name            AS action_plan_name,
        ap.code_order,
        ap.status,
        ap.weight,
        ap.progress_percentage,
        ap.target_percentage,
        ap.start_date,
        ap.end_date,
        ap.target_end_date,
        ap.output,
        ap.indicator,
        ap.is_blocked,
        ap.updated_at,

        pic.id             AS pic_user_id,
        pic.name           AS pic_name,
        pic.role           AS pic_role,

        a.company_id       AS company_id

      FROM action_plans ap
      JOIN activity_groups ag
        ON ag.id = ap.activity_group_id
      JOIN strategies s
        ON s.id = ag.strategy_id
      JOIN aspects a
        ON a.id = s.aspect_id
      JOIN companies c
        ON c.id = a.company_id
      LEFT JOIN users pic
        ON pic.id = ap.pic_user_id
      WHERE
        ap.id = $1
        AND c.company_type = 'bumd'
        AND ($2::BIGINT IS NULL OR a.company_id = $2)
    `,
    [actionPlanId, companyScopeId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    action_plan_id: Number(row.action_plan_id),
    action_plan_name: row.action_plan_name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    start_date: row.start_date,
    end_date: row.end_date,
    target_end_date: row.target_end_date,
    output: row.output,
    indicator: row.indicator,
    is_blocked: row.is_blocked,
    updated_at: row.updated_at,

    company_id: Number(row.company_id),

    pic_utama: row.pic_user_id
      ? {
        user_id: Number(row.pic_user_id),
        name: row.pic_name,
        role: row.pic_role,
      }
      : null,
  };
}

// ─────────────────────────────────────────────
//  PROGRESS BREAKDOWN
//  (from sub_action_plans statuses)
// ─────────────────────────────────────────────

async function getProgressBreakdown(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        COUNT(*)::INT AS total,

        COUNT(*) FILTER (
          WHERE status = 'pengajuan'
        )::INT AS pengajuan,

        COUNT(*) FILTER (
          WHERE status = 'verifikasi'
        )::INT AS verifikasi,

        COUNT(*) FILTER (
          WHERE status = 'selesai'
        )::INT AS selesai,

        COUNT(*) FILTER (
          WHERE status = 'terlambat'
        )::INT AS terlambat,

        COUNT(*) FILTER (
          WHERE status = 'ditolak'
        )::INT AS ditolak,

        COUNT(*) FILTER (
          WHERE status = 'belum mulai'
        )::INT AS belum_mulai

      FROM sub_action_plans
      WHERE action_plan_id = $1
    `,
    [actionPlanId],
  );

  const row = result.rows[0] || {};
  const total = toNumber(row.total);

  const pct = (val) => (total > 0 ? Math.round((val / total) * 100) : 0);

  const selesai = toNumber(row.selesai);
  const pengajuan = toNumber(row.pengajuan);
  const verifikasi = toNumber(row.verifikasi);
  const terlambat = toNumber(row.terlambat);
  const ditolak = toNumber(row.ditolak);
  const belum_mulai = toNumber(row.belum_mulai);

  return {
    total,
    pengajuan,
    verifikasi,
    selesai,
    terlambat,
    ditolak,
    belum_mulai,
    pengajuan_percentage: pct(pengajuan),
    verifikasi_percentage: pct(verifikasi),
    selesai_percentage: pct(selesai),
    terlambat_percentage: pct(terlambat),
    ditolak_percentage: pct(ditolak),
    belum_mulai_percentage: pct(belum_mulai),
  };
}

// ─────────────────────────────────────────────
//  DOCUMENT SUMMARY (for cards)
// ─────────────────────────────────────────────

async function getDocumentSummary(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        COUNT(*)::INT AS total_dokumen,

        COUNT(*) FILTER (
          WHERE status IN ('diunggah', 'verifikasi')
        )::INT AS perlu_verifikasi

      FROM documents d
      WHERE
        d.action_plan_id = $1
        OR d.sub_action_plan_id IN (
          SELECT id FROM sub_action_plans WHERE action_plan_id = $1
        )
    `,
    [actionPlanId],
  );

  const row = result.rows[0] || {};

  return {
    total_dokumen: toNumber(row.total_dokumen),
    perlu_verifikasi: toNumber(row.perlu_verifikasi),
  };
}

// ─────────────────────────────────────────────
//  KPI DAN HASIL
// ─────────────────────────────────────────────

async function getKpis(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        id   AS kpi_id,
        name AS kpi_name,
        status
      FROM kpis
      WHERE action_plan_id = $1
      ORDER BY id
    `,
    [actionPlanId],
  );

  return result.rows.map((row) => ({
    kpi_id: Number(row.kpi_id),
    kpi_name: row.kpi_name,
    status: row.status,
  }));
}

// ─────────────────────────────────────────────
//  RIWAYAT AKTIVITAS
// ─────────────────────────────────────────────

async function getRiwayatAktivitas(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        ha.id            AS history_id,
        ha.description,
        ha.updated_at,
        u.name           AS user_name

      FROM history_activities ha
      LEFT JOIN users u
        ON u.id = ha.user_id
      WHERE
        ha.action_plan_id = $1
      ORDER BY
        ha.updated_at DESC
    `,
    [actionPlanId],
  );

  return result.rows.map((row) => ({
    history_id: Number(row.history_id),
    description: row.description,
    updated_at: row.updated_at,
    user_name: row.user_name,
  }));
}

// ─────────────────────────────────────────────
//  SUB RENCANA AKSI
// ─────────────────────────────────────────────

async function getSubRencanaAksi(client, actionPlanId, userId) {
  // ── 1. Fetch sub action plans ──
  const sapResult = await client.query(
    `
      SELECT
        sap.id              AS sub_action_plan_id,
        sap.name            AS sub_action_plan_name,
        sap.status,
        sap.submitted_at,
        sap.created_at,

        pic.id              AS pic_user_id,
        pic.name            AS pic_name,

        submitter.id        AS submitted_by_user_id,
        submitter.name      AS submitted_by_name

      FROM sub_action_plans sap
      LEFT JOIN users pic
        ON pic.id = sap.pic_user_id
      LEFT JOIN users submitter
        ON submitter.id = sap.submitted_by_user_id
      WHERE
        sap.action_plan_id = $1
      ORDER BY
        sap.id
    `,
    [actionPlanId],
  );

  // ── 2. Fetch all approvals for these sub action plans ──
  const sapIds = sapResult.rows.map((r) => Number(r.sub_action_plan_id));

  let approvalMap = new Map();

  if (sapIds.length > 0) {
    const approvalResult = await client.query(
      `
        SELECT
          sapa.sub_action_plan_id,
          sapa.approval_order,
          sapa.status,
          sapa.notes,
          sapa.approved_at,
          sapa.rejected_at,

          u.id    AS approver_user_id,
          u.name  AS approver_name

        FROM sub_action_plan_approvals sapa
        JOIN users u
          ON u.id = sapa.approver_user_id
        WHERE
          sapa.sub_action_plan_id = ANY($1)
        ORDER BY
          sapa.sub_action_plan_id,
          sapa.approval_order
      `,
      [sapIds],
    );

    for (const row of approvalResult.rows) {
      const key = String(row.sub_action_plan_id);

      if (!approvalMap.has(key)) {
        approvalMap.set(key, []);
      }

      approvalMap.get(key).push({
        approval_order: row.approval_order,
        status: row.status,
        notes: row.notes,
        approved_at: row.approved_at,
        rejected_at: row.rejected_at,
        approver: {
          user_id: Number(row.approver_user_id),
          name: row.approver_name,
        },
      });
    }
  }

  // ── 3. Combine ──
  return sapResult.rows.map((row, index) => {
    const sapIdStr = String(row.sub_action_plan_id);
    const approvals = approvalMap.get(sapIdStr) || [];

    // Calculate needs_my_verification
    let needs_my_verification = false;
    if (userId) {
      const expectedOrder = row.status === 'pengajuan' ? 1 : (row.status === 'verifikasi' ? 2 : null);
      if (expectedOrder) {
        const myApproval = approvals.find(a => 
          a.approval_order === expectedOrder && 
          a.status === 'menunggu' && 
          Number(a.approver.user_id) === Number(userId)
        );
        if (myApproval) {
          needs_my_verification = true;
        }
      }
    }

    return {
      no: index + 1,
      sub_action_plan_id: Number(row.sub_action_plan_id),
      sub_action_plan_name: row.sub_action_plan_name,
      status: row.status,
      weight: toNumber(row.weight),
      submitted_at: row.submitted_at,
      created_at: row.created_at,
      pic: row.pic_user_id
        ? {
          user_id: Number(row.pic_user_id),
          name: row.pic_name,
        }
        : null,
      submitted_by: row.submitted_by_user_id
        ? {
          user_id: Number(row.submitted_by_user_id),
          name: row.submitted_by_name,
        }
        : null,
      approvals,
      needs_my_verification,
    };
  });
}

// ─────────────────────────────────────────────
//  BUKTI DAN DOKUMEN
// ─────────────────────────────────────────────

async function getDokumen(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        d.id AS document_id,
        d.name AS document_name,
        d.description,
        d.original_file_name,
        d.file_type,
        d.file_size,
        d.file_path,
        d.status,
        d.uploaded_at,
        d.verified_at,
        d.rejection_reason,
        d.sub_action_plan_id,
        sap.name AS sub_action_plan_name,

        (
          SELECT json_agg(json_build_object(
            'id', da.id,
            'approver_user_id', da.approver_user_id,
            'approval_order', da.approval_order,
            'status', da.status,
            'notes', da.notes,
            'approver_name', ua.name
          ) ORDER BY da.approval_order ASC)
          FROM document_approvals da
          JOIN users ua ON ua.id = da.approver_user_id
          WHERE da.document_id = d.id
        ) AS approvals,

        uploader.id AS uploaded_by_user_id,
        uploader.name AS uploaded_by_name,
        verifier.id AS verified_by_user_id,
        verifier.name AS verified_by_name

      FROM documents d
      LEFT JOIN users uploader
        ON uploader.id = d.uploaded_by_user_id
      LEFT JOIN users verifier
        ON verifier.id = d.verified_by_user_id
      LEFT JOIN sub_action_plans sap
        ON sap.id = d.sub_action_plan_id
      WHERE
        d.action_plan_id = $1
        OR d.sub_action_plan_id IN (
          SELECT id FROM sub_action_plans WHERE action_plan_id = $1
        )
      ORDER BY
        d.uploaded_at DESC
    `,
    [actionPlanId],
  );

  return result.rows.map((row) => ({
    document_id: Number(row.document_id),
    document_name: row.document_name,
    description: row.description,
    original_file_name: row.original_file_name,
    file_type: row.file_type,
    file_size: toNumber(row.file_size),
    file_path: row.file_path,
    status: row.status,
    rejection_reason: row.rejection_reason,
    sub_action_plan_id: row.sub_action_plan_id ? Number(row.sub_action_plan_id) : null,
    sub_action_plan_name: row.sub_action_plan_name,
    uploaded_at: row.uploaded_at,
    verified_at: row.verified_at,
    uploaded_by: row.uploaded_by_user_id
      ? {
        user_id: Number(row.uploaded_by_user_id),
        name: row.uploaded_by_name,
      }
      : null,
    verified_by: row.verified_by_user_id
      ? {
        user_id: Number(row.verified_by_user_id),
        name: row.verified_by_name,
      }
      : null,
    approvals: row.approvals || []
  }));
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function calculateOverdueDays(targetEndDate, actualEndDate) {
  if (!targetEndDate) {
    return null;
  }

  const target = new Date(targetEndDate);
  const compareDate = actualEndDate ? new Date(actualEndDate) : new Date();

  const diffMs = compareDate.getTime() - target.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

async function logHistory(client, actionPlanId, userId, description) {
  await client.query(
    `
      INSERT INTO history_activities (action_plan_id, user_id, description)
      VALUES ($1, $2, $3)
    `,
    [actionPlanId, userId, description],
  );
}

function formatActionPlanRow(row) {
  return {
    action_plan_id: Number(row.id),
    activity_group_id: Number(row.activity_group_id),
    pic_user_id: row.pic_user_id ? Number(row.pic_user_id) : null,
    name: row.name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    start_date: row.start_date,
    end_date: row.end_date,
    target_end_date: row.target_end_date,
    output: row.output,
    indicator: row.indicator,
    is_blocked: row.is_blocked,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ═════════════════════════════════════════════
//  CREATE ACTION PLAN
// ═════════════════════════════════════════════

/**
 * POST /api/action-plans
 *
 * Body:
 *  - activity_group_id    (required)
 *  - name                 (required)
 *  - code_order           (optional)
 *  - pic_user_id          (optional)
 *  - target_percentage    (optional)
 *  - start_date           (optional)
 *  - target_end_date      (optional)
 *  - output               (optional)
 *  - indicator            (optional)
 */
async function createActionPlan(user, payload) {
  const {
    activity_group_id,
    name,
    code_order,
    pic_user_id,
    target_percentage,
    start_date,
    target_end_date,
    output,
    indicator,
  } = payload;

  if (!activity_group_id || !name) {
    const error = new Error("activity_group_id dan name wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify activity group exists
    const agCheck = await client.query(
      "SELECT id FROM activity_groups WHERE id = $1",
      [activity_group_id],
    );

    if (agCheck.rowCount === 0) {
      const error = new Error("Activity group tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const result = await client.query(
      `
        INSERT INTO action_plans (
          activity_group_id, pic_user_id, name, code_order,
          status, weight, progress_percentage, target_percentage,
          start_date, end_date, target_end_date,
          output, indicator, is_blocked
        )
        VALUES (
          $1, $2, $3, $4,
          'belum mulai', 0, 0, $5,
          $6, NULL, $7,
          $8, $9, FALSE
        )
        RETURNING *
      `,
      [
        activity_group_id,
        pic_user_id || null,
        name,
        code_order || null,
        target_percentage || null,
        start_date || null,
        target_end_date || null,
        output || null,
        indicator || null,
      ],
    );

    const ap = result.rows[0];

    // ── Riwayat Aktivitas ──
    await logHistory(
      client,
      ap.id,
      user.id,
      `Membuat rencana aksi baru: ${name}`,
    );

    await syncProgressHierarchy(client, ap.id);
    await client.query("COMMIT");

    return formatActionPlanRow(ap);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE ACTION PLAN
// ═════════════════════════════════════════════

/**
 * PUT /api/action-plans/:actionPlanId
 *
 * Body (all optional):
 *  - name
 *  - code_order
 *  - pic_user_id
 *  - status
 *  - weight
 *  - progress_percentage
 *  - target_percentage
 *  - start_date
 *  - end_date
 *  - target_end_date
 *  - output
 *  - indicator
 *  - is_blocked
 */
async function updateActionPlan(user, actionPlanId, payload) {
  const ALLOWED_STATUS = [
    "belum mulai",
    "dalam progres",
    "selesai",
    "terlambat",
  ];

  if (
    payload.status !== undefined &&
    !ALLOWED_STATUS.includes(payload.status)
  ) {
    const error = new Error(
      `Status tidak valid. Gunakan: ${ALLOWED_STATUS.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock & verify
    const existing = await client.query(
      `
        SELECT ap.*
        FROM action_plans ap
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE ap.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [actionPlanId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const old = existing.rows[0];

    // ── Build SET dynamically ──
    const FIELDS = [
      "name",
      "code_order",
      "pic_user_id",
      "status",
      "weight",
      "progress_percentage",
      "target_percentage",
      "start_date",
      "end_date",
      "target_end_date",
      "output",
      "indicator",
      "is_blocked",
    ];

    const sets = [];
    const values = [];
    const changes = [];
    let paramIndex = 1;

    for (const field of FIELDS) {
      if (payload[field] !== undefined) {
        sets.push(`${field} = $${paramIndex++}`);
        values.push(payload[field]);

        // Track what changed for history
        const oldVal = old[field];
        const newVal = payload[field];

        if (String(oldVal) !== String(newVal)) {
          changes.push(`${field}: "${oldVal ?? "-"}" → "${newVal}"`);
        }
      }
    }

    if (sets.length === 0) {
      const error = new Error("Tidak ada data yang diubah");
      error.statusCode = 400;
      throw error;
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    values.push(actionPlanId);

    const result = await client.query(
      `
        UPDATE action_plans
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    );

    // ── Riwayat Aktivitas ──
    if (changes.length > 0) {
      const description = `Memperbarui rencana aksi "${old.name}": ${changes.join("; ")}`;

      await logHistory(client, actionPlanId, user.id, description);
    }

    await syncProgressHierarchy(client, actionPlanId);
    await client.query("COMMIT");

    return formatActionPlanRow(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE ACTION PLAN
// ═════════════════════════════════════════════

/**
 * DELETE /api/action-plans/:actionPlanId
 *
 * Tidak bisa dihapus jika masih ada sub action plan.
 * History tetap dicatat sebelum penghapusan.
 */
async function deleteActionPlan(user, actionPlanId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT ap.id, ap.name, ap.activity_group_id
        FROM action_plans ap
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE ap.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [actionPlanId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const ap = existing.rows[0];

    // Check for child sub action plans
    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM sub_action_plans WHERE action_plan_id = $1",
      [actionPlanId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        `Rencana aksi tidak bisa dihapus karena masih memiliki ${childCheck.rows[0].count} sub rencana aksi`,
      );
      error.statusCode = 422;
      throw error;
    }

    // Delete related data (cascades handle documents, kpis, history)
    // History is cascade-deleted automatically due to ON DELETE CASCADE.

    await client.query("DELETE FROM action_plans WHERE id = $1", [
      actionPlanId,
    ]);

    await syncProgressHierarchy(client, null, ap.activity_group_id);
    await client.query("COMMIT");

    return {
      deleted_id: Number(actionPlanId),
      deleted_name: ap.name,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getActionPlanDetail,
  createActionPlan,
  updateActionPlan,
  deleteActionPlan,
};
