"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const documentService = require("../services/document.service");
const { authMiddleware } = require("../middleware/auth.middleware");

// ── Multer configuration ──
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, TXT, CSV, ZIP, atau RAR.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

/**
 * POST /api/documents
 *
 * Upload a document.
 * Content-Type: multipart/form-data
 * Fields: file, action_plan_id, name, description (optional)
 */
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const data = await documentService.uploadDocument(
        req.user,
        req.file,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: "Dokumen berhasil diunggah",
        data,
      });
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Gagal mengunggah dokumen",
      });
    }
  },
);

/**
 * PUT /api/documents/:documentId
 *
 * Update a document metadata and optionally replace the file
 * Content-Type: multipart/form-data
 */
router.put(
  "/:documentId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);

      if (!documentId || isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: "Parameter documentId harus berupa angka",
        });
      }

      const data = await documentService.updateDocument(
        req.user,
        documentId,
        req.file,
        req.body,
      );

      res.json({
        success: true,
        message: "Dokumen berhasil diperbarui",
        data,
      });
    } catch (error) {
      console.error("Update document error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Gagal memperbarui dokumen",
      });
    }
  },
);

/**
 * PUT /api/documents/:documentId/verify
 *
 * Verify a document
 */
router.put("/:documentId/verify", authMiddleware, async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);

    if (!documentId || isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter documentId harus berupa angka",
      });
    }

    const data = await documentService.verifyDocument(req.user, documentId);

    res.json({
      success: true,
      message: "Dokumen berhasil diverifikasi",
      data,
    });
  } catch (error) {
    console.error("Verify document error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal memverifikasi dokumen",
    });
  }
});

/**
 * PUT /api/documents/:documentId/reject
 *
 * Body: { reason }
 *
 * Reject a document
 */
router.put("/:documentId/reject", authMiddleware, async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);

    if (!documentId || isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter documentId harus berupa angka",
      });
    }

    const data = await documentService.rejectDocument(
      req.user,
      documentId,
      req.body.reason,
    );

    res.json({
      success: true,
      message: "Dokumen berhasil ditolak",
      data,
    });
  } catch (error) {
    console.error("Reject document error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menolak dokumen",
    });
  }
});

/**
 * DELETE /api/documents/:documentId
 *
 * Delete a document
 */
router.delete("/:documentId", authMiddleware, async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);

    if (!documentId || isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter documentId harus berupa angka",
      });
    }

    const data = await documentService.deleteDocument(req.user, documentId);

    res.json({
      success: true,
      message: "Dokumen berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus dokumen",
    });
  }
});

/**
 * GET /api/documents/:documentId/download
 *
 * Download a document file
 */
router.get("/:documentId/download", authMiddleware, async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);

    if (!documentId || isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter documentId harus berupa angka",
      });
    }

    const fileInfo =
      await documentService.getDocumentForDownload(documentId);

    res.download(fileInfo.absolutePath, fileInfo.originalFileName);
  } catch (error) {
    console.error("Download document error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengunduh dokumen",
    });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Ukuran file maksimal 25MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
});

module.exports = router;
