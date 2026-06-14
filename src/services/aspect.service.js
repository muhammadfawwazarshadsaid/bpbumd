"use strict";

const { pool } = require("../config/database");

function isHqUser(user) {
  return user.company_type === "bpbumd" || user.company_type === "lainnya";
}

function getCompanyScope(user) {
  if (isHqUser(user)) {
    return null;
  }

  return user.company_id;
}

function toNumber(value) {
  return Number(value || 0);
}

/**
 * GET /api/aspects/:aspectId
 *
 * Returns the full aspect detail page data:
 *  - cards  (progres aspek, total aktivitas, selesai, dalam progres, terlambat, belum mulai)
 *  - daftar_strategi  (strategies → activity groups → action plans)
 */
async function getAspectDetail(user, aspectId) {
  const companyScopeId = getCompanyScope(user);
  const client = await pool.connect();

  try {
    // ── 1. Validate aspect exists and user has access ──
    const aspect = await getAspect(client, aspectId, companyScopeId);

    if (!aspect) {
      const error = new Error("Aspek tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    // ── 2. Fetch all data in parallel ──
    const [cards, strategies, activityGroups, actionPlans] = await Promise.all([
      getAspectCards(client, aspectId),
      getStrategies(client, aspectId),
      getActivityGroups(client, aspectId),
      getActionPlans(client, aspectId),
    ]);

    // ── 3. Build nested hierarchy ──
    const daftarStrategi = buildStrategyTree(
      strategies,
      activityGroups,
      actionPlans,
    );

    return {
      aspect: {
        aspect_id: aspect.aspect_id,
        aspect_name: aspect.aspect_name,
        aspect_status: aspect.aspect_status,
        weight: aspect.weight,
        company_id: aspect.company_id,
      },

      cards,

      daftar_strategi: daftarStrategi,
    };
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
//  ASPECT
// ─────────────────────────────────────────────

async function getAspect(client, aspectId, companyScopeId) {
  const result = await client.query(
    `
      SELECT
        a.id   AS aspect_id,
        a.name AS aspect_name,
        a.status AS aspect_status,
        a.weight,
        a.company_id
      FROM aspects a
      JOIN companies c
        ON c.id = a.company_id
      WHERE
        a.id = $1
        AND c.company_type = 'bumd'
        AND ($2::BIGINT IS NULL OR a.company_id = $2)
    `,
    [aspectId, companyScopeId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    aspect_id: Number(row.aspect_id),
    aspect_name: row.aspect_name,
    aspect_status: row.aspect_status,
    weight: toNumber(row.weight),
    company_id: Number(row.company_id),
  };
}

// ─────────────────────────────────────────────
//  CARDS
// ─────────────────────────────────────────────

async function getAspectCards(client, aspectId) {
  const result = await client.query(
    `
      WITH sub_action_plan_rows AS (
        SELECT
          sap.id,
          sap.status,
          ap.progress_percentage,
          ap.target_percentage
        FROM sub_action_plans sap
        JOIN action_plans ap
          ON ap.id = sap.action_plan_id
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        WHERE
          s.aspect_id = $1
      )
      SELECT
        (SELECT COALESCE(progress_percentage, 0) FROM aspects WHERE id = $1) AS progress_percentage,
        (SELECT COALESCE(target_percentage, 0) FROM aspects WHERE id = $1) AS target_percentage,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
        )::INT AS total_aktivitas,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE status = 'selesai'
        )::INT AS selesai,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE status IN ('pengajuan', 'verifikasi', 'ditolak')
        )::INT AS dalam_progres,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE status = 'terlambat'
        )::INT AS terlambat,

        0::INT AS belum_mulai
    `,
    [aspectId],
  );

  const row = result.rows[0] || {};

  return {
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_aktivitas: toNumber(row.total_aktivitas),
    selesai: toNumber(row.selesai),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
  };
}

// ─────────────────────────────────────────────
//  STRATEGIES
// ─────────────────────────────────────────────

async function getStrategies(client, aspectId) {
  const result = await client.query(
    `
      SELECT
        s.id   AS strategy_id,
        s.name AS strategy_name,
        s.code_order,
        s.status,
        s.weight,

        COALESCE(s.progress_percentage, 0) AS progress_percentage,
        COALESCE(s.target_percentage, 0)   AS target_percentage,

        COUNT(DISTINCT sap.id)::INT AS total_rencana_aksi,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'selesai'
        )::INT AS selesai,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status IN ('pengajuan', 'verifikasi', 'ditolak')
        )::INT AS dalam_progres,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'terlambat'
        )::INT AS terlambat,

        0::INT AS belum_mulai

      FROM strategies s
      LEFT JOIN activity_groups ag
        ON ag.strategy_id = s.id
      LEFT JOIN action_plans ap
        ON ap.activity_group_id = ag.id
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id
      WHERE
        s.aspect_id = $1
      GROUP BY
        s.id,
        s.name,
        s.code_order,
        s.status,
        s.weight,
        s.progress_percentage,
        s.target_percentage
      ORDER BY
        s.code_order,
        s.id
    `,
    [aspectId],
  );

  return result.rows.map((row) => ({
    strategy_id: Number(row.strategy_id),
    strategy_name: row.strategy_name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_rencana_aksi: toNumber(row.total_rencana_aksi),
    selesai: toNumber(row.selesai),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
  }));
}

// ─────────────────────────────────────────────
//  ACTIVITY GROUPS
// ─────────────────────────────────────────────

async function getActivityGroups(client, aspectId) {
  const result = await client.query(
    `
      SELECT
        ag.id          AS activity_group_id,
        ag.strategy_id,
        ag.name        AS activity_group_name,
        ag.code_order,
        ag.status,
        ag.weight,

        COALESCE(ag.progress_percentage, 0) AS progress_percentage,
        COALESCE(ag.target_percentage, 0)   AS target_percentage,

        COUNT(DISTINCT sap.id)::INT AS total_rencana_aksi,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'selesai'
        )::INT AS selesai,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status IN ('pengajuan', 'verifikasi', 'ditolak')
        )::INT AS dalam_progres,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'terlambat'
        )::INT AS terlambat,

        0::INT AS belum_mulai

      FROM activity_groups ag
      JOIN strategies s
        ON s.id = ag.strategy_id
      LEFT JOIN action_plans ap
        ON ap.activity_group_id = ag.id
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id
      WHERE
        s.aspect_id = $1
      GROUP BY
        ag.id,
        ag.strategy_id,
        ag.name,
        ag.code_order,
        ag.status,
        ag.weight,
        ag.progress_percentage,
        ag.target_percentage
      ORDER BY
        ag.code_order,
        ag.id
    `,
    [aspectId],
  );

  return result.rows.map((row) => ({
    activity_group_id: Number(row.activity_group_id),
    strategy_id: Number(row.strategy_id),
    activity_group_name: row.activity_group_name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_rencana_aksi: toNumber(row.total_rencana_aksi),
    selesai: toNumber(row.selesai),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
  }));
}

// ─────────────────────────────────────────────
//  ACTION PLANS (Rencana Aksi)
// ─────────────────────────────────────────────

async function getActionPlans(client, aspectId) {
  const result = await client.query(
    `
      SELECT
        ap.id                AS action_plan_id,
        ap.activity_group_id,
        ap.name              AS action_plan_name,
        ap.code_order,
        ap.status,
        ap.weight,

        COALESCE(ap.progress_percentage, 0) AS progress_percentage,
        COALESCE(ap.target_percentage, 0)   AS target_percentage,

        COUNT(DISTINCT sap.id)::INT AS total_sub_rencana_aksi,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'selesai'
        )::INT AS selesai_sub

      FROM action_plans ap
      JOIN activity_groups ag
        ON ag.id = ap.activity_group_id
      JOIN strategies s
        ON s.id = ag.strategy_id
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id
      WHERE
        s.aspect_id = $1
      GROUP BY
        ap.id,
        ap.activity_group_id,
        ap.name,
        ap.code_order,
        ap.status,
        ap.weight,
        ap.progress_percentage,
        ap.target_percentage
      ORDER BY
        ap.code_order,
        ap.id
    `,
    [aspectId],
  );

  return result.rows.map((row) => ({
    action_plan_id: Number(row.action_plan_id),
    activity_group_id: Number(row.activity_group_id),
    action_plan_name: row.action_plan_name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_sub_rencana_aksi: toNumber(row.total_sub_rencana_aksi),
    selesai_sub: toNumber(row.selesai_sub),
  }));
}

// ─────────────────────────────────────────────
//  BUILD NESTED TREE
//  strategy → activity_groups → action_plans
// ─────────────────────────────────────────────

function buildStrategyTree(strategies, activityGroups, actionPlans) {
  // Group action plans by activity_group_id
  const apByAg = new Map();

  for (const ap of actionPlans) {
    const key = String(ap.activity_group_id);

    if (!apByAg.has(key)) {
      apByAg.set(key, []);
    }

    apByAg.get(key).push({
      action_plan_id: ap.action_plan_id,
      action_plan_name: ap.action_plan_name,
      code_order: ap.code_order,
      status: ap.status,
      weight: ap.weight,
      progress_percentage: ap.progress_percentage,
      target_percentage: ap.target_percentage,
      rencana_aksi: {
        selesai: ap.selesai_sub,
        total: ap.total_sub_rencana_aksi,
      },
    });
  }

  // Group activity groups by strategy_id
  const agByStrategy = new Map();

  for (const ag of activityGroups) {
    const key = String(ag.strategy_id);

    if (!agByStrategy.has(key)) {
      agByStrategy.set(key, []);
    }

    agByStrategy.get(key).push({
      activity_group_id: ag.activity_group_id,
      activity_group_name: ag.activity_group_name,
      code_order: ag.code_order,
      status: ag.status,
      weight: ag.weight,
      progress_percentage: ag.progress_percentage,
      target_percentage: ag.target_percentage,
      total_rencana_aksi: ag.total_rencana_aksi,
      selesai: ag.selesai,
      dalam_progres: ag.dalam_progres,
      terlambat: ag.terlambat,
      belum_mulai: ag.belum_mulai,
      action_plans: apByAg.get(String(ag.activity_group_id)) || [],
    });
  }

  // Attach activity groups to strategies
  return strategies.map((s) => ({
    strategy_id: s.strategy_id,
    strategy_name: s.strategy_name,
    code_order: s.code_order,
    status: s.status,
    weight: s.weight,
    progress_percentage: s.progress_percentage,
    target_percentage: s.target_percentage,
    total_rencana_aksi: s.total_rencana_aksi,
    selesai: s.selesai,
    dalam_progres: s.dalam_progres,
    terlambat: s.terlambat,
    belum_mulai: s.belum_mulai,
    activity_groups: agByStrategy.get(String(s.strategy_id)) || [],
  }));
}

// ═════════════════════════════════════════════
//  CREATE ASPECT
// ═════════════════════════════════════════════

/**
 * POST /api/aspects
 *
 * Body:
 *  - name                 (required)
 *  - target_percentage    (required)
 *  - company_id           (optional — defaults to user's company_id)
 *
 * weight, progress_percentage, status diturunkan dari strategy.
 */
async function createAspect(user, payload) {
  const { name, target_percentage, company_id } = payload;

  if (!name) {
    const error = new Error("Nama aspek wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (target_percentage === undefined || target_percentage === null) {
    const error = new Error("Target percentage wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const targetCompanyId = isHqUser(user)
    ? (company_id || user.company_id)
    : user.company_id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const companyCheck = await client.query(
      "SELECT id FROM companies WHERE id = $1 AND company_type = 'bumd'",
      [targetCompanyId],
    );

    if (companyCheck.rowCount === 0) {
      const error = new Error("Company BUMD tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const result = await client.query(
      `
        INSERT INTO aspects (
          company_id, name, status,
          weight, progress_percentage, target_percentage
        )
        VALUES ($1, $2, 'belum mulai', 0, 0, $3)
        RETURNING *
      `,
      [targetCompanyId, name, target_percentage],
    );

    await client.query("COMMIT");

    return formatAspect(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  UPDATE ASPECT
// ═════════════════════════════════════════════

/**
 * PUT /api/aspects/:aspectId
 *
 * Body:
 *  - name                 (optional)
 *  - target_percentage    (optional)
 *
 * weight, progress_percentage, status diturunkan dari strategy.
 */
async function updateAspect(user, aspectId, payload) {
  const { name, target_percentage } = payload;
  const companyScopeId = getCompanyScope(user);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT a.id, a.company_id
        FROM aspects a
        JOIN companies c ON c.id = a.company_id
        WHERE
          a.id = $1
          AND c.company_type = 'bumd'
          AND ($2::BIGINT IS NULL OR a.company_id = $2)
        FOR UPDATE
      `,
      [aspectId, companyScopeId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Aspek tidak ditemukan");
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
    values.push(aspectId);

    const result = await client.query(
      `
        UPDATE aspects
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    );

    await client.query("COMMIT");

    return formatAspect(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ═════════════════════════════════════════════
//  DELETE ASPECT
// ═════════════════════════════════════════════

async function deleteAspect(user, aspectId) {
  const companyScopeId = getCompanyScope(user);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT a.id, a.name
        FROM aspects a
        JOIN companies c ON c.id = a.company_id
        WHERE
          a.id = $1
          AND c.company_type = 'bumd'
          AND ($2::BIGINT IS NULL OR a.company_id = $2)
        FOR UPDATE
      `,
      [aspectId, companyScopeId],
    );

    if (existing.rowCount === 0) {
      const error = new Error("Aspek tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM strategies WHERE aspect_id = $1",
      [aspectId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        `Aspek tidak bisa dihapus karena masih memiliki ${childCheck.rows[0].count} strategi`,
      );
      error.statusCode = 422;
      throw error;
    }

    await client.query("DELETE FROM aspects WHERE id = $1", [aspectId]);

    await client.query("COMMIT");

    return {
      deleted_id: Number(aspectId),
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
//  FORMAT HELPER
// ─────────────────────────────────────────────

function formatAspect(row) {
  return {
    aspect_id: Number(row.id),
    company_id: Number(row.company_id),
    name: row.name,
    status: row.status,
    weight: toNumber(row.weight),
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  getAspectDetail,
  createAspect,
  updateAspect,
  deleteAspect,
};

