"use strict";

const { pool } = require("../config/database");
const fs = require("fs");
const path = require("path");

function toNumber(value) {
  return Number(value || 0);
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

// ═════════════════════════════════════════════
//  UPLOAD DOCUMENT
// ═════════════════════════════════════════════

/**
 * POST /api/documents
 *
 * Uploads a document and associates it with an action plan.
 * Requires multipart/form-data with:
 *  - file         (the file)
 *  - action_plan_id
 *  - name         (document display name)
 *  - description  (optional)
 */
async function uploadDocument(user, file, body) {
  const { action_plan_id, sub_action_plan_id, name, description, link, is_tindak_lanjut, upload_type } = body;

  if (!action_plan_id) {
    const error = new Error("action_plan_id wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const isTindakLanjut = is_tindak_lanjut === 'true' || is_tindak_lanjut === true || upload_type === 'tindak_lanjut';

  if (!file && !link && !isTindakLanjut) {
    const error = new Error("File, Tautan, atau Tindak Lanjut Saja wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error("Nama dokumen wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify action plan exists
    const apCheck = await client.query(
      "SELECT id, name FROM action_plans WHERE id = $1",
      [action_plan_id],
    );

    if (apCheck.rowCount === 0) {
      // Clean up uploaded file
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const error = new Error("Rencana aksi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    // Determine file or link info
    let ext = "";
    let fileType = "";
    let relativePath = "";
    let originalName = "";
    let fileSize = 0;

    if (file) {
      ext = path.extname(file.originalname).toLowerCase();
      fileType = ext.replace(".", "") || "unknown";
      const relativeDir = path.basename(file.destination);
      relativePath = `/uploads/${relativeDir}/${file.filename}`;
      originalName = file.originalname;
      fileSize = file.size;
    } else if (link) {
      fileType = "link";
      relativePath = link;
      originalName = name.trim();
      fileSize = 0;
    } else if (isTindakLanjut) {
      fileType = "tindak_lanjut";
      relativePath = "";
      originalName = name.trim();
      fileSize = 0;
    }

    let final_action_plan_id = action_plan_id;
    let final_sub_action_plan_id = sub_action_plan_id || null;
    if (final_sub_action_plan_id) {
      final_action_plan_id = null;
    }

    const result = await client.query(
      `
        INSERT INTO documents (
          action_plan_id, sub_action_plan_id, uploaded_by_user_id,
          name, description, original_file_name,
          file_type, file_size, file_path,
          status, uploaded_at
        )
        VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7, $8, $9,
          'diunggah', CURRENT_TIMESTAMP
        )
        RETURNING *
      `,
      [
        final_action_plan_id,
        final_sub_action_plan_id,
        user.id,
        name.trim(),
        description || null,
        originalName,
        fileType,
        fileSize,
        relativePath,
      ],
    );

    const doc = result.rows[0];

    if (final_sub_action_plan_id) {
      // Update Sub Action Plan status to 'pengajuan' if it was 'belum mulai'
      await client.query(
        `UPDATE sub_action_plans 
         SET status = 'pengajuan' 
         WHERE id = $1 AND status = 'belum mulai'`,
        [final_sub_action_plan_id]
      );

      // Get approvers from the SRA
      const sraApprovers = await client.query(
        `SELECT approver_user_id, approval_order 
         FROM sub_action_plan_approvals 
         WHERE sub_action_plan_id = $1 
         ORDER BY approval_order ASC`,
        [final_sub_action_plan_id]
      );

      if (sraApprovers.rowCount > 0) {
        for (const approver of sraApprovers.rows) {
          await client.query(
            `INSERT INTO document_approvals (document_id, approver_user_id, approval_order, status)
             VALUES ($1, $2, $3, 'menunggu')`,
            [doc.id, approver.approver_user_id, approver.approval_order]
          );
        }
      }
    } else {
      let approverList = [];
      if (Array.isArray(body.approvers)) {
        approverList = body.approvers.map(Number);
      } else if (Array.isArray(body['approvers[]'])) {
        approverList = body['approvers[]'].map(Number);
      } else if (body['approvers[]']) {
        approverList = [Number(body['approvers[]'])];
      } else if (body.approvers) {
        approverList = [Number(body.approvers)];
      } else if (body.approver_user_id_1 && body.approver_user_id_2) {
        approverList = [Number(body.approver_user_id_1), Number(body.approver_user_id_2)];
      }

      if (approverList.length > 0) {
        for (let i = 0; i < approverList.length; i++) {
          if (approverList[i]) {
            await client.query(
              `INSERT INTO document_approvals (document_id, approver_user_id, approval_order, status)
               VALUES ($1, $2, $3, 'menunggu')`,
              [doc.id, approverList[i], i + 1]
            );
          }
        }
      }
    }

    // Sync hierarchy status and progress
    const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
    await syncProgressHierarchy(client, action_plan_id);

    // Log history
    await logHistory(
      client,
      action_plan_id,
      user.id,
      `Mengunggah dokumen: ${name.trim()}`,
    );

    await client.query("COMMIT");

    return {
      document_id: Number(doc.id),
      document_name: doc.name,
      description: doc.description,
      original_file_name: doc.original_file_name,
      file_type: doc.file_type,
      file_size: toNumber(doc.file_size),
      file_path: doc.file_path,
      status: doc.status,
      uploaded_at: doc.uploaded_at,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE DOCUMENT
// ═════════════════════════════════════════════

/**
 * PUT /api/documents/:documentId
 *
 * Updates document metadata (name, description) and optionally replaces the file.
 */
async function updateDocument(user, documentId, file, body) {
  const { name, description, link, is_tindak_lanjut, upload_type, sub_action_plan_id } = body;

  if (!name || !name.trim()) {
    const error = new Error("Nama dokumen wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT d.*, ap.name AS ap_name
       FROM documents d
       LEFT JOIN action_plans ap ON ap.id = d.action_plan_id
       WHERE d.id = $1
       FOR UPDATE OF d`,
      [documentId]
    );

    if (existing.rowCount === 0) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const error = new Error("Dokumen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const doc = existing.rows[0];

    // Build update query
    let sets = ["name = $1", "description = $2", "updated_at = CURRENT_TIMESTAMP"];
    let values = [name.trim(), description || null];
    let paramIndex = 3;

    let changes = [];
    if (doc.name !== name.trim()) changes.push(`nama menjadi "${name.trim()}"`);

    // Handle Sub Action Plan ID update
    let targetSubActionPlanId = doc.sub_action_plan_id;
    if (sub_action_plan_id !== undefined) {
      if (sub_action_plan_id === '' || sub_action_plan_id === 'null' || sub_action_plan_id === null) {
        targetSubActionPlanId = null;
        sets.push(`sub_action_plan_id = NULL`);
      } else {
        targetSubActionPlanId = Number(sub_action_plan_id);
        sets.push(`sub_action_plan_id = $${paramIndex++}`);
        values.push(targetSubActionPlanId);
      }
    }

    const fileReplaced = !!(file || link || is_tindak_lanjut === 'true' || upload_type === 'tindak_lanjut');

    // Handle optional file replacement
    if (fileReplaced) {
      if (is_tindak_lanjut === 'true' || upload_type === 'tindak_lanjut') {
        sets.push(`original_file_name = $${paramIndex++}`);
        values.push(name.trim());

        sets.push(`file_type = $${paramIndex++}`);
        values.push("tindak_lanjut");

        sets.push(`file_size = $${paramIndex++}`);
        values.push(0);

        sets.push(`file_path = $${paramIndex++}`);
        values.push("");
      } else if (file) {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileType = ext.replace(".", "") || "unknown";
        const relativeDir = path.basename(file.destination);
        const relativePath = `/uploads/${relativeDir}/${file.filename}`;

        sets.push(`original_file_name = $${paramIndex++}`);
        values.push(file.originalname);

        sets.push(`file_type = $${paramIndex++}`);
        values.push(fileType);

        sets.push(`file_size = $${paramIndex++}`);
        values.push(file.size);

        sets.push(`file_path = $${paramIndex++}`);
        values.push(relativePath);
      } else if (link) {
        sets.push(`original_file_name = $${paramIndex++}`);
        values.push(name.trim());

        sets.push(`file_type = $${paramIndex++}`);
        values.push("link");

        sets.push(`file_size = $${paramIndex++}`);
        values.push(0);

        sets.push(`file_path = $${paramIndex++}`);
        values.push(link);
      }

      changes.push(`file/tautan diperbarui`);

      // Delete old file from disk if file was replaced
      if (doc.file_type !== 'link' && doc.file_type !== 'tindak_lanjut' && doc.file_path && doc.file_path.trim() !== '') {
        try {
          const oldAbsolutePath = path.join(__dirname, "../../", doc.file_path);
          if (fs.existsSync(oldAbsolutePath) && fs.statSync(oldAbsolutePath).isFile()) {
            fs.unlinkSync(oldAbsolutePath);
          }
        } catch (fsErr) {
          console.error("Failed to delete old file from disk:", fsErr.message);
        }
      }
    }

    // ── Smart Approver Synchronization ──
    let newApproverList = [];
    if (targetSubActionPlanId) {
      // Get approvers from the SRA
      const sraApprovers = await client.query(
        `SELECT approver_user_id, approval_order 
         FROM sub_action_plan_approvals 
         WHERE sub_action_plan_id = $1 
         ORDER BY approval_order ASC`,
        [targetSubActionPlanId]
      );
      if (sraApprovers.rowCount > 0) {
        newApproverList = sraApprovers.rows.map(r => Number(r.approver_user_id));
      }
    } else {
      if (Array.isArray(body.approvers)) {
        newApproverList = body.approvers.map(Number);
      } else if (Array.isArray(body['approvers[]'])) {
        newApproverList = body['approvers[]'].map(Number);
      } else if (body['approvers[]']) {
        newApproverList = [Number(body['approvers[]'])];
      } else if (body.approvers) {
        newApproverList = [Number(body.approvers)];
      }
    }

    if (newApproverList.length > 0) {
      // Fetch current document_approvals
      const existingApprovalsRes = await client.query(
        `SELECT * FROM document_approvals WHERE document_id = $1 ORDER BY approval_order ASC`,
        [documentId]
      );
      const existingApprovals = existingApprovalsRes.rows;

      // Delete any extra approvals beyond new count
      await client.query(
        `DELETE FROM document_approvals WHERE document_id = $1 AND approval_order > $2`,
        [documentId, newApproverList.length]
      );

      for (let i = 0; i < newApproverList.length; i++) {
        const order = i + 1;
        const newUserId = newApproverList[i];
        if (!newUserId) continue;

        const existingRow = existingApprovals.find(a => Number(a.approval_order) === order);
        if (existingRow) {
          const sameUser = Number(existingRow.approver_user_id) === Number(newUserId);
          const shouldReset = !sameUser || fileReplaced || doc.status === 'ditolak';

          if (shouldReset) {
            await client.query(
              `UPDATE document_approvals 
               SET approver_user_id = $1, status = 'menunggu', notes = NULL, approved_at = NULL, rejected_at = NULL 
               WHERE id = $2`,
              [newUserId, existingRow.id]
            );
          } else {
            // User is the same and file was not replaced -> KEEP existing approval status & notes!
            await client.query(
              `UPDATE document_approvals SET approver_user_id = $1 WHERE id = $2`,
              [newUserId, existingRow.id]
            );
          }
        } else {
          // New approval order -> INSERT
          await client.query(
            `INSERT INTO document_approvals (document_id, approver_user_id, approval_order, status)
             VALUES ($1, $2, $3, 'menunggu')`,
            [documentId, newUserId, order]
          );
        }
      }
    }

    // Determine overall document status based on updated document_approvals
    const currentApprovalsRes = await client.query(
      `SELECT status FROM document_approvals WHERE document_id = $1`,
      [documentId]
    );

    let docOverallStatus = "diunggah";
    if (currentApprovalsRes.rowCount > 0) {
      const allApproved = currentApprovalsRes.rows.every(r => r.status === 'disetujui');
      const anyRejected = currentApprovalsRes.rows.some(r => r.status === 'ditolak');
      const anyApproved = currentApprovalsRes.rows.some(r => r.status === 'disetujui');

      if (allApproved) {
        docOverallStatus = "terverifikasi";
        sets.push(`status = $${paramIndex++}`);
        values.push("terverifikasi");
        sets.push(`verified_at = CURRENT_TIMESTAMP`);
      } else if (anyRejected) {
        docOverallStatus = "ditolak";
        sets.push(`status = $${paramIndex++}`);
        values.push("ditolak");
      } else if (anyApproved) {
        docOverallStatus = "verifikasi";
        sets.push(`status = $${paramIndex++}`);
        values.push("verifikasi");
      } else {
        docOverallStatus = "diunggah";
        sets.push(`status = $${paramIndex++}`);
        values.push("diunggah");
        sets.push(`verified_by_user_id = NULL`);
        sets.push(`verified_at = NULL`);
        sets.push(`rejection_reason = NULL`);
      }
    } else if (fileReplaced || doc.status === 'ditolak') {
      sets.push(`status = $${paramIndex++}`);
      values.push("diunggah");
      sets.push(`verified_by_user_id = NULL`);
      sets.push(`verified_at = NULL`);
      sets.push(`rejection_reason = NULL`);
    }

    values.push(documentId);

    const result = await client.query(
      `
        UPDATE documents
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values
    );

    const updatedDoc = result.rows[0];

    // Sync progress
    const actionPlanId = doc.action_plan_id;
    if (actionPlanId) {
      const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
      await syncProgressHierarchy(client, actionPlanId);

      // Log history
      if (changes.length > 0) {
        await logHistory(
          client,
          actionPlanId,
          user.id,
          `Memperbarui dokumen "${doc.name}": ${changes.join(", ")}`
        );
      }
    }

    await client.query("COMMIT");

    return {
      document_id: Number(updatedDoc.id),
      document_name: updatedDoc.name,
      description: updatedDoc.description,
      original_file_name: updatedDoc.original_file_name,
      file_type: updatedDoc.file_type,
      file_size: toNumber(updatedDoc.file_size),
      file_path: updatedDoc.file_path,
      status: updatedDoc.status,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (file && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) { }
    }
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  VERIFY DOCUMENT
// ═════════════════════════════════════════════

/**
 * PUT /api/documents/:documentId/verify
 *
 * Marks a document as 'terverifikasi'
 */
async function verifyDocument(user, documentId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT d.*, ap.name AS ap_name
       FROM documents d
       LEFT JOIN action_plans ap ON ap.id = d.action_plan_id
       WHERE d.id = $1
       FOR UPDATE OF d`,
      [documentId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Dokumen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const doc = existing.rows[0];

    if (doc.status === "terverifikasi") {
      const error = new Error("Dokumen sudah terverifikasi");
      error.statusCode = 400;
      throw error;
    }

    // if (Number(user.id) === Number(doc.uploaded_by_user_id)) {
    //   const error = new Error("Anda tidak dapat memverifikasi dokumen yang Anda unggah sendiri");
    //   error.statusCode = 403;
    //   throw error;
    // }

    let currentApprovalOrder = null;

    const checkApprovals = await client.query(
      `SELECT COUNT(*)::INT AS cnt FROM document_approvals WHERE document_id = $1`,
      [documentId]
    );

    if (Number(checkApprovals.rows[0].cnt) > 0) {
      // 2-step / multi-step verification logic
      const approvalCheck = await client.query(
        `SELECT * FROM document_approvals 
         WHERE document_id = $1 AND approver_user_id = $2 
         FOR UPDATE`,
        [documentId, user.id]
      );

      if (approvalCheck.rowCount === 0) {
        const error = new Error("Anda tidak berhak memverifikasi dokumen ini");
        error.statusCode = 403;
        throw error;
      }

      const approval = approvalCheck.rows[0];
      currentApprovalOrder = approval.approval_order;

      if (approval.status !== 'menunggu') {
        const error = new Error("Anda sudah memverifikasi dokumen ini");
        error.statusCode = 400;
        throw error;
      }

      // Ensure previous steps are approved
      if (approval.approval_order > 1) {
        const prevApproval = await client.query(
          `SELECT status FROM document_approvals 
           WHERE document_id = $1 AND approval_order = $2`,
          [documentId, approval.approval_order - 1]
        );
        if (prevApproval.rowCount > 0 && prevApproval.rows[0].status !== 'disetujui') {
          const error = new Error("Menunggu persetujuan verifikator sebelumnya");
          error.statusCode = 400;
          throw error;
        }
      }

      await client.query(
        `UPDATE document_approvals 
         SET status = 'disetujui', approved_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [approval.id]
      );

      // Check if all approvals are done
      const allApprovals = await client.query(
        `SELECT status FROM document_approvals WHERE document_id = $1`,
        [documentId]
      );

      let allApproved = allApprovals.rows.every(a => a.status === 'disetujui');

      if (allApproved) {
        doc.status = 'terverifikasi';
        await client.query(
          `UPDATE documents SET status = 'terverifikasi', verified_by_user_id = $1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [user.id, documentId]
        );
      } else {
        doc.status = 'verifikasi';
        await client.query(
          `UPDATE documents SET status = 'verifikasi', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [documentId]
        );
      }
    } else {
      // 1-step verification for Action Plan documents
      doc.status = 'terverifikasi';
      await client.query(
        `
          UPDATE documents
          SET status = 'terverifikasi',
              verified_by_user_id = $1,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [user.id, documentId],
      );
    }

    // Log history
    if (doc.action_plan_id) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Memverifikasi dokumen: ${doc.name}`,
      );
    }

    if (doc.sub_action_plan_id && currentApprovalOrder !== null) {
      try {
        // Lock the SRA approval row for this step to serialize concurrent document verifications
        await client.query(`
          SELECT id FROM sub_action_plan_approvals
          WHERE sub_action_plan_id = $1 AND approval_order = $2
          FOR UPDATE
        `, [doc.sub_action_plan_id, currentApprovalOrder]);

        // Check if all documents for this sub_action_plan have been approved for this step
        const docsAppr = await client.query(`
          SELECT da.status 
          FROM document_approvals da
          JOIN documents d ON d.id = da.document_id
          WHERE d.sub_action_plan_id = $1 AND da.approval_order = $2
        `, [doc.sub_action_plan_id, currentApprovalOrder]);

        const allDocsStepApproved = docsAppr.rows.length > 0 && docsAppr.rows.every(r => r.status === 'disetujui');

        if (allDocsStepApproved) {
          await client.query(`
            UPDATE sub_action_plan_approvals 
            SET status = 'setujui', approved_at = CURRENT_TIMESTAMP, notes = 'Terverifikasi otomatis dari dokumen'
            WHERE sub_action_plan_id = $1 AND approval_order = $2 AND status = 'menunggu'
          `, [doc.sub_action_plan_id, currentApprovalOrder]);

          const sraApprovals = await client.query(`SELECT status FROM sub_action_plan_approvals WHERE sub_action_plan_id = $1`, [doc.sub_action_plan_id]);
          const sraAllApproved = sraApprovals.rows.length > 0 && sraApprovals.rows.every(r => r.status === 'setujui');

          if (sraAllApproved) {
            await client.query(`
              UPDATE sub_action_plans 
              SET status = 'selesai', updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [doc.sub_action_plan_id]);
          } else {
            await client.query(`
              UPDATE sub_action_plans 
              SET status = 'verifikasi', updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [doc.sub_action_plan_id]);
          }

          const sapResult = await client.query("SELECT action_plan_id FROM sub_action_plans WHERE id = $1", [doc.sub_action_plan_id]);
          if (sapResult.rowCount > 0) {
            const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
            await syncProgressHierarchy(client, sapResult.rows[0].action_plan_id);
          }
        }
      } catch (err) {
        console.log("Auto-approve SRA skipped or failed:", err.message);
      }
    } else if (doc.action_plan_id) {
      const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
      await syncProgressHierarchy(client, doc.action_plan_id);
    }

    await client.query("COMMIT");

    return { document_id: Number(documentId), status: doc.status || "terverifikasi" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  REJECT DOCUMENT
// ═════════════════════════════════════════════

/**
 * PUT /api/documents/:documentId/reject
 *
 * Body: { reason }
 *
 * Marks a document as 'ditolak'
 */
async function rejectDocument(user, documentId, reason) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT d.*, ap.name AS ap_name
       FROM documents d
       LEFT JOIN action_plans ap ON ap.id = d.action_plan_id
       WHERE d.id = $1
       FOR UPDATE OF d`,
      [documentId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Dokumen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const doc = existing.rows[0];

    if (Number(user.id) === Number(doc.uploaded_by_user_id)) {
      const error = new Error("Anda tidak dapat menolak dokumen yang Anda unggah sendiri");
      error.statusCode = 403;
      throw error;
    }

    if (doc.sub_action_plan_id) {
      // 2-step rejection logic
      const approvalCheck = await client.query(
        `SELECT * FROM document_approvals 
         WHERE document_id = $1 AND approver_user_id = $2 
         FOR UPDATE`,
        [documentId, user.id]
      );

      if (approvalCheck.rowCount === 0) {
        const error = new Error("Anda tidak berhak menolak dokumen ini");
        error.statusCode = 403;
        throw error;
      }

      const approval = approvalCheck.rows[0];
      if (approval.status !== 'menunggu') {
        const error = new Error("Anda sudah memverifikasi dokumen ini");
        error.statusCode = 400;
        throw error;
      }

      await client.query(
        `UPDATE document_approvals 
         SET status = 'ditolak', notes = $1, rejected_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason || null, approval.id]
      );

      await client.query(
        `UPDATE documents 
         SET status = 'ditolak', verified_by_user_id = $1, rejection_reason = $2, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [user.id, reason || null, documentId]
      );
    } else {
      // 1-step rejection
      await client.query(
        `
          UPDATE documents
          SET status = 'ditolak',
              verified_by_user_id = $1,
              rejection_reason = $2,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [user.id, reason || null, documentId],
      );
    }

    // Log history
    if (doc.action_plan_id) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Menolak dokumen: ${doc.name}${reason ? " — Alasan: " + reason : ""}`,
      );
    }

    if (doc.sub_action_plan_id) {
      await client.query(
        `UPDATE sub_action_plans 
         SET status = 'ditolak', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [doc.sub_action_plan_id]
      );

      await client.query(
        `UPDATE sub_action_plan_approvals 
         SET status = 'tolak', notes = $1, rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE sub_action_plan_id = $2 AND status = 'menunggu'`,
        [reason || 'Ditolak otomatis dari dokumen', doc.sub_action_plan_id]
      );
    }

    let targetActionPlanId = doc.action_plan_id;
    if (!targetActionPlanId && doc.sub_action_plan_id) {
      const sapRes = await client.query("SELECT action_plan_id FROM sub_action_plans WHERE id = $1", [doc.sub_action_plan_id]);
      if (sapRes.rowCount > 0) {
        targetActionPlanId = sapRes.rows[0].action_plan_id;
      }
    }

    if (targetActionPlanId) {
      const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
      await syncProgressHierarchy(client, targetActionPlanId);
    }

    await client.query("COMMIT");

    return { document_id: Number(documentId), status: "ditolak" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE DOCUMENT
// ═════════════════════════════════════════════

/**
 * DELETE /api/documents/:documentId
 *
 * Deletes a document and removes the file from disk.
 */
async function deleteDocument(user, documentId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT * FROM documents WHERE id = $1 FOR UPDATE`,
      [documentId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Dokumen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const doc = existing.rows[0];

    // Log history before deleting
    if (doc.action_plan_id) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Menghapus dokumen: ${doc.name}`,
      );
    }

    await client.query("DELETE FROM documents WHERE id = $1", [documentId]);

    // If sub_action_plan document was deleted, check if any documents remain
    let apIdToSync = doc.action_plan_id;
    if (doc.sub_action_plan_id) {
      const rem = await client.query(
        `SELECT COUNT(*) FROM documents WHERE sub_action_plan_id = $1`,
        [doc.sub_action_plan_id]
      );
      if (Number(rem.rows[0].count) === 0) {
        await client.query(
          `UPDATE sub_action_plans SET status = 'belum mulai' WHERE id = $1 AND status != 'selesai'`,
          [doc.sub_action_plan_id]
        );
      }
      if (!apIdToSync) {
        const sapRes = await client.query(
          `SELECT action_plan_id FROM sub_action_plans WHERE id = $1`,
          [doc.sub_action_plan_id]
        );
        if (sapRes.rowCount > 0) apIdToSync = sapRes.rows[0].action_plan_id;
      }
    }

    if (apIdToSync) {
      const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
      await syncProgressHierarchy(client, apIdToSync);
    }

    await client.query("COMMIT");

    // Clean up file from disk (after commit)
    if (doc.file_type !== 'link' && doc.file_type !== 'tindak_lanjut' && doc.file_path && doc.file_path.trim() !== '') {
      try {
        const absolutePath = path.join(
          __dirname,
          "../../",
          doc.file_path,
        );
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
          fs.unlinkSync(absolutePath);

          // Remove the folder if it's empty
          const dirPath = path.dirname(absolutePath);
          if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
            fs.rmdirSync(dirPath);
          }
        }
      } catch (fsErr) {
        console.error("Failed to delete file from disk:", fsErr.message);
      }
    }

    return {
      deleted_id: Number(documentId),
      deleted_name: doc.name,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  GET DOCUMENT (for download)
// ═════════════════════════════════════════════

/**
 * GET /api/documents/:documentId/download
 *
 * Returns the file info for download.
 */
async function getDocumentForDownload(documentId) {
  const result = await pool.query(
    "SELECT * FROM documents WHERE id = $1",
    [documentId],
  );

  if (result.rowCount === 0) {
    const error = new Error("Dokumen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const doc = result.rows[0];

  if (doc.file_type === 'tindak_lanjut' || !doc.file_path) {
    const error = new Error("Dokumen ini berstatus 'Tindak Lanjut Saja' dan belum memiliki file.");
    error.statusCode = 400;
    throw error;
  }

  const absolutePath = path.join(__dirname, "../../", doc.file_path);

  if (!fs.existsSync(absolutePath)) {
    const error = new Error("File tidak ditemukan di server");
    error.statusCode = 404;
    throw error;
  }

  return {
    absolutePath,
    originalFileName: doc.original_file_name || doc.name,
    fileType: doc.file_type,
  };
}

module.exports = {
  uploadDocument,
  updateDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
  getDocumentForDownload,
};
