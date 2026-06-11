"use strict";

const express = require("express");
const router = express.Router();

const agService = require("../services/activitygroup.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * POST /api/activity-groups
 * Body: { strategy_id, name, code_order, target_percentage }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await agService.createActivityGroup(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Activity group berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create activity group error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat activity group",
    });
  }
});

/**
 * PUT /api/activity-groups/:id
 * Body: { name, code_order, target_percentage }
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

    const data = await agService.updateActivityGroup(req.user, id, req.body);

    res.json({
      success: true,
      message: "Activity group berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update activity group error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah activity group",
    });
  }
});

/**
 * DELETE /api/activity-groups/:id
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

    const data = await agService.deleteActivityGroup(req.user, id);

    res.json({
      success: true,
      message: "Activity group berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete activity group error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus activity group",
    });
  }
});

module.exports = router;
