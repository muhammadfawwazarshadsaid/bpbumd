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
      getProgressPerAspect(client, companyScopeId, user.id),
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
          a.company_id,
          COALESCE(a.progress_percentage, 0) AS progress_percentage,
          COALESCE(a.target_percentage, 0) AS target_percentage,
          EXISTS (
            SELECT 1 FROM sub_action_plans sap
            JOIN action_plans ap ON ap.id = sap.action_plan_id
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            WHERE s.aspect_id = a.id
          ) AS has_sap
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
          a.company_id,
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
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
      )
      SELECT
        COALESCE(
          ROUND(
            (SELECT COUNT(*)::NUMERIC FROM sub_action_plan_rows WHERE effective_status IN ('selesai', 'selesai_terlambat')) /
            NULLIF((SELECT COUNT(*)::NUMERIC FROM sub_action_plan_rows), 0) * 100
          , 2),
          0
        ) AS progress_percentage,

        COALESCE(
          ROUND((SELECT AVG(target_percentage) FROM aspect_rows WHERE has_sap = true), 2),
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
          FROM sub_action_plan_rows
          WHERE effective_status = 'terlambat'
        )::INT AS terlambat,

        (
          SELECT COUNT(*)
          FROM sub_action_plan_rows
          WHERE effective_status IN ('selesai', 'selesai_terlambat')
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
          COUNT(*)::INT AS total_aspek,

          COALESCE(
            ROUND(
              (
                SELECT COUNT(*)::NUMERIC FROM sub_action_plans sap
                JOIN action_plans ap ON ap.id = sap.action_plan_id
                JOIN activity_groups ag ON ag.id = ap.activity_group_id
                JOIN strategies s ON s.id = ag.strategy_id
                JOIN aspects a2 ON a2.id = s.aspect_id
                WHERE a2.company_id = a.company_id
                  AND sap.status = 'selesai'
              ) / NULLIF(
                (
                  SELECT COUNT(*)::NUMERIC FROM sub_action_plans sap
                  JOIN action_plans ap ON ap.id = sap.action_plan_id
                  JOIN activity_groups ag ON ag.id = ap.activity_group_id
                  JOIN strategies s ON s.id = ag.strategy_id
                  JOIN aspects a2 ON a2.id = s.aspect_id
                  WHERE a2.company_id = a.company_id
                )
              , 0) * 100
            , 2),
            0
          ) AS progress_percentage,

          COALESCE(
            ROUND(AVG(a.target_percentage) FILTER (
              WHERE EXISTS (
                SELECT 1 FROM sub_action_plans sap
                JOIN action_plans ap ON ap.id = sap.action_plan_id
                JOIN activity_groups ag ON ag.id = ap.activity_group_id
                JOIN strategies s ON s.id = ag.strategy_id
                WHERE s.aspect_id = a.id
              )
            ), 2),
            0
          ) AS target_percentage

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
          COUNT(ap.id)::INT AS total_rencana_aksi
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
          COUNT(sap.id)::INT AS total_sub_rencana_aksi,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'terlambat'
          )::INT AS terlambat,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END IN ('selesai', 'selesai_terlambat')
          )::INT AS selesai

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

        COALESCE(aa.progress_percentage, 0) AS progress_percentage,
        COALESCE(aa.target_percentage, 0) AS target_percentage,
        COALESCE(sapa.terlambat, 0) AS terlambat,
        COALESCE(sapa.selesai, 0) AS selesai

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

async function getProgressPerAspect(client, companyScopeId, userId) {
  const result = await client.query(
    `
      WITH sap_base AS (
        SELECT
          sap.id AS sap_id,
          a.company_id,
          a.id AS aspect_id,
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
        JOIN aspects a
          ON a.id = s.aspect_id
        WHERE
          ($1::BIGINT IS NULL OR a.company_id = $1)
      )
      SELECT
        c.id AS company_id,

        a.id AS aspect_id,
        a.name AS aspect_name,
        a.status AS aspect_status,

        COALESCE(a.progress_percentage, 0) AS progress_percentage,
        COALESCE(a.target_percentage, 0) AS target_percentage,

        COUNT(DISTINCT sb.sap_id)::INT AS total,

        COUNT(DISTINCT sb.sap_id) FILTER (
          WHERE sb.effective_status = 'selesai'
        )::INT AS selesai,

        COUNT(DISTINCT sb.sap_id) FILTER (
          WHERE sb.effective_status = 'selesai_terlambat'
        )::INT AS selesai_terlambat,

        COUNT(DISTINCT sb.sap_id) FILTER (
          WHERE sb.effective_status = 'dalam_progres'
        )::INT AS dalam_progres,

        COUNT(DISTINCT sb.sap_id) FILTER (
          WHERE sb.effective_status = 'terlambat'
        )::INT AS terlambat,

        COUNT(DISTINCT sb.sap_id) FILTER (
          WHERE sb.effective_status = 'belum_mulai'
        )::INT AS belum_mulai,

        EXISTS (
          SELECT 1
          FROM sub_action_plan_approvals sapa
          JOIN sub_action_plans sap ON sap.id = sapa.sub_action_plan_id
          JOIN action_plans ap2 ON ap2.id = sap.action_plan_id
          JOIN activity_groups ag2 ON ag2.id = ap2.activity_group_id
          JOIN strategies st2 ON st2.id = ag2.strategy_id
          WHERE st2.aspect_id = a.id
            AND sapa.approver_user_id = $2
            AND sapa.status = 'menunggu'
            AND (
              (sap.status = 'pengajuan' AND sapa.approval_order = 1) OR
              (sap.status = 'verifikasi' AND sapa.approval_order = 2)
            )
        ) AS needs_my_verification

      FROM companies c
      JOIN aspects a
        ON a.company_id = c.id
      LEFT JOIN sap_base sb
        ON sb.aspect_id = a.id
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
    [companyScopeId, userId],
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
    selesai_terlambat: toNumber(row.selesai_terlambat),
    dalam_progres: toNumber(row.dalam_progres),
    terlambat: toNumber(row.terlambat),
    belum_mulai: toNumber(row.belum_mulai),
    needs_my_verification: row.needs_my_verification,
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
      selesai_terlambat: row.selesai_terlambat,
      dalam_progres: row.dalam_progres,
      terlambat: row.terlambat,
      belum_mulai: row.belum_mulai,
      needs_my_verification: row.needs_my_verification,
    });
  }

  return map;
}

module.exports = {
  getDashboardSummary,
};
