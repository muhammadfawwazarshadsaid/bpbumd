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

/**
 * POST /api/aspects
 *
 * Body:
 *  - name                 (required)
 *  - company_id           (optional — defaults to user's company_id)
 *  - status               (optional — defaults to 'belum mulai')
 *  - weight               (optional)
 *  - progress_percentage  (optional)
 *  - target_percentage    (optional)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await aspectService.createAspect(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Aspek berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create aspect error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat aspek",
    });
  }
});

/**
 * PUT /api/aspects/:aspectId
 *
 * Body:
 *  - name                 (optional)
 *  - status               (optional)
 *  - weight               (optional)
 *  - progress_percentage  (optional)
 *  - target_percentage    (optional)
 */
router.put("/:aspectId", authMiddleware, async (req, res) => {
  try {
    const aspectId = Number(req.params.aspectId);

    if (!aspectId || isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter aspectId harus berupa angka",
      });
    }

    const data = await aspectService.updateAspect(req.user, aspectId, req.body);

    res.json({
      success: true,
      message: "Aspek berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update aspect error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah aspek",
    });
  }
});

/**
 * DELETE /api/aspects/:aspectId
 */
router.delete("/:aspectId", authMiddleware, async (req, res) => {
  try {
    const aspectId = Number(req.params.aspectId);

    if (!aspectId || isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter aspectId harus berupa angka",
      });
    }

    const data = await aspectService.deleteAspect(req.user, aspectId);

    res.json({
      success: true,
      message: "Aspek berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete aspect error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus aspek",
    });
  }
});

/**
 * PUT /api/aspects/:aspectId/bulk-weights
 */
router.put("/:aspectId/bulk-weights", authMiddleware, async (req, res) => {
  try {
    const aspectId = Number(req.params.aspectId);

    if (!aspectId || isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter aspectId harus berupa angka",
      });
    }

    const data = await aspectService.bulkUpdateWeights(req.user, aspectId, req.body);

    res.json({
      success: true,
      message: "Bobot berhasil diperbarui secara menyeluruh",
      data,
    });
  } catch (error) {
    console.error("Bulk update weights error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal memperbarui bobot",
    });
  }
});

module.exports = router;

