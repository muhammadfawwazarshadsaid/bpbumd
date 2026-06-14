const fs = require('fs');
let service = fs.readFileSync('src/services/auth.service.js', 'utf8');

const targetStr = `  let finalCompanyId = company_id !== undefined ? company_id : targetUser.company_id;

  if (payload.lainnya_company_name) {`;

const replacementStr = `  let finalCompanyId = company_id !== undefined ? company_id : targetUser.company_id;

  if (!isAdmin && (Number(finalCompanyId) !== Number(targetUser.company_id) || payload.lainnya_company_name)) {
    const error = new Error("Hanya admin yang dapat mengubah instansi");
    error.statusCode = 403;
    throw error;
  }

  if (payload.lainnya_company_name) {`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/auth.service.js', service);
  console.log('done patch company');
} else {
  console.log('not found');
}
