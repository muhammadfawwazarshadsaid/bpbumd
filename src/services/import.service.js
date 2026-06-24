"use strict";

const { pool } = require("../config/database");
const { syncProgressHierarchy } = require("./helpers/syncprogress");

function isHqUser(user) {
  return user.company_type === "bpbumd" || user.company_type === "lainnya";
}

function getCompanyScope(user) {
  if (isHqUser(user)) {
    return null;
  }
  return user.company_id;
}

/**
 * Import Excel data to a company.
 * Creates full hierarchy: Aspect -> Strategy -> Activity Group -> Action Plan (+ KPI).
 * Merges with existing aspects, strategies, and activity groups if they have the same name.
 * 
 * @param {object} user - The user performing the import
 * @param {number} companyId - The target company ID
 * @param {Array} rows - The validated rows from Excel
 */
async function importToCompany(user, companyId, rows) {
  const companyScopeId = getCompanyScope(user);
  
  if (companyScopeId && Number(companyScopeId) !== Number(companyId)) {
    const error = new Error("Anda tidak memiliki akses ke BUMD ini");
    error.statusCode = 403;
    throw error;
  }

  const client = await pool.connect();
  let aspectsCreated = 0;
  let strategiesCreated = 0;
  let agsCreated = 0;
  let apsCreated = 0;

  try {
    await client.query("BEGIN");

    // Get the actual company ID to ensure it exists and is a BUMD
    const companyRes = await client.query(
      `SELECT id FROM companies WHERE id = $1 AND company_type = 'bumd'`,
      [companyId]
    );

    if (companyRes.rows.length === 0) {
      throw new Error("BUMD tidak ditemukan");
    }

    // Cache to avoid hitting DB for every single row if we just created/found it
    // Maps: name -> id
    const aspectCache = new Map();
    // Maps: aspectId_strategyName -> id
    const strategyCache = new Map();
    // Maps: strategyId_agName -> id
    const agCache = new Map();

    const uniqueAgIds = new Set();

    for (const row of rows) {
      if (!row.aspect_name || !row.strategy_name || !row.ag_name || !row.ap_name) {
        continue; // Skip invalid rows
      }

      // 1. Aspect
      let aspectId = aspectCache.get(row.aspect_name);
      if (!aspectId) {
        const aRes = await client.query(
          `SELECT id FROM aspects WHERE company_id = $1 AND name = $2`,
          [companyId, row.aspect_name]
        );
        if (aRes.rows.length > 0) {
          aspectId = aRes.rows[0].id;
        } else {
          const insertA = await client.query(
            `INSERT INTO aspects (company_id, name, target_percentage) VALUES ($1, $2, 100) RETURNING id`,
            [companyId, row.aspect_name]
          );
          aspectId = insertA.rows[0].id;
          aspectsCreated++;
        }
        aspectCache.set(row.aspect_name, aspectId);
      }

      // 2. Strategy
      const strategyKey = `${aspectId}_${row.strategy_name}`;
      let strategyId = strategyCache.get(strategyKey);
      if (!strategyId) {
        const sRes = await client.query(
          `SELECT id FROM strategies WHERE aspect_id = $1 AND name = $2`,
          [aspectId, row.strategy_name]
        );
        if (sRes.rows.length > 0) {
          strategyId = sRes.rows[0].id;
        } else {
          const insertS = await client.query(
            `INSERT INTO strategies (aspect_id, name, code_order, target_percentage) VALUES ($1, $2, $3, 100) RETURNING id`,
            [aspectId, row.strategy_name, row.strategy_code || 'Z']
          );
          strategyId = insertS.rows[0].id;
          strategiesCreated++;
        }
        strategyCache.set(strategyKey, strategyId);
      }

      // 3. Activity Group
      const agKey = `${strategyId}_${row.ag_name}`;
      let agId = agCache.get(agKey);
      if (!agId) {
        const agRes = await client.query(
          `SELECT id FROM activity_groups WHERE strategy_id = $1 AND name = $2`,
          [strategyId, row.ag_name]
        );
        if (agRes.rows.length > 0) {
          agId = agRes.rows[0].id;
        } else {
          const insertAg = await client.query(
            `INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage) VALUES ($1, $2, $3, 100) RETURNING id`,
            [strategyId, row.ag_name, row.ag_code || 'Z']
          );
          agId = insertAg.rows[0].id;
          agsCreated++;
        }
        agCache.set(agKey, agId);
      }
      
      uniqueAgIds.add(agId);

      // 4. Action Plan
      const targetEndDate = row.target_end_date ? row.target_end_date : null;
      const targetStartDate = row.target_start_date ? row.target_start_date : null;
      
      const insertAp = await client.query(
        `INSERT INTO action_plans 
          (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, start_date, target_end_date, status)
         VALUES ($1, $2, $3, 100, $4, $5, $6, $7, $8, 'belum mulai')
         RETURNING id`,
        [
          agId, 
          row.ap_name, 
          row.ap_code || 'Z', 
          row.output || null, 
          row.indicator || null, 
          row.pic_user_id || null, 
          targetStartDate,
          targetEndDate
        ]
      );
      const apId = insertAp.rows[0].id;
      apsCreated++;

      // 5. KPIs
      if (row.kpis && Array.isArray(row.kpis) && row.kpis.length > 0) {
        for (const kpi of row.kpis) {
          if (!kpi || !kpi.trim()) continue;
          await client.query(
            `INSERT INTO kpis (action_plan_id, name, status) VALUES ($1, $2, 'belum mulai')`,
            [apId, kpi.trim()]
          );
        }
      }

      // 6. History Activity
      await client.query(
        `INSERT INTO history_activities (action_plan_id, user_id, description)
         VALUES ($1, $2, 'Rencana Aksi dibuat melalui Import Excel')`,
        [apId, user.id]
      );
    }

    // 7. Sync Progress Hierarchy
    // Only run for unique activity groups to drastically reduce DB load and prevent timeouts.
    for (const agId of uniqueAgIds) {
      await syncProgressHierarchy(client, null, agId);
    }

    await client.query("COMMIT");

    return {
      aspects_created: aspectsCreated,
      strategies_created: strategiesCreated,
      activity_groups_created: agsCreated,
      action_plans_created: apsCreated
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  importToCompany
};
