const fs = require('fs');
let authJs = fs.readFileSync('public/auth.js', 'utf8');

const targetStr = `      if (result.success && result.data) {
        setUser(result.data);
        return result.data;
      }`;

const replacementStr = `      if (result.success && result.data) {
        setUser(result.data);
        
        // Hide Manajemen Pengguna menu for non-admin
        if (result.data.role !== 'admin') {
          const navItem = document.querySelector('a[href="/pengguna.html"]');
          if (navItem) navItem.style.display = 'none';
        }
        
        return result.data;
      }`;

if (authJs.includes(targetStr)) {
  authJs = authJs.replace(targetStr, replacementStr);
  fs.writeFileSync('public/auth.js', authJs);
  console.log('done');
} else {
  console.log('not found');
}
