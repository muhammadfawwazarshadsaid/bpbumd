"use strict";

const express = require("express");
const router = express.Router();

const bumdService = require("../services/bumd.service");
const { authMiddleware } = require("../middleware/auth.middleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require("fs");
    const uploadPath = path.join(__dirname, "../../uploads/logos");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

/**
 * GET /api/bumds
 * Query: ?search=&sector_id=
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await bumdService.getAllBumds(req.user, req.query);

    res.json({
      success: true,
      message: "Berhasil mendapatkan daftar BUMD",
      data,
    });
  } catch (error) {
    console.error("Get BUMDs error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengambil daftar BUMD",
    });
  }
});

/**
 * GET /api/bumds/sectors
 */
router.get("/sectors", authMiddleware, async (req, res) => {
  try {
    const data = await bumdService.getAllSectors();

    res.json({
      success: true,
      message: "Berhasil mendapatkan daftar sektor",
      data,
    });
  } catch (error) {
    console.error("Get sectors error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengambil daftar sektor",
    });
  }
});

/**
 * GET /api/bumds/:id
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await bumdService.getBumdById(id);

    res.json({
      success: true,
      message: "Berhasil mendapatkan detail BUMD",
      data,
    });
  } catch (error) {
    console.error("Get BUMD error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengambil detail BUMD",
    });
  }
});

/**
 * POST /api/bumds
 * Body: { name, sector_id, user_ids: [] }
 */
router.post("/", authMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.logo = "/uploads/logos/" + req.file.filename;
    }
    
    // Parse user_ids if sent as string from FormData
    if (payload.user_ids && typeof payload.user_ids === 'string') {
      try {
        payload.user_ids = JSON.parse(payload.user_ids);
      } catch (e) {
        // Assume comma separated
        payload.user_ids = payload.user_ids.split(',').map(s => s.trim());
      }
    }

    const data = await bumdService.createBumd(req.user, payload);

    res.status(201).json({
      success: true,
      message: "BUMD berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create BUMD error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat BUMD",
    });
  }
});

/**
 * PUT /api/bumds/:id
 * Body: { name, sector_id, user_ids: [] }
 */
router.put("/:id", authMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const payload = { ...req.body };
    if (req.file) {
      payload.logo = "/uploads/logos/" + req.file.filename;
    }
    
    // Parse user_ids if sent as string from FormData
    if (payload.user_ids && typeof payload.user_ids === 'string') {
      try {
        payload.user_ids = JSON.parse(payload.user_ids);
      } catch (e) {
        // Assume comma separated
        payload.user_ids = payload.user_ids.split(',').map(s => s.trim());
      }
    }

    const data = await bumdService.updateBumd(req.user, id, payload);

    res.json({
      success: true,
      message: "BUMD berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update BUMD error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah BUMD",
    });
  }
});

/**
 * DELETE /api/bumds/:id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await bumdService.deleteBumd(req.user, id);

    res.json({
      success: true,
      message: "BUMD berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete BUMD error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus BUMD",
    });
  }
});

module.exports = router;
