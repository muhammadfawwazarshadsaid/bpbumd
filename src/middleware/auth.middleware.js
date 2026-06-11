"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

function authMiddleware(req, res, next) {
  let token = null;

  // 1. Check httpOnly cookie first
  if (req.cookies && req.cookies.bpbumd_token) {
    token = req.cookies.bpbumd_token;
  }

  // 2. Fallback to Authorization header (for API clients / Postman)
  if (!token) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [type, headerToken] = authHeader.split(" ");

      if (type === "Bearer" && headerToken) {
        token = headerToken;
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization wajib diisi",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah expired",
    });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Akses hanya untuk admin",
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  adminOnly,
};
