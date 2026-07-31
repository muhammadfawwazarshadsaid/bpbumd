"use strict";

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { pool } = require("../config/database");

function clean(s) {
  if (!s) return "";
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}

function cleanText(s) {
  if (s === null || s === undefined) return null;
  const str = String(s).replace(/\r\n/g, "\n").trim();
  return str === "" ? null : str;
}

async function runUpdate() {
  const excelPath = path.join(__dirname, "mock", "Koreksi_Business Continuity Planning_PPSJ.xlsx");
  if (!fs.existsSync(excelPath)) {
    console.error("Excel file not found at:", excelPath);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const wb = xlsx.readFile(excelPath);
    const sheet = wb.Sheets["ALL New"];
    if (!sheet) {
      throw new Error("Sheet 'ALL New' not found in Excel file.");
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const dbRes = await client.query(`
      SELECT ap.id, ap.code_order, ap.name
      FROM action_plans ap
      JOIN activity_groups ag ON ag.id = ap.activity_group_id
      JOIN strategies s ON s.id = ag.strategy_id
      JOIN aspects a ON a.id = s.aspect_id
      WHERE a.company_id = 4 AND ap.deleted_at IS NULL
    `);

    const dbRows = dbRes.rows;

    const sheetRAs = [];
    for (let r = 3; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;
      const raName = row[5] ? String(row[5]).trim() : "";
      const output = cleanText(row[7]);
      const penilaian = cleanText(row[9]);

      if (raName) {
        sheetRAs.push({
          name: raName,
          output: output,
          penilaian: penilaian,
          cleanName: clean(raName),
        });
      }
    }

    let updatedCount = 0;
    await client.query("BEGIN");

    for (const dbRow of dbRows) {
      const dbClean = clean(dbRow.name);
      const match = sheetRAs.find((x) => x.cleanName === dbClean);
      if (match) {
        await client.query(
          "UPDATE action_plans SET output = $1, indicator = $2, updated_at = NOW() WHERE id = $3",
          [match.output, match.penilaian, dbRow.id]
        );
        updatedCount++;
      } else {
        console.warn("Could not match DB ID:", dbRow.id, dbRow.name);
      }
    }

    await client.query("COMMIT");
    console.log(`Successfully updated ${updatedCount} / ${dbRows.length} Sarana Jaya Action Plans in DB!`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error during update:", err);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  runUpdate();
}

module.exports = { runUpdate };
