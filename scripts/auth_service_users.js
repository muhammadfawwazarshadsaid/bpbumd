const fs = require('fs');
let service = fs.readFileSync('src/services/auth.service.js', 'utf8');

const targetStr = `  const values = [];
  
  if (!isBpbumd && user) {
    sql += \` AND u.company_id = $1\`;
    values.push(user.company_id);
  }`;

const replacementStr = `  const values = [];
  
  if (user && user.role !== 'admin') {
    // Non-admins can only see themselves
    sql += \` AND u.id = $1\`;
    values.push(user.id);
  } else if (!isBpbumd && user) {
    // Admins of BUMD can see everyone in their BUMD
    sql += \` AND u.company_id = $1\`;
    values.push(user.company_id);
  }`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/auth.service.js', service);
  console.log('done auth.service');
} else {
  console.log('not found in auth.service');
}
