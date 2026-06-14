const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

const targetStr = `      initUserInfo(currentUser);`;

const replacementStr = `      initUserInfo(currentUser);
      
      // If user is not admin, they can only see themselves and cannot add new users
      if (currentUser && currentUser.role !== 'admin') {
        const btnTambah = document.getElementById('btnTambah');
        if (btnTambah) btnTambah.style.display = 'none';
      }`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, replacementStr);
  fs.writeFileSync('public/pengguna.html', html);
  console.log('done hide_tambah');
} else {
  console.log('not found');
}
