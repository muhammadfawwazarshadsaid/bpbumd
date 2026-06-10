"use strict";

const { pool } = require("../config/database");

function isHqUser(user) {
  return user.company_type === "bpbumd";
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
    const actionPlan = await getActionPlan(client, actionPlanId, companyScopeId);

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
      getSubRencanaAksi(client, actionPlanId),
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
        pic.role           AS pic_role

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
          WHERE status = 'verif_1'
        )::INT AS verif_1,

        COUNT(*) FILTER (
          WHERE status = 'verif_2'
        )::INT AS verif_2,

        COUNT(*) FILTER (
          WHERE status = 'selesai'
        )::INT AS selesai,

        COUNT(*) FILTER (
          WHERE status = 'terlambat'
        )::INT AS terlambat,

        COUNT(*) FILTER (
          WHERE status = 'ditolak'
        )::INT AS ditolak

      FROM sub_action_plans
      WHERE action_plan_id = $1
    `,
    [actionPlanId],
  );

  const row = result.rows[0] || {};
  const total = toNumber(row.total);

  const pct = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

  const selesai = toNumber(row.selesai);
  const pengajuan = toNumber(row.pengajuan);
  const verif_1 = toNumber(row.verif_1);
  const verif_2 = toNumber(row.verif_2);
  const terlambat = toNumber(row.terlambat);
  const ditolak = toNumber(row.ditolak);

  return {
    total,
    pengajuan,
    verif_1,
    verif_2,
    selesai,
    terlambat,
    ditolak,
    pengajuan_percentage: pct(pengajuan),
    verif_1_percentage: pct(verif_1),
    verif_2_percentage: pct(verif_2),
    selesai_percentage: pct(selesai),
    terlambat_percentage: pct(terlambat),
    ditolak_percentage: pct(ditolak),
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
          WHERE status = 'diunggah'
        )::INT AS perlu_verifikasi

      FROM documents
      WHERE action_plan_id = $1
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

async function getSubRencanaAksi(client, actionPlanId) {
  // ── 1. Fetch sub action plans ──
  const sapResult = await client.query(
    `
      SELECT
        sap.id              AS sub_action_plan_id,
        sap.name            AS sub_action_plan_name,
        sap.status,
        sap.weight,
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
  return sapResult.rows.map((row, index) => ({
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
    approvals: approvalMap.get(String(row.sub_action_plan_id)) || [],
  }));
}

// ─────────────────────────────────────────────
//  BUKTI DAN DOKUMEN
// ─────────────────────────────────────────────

async function getDokumen(client, actionPlanId) {
  const result = await client.query(
    `
      SELECT
        d.id                 AS document_id,
        d.name               AS document_name,
        d.description,
        d.original_file_name,
        d.file_type,
        d.file_size,
        d.file_path,
        d.status,
        d.rejection_reason,
        d.uploaded_at,
        d.verified_at,

        uploader.id          AS uploaded_by_user_id,
        uploader.name        AS uploaded_by_name,

        verifier.id          AS verified_by_user_id,
        verifier.name        AS verified_by_name

      FROM documents d
      LEFT JOIN users uploader
        ON uploader.id = d.uploaded_by_user_id
      LEFT JOIN users verifier
        ON verifier.id = d.verified_by_user_id
      WHERE
        d.action_plan_id = $1
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

  // Positive = overdue, Negative = days remaining, 0 = on time
  return diffDays;
}

module.exports = {
  getActionPlanDetail,
};
