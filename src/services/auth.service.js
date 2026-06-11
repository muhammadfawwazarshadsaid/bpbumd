"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      company_id: user.company_id,
      username: user.username,
      role: user.role,
      company_type: user.company_type,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

async function registerUser(payload) {
  const { company_id, username, password, name, role } = payload;

  if (!company_id || !username || !password || !name) {
    const error = new Error(
      "company_id, username, password, and name are required",
    );
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password minimal 6 karakter");
    error.statusCode = 400;
    throw error;
  }

  const finalRole = role || "user";

  if (!["admin", "user"].includes(finalRole)) {
    const error = new Error("Role harus admin atau user");
    error.statusCode = 400;
    throw error;
  }

  const companyCheck = await pool.query(
    `
      SELECT id, name, company_type
      FROM companies
      WHERE id = $1
    `,
    [company_id],
  );

  if (companyCheck.rowCount === 0) {
    const error = new Error("Company tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `
        INSERT INTO users (
          company_id,
          username,
          password_hash,
          name,
          role,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING
          id,
          company_id,
          username,
          name,
          role,
          is_active,
          created_at,
          updated_at
      `,
      [company_id, username, passwordHash, name, finalRole],
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      const duplicateError = new Error("Username sudah digunakan");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
}

async function loginUser(payload) {
  const { username, password } = payload;

  if (!username || !password) {
    const error = new Error("username and password are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
      SELECT
        u.id,
        u.company_id,
        u.username,
        u.password_hash,
        u.name,
        u.role,
        u.is_active,
        c.name AS company_name,
        c.company_type
      FROM users u
      JOIN companies c ON c.id = u.company_id
      WHERE u.username = $1
      LIMIT 1
    `,
    [username],
  );

  if (result.rowCount === 0) {
    const error = new Error("Username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const error = new Error("User tidak aktif");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error("Username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  delete user.password_hash;

  return {
    token,
    token_type: "Bearer",
    user,
  };
}

async function getCurrentUser(userId) {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.company_id,
        u.username,
        u.name,
        u.role,
        u.is_active,
        c.name AS company_name,
        c.company_type
      FROM users u
      JOIN companies c ON c.id = u.company_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (result.rowCount === 0) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function getAllUsers() {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.company_id,
        c.name AS company_name,
        c.company_type
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.is_active = TRUE
      ORDER BY u.name ASC
    `,
  );

  return result.rows;
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
};
