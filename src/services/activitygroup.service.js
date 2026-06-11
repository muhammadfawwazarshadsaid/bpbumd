"use strict";

const { pool } = require("../config/database");

function toNumber(value) {
  return Number(value || 0);
}

// ═════════════════════════════════════════════
//  CREATE ACTIVITY GROUP
// ═════════════════════════════════════════════

/**
 * POST /api/activity-groups
 *
 * Body:
 *  - strategy_id          (required)
 *  - name                 (required)
 *  - code_order           (optional)
 *  - target_percentage    (optional)
 *
 * weight, progress_percentage, status diturunkan dari action plan.
 */
async function createActivityGroup(user, payload) {
  const { strategy_id, name, code_order, target_percentage } = payload;

  if (!strategy_id || !name) {
    const error = new Error("strategy_id dan name wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify strategy exists
    const strategyCheck = await client.query(
      "SELECT id FROM strategies WHERE id = $1",
      [strategy_id],
    );

    if (strategyCheck.rowCount === 0) {
      const error = new Error("Strategi tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const result = await client.query(
      `
        INSERT INTO activity_groups (
          strategy_id, name, code_order, status,
          weight, progress_percentage, target_percentage
        )
        VALUES ($1, $2, $3, 'belum mulai', 0, 0, $4)
        RETURNING *
      `,
      [strategy_id, name, code_order || null, target_percentage || null],
    );

    await client.query("COMMIT");

    return formatActivityGroup(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE ACTIVITY GROUP
// ═════════════════════════════════════════════

/**
 * PUT /api/activity-groups/:id
 *
 * Body:
 *  - name                 (optional)
 *  - code_order           (optional)
 *  - target_percentage    (optional)
 *
 * weight, progress_percentage, status diturunkan dari action plan.
 */
async function updateActivityGroup(user, activityGroupId, payload) {
  const { name, code_order, target_percentage } = payload;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT ag.id
        FROM activity_groups ag
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE ag.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [activityGroupId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Activity group tidak ditemukan");
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
    values.push(activityGroupId);

    const result = await client.query(
      `
        UPDATE activity_groups
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    );

    await client.query("COMMIT");

    return formatActivityGroup(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE ACTIVITY GROUP
// ═════════════════════════════════════════════

async function deleteActivityGroup(user, activityGroupId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT ag.id, ag.name
        FROM activity_groups ag
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN aspects a ON a.id = s.aspect_id
        JOIN companies c ON c.id = a.company_id
        WHERE ag.id = $1 AND c.company_type = 'bumd'
        FOR UPDATE
      `,
      [activityGroupId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Activity group tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM action_plans WHERE activity_group_id = $1",
      [activityGroupId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        `Activity group tidak bisa dihapus karena masih memiliki ${childCheck.rows[0].count} rencana aksi`,
      );
      error.statusCode = 422;
      throw error;
    }

    await client.query("DELETE FROM activity_groups WHERE id = $1", [
      activityGroupId,
    ]);

    await client.query("COMMIT");

    return {
      deleted_id: Number(activityGroupId),
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

function formatActivityGroup(row) {
  return {
    activity_group_id: Number(row.id),
    strategy_id: Number(row.strategy_id),
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
  createActivityGroup,
  updateActivityGroup,
  deleteActivityGroup,
};
