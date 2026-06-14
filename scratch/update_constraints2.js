const { pool } = require('../src/config/database.js');

async function main() {
  try {
    await pool.query("ALTER TABLE action_plans DROP CONSTRAINT IF EXISTS chk_action_plans_status;");
    await pool.query("ALTER TABLE action_plans ADD CONSTRAINT chk_action_plans_status CHECK (status IN ('belum mulai', 'dalam progres', 'selesai', 'terlambat', 'selesai terlambat'));");
    
    await pool.query("ALTER TABLE activity_groups DROP CONSTRAINT IF EXISTS chk_activity_groups_status;");
    await pool.query("ALTER TABLE activity_groups ADD CONSTRAINT chk_activity_groups_status CHECK (status IN ('belum mulai', 'dalam progres', 'selesai', 'terlambat', 'selesai terlambat'));");

    await pool.query("ALTER TABLE strategies DROP CONSTRAINT IF EXISTS chk_strategies_status;");
    await pool.query("ALTER TABLE strategies ADD CONSTRAINT chk_strategies_status CHECK (status IN ('belum mulai', 'dalam progres', 'selesai', 'terlambat', 'selesai terlambat'));");

    await pool.query("ALTER TABLE aspects DROP CONSTRAINT IF EXISTS chk_aspects_status;");
    await pool.query("ALTER TABLE aspects ADD CONSTRAINT chk_aspects_status CHECK (status IN ('belum mulai', 'dalam progres', 'selesai', 'terlambat', 'selesai terlambat'));");

    console.log("Constraints updated successfully on", process.env.DATABASE_URL);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
