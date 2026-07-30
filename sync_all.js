const { pool } = require("./src/config/database");
const { syncProgressHierarchy } = require("./src/services/helpers/syncprogress.js");

async function syncAll() {
  const client = await pool.connect();
  try {
    console.log("Starting sync progress for all action plans...");

    // Get all action plans
    const res = await client.query("SELECT id FROM action_plans WHERE deleted_at IS NULL");
    console.log(`Found ${res.rowCount} action plans to sync.`);

    for (const row of res.rows) {
      await syncProgressHierarchy(client, row.id);
    }

    console.log("Sync progress completed successfully!");
  } catch (error) {
    console.error("Error syncing progress:", error);
  } finally {
    client.release();
    pool.end();
  }
}

syncAll();
