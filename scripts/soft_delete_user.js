const fs = require('fs');
let code = fs.readFileSync('src/services/auth.service.js', 'utf8');

code = code.replace(
  'await pool.query("DELETE FROM users WHERE id = $1", [userId]);',
  'await pool.query("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);'
);

fs.writeFileSync('src/services/auth.service.js', code);
console.log('done');
