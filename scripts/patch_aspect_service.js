const fs = require('fs');
let service = fs.readFileSync('src/services/aspect.service.js', 'utf8');

const targetStr = `function isHqUser(user) {
  return user.company_type === "bpbumd";
}`;
const replacementStr = `function isHqUser(user) {
  return user.company_type === "bpbumd" || user.company_type === "lainnya";
}`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/aspect.service.js', service);
  console.log('done patch aspect service');
} else {
  console.log('not found in aspect service');
}
