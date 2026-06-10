"use strict";

const express = require("express");
const router = express.Router();

const authService = require("../services/auth.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * GET /api/auth/login
 *
 * Header:
 * Authorization: Bearer <token>
 */

router.post("/register", async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Register berhasil",
      data: user,
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Register gagal",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await authService.loginUser(req.body);

    res.json({
      success: true,
      message: "Login berhasil",
      data,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Login gagal",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.json({
      success: true,
      message: "Current user",
      data: user,
    });
  } catch (error) {
    console.error("Me error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to get current user",
    });
  }
});

module.exports = router;
