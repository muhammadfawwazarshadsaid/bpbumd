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

async function getDashboardSummary(user, filters = {}) {
  const companyScopeId = getCompanyScope(user);
  const { picCombos = null } = filters;
  const client = await pool.connect();

  try {
    const [overallCards, companyCards, progressPerAspect] = await Promise.all([
      getOverallCards(client, companyScopeId, { picCombos }),
      getCompanyCards(client, companyScopeId, { picCombos }),
      getProgressPerAspect(client, companyScopeId, user.id, { picCombos }),
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
        selesai_rencana_aksi: company.selesai_rencana_aksi,
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

async function getOverallCards(client, companyScopeId, filters = {}) {
  const { picCombos = null } = filters;
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
            WHERE s.aspect_id = a.id AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
              AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
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
        WHERE ap.deleted_at IS NULL
          AND ($2::text[] IS NULL OR (ap.pic_user_id::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(ap.additional_pic_user_ids) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND ap.pic_user_id IS NULL))
      ),
      sub_action_plan_rows AS (
        SELECT
          sap.id,
          sap.action_plan_id,
          a.company_id,
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
          END AS progress_weight
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
        WHERE sap.deleted_at IS NULL AND ap.deleted_at IS NULL
          AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
      ),
      ap_dyn AS (
        SELECT action_plan_id, AVG(progress_weight) AS ap_prog
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
          a.company_id,
          SUM(COALESCE(CASE WHEN sd.sum_weight > 0 THEN sd.strat_prog_weighted ELSE sd.strat_prog_unweighted END, 0) * COALESCE(s.weight, 0)) / NULLIF(SUM(COALESCE(s.weight, 0)), 0) AS asp_prog_weighted,
          AVG(COALESCE(CASE WHEN sd.sum_weight > 0 THEN sd.strat_prog_weighted ELSE sd.strat_prog_unweighted END, 0)) AS asp_prog_unweighted,
          SUM(COALESCE(s.weight, 0)) AS sum_weight
        FROM strategies s
        JOIN strat_dyn sd ON sd.strategy_id = s.id
        JOIN aspects a ON a.id = s.aspect_id
        GROUP BY s.aspect_id, a.company_id
      ),
      company_dyn AS (
        SELECT
          company_id,
          AVG(COALESCE(CASE WHEN sum_weight > 0 THEN asp_prog_weighted ELSE asp_prog_unweighted END, 0)) AS company_prog
        FROM aspect_dyn
        GROUP BY company_id
      )
      SELECT
        COALESCE(
              ROUND(
                (SELECT AVG(company_prog) FROM company_dyn)
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
        )::INT AS selesai,

        (
          SELECT COUNT(*)
          FROM action_plan_rows
          WHERE status IN ('selesai', 'selesai terlambat')
        )::INT AS selesai_rencana_aksi
    `,
    [companyScopeId, picCombos],
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
    selesai_rencana_aksi: toNumber(row.selesai_rencana_aksi),
  };
}

async function getCompanyCards(client, companyScopeId, filters = {}) {
  const { picCombos = null } = filters;
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
                SELECT SUM(CASE WHEN sap.status = 'pengajuan' THEN 30 WHEN sap.status = 'verifikasi' THEN 65 WHEN sap.status = 'selesai' THEN 100 ELSE 0 END)::NUMERIC
                FROM sub_action_plans sap
                JOIN action_plans ap ON ap.id = sap.action_plan_id
                JOIN activity_groups ag ON ag.id = ap.activity_group_id
                JOIN strategies s ON s.id = ag.strategy_id
                JOIN aspects a2 ON a2.id = s.aspect_id
                WHERE a2.company_id = a.company_id
                  AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
                  AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
              ) / NULLIF(
                (
                  SELECT COUNT(*)::NUMERIC FROM sub_action_plans sap
                  JOIN action_plans ap ON ap.id = sap.action_plan_id
                  JOIN activity_groups ag ON ag.id = ap.activity_group_id
                  JOIN strategies s ON s.id = ag.strategy_id
                  JOIN aspects a2 ON a2.id = s.aspect_id
                  WHERE a2.company_id = a.company_id
                    AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
                    AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
                )
              , 0)
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
                  AND sap.deleted_at IS NULL AND ap.deleted_at IS NULL
                  AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
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
          COUNT(ap.id)::INT AS total_rencana_aksi,
          COUNT(ap.id) FILTER (WHERE ap.status IN ('selesai', 'selesai terlambat'))::INT AS selesai_rencana_aksi
        FROM action_plans ap
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        JOIN scoped_companies sc
          ON sc.id = a.company_id
        WHERE ap.deleted_at IS NULL
          AND ($2::text[] IS NULL OR (ap.pic_user_id::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(ap.additional_pic_user_ids) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND ap.pic_user_id IS NULL))
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
        WHERE sap.deleted_at IS NULL AND ap.deleted_at IS NULL
          AND ($2::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($2::text[]) OR ('unassigned' = ANY($2::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
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
        COALESCE(sapa.selesai, 0) AS selesai,
        COALESCE(apa.selesai_rencana_aksi, 0) AS selesai_rencana_aksi

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
    [companyScopeId, picCombos],
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
    selesai_rencana_aksi: toNumber(row.selesai_rencana_aksi),
  }));
}

async function getProgressPerAspect(client, companyScopeId, userId, filters = {}) {
  const { picCombos = null } = filters;
  const result = await client.query(
    `
      WITH filtered_saps AS (
        SELECT 
          sap.action_plan_id,
          sap.id AS sap_id,
          CASE WHEN sap.status = 'pengajuan' THEN 30 WHEN sap.status = 'verifikasi' THEN 65 WHEN sap.status = 'selesai' THEN 100 ELSE 0 END AS score
        FROM sub_action_plans sap
        JOIN action_plans ap ON ap.id = sap.action_plan_id
        JOIN activity_groups ag ON ag.id = ap.activity_group_id
        JOIN strategies s ON s.id = ag.strategy_id
        JOIN aspects a ON a.id = s.aspect_id
        WHERE sap.deleted_at IS NULL AND ap.deleted_at IS NULL
          AND ($1::BIGINT IS NULL OR a.company_id = $1)
          AND ($3::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($3::text[]) OR ('unassigned' = ANY($3::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
      ),
      ap_dyn AS (
        SELECT action_plan_id, AVG(score) AS ap_prog
        FROM filtered_saps
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
      ),
      sap_agg AS (
        SELECT
          a.id AS aspect_id,
          COUNT(sap.id)::INT AS total_sap,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'selesai'
          )::INT AS selesai_sap,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'selesai_terlambat'
          )::INT AS selesai_terlambat_sap,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'dalam_progres'
          )::INT AS dalam_progres_sap,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'terlambat'
          )::INT AS terlambat_sap,

          COUNT(sap.id) FILTER (
            WHERE CASE 
              WHEN sap.status = 'selesai' THEN 
                CASE WHEN ap.status IN ('selesai terlambat', 'terlambat') THEN 'selesai_terlambat' ELSE 'selesai' END
              WHEN ap.status = 'terlambat' THEN 'terlambat'
              WHEN sap.status IN ('pengajuan', 'verifikasi', 'ditolak') THEN 'dalam_progres'
              ELSE 'belum_mulai'
            END = 'belum_mulai'
          )::INT AS belum_mulai_sap
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
          sap.deleted_at IS NULL AND ap.deleted_at IS NULL
          AND ($1::BIGINT IS NULL OR a.company_id = $1)
          AND ($3::text[] IS NULL OR (COALESCE(sap.pic_user_id, ap.pic_user_id)::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(COALESCE(sap.additional_pic_user_ids, ap.additional_pic_user_ids)) ORDER BY 1), ','), '')) = ANY($3::text[]) OR ('unassigned' = ANY($3::text[]) AND COALESCE(sap.pic_user_id, ap.pic_user_id) IS NULL))
        GROUP BY
          a.id
      ),
      ap_agg AS (
        SELECT
          a.id AS aspect_id,
          COUNT(ap.id)::INT AS total_ap,
          COUNT(ap.id) FILTER (WHERE ap.status = 'selesai')::INT AS selesai_ap,
          COUNT(ap.id) FILTER (WHERE ap.status = 'selesai terlambat')::INT AS selesai_terlambat_ap,
          COUNT(ap.id) FILTER (WHERE ap.status = 'dalam progres')::INT AS dalam_progres_ap,
          COUNT(ap.id) FILTER (WHERE ap.status = 'terlambat')::INT AS terlambat_ap,
          COUNT(ap.id) FILTER (WHERE ap.status NOT IN ('selesai', 'selesai terlambat', 'dalam progres', 'terlambat') OR ap.status IS NULL)::INT AS belum_mulai_ap
        FROM action_plans ap
        JOIN activity_groups ag
          ON ag.id = ap.activity_group_id
        JOIN strategies s
          ON s.id = ag.strategy_id
        JOIN aspects a
          ON a.id = s.aspect_id
        WHERE
          ap.deleted_at IS NULL
          AND ($1::BIGINT IS NULL OR a.company_id = $1)
          AND ($3::text[] IS NULL OR (ap.pic_user_id::text || '|' || COALESCE(array_to_string(ARRAY(SELECT unnest(ap.additional_pic_user_ids) ORDER BY 1), ','), '')) = ANY($3::text[]) OR ('unassigned' = ANY($3::text[]) AND ap.pic_user_id IS NULL))
        GROUP BY
          a.id
      )
      SELECT
        c.id AS company_id,
        a.id AS aspect_id,
        a.name AS aspect_name,
        a.status AS aspect_status,

        ROUND(COALESCE(CASE WHEN adyn.sum_weight > 0 THEN adyn.asp_prog_weighted ELSE adyn.asp_prog_unweighted END, 0), 2) AS progress_percentage,
        COALESCE(a.target_percentage, 0) AS target_percentage,

        COALESCE(sa.total_sap, 0) AS total,
        COALESCE(sa.selesai_sap, 0) AS selesai,
        COALESCE(sa.selesai_terlambat_sap, 0) AS selesai_terlambat,
        COALESCE(sa.dalam_progres_sap, 0) AS dalam_progres,
        COALESCE(sa.terlambat_sap, 0) AS terlambat,
        COALESCE(sa.belum_mulai_sap, 0) AS belum_mulai,

        COALESCE(sa.total_sap, 0) AS total_sap,
        COALESCE(sa.selesai_sap, 0) AS selesai_sap,
        COALESCE(sa.selesai_terlambat_sap, 0) AS selesai_terlambat_sap,
        COALESCE(sa.dalam_progres_sap, 0) AS dalam_progres_sap,
        COALESCE(sa.terlambat_sap, 0) AS terlambat_sap,
        COALESCE(sa.belum_mulai_sap, 0) AS belum_mulai_sap,

        COALESCE(aa.total_ap, 0) AS total_ap,
        COALESCE(aa.selesai_ap, 0) AS selesai_ap,
        COALESCE(aa.selesai_terlambat_ap, 0) AS selesai_terlambat_ap,
        COALESCE(aa.dalam_progres_ap, 0) AS dalam_progres_ap,
        COALESCE(aa.terlambat_ap, 0) AS terlambat_ap,
        COALESCE(aa.belum_mulai_ap, 0) AS belum_mulai_ap,

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
            AND sap.status IN ('pengajuan', 'verifikasi')
            AND NOT EXISTS (
              SELECT 1 FROM sub_action_plan_approvals prev
              WHERE prev.sub_action_plan_id = sapa.sub_action_plan_id
                AND prev.approval_order < sapa.approval_order
                AND prev.status != 'setujui'
            )
        ) AS needs_my_verification

      FROM companies c
      JOIN aspects a
        ON a.company_id = c.id
      LEFT JOIN sap_agg sa
        ON sa.aspect_id = a.id
      LEFT JOIN ap_agg aa
        ON aa.aspect_id = a.id
      LEFT JOIN aspect_dyn adyn
        ON adyn.aspect_id = a.id
      WHERE
        c.company_type = 'bumd'
        AND ($1::BIGINT IS NULL OR c.id = $1)
      ORDER BY
        c.name,
        a.id
    `,
    [companyScopeId, userId, picCombos],
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

    total_sap: toNumber(row.total_sap),
    selesai_sap: toNumber(row.selesai_sap),
    selesai_terlambat_sap: toNumber(row.selesai_terlambat_sap),
    dalam_progres_sap: toNumber(row.dalam_progres_sap),
    terlambat_sap: toNumber(row.terlambat_sap),
    belum_mulai_sap: toNumber(row.belum_mulai_sap),

    total_ap: toNumber(row.total_ap),
    selesai_ap: toNumber(row.selesai_ap),
    selesai_terlambat_ap: toNumber(row.selesai_terlambat_ap),
    dalam_progres_ap: toNumber(row.dalam_progres_ap),
    terlambat_ap: toNumber(row.terlambat_ap),
    belum_mulai_ap: toNumber(row.belum_mulai_ap),

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

      total_sap: row.total_sap,
      selesai_sap: row.selesai_sap,
      selesai_terlambat_sap: row.selesai_terlambat_sap,
      dalam_progres_sap: row.dalam_progres_sap,
      terlambat_sap: row.terlambat_sap,
      belum_mulai_sap: row.belum_mulai_sap,

      total_ap: row.total_ap,
      selesai_ap: row.selesai_ap,
      selesai_terlambat_ap: row.selesai_terlambat_ap,
      dalam_progres_ap: row.dalam_progres_ap,
      terlambat_ap: row.terlambat_ap,
      belum_mulai_ap: row.belum_mulai_ap,

      needs_my_verification: row.needs_my_verification,
    });
  }

  return map;
}

module.exports = {
  getDashboardSummary,
};
