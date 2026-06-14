const fs = require('fs');

const targetStr = `function isHqUser(user) {
  return user.company_type === "bpbumd";
}`;
const replacementStr = `function isHqUser(user) {
  return user.company_type === "bpbumd" || user.company_type === "lainnya";
}`;

const files = [
  'src/services/dashboard.service.js',
  'src/services/actionplan.service.js',
  'src/services/strategy.service.js',
  'src/services/activitygroup.service.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(targetStr)) {
      content = content.replace(targetStr, replacementStr);
      fs.writeFileSync(file, content);
      console.log('patched ' + file);
    }
  }
}
