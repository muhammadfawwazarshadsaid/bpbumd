const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

const targetStr = `      if (currentUser && currentUser.role !== 'admin') {
        alert("Akses ditolak: Hanya admin yang dapat mengakses Manajemen Pengguna.");
        window.location.href = '/dashboard.html';
        return;
      }`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, "");
  fs.writeFileSync('public/pengguna.html', html);
  console.log('done remove alert');
} else {
  console.log('not found alert');
}
