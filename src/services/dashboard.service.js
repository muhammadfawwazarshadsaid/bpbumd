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

async function getDashboardSummary(user) {
  const companyScopeId = getCompanyScope(user);
  const client = await pool.connect();

  try {
    const [overallCards, companyCards, progressPerAspect] = await Promise.all([
      getOverallCards(client, companyScopeId),
      getCompanyCards(client, companyScopeId),
      getProgressPerAspect(client, companyScopeId),
    ]);

    const aspectMap = groupAspectsByCompany(progressPerAspect);

    const companies = companyCards.map((company) => ({
      company_id: company.company_id,
      company_name: company.company_name,
      company_code: company.company_code,
      logo: company.logo,
      sector_name: company.sector_name,

      cards: {
        progress_percentage: company.progress_percentage,
        target_percentage: company.target_percentage,
        terlambat: company.terlambat,
        total_aspek: company.total_aspek,
        total_strategi: company.total_strategi,
        total_rencana_aksi: company.total_rencana_aksi,
        total_sub_rencana_aksi: company.total_sub_rencana_aksi,
        selesai: company.selesai,
      },

      progress_per_aspect: aspectMap.get(String(company.company_id)) || [],
    }));

    return {
      scope: {
        company_id: companyScopeId,
        company_type: user.company_type,
        scope_type: companyScopeId ? "company" : "all",
      },

      cards: overallCards,

      companies,
    };
  } finally {
    client.release();
  }
}

async function getOverallCards(client, companyScopeId) {
  const result = await client.query(
    `
      WITH scoped_companies AS (
        SELECT
          c.id
        FROM companies c
        WHERE
          c.company_type = 'bumd'
          AND ($1::BIGINT IS NULL OR c.id = $1)
      ),
      aspect_rows AS (
        SELECT
          a.id,
          a.company_id
        FROM aspects a
        JOIN scoped_companies sc
          ON sc.id = a.company_id
      ),
      strategy_rows AS (
        SELECT
          s.id,
          a.company_id
        FROM strategies s
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
      ),
      action_plan_rows AS (
        SELECT
          ap.id,
          a.company_id,
          ap.status,
          ap.progress_percentage,
          ap.target_percentage
        FROM action_plans ap
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
      ),
      sub_action_plan_rows AS (
        SELECT
          sap.id,
          a.company_id
        FROM sub_action_plans sap
        JOIN action_plans ap
          ON ap.id = sap.action_plan_id
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
      )
      SELECT
        COALESCE(
          ROUND((SELECT AVG(progress_percentage) FROM action_plan_rows), 2),
          0
        ) AS progress_percentage,

        COALESCE(
          ROUND((SELECT AVG(target_percentage) FROM action_plan_rows), 2),
          0
        ) AS target_percentage,

        (
          SELECT COUNT(*)
          FROM aspect_rows
        )::INT AS total_aspek,

        (
          SELECT COUNT(*)
          FROM strategy_rows
        )::INT AS total_strategi,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
        )::INT AS total_rencana_aksi,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
        )::INT AS total_sub_rencana_aksi,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'terlambat'
        )::INT AS terlambat,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status = 'selesai'
        )::INT AS selesai
    `,
    [companyScopeId],
  );

  const row = result.rows[0] || {};

  return {
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    terlambat: toNumber(row.terlambat),
    total_aspek: toNumber(row.total_aspek),
    total_strategi: toNumber(row.total_strategi),
    total_rencana_aksi: toNumber(row.total_rencana_aksi),
    total_sub_rencana_aksi: toNumber(row.total_sub_rencana_aksi),
    selesai: toNumber(row.selesai),
  };
}

async function getCompanyCards(client, companyScopeId) {
  const result = await client.query(
    `
      WITH scoped_companies AS (
        SELECT
          c.id,
          c.name,
          c.company_code,
          c.sector_id,
          c.logo
        FROM companies c
        WHERE
          c.company_type = 'bumd'
          AND ($1::BIGINT IS NULL OR c.id = $1)
      ),
      aspect_agg AS (
        SELECT
          a.company_id,
          COUNT(*)::INT AS total_aspek
        FROM aspects a
        JOIN scoped_companies sc
          ON sc.id = a.company_id
        GROUP BY
          a.company_id
      ),
      strategy_agg AS (
        SELECT
          a.company_id,
          COUNT(s.id)::INT AS total_strategi
        FROM strategies s
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
        GROUP BY
          a.company_id
      ),
      action_plan_agg AS (
        SELECT
          a.company_id,
          COUNT(ap.id)::INT AS total_rencana_aksi,

          COALESCE(
            ROUND(AVG(ap.progress_percentage), 2),
            0
          ) AS progress_percentage,

          COALESCE(
            ROUND(AVG(ap.target_percentage), 2),
            0
          ) AS target_percentage,

          COUNT(ap.id) FILTER (
            WHERE ap.status = 'terlambat'
          )::INT AS terlambat,

          COUNT(ap.id) FILTER (
            WHERE ap.status = 'selesai'
          )::INT AS selesai

        FROM action_plans ap
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
        GROUP BY
          a.company_id
      ),
      sub_action_plan_agg AS (
        SELECT
          a.company_id,
          COUNT(sap.id)::INT AS total_sub_rencana_aksi
        FROM sub_action_plans sap
        JOIN action_plans ap
          ON ap.id = sap.action_plan_id
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
        GROUP BY
          a.company_id
      )
      SELECT
        sc.id AS company_id,
        sc.name AS company_name,
        sc.company_code,
        sc.logo,
        sec.name AS sector_name,

        COALESCE(aa.total_aspek, 0) AS total_aspek,
        COALESCE(sa.total_strategi, 0) AS total_strategi,
        COALESCE(apa.total_rencana_aksi, 0) AS total_rencana_aksi,
        COALESCE(sapa.total_sub_rencana_aksi, 0) AS total_sub_rencana_aksi,

        COALESCE(apa.progress_percentage, 0) AS progress_percentage,
        COALESCE(apa.target_percentage, 0) AS target_percentage,
        COALESCE(apa.terlambat, 0) AS terlambat,
        COALESCE(apa.selesai, 0) AS selesai

      FROM scoped_companies sc
      LEFT JOIN sectors sec
        ON sec.id = sc.sector_id
      LEFT JOIN aspect_agg aa
        ON aa.company_id = sc.id
      LEFT JOIN strategy_agg sa
        ON sa.company_id = sc.id
      LEFT JOIN action_plan_agg apa
        ON apa.company_id = sc.id
      LEFT JOIN sub_action_plan_agg sapa
        ON sapa.company_id = sc.id
      ORDER BY
        sc.name
    `,
    [companyScopeId],
  );

  return result.rows.map((row) => ({
    company_id: Number(row.company_id),
    company_name: row.company_name,
    company_code: row.company_code,
    logo: row.logo,
    sector_name: row.sector_name,

    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    terlambat: toNumber(row.terlambat),
    total_aspek: toNumber(row.total_aspek),
    total_strategi: toNumber(row.total_strategi),
    total_rencana_aksi: toNumber(row.total_rencana_aksi),
    total_sub_rencana_aksi: toNumber(row.total_sub_rencana_aksi),
    selesai: toNumber(row.selesai),
  }));
}

async function getProgressPerAspect(client, companyScopeId) {
  const result = await client.query(
    `
      SELECT
        c.id AS company_id,

        a.id AS aspect_id,
        a.name AS aspect_name,
        a.status AS aspect_status,

        COALESCE(a.progress_percentage, 0) AS progress_percentage,
        COALESCE(a.target_percentage, 0) AS target_percentage,

        COUNT(DISTINCT ap.id)::INT AS total,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status = 'selesai'
        )::INT AS selesai,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status = 'dalam progres'
        )::INT AS dalam_progres,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status = 'terlambat'
        )::INT AS terlambat,

        COUNT(DISTINCT ap.id) FILTER (
          WHERE ap.status = 'belum mulai'
        )::INT AS belum_mulai

      FROM companies c
      JOIN aspects a
        ON a.company_id = c.id
      LEFT JOIN strategies s
        ON s.aspect_id = a.id
      LEFT JOIN activity_groups ag
        ON ag.strategy_id = s.id
      LEFT JOIN action_plans ap
        ON ap.activity_group_id = ag.id
      WHERE
        c.company_type = 'bumd'
        AND ($1::BIGINT IS NULL OR c.id = $1)
      GROUP BY
        c.id,
        c.name,
        a.id,
        a.name,
        a.status,
        a.progress_percentage,
        a.target_percentage
      ORDER BY
        c.name,
        a.id
    `,
    [companyScopeId],
  );

  return result.rows.map((row) => ({
    company_id: Number(row.company_id),
    aspect_id: Number(row.aspect_id),
    aspect_name: row.aspect_name,
    aspect_status: row.aspect_status,
    progress_percentage: toNumber(row.progress_percentage),
    target_percentage: toNumber(row.target_percentage),
    total: toNumber(row.total),
    selesai: toNumber(row.selesai),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
  }));
}

function groupAspectsByCompany(rows) {
  const map = new Map();

  for (const row of rows) {
    const companyId = String(row.company_id);

    if (!map.has(companyId)) {
      map.set(companyId, []);
    }

    map.get(companyId).push({
      aspect_id: row.aspect_id,
      aspect_name: row.aspect_name,
      aspect_status: row.aspect_status,
      progress_percentage: row.progress_percentage,
      target_percentage: row.target_percentage,
      total: row.total,
      selesai: row.selesai,
      dalam_progres: row.dalam_progres,
      terlambat: row.terlambat,
      belum_mulai: row.belum_mulai,
    });
  }

  return map;
}

module.exports = {
  getDashboardSummary,
};
