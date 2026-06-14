const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

const targetStr = `      currentUser = await BPBUMDAuth.requireAuth();
      if (currentUser && currentUser.company_type !== 'bpbumd' && currentUser.role !== 'admin') {
        // Just let them view if they have access, or we can restrict.
      }`;

const replacementStr = `      currentUser = await BPBUMDAuth.requireAuth();
      if (currentUser && currentUser.role !== 'admin') {
        alert("Akses ditolak: Hanya admin yang dapat mengakses Manajemen Pengguna.");
        window.location.href = '/dashboard.html';
        return;
      }`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, replacementStr);
  fs.writeFileSync('public/pengguna.html', html);
  console.log('done');
} else {
  console.log('not found');
}
