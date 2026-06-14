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
      position: user.position,
      company_type: user.company_type || null,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

async function registerUser(payload) {
  const { company_id, username, password, name, role, position } = payload;

  if (!username || !password || !name) {
    const error = new Error(
      "username, password, and name are required",
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

  let finalCompanyId = company_id || null;

  if (payload.lainnya_company_name) {
    const checkLainnya = await pool.query(
      "SELECT id FROM companies WHERE name = $1 AND company_type = 'lainnya'",
      [payload.lainnya_company_name]
    );
    if (checkLainnya.rowCount > 0) {
      finalCompanyId = checkLainnya.rows[0].id;
    } else {
      const insert = await pool.query(
        "INSERT INTO companies (name, company_type) VALUES ($1, 'lainnya') RETURNING id",
        [payload.lainnya_company_name]
      );
      finalCompanyId = insert.rows[0].id;
    }
  } else if (finalCompanyId) {
    const companyCheck = await pool.query(
      `
        SELECT id, name, company_type
        FROM companies
        WHERE id = $1
      `,
      [finalCompanyId],
    );

    if (companyCheck.rowCount === 0) {
      const error = new Error("Company tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
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
          position,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING
          id,
          company_id,
          username,
          name,
          role,
          position,
          is_active,
          created_at,
          updated_at
      `,
      [finalCompanyId, username, passwordHash, name, finalRole, position || null],
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
        u.position,
        u.is_active,
        c.name AS company_name,
        c.company_type
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
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
        u.position,
        u.is_active,
        c.name AS company_name,
        c.company_type
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
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

async function getAllUsers(user) {
  const isBpbumdOrLainnya = user && (user.company_type === 'bpbumd' || user.company_type === 'lainnya');

  let sql = `
    SELECT
      u.id,
      u.username,
      u.name,
      u.role,
      u.position,
      u.is_active,
      u.company_id,
      c.name AS company_name,
      c.company_type
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE u.is_active = TRUE
  `;

  const values = [];

  if (!isBpbumdOrLainnya && user) {
    // BUMD users (admin and regular) can see everyone in their BUMD, PLUS all bpbumd and lainnya users
    sql += ` AND (u.company_id = $1 OR c.company_type IN ('bpbumd', 'lainnya'))`;
    values.push(user.company_id);
  }

  sql += ` ORDER BY u.name ASC`;

  const result = await pool.query(sql, values);

  return result.rows;
}

async function getUserById(userId) {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.company_id,
        u.username,
        u.name,
        u.role,
        u.position,
        u.is_active,
        c.name AS company_name,
        c.company_type
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
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

async function updateUser(requestingUser, userId, payload) {
  const { name, username, password, role, position, company_id } = payload;

  // Check user exists
  const existing = await pool.query(
    `SELECT u.id, u.company_id, u.role, c.company_type
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [userId],
  );

  if (existing.rowCount === 0) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const targetUser = existing.rows[0];

  // Authorization:
  // 1. User can always edit themselves
  // 2. BPBUMD admin can edit anyone
  // 3. BUMD admin can edit anyone in their own company
  const isSelf = Number(requestingUser.id) === Number(userId);
  const isAdmin = requestingUser.role === 'admin';
  const isBpbumd = requestingUser.company_type === 'bpbumd';

  if (!isSelf) {
    if (!isAdmin) {
      const error = new Error("Anda tidak memiliki akses untuk mengedit user lain");
      error.statusCode = 403;
      throw error;
    }

    // BPBUMD admin can edit anyone. BUMD admin can only edit if target user's company is same.
    // If targetUser has NO company, only BPBUMD can edit? Let's say BUMD admin can't edit users with no company.
    if (!isBpbumd && (!targetUser.company_id || Number(targetUser.company_id) !== Number(requestingUser.company_id))) {
      const error = new Error("Anda tidak memiliki akses untuk mengedit user ini");
      error.statusCode = 403;
      throw error;
    }
  }

  const sets = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    sets.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (username !== undefined) {
    sets.push(`username = $${paramIndex++}`);
    values.push(username);
  }

  if (role !== undefined) {
    if (!isAdmin && role !== targetUser.role) {
      const error = new Error("Hanya admin yang dapat mengubah role");
      error.statusCode = 403;
      throw error;
    }
    if (isSelf && role !== targetUser.role) {
      const error = new Error("Anda tidak dapat mengubah role diri sendiri");
      error.statusCode = 403;
      throw error;
    }
    if (!['admin', 'user'].includes(role)) {
      const error = new Error("Role harus admin atau user");
      error.statusCode = 400;
      throw error;
    }
    sets.push(`role = $${paramIndex++}`);
    values.push(role);
  }

  if (position !== undefined) {
    sets.push(`position = $${paramIndex++}`);
    values.push(position);
  }

  let finalCompanyId = company_id !== undefined ? company_id : targetUser.company_id;

  if (!isBpbumd && (Number(finalCompanyId) !== Number(targetUser.company_id) || payload.lainnya_company_name)) {
    const error = new Error("Hanya admin BPBUMD yang dapat mengubah instansi");
    error.statusCode = 403;
    throw error;
  }

  if (isSelf && (Number(finalCompanyId) !== Number(targetUser.company_id) || payload.lainnya_company_name)) {
    const error = new Error("Anda tidak dapat mengubah instansi diri sendiri");
    error.statusCode = 403;
    throw error;
  }

  if (payload.lainnya_company_name) {
    const checkLainnya = await pool.query(
      "SELECT id FROM companies WHERE name = $1 AND company_type = 'lainnya'",
      [payload.lainnya_company_name]
    );
    if (checkLainnya.rowCount > 0) {
      finalCompanyId = checkLainnya.rows[0].id;
    } else {
      const insert = await pool.query(
        "INSERT INTO companies (name, company_type) VALUES ($1, 'lainnya') RETURNING id",
        [payload.lainnya_company_name]
      );
      finalCompanyId = insert.rows[0].id;
    }
  }

  if (company_id !== undefined || payload.lainnya_company_name !== undefined) {
    sets.push(`company_id = $${paramIndex++}`);
    values.push(finalCompanyId);
  }

  if (password !== undefined) {
    if (password.length < 6) {
      const error = new Error("Password minimal 6 karakter");
      error.statusCode = 400;
      throw error;
    }
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    sets.push(`password_hash = $${paramIndex++}`);
    values.push(hash);
  }

  if (sets.length === 0) {
    const error = new Error("Tidak ada data yang diubah");
    error.statusCode = 400;
    throw error;
  }

  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  try {
    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, company_id, username, name, role, position, is_active`,
      values,
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const duplicateError = new Error('Username sudah digunakan');
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
}

async function deleteUser(requestingUser, userId) {
  // Authorization:
  // 1. BPBUMD admin can delete anyone
  // 2. BUMD admin can delete users in their own company
  const isAdmin = requestingUser.role === 'admin';
  const isBpbumd = requestingUser.company_type === 'bpbumd';

  if (!isAdmin) {
    const error = new Error("Anda tidak memiliki akses untuk menghapus user");
    error.statusCode = 403;
    throw error;
  }

  const existing = await pool.query(
    "SELECT company_id FROM users WHERE id = $1",
    [userId]
  );

  if (existing.rowCount === 0) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!isBpbumd && Number(existing.rows[0].company_id) !== Number(requestingUser.company_id)) {
    const error = new Error("Anda tidak memiliki akses untuk menghapus user ini");
    error.statusCode = 403;
    throw error;
  }

  await pool.query("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);
}

module.exports = {
  deleteUser,
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
};
