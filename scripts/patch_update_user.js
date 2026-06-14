const fs = require('fs');
let service = fs.readFileSync('src/services/auth.service.js', 'utf8');

const targetStr = `  if (role !== undefined) {
    if (!['admin', 'user'].includes(role)) {`;

const replacementStr = `  if (role !== undefined) {
    if (!isAdmin && role !== targetUser.role) {
      const error = new Error("Hanya admin yang dapat mengubah role");
      error.statusCode = 403;
      throw error;
    }
    if (!['admin', 'user'].includes(role)) {`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/auth.service.js', service);
  console.log('done patch role');
} else {
  console.log('not found');
}
