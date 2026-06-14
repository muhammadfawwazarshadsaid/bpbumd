const fs = require('fs');
let service = fs.readFileSync('src/services/bumd.service.js', 'utf8');

const targetStr = `  const isBpbumd = user && user.company_type === 'bpbumd';`;
const replacementStr = `  const isBpbumd = user && (user.company_type === 'bpbumd' || user.company_type === 'lainnya');`;

if (service.includes(targetStr)) {
  service = service.replaceAll(targetStr, replacementStr);
  fs.writeFileSync('src/services/bumd.service.js', service);
  console.log('done bumd.service');
} else {
  console.log('not found in bumd.service');
}
