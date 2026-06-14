const fs = require('fs');
let authJs = fs.readFileSync('src/services/auth.service.js', 'utf8');

authJs = authJs.replace(
  `  if (company_id !== undefined || payload.lainnya_company_name !== undefined) {
    sets.push(\`company_id = \${paramIndex++}\`);
    values.push(finalCompanyId);
  }`,
  `  if (company_id !== undefined || payload.lainnya_company_name !== undefined) {
    sets.push(\`company_id = $\${paramIndex++}\`);
    values.push(finalCompanyId);
  }`
);

fs.writeFileSync('src/services/auth.service.js', authJs);
console.log('done');
