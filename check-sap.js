const { pool } = require('./src/config/database.js');

async function main() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sub_action_plans';
    `);
    console.log(result.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
