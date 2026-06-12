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
 * Create a new sub action plan + 2 approval rows.
 *
 * Body:
 *  - action_plan_id       (required)
 *  - name                 (required)
 *  - pic_user_id          (optional)
 *  - weight               (optional)
 *  - approver_user_id_1   (required) — approver order 1
 *  - approver_user_id_2   (required) — approver order 2
 */
async function createSubActionPlan(user, payload) {
  const {
    action_plan_id,
    name,
    pic_user_id,
    weight,
    approver_user_id_1,
    approver_user_id_2,
  } = payload;

  // ── Validation ──
  if (!action_plan_id || !name) {
    const error = new Error("action_plan_id dan name wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!approver_user_id_1 || !approver_user_id_2) {
    const error = new Error(
      "approver_user_id_1 dan approver_user_id_2 wajib diisi",
    );
    error.statusCode = 400;
    throw error;
  }

  if (Number(approver_user_id_1) === Number(approver_user_id_2)) {
    const error = new Error("Approver 1 dan Approver 2 tidak boleh sama");
    error.statusCode = 400;
    throw error;
  }

  if (Number(approver_user_id_1) === Number(user.id) || Number(approver_user_id_2) === Number(user.id)) {
    const error = new Error("Anda tidak dapat menjadi verifikator untuk sub rencana aksi yang Anda ajukan sendiri");
    error.statusCode = 400;
    throw error;
  }

  if (pic_user_id && (Number(approver_user_id_1) === Number(pic_user_id) || Number(approver_user_id_2) === Number(pic_user_id))) {
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

    // ── Create sub action plan ──
    const result = await client.query(
      `
        INSERT INTO sub_action_plans (
          action_plan_id,
          pic_user_id,
          submitted_by_user_id,
          name,
          status,
          weight,
          submitted_at
        )
        VALUES ($1, $2, $3, $4, 'pengajuan', $5, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      [action_plan_id, pic_user_id || null, user.id, name, weight || null],
    );

    const subActionPlan = result.rows[0];

    // ── Create 2 approval rows ──
    await client.query(
      `
        INSERT INTO sub_action_plan_approvals (
          sub_action_plan_id,
          approver_user_id,
          approval_order,
          status
        )
        VALUES
          ($1, $2, 1, 'menunggu'),
          ($1, $3, 2, 'menunggu')
      `,
      [subActionPlan.id, approver_user_id_1, approver_user_id_2],
    );

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
  const { name, pic_user_id, weight } = payload;

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

    // ── Only submitter can edit ──
    if (Number(sap.submitted_by_user_id) !== Number(user.id)) {
      const error = new Error(
        "Hanya pembuat sub rencana aksi yang bisa mengubah",
      );
      error.statusCode = 403;
      throw error;
    }

    // ── Only editable when pengajuan or ditolak ──
    if (!["pengajuan", "ditolak"].includes(sap.status)) {
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

    if (weight !== undefined) {
      sets.push(`weight = $${paramIndex++}`);
      values.push(weight);
    }

    // ── Jika ditolak → resubmit ──
    if (sap.status === "ditolak") {
      sets.push(`status = 'pengajuan'`);
      sets.push(`submitted_at = CURRENT_TIMESTAMP`);
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);

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

    // ── Reset approvals jika resubmit dari ditolak ──
    if (sap.status === "ditolak") {
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

    if (Number(sap.submitted_by_user_id) !== Number(user.id)) {
      const error = new Error(
        "Hanya pembuat sub rencana aksi yang bisa menghapus",
      );
      error.statusCode = 403;
      throw error;
    }

    if (sap.status !== "pengajuan") {
      const error = new Error(
        `Sub rencana aksi tidak bisa dihapus saat status "${sap.status}"`,
      );
      error.statusCode = 422;
      throw error;
    }

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
 * Flow:
 *   pengajuan  → approver 1 setujui → verif_1
 *   verif_1    → approver 2 setujui → verif_2
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

    // ── Only approve when pengajuan or verif_1 ──
    if (!["pengajuan", "verif_1"].includes(sap.status)) {
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

    // ── Validate approval order ──
    const expectedOrder = sap.status === "pengajuan" ? 1 : 2;

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

    // ── Advance sub action plan status ──
    const newStatus = sap.status === "pengajuan" ? "verif_1" : "verif_2";

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
        `Menyetujui (Approver ${expectedOrder}) sub rencana aksi: ${sap.name}`,
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

    if (!["pengajuan", "verif_1"].includes(sap.status)) {
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
    const expectedOrder = sap.status === "pengajuan" ? 1 : 2;

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
    weight: toNumber(row.weight),
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
