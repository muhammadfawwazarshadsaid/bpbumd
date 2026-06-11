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
  const { action_plan_id, name, description } = body;

  if (!action_plan_id) {
    const error = new Error("action_plan_id wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!file) {
    const error = new Error("File wajib diunggah");
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

    // Determine file extension/type
    const ext = path.extname(file.originalname).toLowerCase();
    const fileType = ext.replace(".", "") || "unknown";

    // Build relative file path for storage
    const relativePath = `/uploads/${file.filename}`;

    const result = await client.query(
      `
        INSERT INTO documents (
          action_plan_id, uploaded_by_user_id,
          name, description, original_file_name,
          file_type, file_size, file_path,
          status, uploaded_at
        )
        VALUES (
          $1, $2,
          $3, $4, $5,
          $6, $7, $8,
          'diunggah', CURRENT_TIMESTAMP
        )
        RETURNING *
      `,
      [
        action_plan_id,
        user.id,
        name.trim(),
        description || null,
        file.originalname,
        fileType,
        file.size,
        relativePath,
      ],
    );

    const doc = result.rows[0];

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
  const { name, description } = body;

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
    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext.replace(".", "") || "unknown";
      const relativePath = `/uploads/${file.filename}`;

      sets.push(`original_file_name = $${paramIndex++}`);
      values.push(file.originalname);
      
      sets.push(`file_type = $${paramIndex++}`);
      values.push(fileType);
      
      sets.push(`file_size = $${paramIndex++}`);
      values.push(file.size);
      
      sets.push(`file_path = $${paramIndex++}`);
      values.push(relativePath);

      // Status goes back to 'diunggah' if file changed
      sets.push(`status = $${paramIndex++}`);
      values.push("diunggah");
      
      sets.push(`verified_by_user_id = NULL`);
      sets.push(`verified_at = NULL`);
      sets.push(`rejection_reason = NULL`);

      changes.push(`file diperbarui`);

      // Delete old file from disk
      try {
        const oldAbsolutePath = path.join(__dirname, "../../", doc.file_path);
        if (fs.existsSync(oldAbsolutePath)) {
          fs.unlinkSync(oldAbsolutePath);
        }
      } catch (fsErr) {
        console.error("Failed to delete old file from disk:", fsErr.message);
      }
    } else {
      // If status was rejected and they only updated metadata, move it back to 'diunggah'
      if (doc.status === 'ditolak') {
        sets.push(`status = $${paramIndex++}`);
        values.push("diunggah");
        sets.push(`verified_by_user_id = NULL`);
        sets.push(`verified_at = NULL`);
        sets.push(`rejection_reason = NULL`);
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
      try { fs.unlinkSync(file.path); } catch (e) {}
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

    // Log history
    if (doc.action_plan_id) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Memverifikasi dokumen: ${doc.name}`,
      );
    }

    await client.query("COMMIT");

    return { document_id: Number(documentId), status: "terverifikasi" };
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

    // Log history
    if (doc.action_plan_id) {
      await logHistory(
        client,
        doc.action_plan_id,
        user.id,
        `Menolak dokumen: ${doc.name}${reason ? " — Alasan: " + reason : ""}`,
      );
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
