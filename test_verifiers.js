const { pool } = require("./src/config/database");

async function test(picUserId, userCompanyId) {
  const user = { company_type: "bumd", company_id: userCompanyId };
  
  let query = `
    SELECT sapa.approver_user_id, sapa.approval_order
    FROM sub_action_plan_approvals sapa
    WHERE sapa.sub_action_plan_id = (
      SELECT sap.id
      FROM sub_action_plans sap
      JOIN action_plans ap ON sap.action_plan_id = ap.id
      JOIN activity_groups ag ON ap.activity_group_id = ag.id
      JOIN strategies s ON ag.strategy_id = s.id
      JOIN aspects a ON s.aspect_id = a.id
      WHERE sap.pic_user_id = $1
        AND EXISTS (SELECT 1 FROM sub_action_plan_approvals sa2 WHERE sa2.sub_action_plan_id = sap.id)
      ORDER BY sap.created_at DESC
      LIMIT 1
    )
    ORDER BY sapa.approval_order ASC
  `;

  const res = await pool.query(query, [picUserId]);
  console.log("Result for PIC", picUserId, ":", res.rows);
}

async function run() {
  await test(94, 2);
  await test(95, 2);
  process.exit(0);
}
run();
