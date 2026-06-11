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

    // Set JWT as httpOnly cookie — not accessible by JavaScript
    res.cookie("bpbumd_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    // Return user data (without token in body for security)
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user: data.user,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Login gagal",
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("bpbumd_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({
    success: true,
    message: "Logout berhasil",
  });
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
