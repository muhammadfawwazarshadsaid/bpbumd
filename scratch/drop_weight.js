const { pool } = require('../src/config/database.js');
async function main() {
  await pool.query('ALTER TABLE sub_action_plans DROP COLUMN IF EXISTS weight;');
  console.log('Column weight dropped from sub_action_plans.');
  process.exit(0);
}
main().catch(console.error);
