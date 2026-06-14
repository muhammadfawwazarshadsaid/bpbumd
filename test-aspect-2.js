const { getAspectDetail } = require('./src/services/aspect.service.js');
const { pool } = require('./src/config/database.js');

async function main() {
  try {
    const user = { id: 3, company_type: 'bpbumd' }; // Assume user 3 is verifikator
    const result = await getAspectDetail(user, 1);
    console.log(JSON.stringify(result.daftar_strategi.map(s => ({
      name: s.strategy_name,
      needs: s.needs_my_verification,
      ag: s.activity_groups.map(ag => ({
        name: ag.activity_group_name,
        needs: ag.needs_my_verification,
        ap: ag.action_plans.map(ap => ({
          name: ap.action_plan_name,
          needs: ap.needs_my_verification
        }))
      }))
    })), null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
