"use strict";

const express = require("express");
const router = express.Router();

const aspectService = require("../services/aspect.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * GET /api/aspects/:aspectId
 *
 * Header:
 * Authorization: Bearer <token>
 *
 * Returns the full aspect detail including:
 *  - aspect info (id, name, status, weight)
 *  - cards (progres aspek, total aktivitas, selesai, dalam progres, terlambat, belum mulai)
 *  - daftar_strategi (nested: strategy → activity_groups → action_plans)
 */
router.get("/:aspectId", authMiddleware, async (req, res) => {
  try {
    const aspectId = Number(req.params.aspectId);

    if (!aspectId || isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter aspectId harus berupa angka",
      });
    }

    const data = await aspectService.getAspectDetail(req.user, aspectId);

    res.json({
      success: true,
      message: "Detail aspek berhasil diambil",
      data,
    });
  } catch (error) {
    console.error("Aspect detail error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Detail aspek gagal diambil",
    });
  }
});

module.exports = router;
