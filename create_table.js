const { pool } = require("./src/config/database");

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pic_default_verifiers (
        pic_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        approver_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        approval_order INT NOT NULL,
        PRIMARY KEY (pic_user_id, approver_user_id)
      );
    `);
    console.log("Table created!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
