const fs = require('fs');
let authJs = fs.readFileSync('src/services/auth.service.js', 'utf8');

authJs = authJs.replace(
  `  if (company_id !== undefined) {
    // Optional: allow admin to change user's company_id
    // Wait, BUMD admin probably shouldn't be able to change this, but let's assume only BPBUMD admin does this or self.
    sets.push(\`company_id = $\${paramIndex++}\`);
    values.push(company_id || null);
  }`,
  `  if (company_id !== undefined || payload.lainnya_company_name !== undefined) {
    sets.push(\`company_id = $\${paramIndex++}\`);
    values.push(finalCompanyId);
  }`
);

fs.writeFileSync('src/services/auth.service.js', authJs);
console.log('done');
