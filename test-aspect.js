const { getAspectDetail } = require('./src/services/aspect.service.js');
const { pool } = require('./src/config/database.js');

async function main() {
  try {
    const user = { id: 3, company_type: 'bpbumd' }; // Assume user 3 is verifikator
    const result = await getAspectDetail(user, 1);
    console.log(JSON.stringify(result.daftar_strategi, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
