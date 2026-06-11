"use strict";

const express = require("express");
const router = express.Router();

const actionPlanService = require("../services/actionplan.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * GET /api/action-plans/:actionPlanId
 *
 * Header:
 * Authorization: Bearer <token>
 *
 * Returns the full action plan detail including:
 *  - action_plan info (id, name, code_order, weight)
 *  - cards (status, progress breakdown, PIC utama, target selesai, bukti)
 *  - informasi_rencana_aksi (output, penilaian, dates, blocked)
 *  - kpis (list of KPI with status)
 *  - riwayat_aktivitas (history activities)
 *  - sub_rencana_aksi (list with PIC)
 *  - dokumen (documents with uploader/verifier)
 */
router.get("/:actionPlanId", authMiddleware, async (req, res) => {
  try {
    const actionPlanId = Number(req.params.actionPlanId);

    if (!actionPlanId || isNaN(actionPlanId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter actionPlanId harus berupa angka",
      });
    }

    const data = await actionPlanService.getActionPlanDetail(
      req.user,
      actionPlanId,
    );

    res.json({
      success: true,
      message: "Detail rencana aksi berhasil diambil",
      data,
    });
  } catch (error) {
    console.error("Action plan detail error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Detail rencana aksi gagal diambil",
    });
  }
});

/**
 * POST /api/action-plans
 * Body: { activity_group_id, name, code_order, pic_user_id,
 *         target_percentage, start_date, target_end_date, output, indicator }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await actionPlanService.createActionPlan(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Rencana aksi berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create action plan error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat rencana aksi",
    });
  }
});

/**
 * PUT /api/action-plans/:actionPlanId
 * Body: { name, code_order, pic_user_id, status, weight,
 *         progress_percentage, target_percentage, start_date,
 *         end_date, target_end_date, output, indicator, is_blocked }
 */
router.put("/:actionPlanId", authMiddleware, async (req, res) => {
  try {
    const actionPlanId = Number(req.params.actionPlanId);

    if (!actionPlanId || isNaN(actionPlanId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter actionPlanId harus berupa angka",
      });
    }

    const data = await actionPlanService.updateActionPlan(
      req.user,
      actionPlanId,
      req.body,
    );

    res.json({
      success: true,
      message: "Rencana aksi berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update action plan error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah rencana aksi",
    });
  }
});

/**
 * DELETE /api/action-plans/:actionPlanId
 */
router.delete("/:actionPlanId", authMiddleware, async (req, res) => {
  try {
    const actionPlanId = Number(req.params.actionPlanId);

    if (!actionPlanId || isNaN(actionPlanId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter actionPlanId harus berupa angka",
      });
    }

    const data = await actionPlanService.deleteActionPlan(
      req.user,
      actionPlanId,
    );

    res.json({
      success: true,
      message: "Rencana aksi berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete action plan error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus rencana aksi",
    });
  }
});

module.exports = router;

