const { pool } = require('./src/config/database.js');

async function main() {
  try {
    const result = await pool.query(`
      SELECT data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'action_plans' AND column_name = 'status';
    `);
    console.log(result.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
