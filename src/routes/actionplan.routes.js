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

module.exports = router;
