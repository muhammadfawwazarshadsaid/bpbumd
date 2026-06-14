const fs = require('fs');
let authJs = fs.readFileSync('public/auth.js', 'utf8');

const targetStr1 = `        const cached = getUser();
        if (cached) return cached;`;

const replacementStr1 = `        const cached = getUser();
        if (cached) {
          if (cached.role !== 'admin') {
            const navItem = document.querySelector('a[href="/pengguna.html"]');
            if (navItem) navItem.style.display = 'none';
          }
          return cached;
        }`;

if (authJs.includes(targetStr1)) {
  // It occurs twice, replace all
  authJs = authJs.replaceAll(targetStr1, replacementStr1);
  fs.writeFileSync('public/auth.js', authJs);
  console.log('done fallback');
}
