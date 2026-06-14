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

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await authService.getAllUsers(req.user);

    res.json({
      success: true,
      message: "Berhasil mendapatkan daftar user",
      data: users,
    });
  } catch (error) {
    console.error("Get Users error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengambil daftar user",
    });
  }
});

router.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const user = await authService.getCurrentUser(id);

    res.json({
      success: true,
      message: "Berhasil mendapatkan user",
      data: user,
    });
  } catch (error) {
    console.error("Get User by ID error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengambil data user",
    });
  }
});

/**
 * PUT /api/auth/users/:id
 * Body: { name, username, password, role }
 */
router.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await authService.updateUser(req.user, id, req.body);

    res.json({
      success: true,
      message: "User berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update User error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah user",
    });
  }
});

module.exports = router;

/**
 * DELETE /api/auth/users/:id
 */
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    await authService.deleteUser(req.user, req.params.id);
    res.json({
      success: true,
      message: "Berhasil menghapus pengguna",
    });
  } catch (error) {
    console.error("Delete User error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus pengguna",
    });
  }
});
