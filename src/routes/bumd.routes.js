"use strict";

const express = require("express");
const router = express.Router();

const bumdService = require("../services/bumd.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * GET /api/bumds
 * Query: ?search=&sector_id=
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await bumdService.getAllBumds(req.query);

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
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await bumdService.createBumd(req.user, req.body);

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
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await bumdService.updateBumd(req.user, id, req.body);

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
