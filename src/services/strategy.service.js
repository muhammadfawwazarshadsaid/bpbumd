"use strict";

const { pool } = require("../config/database");

function toNumber(value) {
  return Number(value || 0);
}

// ═════════════════════════════════════════════
//  CREATE STRATEGY
// ═════════════════════════════════════════════

/**
 * POST /api/strategies
 *
 * Body:
 *  - aspect_id            (required)
 *  - name                 (required)
 *  - code_order           (optional)
 *  - target_percentage    (optional)
 *
 * weight, progress_percentage, status diturunkan dari activity group.
 */
async function createStrategy(user, payload) {
  const { aspect_id, name, code_order, target_percentage } = payload;

  if (!aspect_id || !name) {
    const error = new Error("aspect_id dan name wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify aspect exists
    const aspectCheck = await client.query(
      "SELECT id FROM aspects WHERE id = $1",
      [aspect_id],
    );

    if (aspectCheck.rowCount === 0) {
      const error = new Error("Aspek tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const result = await client.query(
      `
        INSERT INTO strategies (
          aspect_id, name, code_order, status,
          weight, progress_percentage, target_percentage
        )
        VALUES ($1, $2, $3, 'belum mulai', 0, 0, $4)
        RETURNING *
      `,
      [aspect_id, name, code_order || null, target_percentage || null],
    );

    await client.query("COMMIT");

    return formatStrategy(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE STRATEGY
// ═════════════════════════════════════════════

/**
 * PUT /api/strategies/:id
 *
 * Body:
 *  - name                 (optional)
 *  - code_order           (optional)
 *  - target_percentage    (optional)
 *
 * weight, progress_percentage, status diturunkan dari activity group.
 */
async function updateStrategy(user, strategyId, payload) {
  const { name, code_order, target_percentage } = payload;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT s.id
        FROM strategies s
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE s.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [strategyId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Strategi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const sets = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (code_order !== undefined) {
      sets.push(`code_order = $${paramIndex++}`);
      values.push(code_order);
    }

    if (target_percentage !== undefined) {
      sets.push(`target_percentage = $${paramIndex++}`);
      values.push(target_percentage);
    }

    if (sets.length === 0) {
      const error = new Error("Tidak ada data yang diubah");
      error.statusCode = 400;
      throw error;
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    values.push(strategyId);

    const result = await client.query(
      `
        UPDATE strategies
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    );

    await client.query("COMMIT");

    return formatStrategy(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE STRATEGY
// ═════════════════════════════════════════════

async function deleteStrategy(user, strategyId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT s.id, s.name
        FROM strategies s
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE s.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [strategyId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Strategi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM activity_groups WHERE strategy_id = $1",
      [strategyId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        `Strategi tidak bisa dihapus karena masih memiliki ${childCheck.rows[0].count} activity group`,
      );
      error.statusCode = 422;
      throw error;
    }

    await client.query("DELETE FROM strategies WHERE id = $1", [strategyId]);

    await client.query("COMMIT");

    return {
      deleted_id: Number(strategyId),
      deleted_name: existing.rows[0].name,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────

function formatStrategy(row) {
  return {
    strategy_id: Number(row.id),
    aspect_id: Number(row.aspect_id),
    name: row.name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  createStrategy,
  updateStrategy,
  deleteStrategy,
};
