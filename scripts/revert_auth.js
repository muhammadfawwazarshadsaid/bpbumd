const fs = require('fs');
let authJs = fs.readFileSync('public/auth.js', 'utf8');

const targetStr1 = `      if (result.success && result.data) {
        setUser(result.data);
        
        // Hide Manajemen Pengguna menu for non-admin
        if (result.data.role !== 'admin') {
          const navItem = document.querySelector('a[href="/pengguna.html"]');
          if (navItem) navItem.style.display = 'none';
        }
        
        return result.data;
      }`;
const replacementStr1 = `      if (result.success && result.data) {
        setUser(result.data);
        return result.data;
      }`;

const targetStr2 = `        const cached = getUser();
        if (cached) {
          if (cached.role !== 'admin') {
            const navItem = document.querySelector('a[href="/pengguna.html"]');
            if (navItem) navItem.style.display = 'none';
          }
          return cached;
        }`;
const replacementStr2 = `        const cached = getUser();
        if (cached) return cached;`;

if (authJs.includes(targetStr1)) {
  authJs = authJs.replace(targetStr1, replacementStr1);
}
if (authJs.includes(targetStr2)) {
  authJs = authJs.replaceAll(targetStr2, replacementStr2);
}
fs.writeFileSync('public/auth.js', authJs);
console.log('done revert auth');
