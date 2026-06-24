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
  const { action_plan_id, sub_action_plan_id, name, description, link } = body;

  if (!action_plan_id) {
    const error = new Error("action_plan_id wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!file && !link) {
    const error = new Error("File atau Tautan wajib diisi");
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
      if (fs.existsSync(file.path)) {
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
    }

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
  const { name, description, link } = body;

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

    // Handle optional file replacement
    if (file || link) {
      if (file) {
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

      // Status goes back to 'diunggah' if file/link changed
      sets.push(`status = $${paramIndex++}`);
      values.push("diunggah");

      sets.push(`verified_by_user_id = NULL`);
      sets.push(`verified_at = NULL`);
      sets.push(`rejection_reason = NULL`);

      if (doc.sub_action_plan_id) {
        await client.query(
          `UPDATE document_approvals SET status = 'menunggu', notes = NULL, approved_at = NULL, rejected_at = NULL WHERE document_id = $1`,
          [documentId]
        );
      }

      changes.push(`file/tautan diperbarui`);

      // Delete old file from disk
      if (doc.file_type !== 'link' && doc.file_path) {
        try {
          const oldAbsolutePath = path.join(__dirname, "../../", doc.file_path);
          if (fs.existsSync(oldAbsolutePath)) {
            fs.unlinkSync(oldAbsolutePath);
          }
        } catch (fsErr) {
          console.error("Failed to delete old file from disk:", fsErr.message);
        }
      }
    } else {
      // If status was rejected and they only updated metadata, move it back to 'diunggah'
      if (doc.status === 'ditolak') {
        sets.push(`status = $${paramIndex++}`);
        values.push("diunggah");
        sets.push(`verified_by_user_id = NULL`);
        sets.push(`verified_at = NULL`);
        sets.push(`rejection_reason = NULL`);

        if (doc.sub_action_plan_id) {
          await client.query(
            `UPDATE document_approvals SET status = 'menunggu', notes = NULL, approved_at = NULL, rejected_at = NULL WHERE document_id = $1`,
            [documentId]
          );
        }
      }
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

    // Log history
    if (doc.action_plan_id && changes.length > 0) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Memperbarui dokumen "${doc.name}": ${changes.join(", ")}`
      );
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

    if (doc.sub_action_plan_id) {
      // 2-step verification logic
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

            const sapResult = await client.query("SELECT action_plan_id FROM sub_action_plans WHERE id = $1", [doc.sub_action_plan_id]);
            if (sapResult.rowCount > 0) {
              const { syncProgressHierarchy } = require("./helpers/syncprogress.js");
              await syncProgressHierarchy(client, sapResult.rows[0].action_plan_id);
            }
          }
        }
      } catch (err) {
        console.log("Auto-approve SRA skipped or failed:", err.message);
      }
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

    let shouldAutoRejectSRA = false;
    let autoRejectSraId = null;

    if (doc.sub_action_plan_id) {
      shouldAutoRejectSRA = true;
      autoRejectSraId = doc.sub_action_plan_id;
    }

    await client.query("COMMIT");

    if (shouldAutoRejectSRA) {
      try {
        const sapService = require("./subactionplan.service");
        await sapService.rejectSubActionPlan(user, autoRejectSraId, { notes: reason || 'Ditolak otomatis dari dokumen' });
      } catch (err) {
        console.log("Auto-reject SRA skipped or failed:", err.message);
      }
    }

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

    await client.query("COMMIT");

    // Clean up file from disk (after commit)
    try {
      const absolutePath = path.join(
        __dirname,
        "../../",
        doc.file_path,
      );
      if (fs.existsSync(absolutePath)) {
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
