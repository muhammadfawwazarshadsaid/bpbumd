const { pool } = require("./src/config/database");

async function run() {
  try {
    const res = await pool.query(`
      SELECT sap.id, sap.name, sap.pic_user_id, u.name as pic_name, sapa.approver_user_id, sapa.approval_order, u2.name as approver_name
      FROM sub_action_plans sap
      LEFT JOIN users u ON sap.pic_user_id = u.id
      JOIN sub_action_plan_approvals sapa ON sap.id = sapa.sub_action_plan_id
      JOIN users u2 ON sapa.approver_user_id = u2.id
      ORDER BY sap.id DESC
      LIMIT 20
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
