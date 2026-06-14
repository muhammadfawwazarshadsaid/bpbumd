const fs = require('fs');
let html = fs.readFileSync('public/daftar-bumd.html', 'utf8');

const targetStr1 = `      const isBpbumd = currentUser && currentUser.company_type === 'bpbumd';`;
const replacementStr1 = `      const isBpbumd = currentUser && (currentUser.company_type === 'bpbumd' || currentUser.company_type === 'lainnya');`;

const targetStr2 = `        const isAdmin = u.company_type === 'bpbumd';`;
const replacementStr2 = `        const isAdmin = u.company_type === 'bpbumd' || u.company_type === 'lainnya';`;

if (html.includes(targetStr1)) {
  html = html.replace(targetStr1, replacementStr1);
  console.log('done 1');
}
if (html.includes(targetStr2)) {
  html = html.replace(targetStr2, replacementStr2);
  console.log('done 2');
}
fs.writeFileSync('public/daftar-bumd.html', html);
