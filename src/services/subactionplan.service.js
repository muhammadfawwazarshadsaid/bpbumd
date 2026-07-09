"use strict";

const { pool } = require("../config/database");
const { syncProgressHierarchy } = require("./helpers/syncprogress.js");

function toNumber(value) {
  return Number(value || 0);
}

// ═════════════════════════════════════════════
//  SUBMITTER SIDE (yang minta)
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans
 *
 * Create a new sub action plan + N approval rows.
 *
 * Body:
 *  - action_plan_id       (required)
 *  - name                 (required)
 *  - pic_user_id          (optional)
 *  - approvers            (required) - array of user_id, min 1, ordered
 *  - is_draft             (optional)
 *
 * Legacy: also accepts approver_user_id_1 + approver_user_id_2
 */
async function createSubActionPlan(user, payload) {
  const {
    action_plan_id,
    name,
    pic_user_id,
    is_draft,
  } = payload;

  // ── Build approvers array (support legacy + new format) ──
  let approvers = [];
  if (Array.isArray(payload.approvers) && payload.approvers.length > 0) {
    approvers = payload.approvers.map(Number);
  } else if (payload.approver_user_id_1 && payload.approver_user_id_2) {
    approvers = [Number(payload.approver_user_id_1), Number(payload.approver_user_id_2)];
  }

  // ── Validation ──
  if (!action_plan_id || !name) {
    const error = new Error("action_plan_id dan name wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (approvers.length < 1) {
    const error = new Error("Minimal 1 verifikator wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const uniqueApprovers = [...new Set(approvers)];
  if (uniqueApprovers.length !== approvers.length) {
    const error = new Error("Tidak boleh ada verifikator yang sama");
    error.statusCode = 400;
    throw error;
  }

  if (approvers.some(id => id === Number(user.id))) {
    const error = new Error("Anda tidak dapat menjadi verifikator untuk sub rencana aksi yang Anda ajukan sendiri");
    error.statusCode = 400;
    throw error;
  }

  if (pic_user_id && approvers.some(id => id === Number(pic_user_id))) {
    const error = new Error("PIC tidak dapat menjadi verifikator untuk sub rencana aksi miliknya sendiri");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── Verify action plan exists ──
    const apCheck = await client.query(
      "SELECT id FROM action_plans WHERE id = $1",
      [action_plan_id],
    );

    if (apCheck.rowCount === 0) {
      const error = new Error("Action plan tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const initialStatus = is_draft ? 'belum mulai' : 'pengajuan';

    // ── Create sub action plan ──
    const result = await client.query(
      `
        INSERT INTO sub_action_plans (
          action_plan_id,
          pic_user_id,
          submitted_by_user_id,
          name,
          status,
          submitted_at
        )
        VALUES ($1, $2, $3, $4, $5, ${is_draft ? 'NULL' : 'CURRENT_TIMESTAMP'})
        RETURNING *
      `,
      [action_plan_id, pic_user_id || null, user.id, name, initialStatus],
    );

    const subActionPlan = result.rows[0];

    // ── Create N approval rows dynamically ──
    for (let i = 0; i < approvers.length; i++) {
      await client.query(
        `INSERT INTO sub_action_plan_approvals (sub_action_plan_id, approver_user_id, approval_order, status)
         VALUES ($1, $2, $3, 'menunggu')`,
        [subActionPlan.id, approvers[i], i + 1],
      );
    }

    // ── Tmbahkan pencatatan riwayat aktivitas ──
    await client.query(
      `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
      [action_plan_id, user.id, `Mengajukan sub rencana aksi baru: ${name}`],
    );

    await syncProgressHierarchy(client, action_plan_id);
    await client.query("COMMIT");

    return formatSubActionPlan(subActionPlan);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * PUT /api/sub-action-plans/:id
 *
 * Update sub action plan — hanya bisa ketika status = 'pengajuan' atau 'ditolak'.
 * Jika status 'ditolak', update akan otomatis resubmit (status → 'pengajuan').
 *
 * Body:
 *  - name         (optional)
 *  - pic_user_id  (optional)
 *  - weight       (optional)
 */
async function updateSubActionPlan(user, subActionPlanId, payload) {
  const { name, pic_user_id, is_draft, approvers } = payload;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── Lock & verify ──
    const existing = await client.query(
      `
        SELECT id, action_plan_id, name, status, submitted_by_user_id
        FROM sub_action_plans
        WHERE id = $1
        FOR UPDATE
      `,
      [subActionPlanId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Sub rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const sap = existing.rows[0];

    // ── Only submitter can edit (allow if null from import) ──
    if (sap.submitted_by_user_id !== null && Number(sap.submitted_by_user_id) !== Number(user.id)) {
      const error = new Error(
        "Hanya pembuat sub rencana aksi yang bisa mengubah",
      );
      error.statusCode = 403;
      throw error;
    }

    // ── Only editable when belum mulai, pengajuan or ditolak ──
    if (!["belum mulai", "pengajuan", "ditolak"].includes(sap.status)) {
      const error = new Error(
        `Sub rencana aksi tidak bisa diubah saat status "${sap.status}"`,
      );
      error.statusCode = 422;
      throw error;
    }

    // ── Build SET clause dynamically ──
    const sets = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (pic_user_id !== undefined) {
      sets.push(`pic_user_id = $${paramIndex++}`);
      values.push(pic_user_id);
    }

    // weight removed

    // ── Jika belum mulai & disubmit ──
    if (sap.status === "belum mulai" && is_draft === false) {
      sets.push(`status = 'pengajuan'`);
      sets.push(`submitted_at = CURRENT_TIMESTAMP`);
    }

    // ── Jika ditolak → resubmit ──
    if (sap.status === "ditolak" && is_draft === false) {
      sets.push(`status = 'pengajuan'`);
      sets.push(`submitted_at = CURRENT_TIMESTAMP`);
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);

    // ── Claim ownership if it was imported (null) ──
    if (sap.submitted_by_user_id === null) {
      sets.push(`submitted_by_user_id = $${paramIndex++}`);
      values.push(user.id);
    }

    if (sets.length === 0) {
      const error = new Error("Tidak ada data yang diubah");
      error.statusCode = 400;
      throw error;
    }

    values.push(subActionPlanId);

    const result = await client.query(
      `
        UPDATE sub_action_plans
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    );

    // ── Update approvers (verifikator) jika ada ──
    if (approvers !== undefined && Array.isArray(approvers)) {
      await client.query("DELETE FROM sub_action_plan_approvals WHERE sub_action_plan_id = $1", [subActionPlanId]);
      
      for (const approverUserId of approvers) {
        if (!approverUserId) continue;
        const checkUser = await client.query("SELECT company_id FROM users WHERE id = $1 AND is_active = TRUE", [approverUserId]);
        if (checkUser.rowCount === 0) continue;
        
        await client.query(
          `
            INSERT INTO sub_action_plan_approvals (sub_action_plan_id, approver_user_id, approval_order, status)
            VALUES ($1, $2, (SELECT COALESCE(MAX(approval_order), 0) + 1 FROM sub_action_plan_approvals WHERE sub_action_plan_id = $1), 'menunggu')
          `,
          [subActionPlanId, approverUserId]
        );
      }
    }

    // ── Reset approvals jika resubmit ──
    if (is_draft === false && (sap.status === "ditolak" || sap.status === "belum mulai")) {
      await client.query(
        `
          UPDATE sub_action_plan_approvals
          SET
            status = 'menunggu',
            notes = NULL,
            approved_at = NULL,
            rejected_at = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE sub_action_plan_id = $1
        `,
        [subActionPlanId],
      );
    }

    // ── Tambahkan pencatatan riwayat aktivitas ──
    const actionDesc =
      sap.status === "ditolak"
        ? `Mengajukan ulang sub rencana aksi: ${sap.name}`
        : `Memperbarui sub rencana aksi: ${sap.name}`;

    await client.query(
      `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
      [sap.action_plan_id, user.id, actionDesc],
    );

    await syncProgressHierarchy(client, sap.action_plan_id);
    await client.query("COMMIT");

    return formatSubActionPlan(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/sub-action-plans/:id
 *
 * Delete sub action plan — hanya bisa ketika status = 'pengajuan'.
 */
async function deleteSubActionPlan(user, subActionPlanId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT id, action_plan_id, name, status, submitted_by_user_id
        FROM sub_action_plans
        WHERE id = $1
        FOR UPDATE
      `,
      [subActionPlanId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Sub rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const sap = existing.rows[0];

    // Hanya pembuat atau superadmin yang bisa menghapus (atau jika hasil import/null)
    if (
      sap.submitted_by_user_id !== null && 
      Number(sap.submitted_by_user_id) !== Number(user.id) &&
      user.role !== "superadmin"
    ) {
      const error = new Error(
        "Hanya pembuat sub rencana aksi yang bisa menghapus",
      );
      error.statusCode = 403;
      throw error;
    }

    // Diizinkan hapus meski sudah diverifikasi/selesai (sesuai permintaan)

    // Approvals cascade on delete
    await client.query("DELETE FROM sub_action_plans WHERE id = $1", [
      subActionPlanId,
    ]);

    // ── Tambahkan pencatatan riwayat aktivitas ──
    await client.query(
      `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
      [sap.action_plan_id, user.id, `Menghapus sub rencana aksi: ${sap.name}`],
    );

    await syncProgressHierarchy(client, sap.action_plan_id);
    await client.query("COMMIT");

    return { deleted_id: Number(subActionPlanId) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  APPROVER SIDE (yang nyetujuin)
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans/:id/approve
 *
 * Approve sub action plan.
 *
 * Flow (dynamic N approvers):
 *   pengajuan  → approver 1 setujui → verifikasi
 *   verifikasi → approver 2..N-1 setujui → verifikasi
 *   verifikasi → approver N (last) setujui → selesai
 *
 * Body:
 *  - notes (optional)
 */
async function approveSubActionPlan(user, subActionPlanId, payload) {
  const { notes } = payload || {};

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── Lock sub action plan ──
    const sapResult = await client.query(
      `
        SELECT id, action_plan_id, name, status
        FROM sub_action_plans
        WHERE id = $1
        FOR UPDATE
      `,
      [subActionPlanId],
    );

    if (sapResult.rowCount === 0) {
      const error = new Error("Sub rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const sap = sapResult.rows[0];

    // ── Only approve when pengajuan or verifikasi ──
    if (!["pengajuan", "verifikasi"].includes(sap.status)) {
      const error = new Error(
        `Sub rencana aksi tidak bisa disetujui saat status "${sap.status}"`,
      );
      error.statusCode = 422;
      throw error;
    }

    // ── Find the approval row for this approver ──
    const approvalResult = await client.query(
      `
        SELECT id, approval_order, status
        FROM sub_action_plan_approvals
        WHERE
          sub_action_plan_id = $1
          AND approver_user_id = $2
        FOR UPDATE
      `,
      [subActionPlanId, user.id],
    );

    if (approvalResult.rowCount === 0) {
      const error = new Error("Anda bukan approver untuk sub rencana aksi ini");
      error.statusCode = 403;
      throw error;
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== "menunggu") {
      const error = new Error("Anda sudah memberikan approval sebelumnya");
      error.statusCode = 422;
      throw error;
    }

    // ── Validate approval order (dynamic) ──
    // Find the next expected approval_order: the smallest order that is still 'menunggu'
    const nextExpected = await client.query(
      `SELECT MIN(approval_order) AS next_order
       FROM sub_action_plan_approvals
       WHERE sub_action_plan_id = $1 AND status = 'menunggu'`,
      [subActionPlanId],
    );
    const expectedOrder = nextExpected.rows[0].next_order;

    if (approval.approval_order !== expectedOrder) {
      const error = new Error(
        `Belum giliran Anda. Menunggu approver ${expectedOrder} terlebih dahulu`,
      );
      error.statusCode = 422;
      throw error;
    }

    // ── Update approval ──
    await client.query(
      `
        UPDATE sub_action_plan_approvals
        SET
          status = 'setujui',
          notes = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [notes || null, approval.id],
    );

    // ── Determine new status: check if there are more pending approvals ──
    const remaining = await client.query(
      `SELECT COUNT(*) AS cnt FROM sub_action_plan_approvals
       WHERE sub_action_plan_id = $1 AND status = 'menunggu'`,
      [subActionPlanId],
    );
    const newStatus = Number(remaining.rows[0].cnt) === 0 ? "selesai" : "verifikasi";

    const updated = await client.query(
      `
        UPDATE sub_action_plans
        SET
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `,
      [newStatus, subActionPlanId],
    );

    // ── Tambahkan pencatatan riwayat aktivitas ──
    await client.query(
      `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
      [
        sap.action_plan_id,
        user.id,
        `Menyetujui (Approver ${approval.approval_order}) sub rencana aksi: ${sap.name}`,
      ],
    );

    await syncProgressHierarchy(client, sap.action_plan_id);
    await client.query("COMMIT");

    return {
      sub_action_plan: formatSubActionPlan(updated.rows[0]),
      approval: {
        approval_order: approval.approval_order,
        status: "setujui",
        notes: notes || null,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * POST /api/sub-action-plans/:id/reject
 *
 * Reject sub action plan → status = 'ditolak'.
 *
 * Body:
 *  - notes (required) — alasan penolakan
 */
async function rejectSubActionPlan(user, subActionPlanId, payload) {
  const { notes } = payload || {};

  if (!notes) {
    const error = new Error("Alasan penolakan (notes) wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── Lock sub action plan ──
    const sapResult = await client.query(
      `
        SELECT id, action_plan_id, name, status
        FROM sub_action_plans
        WHERE id = $1
        FOR UPDATE
      `,
      [subActionPlanId],
    );

    if (sapResult.rowCount === 0) {
      const error = new Error("Sub rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const sap = sapResult.rows[0];

    if (!["pengajuan", "verifikasi"].includes(sap.status)) {
      const error = new Error(
        `Sub rencana aksi tidak bisa ditolak saat status "${sap.status}"`,
      );
      error.statusCode = 422;
      throw error;
    }

    // ── Find the approval row ──
    const approvalResult = await client.query(
      `
        SELECT id, approval_order, status
        FROM sub_action_plan_approvals
        WHERE
          sub_action_plan_id = $1
          AND approver_user_id = $2
        FOR UPDATE
      `,
      [subActionPlanId, user.id],
    );

    if (approvalResult.rowCount === 0) {
      const error = new Error("Anda bukan approver untuk sub rencana aksi ini");
      error.statusCode = 403;
      throw error;
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== "menunggu") {
      const error = new Error("Anda sudah memberikan approval sebelumnya");
      error.statusCode = 422;
      throw error;
    }

    // ── Validate approval order ──
    // ── Dynamic: find the next expected approval order ──
    const nextExpectedReject = await client.query(
      `SELECT MIN(approval_order) AS next_order
       FROM sub_action_plan_approvals
       WHERE sub_action_plan_id = $1 AND status = 'menunggu'`,
      [subActionPlanId],
    );
    const expectedOrder = nextExpectedReject.rows[0].next_order;

    if (approval.approval_order !== expectedOrder) {
      const error = new Error(
        `Belum giliran Anda. Menunggu approver ${expectedOrder} terlebih dahulu`,
      );
      error.statusCode = 422;
      throw error;
    }

    // ── Update approval → tolak ──
    await client.query(
      `
        UPDATE sub_action_plan_approvals
        SET
          status = 'tolak',
          notes = $1,
          rejected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [notes, approval.id],
    );

    // ── Update sub action plan → ditolak ──
    const updated = await client.query(
      `
        UPDATE sub_action_plans
        SET
          status = 'ditolak',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [subActionPlanId],
    );

    // ── Tambahkan pencatatan riwayat aktivitas ──
    await client.query(
      `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
      [
        sap.action_plan_id,
        user.id,
        `Menolak sub rencana aksi: ${sap.name}. Alasan: ${notes}`,
      ],
    );

    await syncProgressHierarchy(client, sap.action_plan_id);
    await client.query("COMMIT");

    return {
      sub_action_plan: formatSubActionPlan(updated.rows[0]),
      approval: {
        approval_order: approval.approval_order,
        status: "tolak",
        notes,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function formatSubActionPlan(row) {
  return {
    sub_action_plan_id: Number(row.id),
    action_plan_id: Number(row.action_plan_id),
    pic_user_id: row.pic_user_id ? Number(row.pic_user_id) : null,
    submitted_by_user_id: row.submitted_by_user_id
      ? Number(row.submitted_by_user_id)
      : null,
    name: row.name,
    status: row.status,
    weight: 0, // Placeholder if anything relies on it, or just remove
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  createSubActionPlan,
  updateSubActionPlan,
  deleteSubActionPlan,
  approveSubActionPlan,
  rejectSubActionPlan,
};
