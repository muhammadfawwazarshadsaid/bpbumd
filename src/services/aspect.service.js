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
    const [cards, strategies, activityGroups, actionPlans, subActionPlans] = await Promise.all([
      getAspectCards(client, aspectId),
      getStrategies(client, aspectId, user.id),
      getActivityGroups(client, aspectId, user.id),
      getActionPlans(client, aspectId, user.id),
      getSubActionPlans(client, aspectId),
    ]);

    // ── 3. Build nested hierarchy ──
    const daftarStrategi = buildStrategyTree(
      strategies,
      activityGroups,
      actionPlans,
      subActionPlans,
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
          sap.action_plan_id,
          sap.status AS sap_status,
          CASE 
            WHEN sap.status = 'selesai' THEN 
              CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
            WHEN ap.status = 'terlambat' THEN 'terlambat'
            WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
            ELSE 'belum_mulai'
          END AS effective_status,
          CASE
            WHEN sap.status = 'pengajuan' THEN 30
            WHEN sap.status = 'verifikasi' THEN 65
            WHEN sap.status = 'selesai' THEN 100
            ELSE 0
          END AS score
        FROM sub_action_plans sap
        JOIN action_plans ap
          ON ap.id = sap.action_plan_id
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        WHERE
          s.aspect_id = $1
          AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
      ),
      action_plan_rows AS (
        SELECT
          ap.id,
          ap.status
        FROM action_plans ap
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        JOIN strategies s ON s.id = ag.strategy_id
        WHERE s.aspect_id = $1 AND ap.deleted_at IS NULL
      ),
      ap_dyn AS (
        SELECT action_plan_id, AVG(score) AS ap_prog
        FROM sub_action_plan_rows
        GROUP BY action_plan_id
      ),
      ag_dyn AS (
        SELECT
          ag.id AS activity_group_id, ag.strategy_id,
          SUM(COALESCE(ad.ap_prog, 0) * COALESCE(ap.weight, 0)) / NULLIF(SUM(COALESCE(ap.weight, 0)), 0) AS ag_prog_weighted,
          AVG(COALESCE(ad.ap_prog, 0)) AS ag_prog_unweighted,
          SUM(COALESCE(ap.weight, 0)) AS sum_weight
        FROM action_plans ap
        JOIN ap_dyn ad ON ad.action_plan_id = ap.id
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        WHERE ap.deleted_at IS NULL
        GROUP BY ag.id, ag.strategy_id
      ),
      strat_dyn AS (
        SELECT
          s.id AS strategy_id, s.aspect_id,
          SUM(COALESCE(CASE WHEN ad2.sum_weight > 0 THEN ad2.ag_prog_weighted ELSE ad2.ag_prog_unweighted END, 0) * COALESCE(ag.weight, 0)) / NULLIF(SUM(COALESCE(ag.weight, 0)), 0) AS strat_prog_weighted,
          AVG(COALESCE(CASE WHEN ad2.sum_weight > 0 THEN ad2.ag_prog_weighted ELSE ad2.ag_prog_unweighted END, 0)) AS strat_prog_unweighted,
          SUM(COALESCE(ag.weight, 0)) AS sum_weight
        FROM activity_groups ag
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN ag_dyn ad2 ON ad2.activity_group_id = ag.id
        GROUP BY s.id, s.aspect_id
      ),
      aspect_dyn AS (
        SELECT
          s.aspect_id,
          SUM(COALESCE(CASE WHEN sd.sum_weight > 0 THEN sd.strat_prog_weighted ELSE sd.strat_prog_unweighted END, 0) * COALESCE(s.weight, 0)) / NULLIF(SUM(COALESCE(s.weight, 0)), 0) AS asp_prog_weighted,
          AVG(COALESCE(CASE WHEN sd.sum_weight > 0 THEN sd.strat_prog_weighted ELSE sd.strat_prog_unweighted END, 0)) AS asp_prog_unweighted,
          SUM(COALESCE(s.weight, 0)) AS sum_weight
        FROM strategies s
        JOIN strat_dyn sd ON sd.strategy_id = s.id
        GROUP BY s.aspect_id
      )
      SELECT
        ROUND(COALESCE(CASE WHEN adyn.sum_weight > 0 THEN adyn.asp_prog_weighted ELSE adyn.asp_prog_unweighted END, 0), 2) AS progress_percentage,
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
        )::INT AS belum_mulai,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
        )::INT AS total_ap,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'selesai'
        )::INT AS selesai_ap,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'selesai terlambat'
        )::INT AS selesai_terlambat_ap,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status IN ('dalam progres', 'ditolak')
        )::INT AS dalam_progres_ap,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'terlambat'
        )::INT AS terlambat_ap,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'belum mulai' OR status IS NULL OR status = ''
        )::INT AS belum_mulai_ap
      FROM aspect_dyn adyn
      RIGHT JOIN (SELECT $1::BIGINT AS aspect_id) q ON q.aspect_id = adyn.aspect_id
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
    total_ap: toNumber(row.total_ap),
    selesai_ap: toNumber(row.selesai_ap),
    selesai_terlambat_ap: toNumber(row.selesai_terlambat_ap),
    dalam_progres_ap: toNumber(row.dalam_progres_ap),
    terlambat_ap: toNumber(row.terlambat_ap),
    belum_mulai_ap: toNumber(row.belum_mulai_ap),
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

        COUNT(DISTINCT ap.id)::INT AS total_ap,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status IN ('selesai', 'selesai terlambat')
        )::INT AS selesai_ap,

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
            AND sap2.status IN ('pengajuan', 'verifikasi')
            AND NOT EXISTS (
              SELECT 1 FROM sub_action_plan_approvals prev
              WHERE prev.sub_action_plan_id = sapa.sub_action_plan_id
                AND prev.approval_order < sapa.approval_order
                AND prev.status != 'setujui'
            )
        ) AS needs_my_verification

      FROM strategies s
      LEFT JOIN activity_groups ag
        ON ag.strategy_id = s.id
      LEFT JOIN action_plans ap
        ON ap.activity_group_id = ag.id AND ap.deleted_at IS NULL
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id AND sap.deleted_at IS NULL
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
    total_ap: toNumber(row.total_ap),
    selesai_ap: toNumber(row.selesai_ap),
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

        COUNT(DISTINCT ap.id)::INT AS total_ap,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status IN ('selesai', 'selesai terlambat')
        )::INT AS selesai_ap,

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
            AND sap2.status IN ('pengajuan', 'verifikasi')
            AND NOT EXISTS (
              SELECT 1 FROM sub_action_plan_approvals prev
              WHERE prev.sub_action_plan_id = sapa.sub_action_plan_id
                AND prev.approval_order < sapa.approval_order
                AND prev.status != 'setujui'
            )
        ) AS needs_my_verification

      FROM activity_groups ag
      JOIN strategies s
        ON s.id = ag.strategy_id
      LEFT JOIN action_plans ap
        ON ap.activity_group_id = ag.id AND ap.deleted_at IS NULL
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id AND sap.deleted_at IS NULL
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
    total_ap: toNumber(row.total_ap),
    selesai_ap: toNumber(row.selesai_ap),
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
        ap.additional_pic_user_ids,
        u.name AS pic_name,
        u.position AS pic_position,
        ap.target_end_date,
        ap.output,
        ap.indicator,
        (ap.pic_user_id::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(ap.additional_pic_user_ids) ORDER BY 1), ','), '')) AS combo_string,
        (
          SELECT JSON_AGG(json_build_object(
            'id', apic.id,
            'name', apic.name,
            'position', apic.position
          ))
          FROM users apic
          WHERE apic.id = ANY(ap.additional_pic_user_ids)
        ) AS additional_pics,

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
            AND sap2.status IN ('pengajuan', 'verifikasi')
            AND NOT EXISTS (
              SELECT 1 FROM sub_action_plan_approvals prev
              WHERE prev.sub_action_plan_id = sapa.sub_action_plan_id
                AND prev.approval_order < sapa.approval_order
                AND prev.status != 'setujui'
            )
        ) AS needs_my_verification

      FROM action_plans ap
      JOIN activity_groups ag
        ON ag.id = ap.activity_group_id
      JOIN strategies s
        ON s.id = ag.strategy_id
      LEFT JOIN users u
        ON u.id = ap.pic_user_id
      LEFT JOIN sub_action_plans sap
        ON sap.action_plan_id = ap.id AND sap.deleted_at IS NULL
      WHERE
        s.aspect_id = $1 AND ap.deleted_at IS NULL
      GROUP BY
        ap.id,
        ap.activity_group_id,
        ap.name,
        ap.code_order,
        ap.status,
        ap.weight,
        ap.pic_user_id,
        u.name,
        u.position,
        ap.target_end_date,
        ap.output,
        ap.indicator,
        ap.progress_percentage,
        ap.target_percentage,
        ap.additional_pic_user_ids
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
    pic_name: row.pic_name || null,
    pic_position: row.pic_position || null,
    target_end_date: row.target_end_date,
    output: row.output,
    indicator: row.indicator,
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    combo_string: row.combo_string || null,
    additional_pics: row.additional_pics || [],
    total_sub_rencana_aksi: toNumber(row.total_sub_rencana_aksi),
    selesai_sub: toNumber(row.selesai_sub),
    ditolak_sub: toNumber(row.ditolak_sub),
    needs_my_verification: row.needs_my_verification,
  }));
}

// ─────────────────────────────────────────────
//  SUB ACTION PLANS
// ─────────────────────────────────────────────

async function getSubActionPlans(client, aspectId) {
  const result = await client.query(
    `
      SELECT
        sap.id AS sub_action_plan_id,
        sap.action_plan_id,
        sap.name AS sub_action_plan_name,
        sap.status,
        sap.pic_user_id,
        sap.additional_pic_user_ids,
        u.name AS pic_name,
        (sap.pic_user_id::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(sap.additional_pic_user_ids) ORDER BY 1), ','), '')) AS combo_string,
        (
          SELECT JSON_AGG(json_build_object(
            'id', apic.id,
            'name', apic.name,
            'position', apic.position
          ))
          FROM users apic
          WHERE apic.id = ANY(sap.additional_pic_user_ids)
        ) AS additional_pics
      FROM sub_action_plans sap
      JOIN action_plans ap ON ap.id = sap.action_plan_id
      JOIN activity_groups ag ON ag.id = ap.activity_group_id
      JOIN strategies s ON s.id = ag.strategy_id
      LEFT JOIN users u ON u.id = sap.pic_user_id
      WHERE s.aspect_id = $1 AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
      ORDER BY sap.id ASC
    `,
    [aspectId]
  );

  return result.rows.map((row) => ({
    sub_action_plan_id: Number(row.sub_action_plan_id),
    action_plan_id: Number(row.action_plan_id),
    sub_action_plan_name: row.sub_action_plan_name,
    status: row.status,
    pic_user_id: row.pic_user_id ? Number(row.pic_user_id) : null,
    pic_name: row.pic_name || null,
    combo_string: row.combo_string || null,
    additional_pics: row.additional_pics || [],
  }));
}

function naturalCompareCodeOrder(a, b) {
  const cleanA = (a.code_order || "").replace(/\.+/g, ".").replace(/\.$/, "");
  const cleanB = (b.code_order || "").replace(/\.+/g, ".").replace(/\.$/, "");
  return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: "base" });
}

// ─────────────────────────────────────────────
//  BUILD NESTED TREE
//  strategy → activity_groups → action_plans → sub_action_plans
// ─────────────────────────────────────────────

function buildStrategyTree(strategies, activityGroups, actionPlans, subActionPlans = []) {
  // Group sub action plans by action_plan_id
  const sapByAp = new Map();
  for (const sap of subActionPlans) {
    const key = String(sap.action_plan_id);
    if (!sapByAp.has(key)) {
      sapByAp.set(key, []);
    }
    sapByAp.get(key).push(sap);
  }

  // Sort action plans naturally
  const sortedAp = [...actionPlans].sort(naturalCompareCodeOrder);

  // Group action plans by activity_group_id
  const apByAg = new Map();

  for (const ap of sortedAp) {
    const key = String(ap.activity_group_id);

    if (!apByAg.has(key)) {
      apByAg.set(key, []);
    }

    const cleanCode = (ap.code_order || "").replace(/\.+/g, ".");

    apByAg.get(key).push({
      action_plan_id: ap.action_plan_id,
      action_plan_name: ap.action_plan_name,
      code_order: cleanCode,
      status: ap.status,
      weight: ap.weight,
      pic_user_id: ap.pic_user_id,
      pic_name: ap.pic_name,
      pic_position: ap.pic_position,
      target_end_date: ap.target_end_date,
      output: ap.output,
      indicator: ap.indicator,
      progress_percentage: ap.progress_percentage,
      target_percentage: ap.target_percentage,
      needs_my_verification: ap.needs_my_verification,
      ditolak_sub: ap.ditolak_sub,
      combo_string: ap.combo_string,
      additional_pics: ap.additional_pics,
      sub_action_plans: sapByAp.get(String(ap.action_plan_id)) || [],
      rencana_aksi: {
        selesai: ap.selesai_sub,
        total: ap.total_sub_rencana_aksi,
      },
    });
  }

  // Sort activity groups naturally
  const sortedAg = [...activityGroups].sort(naturalCompareCodeOrder);

  // Group activity groups by strategy_id
  const agByStrategy = new Map();

  for (const ag of sortedAg) {
    const key = String(ag.strategy_id);

    if (!agByStrategy.has(key)) {
      agByStrategy.set(key, []);
    }

    const cleanCode = (ag.code_order || "").replace(/\.+/g, ".");

    agByStrategy.get(key).push({
      activity_group_id: ag.activity_group_id,
      activity_group_name: ag.activity_group_name,
      code_order: cleanCode,
      status: ag.status,
      weight: ag.weight,
      progress_percentage: ag.progress_percentage,
      target_percentage: ag.target_percentage,
      total_rencana_aksi: ag.total_rencana_aksi,
      selesai: ag.selesai,
      total_ap: ag.total_ap,
      selesai_ap: ag.selesai_ap,
      ditolak_sub: ag.ditolak_sub,
      dalam_progres: ag.dalam_progres,
      terlambat: ag.terlambat,
      belum_mulai: ag.belum_mulai,
      needs_my_verification: ag.needs_my_verification,
      action_plans: apByAg.get(String(ag.activity_group_id)) || [],
    });
  }

  // Sort strategies naturally
  const sortedStrategies = [...strategies].sort(naturalCompareCodeOrder);

  // Group strategies
  const strategyList = [];

  for (const s of sortedStrategies) {
    const cleanCode = (s.code_order || "").replace(/\.+/g, ".");

    strategyList.push({
      strategy_id: s.strategy_id,
      strategy_name: s.strategy_name,
      code_order: cleanCode,
      status: s.status,
      weight: s.weight,
      progress_percentage: s.progress_percentage,
      target_percentage: s.target_percentage,
      total_rencana_aksi: s.total_rencana_aksi,
      selesai: s.selesai,
      total_ap: s.total_ap,
      selesai_ap: s.selesai_ap,
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

    // Cascade delete bottom-up to handle ON DELETE RESTRICT constraints
    // 1. Delete sub_action_plans
    await client.query(`
      DELETE FROM sub_action_plans 
      WHERE action_plan_id IN (
        SELECT ap.id FROM action_plans ap
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        JOIN strategies s ON s.id = ag.strategy_id
        WHERE s.aspect_id = $1
      )
    `, [aspectId]);

    // 2. Delete action_plans
    await client.query(`
      DELETE FROM action_plans 
      WHERE activity_group_id IN (
        SELECT ag.id FROM activity_groups ag
        JOIN strategies s ON s.id = ag.strategy_id
        WHERE s.aspect_id = $1
      )
    `, [aspectId]);

    // 3. Delete activity_groups
    await client.query(`
      DELETE FROM activity_groups 
      WHERE strategy_id IN (
        SELECT s.id FROM strategies s
        WHERE s.aspect_id = $1
      )
    `, [aspectId]);

    // 4. Delete strategies
    await client.query(`
      DELETE FROM strategies 
      WHERE aspect_id = $1
    `, [aspectId]);

    // 5. Delete aspect
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
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(ap.weight, 0)) = 0 THEN 
               COALESCE(
                 (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
                  FROM sub_action_plans sap JOIN action_plans ap2 ON ap2.id = sap.action_plan_id WHERE ap2.activity_group_id = ag.id)
               , 0)
             ELSE ROUND(SUM((ap.progress_percentage * COALESCE(ap.weight, 0)) / 100.0), 2)
           END
         FROM action_plans ap
         WHERE ap.activity_group_id = ag.id), 0
      )
      WHERE ag.strategy_id IN (SELECT id FROM strategies WHERE aspect_id = $1)
    `, [aspectId]);

    await client.query(`
      UPDATE strategies s
      SET progress_percentage = COALESCE(
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(ag.weight, 0)) = 0 THEN 
               COALESCE(
                 (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
                  FROM sub_action_plans sap JOIN action_plans ap2 ON ap2.id = sap.action_plan_id JOIN activity_groups ag2 ON ag2.id = ap2.activity_group_id WHERE ag2.strategy_id = s.id)
               , 0)
             ELSE ROUND(SUM((ag.progress_percentage * COALESCE(ag.weight, 0)) / 100.0), 2)
           END
         FROM activity_groups ag
         WHERE ag.strategy_id = s.id), 0
      )
      WHERE s.aspect_id = $1
    `, [aspectId]);

    await client.query(`
      UPDATE aspects a
      SET progress_percentage = COALESCE(
        (SELECT 
           CASE 
             WHEN SUM(COALESCE(s.weight, 0)) = 0 THEN 
               COALESCE(
                 (SELECT ROUND((COUNT(*) FILTER (WHERE sap.status = 'selesai'))::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)
                  FROM sub_action_plans sap JOIN action_plans ap2 ON ap2.id = sap.action_plan_id JOIN activity_groups ag2 ON ag2.id = ap2.activity_group_id JOIN strategies s2 ON s2.id = ag2.strategy_id WHERE s2.aspect_id = a.id)
               , 0)
             ELSE ROUND(SUM((s.progress_percentage * COALESCE(s.weight, 0)) / 100.0), 2)
           END
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
