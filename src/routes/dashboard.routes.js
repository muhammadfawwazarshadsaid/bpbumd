"use strict";

const express = require("express");
const router = express.Router();

const dashboardService = require("../services/dashboard.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * GET /api/dashboard/summary
 *
 * Header:
 * Authorization: Bearer <token>
 */
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary(req.user);

    res.json({
      success: true,
      message: "Dashboard summary berhasil diambil",
      data,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Dashboard summary gagal diambil",
    });
  }
});

module.exports = router;
