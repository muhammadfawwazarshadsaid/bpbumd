"use strict";

const express = require("express");
const router = express.Router();

const strategyService = require("../services/strategy.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * POST /api/strategies
 * Body: { aspect_id, name, code_order, target_percentage }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await strategyService.createStrategy(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Strategi berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create strategy error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat strategi",
    });
  }
});

/**
 * PUT /api/strategies/:id
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

    const data = await strategyService.updateStrategy(req.user, id, req.body);

    res.json({
      success: true,
      message: "Strategi berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update strategy error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah strategi",
    });
  }
});

/**
 * DELETE /api/strategies/:id
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

    const data = await strategyService.deleteStrategy(req.user, id);

    res.json({
      success: true,
      message: "Strategi berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete strategy error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus strategi",
    });
  }
});

module.exports = router;
