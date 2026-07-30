const { pool } = require("./src/config/database");

async function run() {
  try {
    console.log("--- USERS ---");
    const users = await pool.query(`SELECT id, name, role, company_id FROM users LIMIT 20`);
    console.log(users.rows);

    console.log("\n--- ACTION PLANS PICs ---");
    const aps = await pool.query(`SELECT id, name, pic_user_id FROM action_plans WHERE pic_user_id IS NOT NULL LIMIT 10`);
    console.log(aps.rows);

    console.log("\n--- SUB ACTION PLANS PICs & APPROVALS ---");
    const saps = await pool.query(`
      SELECT sap.id, sap.name, sap.pic_user_id, sap.action_plan_id, COUNT(sapa.id) as approvals_count
      FROM sub_action_plans sap
      LEFT JOIN sub_action_plan_approvals sapa ON sap.id = sapa.sub_action_plan_id
      GROUP BY sap.id LIMIT 20
    `);
    console.log(saps.rows);

    console.log("\n--- SUB ACTION PLAN APPROVALS ROWS ---");
    const sapaRows = await pool.query(`SELECT * FROM sub_action_plan_approvals LIMIT 20`);
    console.log(sapaRows.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
