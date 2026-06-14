const { pool } = require('../src/config/database.js');

async function main() {
  const tables = ['sectors', 'companies', 'users', 'aspects', 'strategies', 'activity_groups', 'action_plans', 'sub_action_plans', 'sub_action_plan_approvals', 'kpis', 'documents', 'history_activities'];
  
  for (const table of tables) {
    console.log(`\n--- TABLE: ${table} ---`);
    const cols = await pool.query(`SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
    for (const c of cols.rows) {
      console.log(`${c.column_name}: ${c.data_type} (Max: ${c.character_maximum_length}) - Nullable: ${c.is_nullable} - Default: ${c.column_default}`);
    }
    
    console.log(`\nConstraints for ${table}:`);
    const constraints = await pool.query(`
      SELECT tc.constraint_name, tc.constraint_type, pg_get_constraintdef(c.oid) AS definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE tc.table_name = $1
    `, [table]);
    
    for (const c of constraints.rows) {
      console.log(`${c.constraint_name} (${c.constraint_type}): ${c.definition}`);
    }
  }
  process.exit(0);
}
main().catch(console.error);
