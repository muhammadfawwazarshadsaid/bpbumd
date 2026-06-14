const fs = require('fs');

let service = fs.readFileSync('src/services/bumd.service.js', 'utf8');

const targetStr = `    // Check if BUMD has aspects
    const childCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM aspects WHERE company_id = $1",
      [bumdId],
    );

    if (Number(childCheck.rows[0].count) > 0) {
      const error = new Error(
        \`BUMD tidak bisa dihapus karena masih memiliki \${childCheck.rows[0].count} aspek\`,
      );
      error.statusCode = 422;
      throw error;
    }`;

const replacementStr = `    // Cascade delete all children manually to bypass ON DELETE RESTRICT
    await client.query(\`
      DELETE FROM history_activities WHERE sub_action_plan_id IN (
        SELECT id FROM sub_action_plans WHERE action_plan_id IN (
          SELECT id FROM action_plans WHERE activity_group_id IN (
            SELECT id FROM activity_groups WHERE strategy_id IN (
              SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
            )
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM history_activities WHERE action_plan_id IN (
        SELECT id FROM action_plans WHERE activity_group_id IN (
          SELECT id FROM activity_groups WHERE strategy_id IN (
            SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM documents WHERE sub_action_plan_id IN (
        SELECT id FROM sub_action_plans WHERE action_plan_id IN (
          SELECT id FROM action_plans WHERE activity_group_id IN (
            SELECT id FROM activity_groups WHERE strategy_id IN (
              SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
            )
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM documents WHERE action_plan_id IN (
        SELECT id FROM action_plans WHERE activity_group_id IN (
          SELECT id FROM activity_groups WHERE strategy_id IN (
            SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM kpis WHERE action_plan_id IN (
        SELECT id FROM action_plans WHERE activity_group_id IN (
          SELECT id FROM activity_groups WHERE strategy_id IN (
            SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM sub_action_plan_approvals WHERE sub_action_plan_id IN (
        SELECT id FROM sub_action_plans WHERE action_plan_id IN (
          SELECT id FROM action_plans WHERE activity_group_id IN (
            SELECT id FROM activity_groups WHERE strategy_id IN (
              SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
            )
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM sub_action_plans WHERE action_plan_id IN (
        SELECT id FROM action_plans WHERE activity_group_id IN (
          SELECT id FROM activity_groups WHERE strategy_id IN (
            SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
          )
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM action_plans WHERE activity_group_id IN (
        SELECT id FROM activity_groups WHERE strategy_id IN (
          SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
        )
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM activity_groups WHERE strategy_id IN (
        SELECT id FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
      )
    \`, [bumdId]);

    await client.query(\`
      DELETE FROM strategies WHERE aspect_id IN (SELECT id FROM aspects WHERE company_id = $1)
    \`, [bumdId]);

    await client.query("DELETE FROM aspects WHERE company_id = $1", [bumdId]);`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/bumd.service.js', service);
  console.log('done');
} else {
  console.log('not found');
}
