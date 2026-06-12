"use strict";

const { pool } = require("../config/database");

// ═════════════════════════════════════════════
//  GET ALL BUMDs
// ═════════════════════════════════════════════

async function getAllBumds(user, query) {
  const { search, sector_id } = query || {};
  const isBpbumd = user && user.company_type === 'bpbumd';

  let sql = `
    SELECT
      c.id,
      c.name,
      c.company_code,
      c.sector_id,
      s.name AS sector_name,
      s.code AS sector_code,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'user_id', u.id,
            'username', u.username,
            'name', u.name,
            'role', u.role
          )
          ORDER BY u.name
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
      ) AS users
    FROM companies c
    LEFT JOIN sectors s ON s.id = c.sector_id
    LEFT JOIN users u ON u.company_id = c.id AND u.is_active = TRUE
    WHERE c.company_type = 'bumd'
  `;

  const values = [];
  let paramIndex = 1;

  // Non-BPBUMD users can only see their own BUMD
  if (!isBpbumd && user) {
    sql += ` AND c.id = $${paramIndex++}`;
    values.push(user.company_id);
  }

  if (search) {
    sql += ` AND c.name ILIKE $${paramIndex++}`;
    values.push(`%${search}%`);
  }

  if (sector_id) {
    sql += ` AND c.sector_id = $${paramIndex++}`;
    values.push(sector_id);
  }

  sql += `
    GROUP BY c.id, c.name, c.company_code, c.sector_id,
             s.name, s.code, c.created_at, c.updated_at
    ORDER BY c.name ASC
  `;

  const result = await pool.query(sql, values);

  return result.rows.map(formatBumd);
}

// ═════════════════════════════════════════════
//  GET SINGLE BUMD
// ═════════════════════════════════════════════

async function getBumdById(bumdId) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.name,
        c.company_code,
        c.sector_id,
        s.name AS sector_name,
        s.code AS sector_code,
        c.created_at,
        c.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', u.id,
              'username', u.username,
              'name', u.name,
              'role', u.role
            )
            ORDER BY u.name
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS users
      FROM companies c
      LEFT JOIN sectors s ON s.id = c.sector_id
      LEFT JOIN users u ON u.company_id = c.id AND u.is_active = TRUE
      WHERE c.id = $1 AND c.company_type = 'bumd'
      GROUP BY c.id, c.name, c.company_code, c.sector_id,
               s.name, s.code, c.created_at, c.updated_at
    `,
    [bumdId],
  );

  if (result.rowCount === 0) {
    const error = new Error("BUMD tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return formatBumd(result.rows[0]);
}

// ═════════════════════════════════════════════
//  CREATE BUMD
// ═════════════════════════════════════════════

async function createBumd(user, payload) {
  const { name, sector_id, user_ids } = payload;

  if (!name) {
    const error = new Error("Nama BUMD wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (user_ids && user_ids.length > 3) {
    const error = new Error("Maksimal 3 user per BUMD");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify sector exists if provided
    if (sector_id) {
      const sectorCheck = await client.query(
        "SELECT id FROM sectors WHERE id = $1",
        [sector_id],
      );

      if (sectorCheck.rowCount === 0) {
        const error = new Error("Sektor tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }
    }

    const result = await client.query(
      `
        INSERT INTO companies (name, sector_id, company_type)
        VALUES ($1, $2, 'bumd')
        RETURNING *
      `,
      [name, sector_id || null],
    );

    const bumdId = result.rows[0].id;

    // Assign users
    if (user_ids && user_ids.length > 0) {
      // Validasi max 3 user per BUMD dilakukan dengan ngecek jumlah user yg diassign
      for (const uid of user_ids) {
        await client.query(
          "UPDATE users SET company_id = $1 WHERE id = $2",
          [bumdId, uid],
        );
      }
    }

    await client.query("COMMIT");

    return getBumdById(bumdId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE BUMD
// ═════════════════════════════════════════════

async function updateBumd(user, bumdId, payload) {
  const { name, sector_id, user_ids } = payload;

  if (user_ids && user_ids.length > 3) {
    const error = new Error("Maksimal 3 user per BUMD");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify BUMD exists
    const existing = await client.query(
      "SELECT id FROM companies WHERE id = $1 AND company_type = 'bumd' FOR UPDATE",
      [bumdId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("BUMD tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    // Build dynamic update
    const sets = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (sector_id !== undefined) {
      // Verify sector exists if not null
      if (sector_id) {
        const sectorCheck = await client.query(
          "SELECT id FROM sectors WHERE id = $1",
          [sector_id],
        );

        if (sectorCheck.rowCount === 0) {
          const error = new Error("Sektor tidak ditemukan");
          error.statusCode = 404;
          throw error;
        }
      }

      sets.push(`sector_id = $${paramIndex++}`);
      values.push(sector_id || null);
    }

    if (sets.length > 0) {
      sets.push("updated_at = CURRENT_TIMESTAMP");
      values.push(bumdId);

      await client.query(
        `
          UPDATE companies
          SET ${sets.join(", ")}
          WHERE id = $${paramIndex}
        `,
        values,
      );
    }

    // Update user assignments if provided
    if (user_ids !== undefined) {
      // Dapatkan user yang saat ini ada di BUMD ini
      const currentUsersRes = await client.query(
        "SELECT id FROM users WHERE company_id = $1 AND is_active = TRUE",
        [bumdId]
      );
      const currentUserIds = currentUsersRes.rows.map(r => Number(r.id));
      const newUserIds = user_ids.map(id => Number(id));

      // Cari user yang perlu di-unassign
      const usersToUnassign = currentUserIds.filter(id => !newUserIds.includes(id));
      
      if (usersToUnassign.length > 0) {
        for (const uid of usersToUnassign) {
          await client.query("UPDATE users SET company_id = NULL WHERE id = $1", [uid]);
        }
      }

      // Cari user yang baru di-assign
      if (newUserIds.length > 0) {
        for (const uid of newUserIds) {
          await client.query(
            "UPDATE users SET company_id = $1 WHERE id = $2",
            [bumdId, uid],
          );
        }
      }
    }

    await client.query("COMMIT");

    return getBumdById(bumdId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE BUMD
// ═════════════════════════════════════════════

async function deleteBumd(user, bumdId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, name FROM companies WHERE id = $1 AND company_type = 'bumd' FOR UPDATE",
      [bumdId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("BUMD tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    // Check if BUMD has aspects
    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM aspects WHERE company_id = $1",
      [bumdId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        `BUMD tidak bisa dihapus karena masih memiliki ${childCheck.rows[0].count} aspek`,
      );
      error.statusCode = 422;
      throw error;
    }

    // Cek apakah masih ada user yang terikat ke BUMD ini
    const userCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM users WHERE company_id = $1",
      [bumdId]
    );

    if (Number(userCheck.rows[0].count) > 0) {
      const error = new Error(
        `BUMD tidak bisa dihapus karena masih memiliki ${userCheck.rows[0].count} user. Pindahkan user terlebih dahulu.`
      );
      error.statusCode = 422;
      throw error;
    }

    // Delete the BUMD
    await client.query("DELETE FROM companies WHERE id = $1", [bumdId]);

    await client.query("COMMIT");

    return {
      deleted_id: Number(bumdId),
      deleted_name: existing.rows[0].name,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  GET ALL SECTORS
// ═════════════════════════════════════════════

async function getAllSectors() {
  const result = await pool.query(
    "SELECT id, name, code FROM sectors ORDER BY name ASC",
  );

  return result.rows;
}

// ─────────────────────────────────────────────

function formatBumd(row) {
  return {
    id: Number(row.id),
    name: row.name,
    company_code: row.company_code,
    sector_id: row.sector_id ? Number(row.sector_id) : null,
    sector_name: row.sector_name || null,
    sector_code: row.sector_code || null,
    users: row.users || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  getAllBumds,
  getBumdById,
  createBumd,
  updateBumd,
  deleteBumd,
  getAllSectors,
};
