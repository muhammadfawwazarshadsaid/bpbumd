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
      getStrategies(client, aspectId, user.id),
      getActivityGroups(client, aspectId, user.id),
      getActionPlans(client, aspectId, user.id),
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
          sap.status AS sap_status,
          CASE 
            WHEN sap.status = 'selesai' THEN 
              CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
            WHEN ap.status = 'terlambat' THEN 'terlambat'
            WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
            ELSE 'belum_mulai'
          END AS effective_status
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
          WHERE effective_status = 'selesai'
        )::INT AS selesai,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE effective_status = 'selesai_terlambat'
        )::INT AS selesai_terlambat,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE effective_status = 'dalam_progres'
        )::INT AS dalam_progres,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE sap_status = 'ditolak'
        )::INT AS ditolak_count,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE effective_status = 'terlambat'
        )::INT AS terlambat,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE effective_status = 'belum_mulai'
        )::INT AS belum_mulai
    `,
    [aspectId],
  );

  const row = result.rows[0] || {};

  return {
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_aktivitas: toNumber(row.total_aktivitas),
    selesai: toNumber(row.selesai),
    selesai_terlambat: toNumber(row.selesai_terlambat),
    dalam_progres: toNumber(row.dalam_progres),
    ditolak_count: toNumber(row.ditolak_count),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
  };
}

// ─────────────────────────────────────────────
//  STRATEGIES
// ─────────────────────────────────────────────

async function getStrategies(client, aspectId, userId) {
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
          WHERE sap.status = 'ditolak'
        )::INT AS ditolak_sub,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status IN ('pengajuan', 'verifikasi', 'ditolak')
        )::INT AS dalam_progres,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'terlambat'
        )::INT AS terlambat,

        0::INT AS belum_mulai,

        EXISTS (
          SELECT 1
          FROM sub_action_plan_approvals sapa
          JOIN sub_action_plans sap2 ON sap2.id = sapa.sub_action_plan_id
          JOIN action_plans ap2 ON ap2.id = sap2.action_plan_id
          JOIN activity_groups ag2 ON ag2.id = ap2.activity_group_id
          WHERE ag2.strategy_id = s.id
            AND sapa.approver_user_id = $2
            AND sapa.status = 'menunggu'
            AND (
              (sap2.status = 'pengajuan' AND sapa.approval_order = 1) OR
              (sap2.status = 'verifikasi' AND sapa.approval_order = 2)
            )
        ) AS needs_my_verification

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
    [aspectId, userId],
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
    ditolak_sub: toNumber(row.ditolak_sub),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
    needs_my_verification: row.needs_my_verification,
  }));
}

// ─────────────────────────────────────────────
//  ACTIVITY GROUPS
// ─────────────────────────────────────────────

async function getActivityGroups(client, aspectId, userId) {
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
          WHERE sap.status = 'ditolak'
        )::INT AS ditolak_sub,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status IN ('pengajuan', 'verifikasi', 'ditolak')
        )::INT AS dalam_progres,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'terlambat'
        )::INT AS terlambat,

        0::INT AS belum_mulai,

        EXISTS (
          SELECT 1
          FROM sub_action_plan_approvals sapa
          JOIN sub_action_plans sap2 ON sap2.id = sapa.sub_action_plan_id
          JOIN action_plans ap2 ON ap2.id = sap2.action_plan_id
          WHERE ap2.activity_group_id = ag.id
            AND sapa.approver_user_id = $2
            AND sapa.status = 'menunggu'
            AND (
              (sap2.status = 'pengajuan' AND sapa.approval_order = 1) OR
              (sap2.status = 'verifikasi' AND sapa.approval_order = 2)
            )
        ) AS needs_my_verification

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
    [aspectId, userId],
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
    ditolak_sub: toNumber(row.ditolak_sub),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
    needs_my_verification: row.needs_my_verification,
  }));
}

// ─────────────────────────────────────────────
//  ACTION PLANS (Rencana Aksi)
// ─────────────────────────────────────────────

async function getActionPlans(client, aspectId, userId) {
  const result = await client.query(
    `
      SELECT
        ap.id                AS action_plan_id,
        ap.activity_group_id,
        ap.name              AS action_plan_name,
        ap.code_order,
        ap.status,
        ap.weight,
        ap.pic_user_id,
        ap.target_end_date,
        ap.output,
        ap.indicator,

        COALESCE(ap.progress_percentage, 0) AS progress_percentage,
        COALESCE(ap.target_percentage, 0)   AS target_percentage,

        COUNT(DISTINCT sap.id)::INT AS total_sub_rencana_aksi,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'selesai'
        )::INT AS selesai_sub,

        COUNT(DISTINCT sap.id) FILTER (
          WHERE sap.status = 'ditolak'
        )::INT AS ditolak_sub,

        EXISTS (
          SELECT 1
          FROM sub_action_plan_approvals sapa
          JOIN sub_action_plans sap2 ON sap2.id = sapa.sub_action_plan_id
          WHERE sap2.action_plan_id = ap.id
            AND sapa.approver_user_id = $2
            AND sapa.status = 'menunggu'
            AND (
              (sap2.status = 'pengajuan' AND sapa.approval_order = 1) OR
              (sap2.status = 'verifikasi' AND sapa.approval_order = 2)
            )
        ) AS needs_my_verification

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
        ap.pic_user_id,
        ap.target_end_date,
        ap.output,
        ap.indicator,
        ap.progress_percentage,
        ap.target_percentage
      ORDER BY
        ap.code_order,
        ap.id
    `,
    [aspectId, userId],
  );

  return result.rows.map((row) => ({
    action_plan_id: Number(row.action_plan_id),
    activity_group_id: Number(row.activity_group_id),
    action_plan_name: row.action_plan_name,
    code_order: row.code_order,
    status: row.status,
    weight: toNumber(row.weight),
    pic_user_id: row.pic_user_id,
    target_end_date: row.target_end_date,
    output: row.output,
    indicator: row.indicator,
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total_sub_rencana_aksi: toNumber(row.total_sub_rencana_aksi),
    selesai_sub: toNumber(row.selesai_sub),
    ditolak_sub: toNumber(row.ditolak_sub),
    needs_my_verification: row.needs_my_verification,
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
      pic_user_id: ap.pic_user_id,
      target_end_date: ap.target_end_date,
      output: ap.output,
      indicator: ap.indicator,
      progress_percentage: ap.progress_percentage,
      target_percentage: ap.target_percentage,
      needs_my_verification: ap.needs_my_verification,
      ditolak_sub: ap.ditolak_sub,
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
      ditolak_sub: ag.ditolak_sub,
      dalam_progres: ag.dalam_progres,
      terlambat: ag.terlambat,
      belum_mulai: ag.belum_mulai,
      needs_my_verification: ag.needs_my_verification,
      action_plans: apByAg.get(String(ag.activity_group_id)) || [],
    });
  }

  // Group strategies
  const strategyList = [];

  for (const s of strategies) {
    strategyList.push({
      strategy_id: s.strategy_id,
      strategy_name: s.strategy_name,
      code_order: s.code_order,
      status: s.status,
      weight: s.weight,
      progress_percentage: s.progress_percentage,
      target_percentage: s.target_percentage,
      total_rencana_aksi: s.total_rencana_aksi,
      selesai: s.selesai,
      ditolak_sub: s.ditolak_sub,
      dalam_progres: s.dalam_progres,
      terlambat: s.terlambat,
      belum_mulai: s.belum_mulai,
      needs_my_verification: s.needs_my_verification,
      activity_groups: agByStrategy.get(String(s.strategy_id)) || [],
    });
  }

  return strategyList;
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
          progress_percentage, target_percentage
        )
        VALUES ($1, $2, 'belum mulai', 0, $3)
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
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Bulk update weights for strategies, activity_groups, and action_plans
 */
async function bulkUpdateWeights(user, aspectId, payload) {
  const companyScopeId = getCompanyScope(user);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify aspect exists
    const aspect = await getAspect(client, aspectId, companyScopeId);
    if (!aspect) {
      const error = new Error("Aspek tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const { strategies = [], activity_groups = [], action_plans = [] } = payload;

    // 2. Update strategies
    if (strategies.length > 0) {
      const sum = strategies.reduce((acc, curr) => acc + toNumber(curr.weight), 0);
      if (Math.round(sum) !== 100 && Math.round(sum) !== 0) {
        const error = new Error("Total bobot strategi harus 100%");
        error.statusCode = 400;
        throw error;
      }
      for (const s of strategies) {
        const verifySql = `SELECT id FROM strategies WHERE id = $1 AND aspect_id = $2`;
        const verifyRes = await client.query(verifySql, [s.id, aspectId]);
        if (verifyRes.rows.length === 0) continue;
        await client.query(`UPDATE strategies SET weight = $1 WHERE id = $2`, [toNumber(s.weight), s.id]);
      }
    }

    // 3. Update activity groups
    if (activity_groups.length > 0) {
      const agIds = activity_groups.map(ag => ag.id);
      if (agIds.length > 0) {
        const verifySql = `SELECT id, strategy_id FROM activity_groups WHERE id = ANY($1::bigint[])`;
        const verifyRes = await client.query(verifySql, [agIds]);
        const agMap = new Map();
        verifyRes.rows.forEach(row => {
          agMap.set(Number(row.id), Number(row.strategy_id));
        });

        const grouped = {};
        for (const ag of activity_groups) {
          const sid = agMap.get(Number(ag.id));
          if (!sid) continue;
          if (!grouped[sid]) grouped[sid] = 0;
          grouped[sid] += toNumber(ag.weight);
        }

        for (const sid in grouped) {
          const sum = Math.round(grouped[sid]);
          if (sum !== 100 && sum !== 0) {
            const error = new Error("Total bobot activity group dalam satu strategi harus 100%");
            error.statusCode = 400;
            throw error;
          }
        }

        for (const ag of activity_groups) {
          await client.query(`UPDATE activity_groups SET weight = $1 WHERE id = $2`, [toNumber(ag.weight), ag.id]);
        }
      }
    }

    // 4. Update action plans
    if (action_plans.length > 0) {
      const apIds = action_plans.map(ap => ap.id);
      if (apIds.length > 0) {
        const verifySql = `SELECT id, activity_group_id FROM action_plans WHERE id = ANY($1::bigint[])`;
        const verifyRes = await client.query(verifySql, [apIds]);
        const apMap = new Map();
        verifyRes.rows.forEach(row => {
          apMap.set(Number(row.id), Number(row.activity_group_id));
        });

        const grouped = {};
        for (const ap of action_plans) {
          const agid = apMap.get(Number(ap.id));
          if (!agid) continue;
          if (!grouped[agid]) grouped[agid] = 0;
          grouped[agid] += toNumber(ap.weight);
        }

        for (const agid in grouped) {
          const sum = Math.round(grouped[agid]);
          if (sum !== 100 && sum !== 0) {
            const error = new Error("Total bobot rencana aksi dalam satu activity group harus 100%");
            error.statusCode = 400;
            throw error;
          }
        }

        for (const ap of action_plans) {
          await client.query(`UPDATE action_plans SET weight = $1 WHERE id = $2`, [toNumber(ap.weight), ap.id]);
        }
      }
    }

    // 5. Sinkronisasi ulang progress_percentage bottom-up
    await client.query(`
      UPDATE activity_groups ag
      SET progress_percentage = COALESCE(
        (SELECT ROUND(SUM((ap.progress_percentage * COALESCE(ap.weight, 0)) / 100.0), 2)
         FROM action_plans ap
         WHERE ap.activity_group_id = ag.id), 0
      )
      WHERE ag.strategy_id IN (SELECT id FROM strategies WHERE aspect_id = $1)
    `, [aspectId]);

    await client.query(`
      UPDATE strategies s
      SET progress_percentage = COALESCE(
        (SELECT ROUND(SUM((ag.progress_percentage * COALESCE(ag.weight, 0)) / 100.0), 2)
         FROM activity_groups ag
         WHERE ag.strategy_id = s.id), 0
      )
      WHERE s.aspect_id = $1
    `, [aspectId]);

    await client.query(`
      UPDATE aspects a
      SET progress_percentage = COALESCE(
        (SELECT ROUND(SUM((s.progress_percentage * COALESCE(s.weight, 0)) / 100.0), 2)
         FROM strategies s
         WHERE s.aspect_id = a.id), 0
      )
      WHERE a.id = $1
    `, [aspectId]);

    await client.query("COMMIT");
    return { updated: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getAspectDetail,
  createAspect,
  updateAspect,
  deleteAspect,
  bulkUpdateWeights,
};
