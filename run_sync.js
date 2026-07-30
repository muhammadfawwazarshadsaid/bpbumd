const { pool } = require("./src/config/database");
const { syncProgressHierarchy } = require("./src/services/helpers/syncprogress");

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id FROM action_plans WHERE deleted_at IS NULL');
    console.log(`Syncing ${res.rowCount} action plans...`);
    for (let row of res.rows) {
      await syncProgressHierarchy(client, row.id);
    }
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
