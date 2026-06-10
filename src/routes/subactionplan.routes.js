"use strict";

const express = require("express");
const router = express.Router();

const sapService = require("../services/subactionplan.service");
const { authMiddleware } = require("../middleware/auth.middleware");

// ═════════════════════════════════════════════
//  SUBMITTER SIDE
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans
 *
 * Body:
 *  - action_plan_id       (required)
 *  - name                 (required)
 *  - pic_user_id          (optional)
 *  - weight               (optional)
 *  - approver_user_id_1   (required)
 *  - approver_user_id_2   (required)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await sapService.createSubActionPlan(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Sub rencana aksi berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat sub rencana aksi",
    });
  }
});

/**
 * PUT /api/sub-action-plans/:id
 *
 * Body:
 *  - name         (optional)
 *  - pic_user_id  (optional)
 *  - weight       (optional)
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

    const data = await sapService.updateSubActionPlan(req.user, id, req.body);

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah sub rencana aksi",
    });
  }
});

/**
 * DELETE /api/sub-action-plans/:id
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

    const data = await sapService.deleteSubActionPlan(req.user, id);

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus sub rencana aksi",
    });
  }
});

// ═════════════════════════════════════════════
//  APPROVER SIDE
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans/:id/approve
 *
 * Body:
 *  - notes (optional)
 */
router.post("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await sapService.approveSubActionPlan(
      req.user,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil disetujui",
      data,
    });
  } catch (error) {
    console.error("Approve sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menyetujui sub rencana aksi",
    });
  }
});

/**
 * POST /api/sub-action-plans/:id/reject
 *
 * Body:
 *  - notes (required) — alasan penolakan
 */
router.post("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await sapService.rejectSubActionPlan(
      req.user,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil ditolak",
      data,
    });
  } catch (error) {
    console.error("Reject sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menolak sub rencana aksi",
    });
  }
});

module.exports = router;
