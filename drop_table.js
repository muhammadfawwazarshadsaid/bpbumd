const { pool } = require("./src/config/database");

async function run() {
  try {
    await pool.query(`DROP TABLE IF EXISTS pic_default_verifiers CASCADE;`);
    console.log("Table dropped!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
