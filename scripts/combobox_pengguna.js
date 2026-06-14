const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

// HTML REPLACEMENTS

// Add datalists near the end of body before script tags
const datalists = `
  <datalist id="positionList"></datalist>
`;
html = html.replace('</body>', datalists + '\n</body>');

// Replace createUserPosition
html = html.replace(
  '<input class="form-input" id="createUserPosition" type="text" placeholder="Contoh: Divisi Strategic & Planning" />',
  '<input class="form-input" id="createUserPosition" type="text" list="positionList" placeholder="Ketik atau pilih posisi..." />'
);

// Replace editUserPosition
html = html.replace(
  '<input class="form-input" id="editUserPosition" type="text" placeholder="Contoh: Divisi Strategic & Planning" />',
  '<input class="form-input" id="editUserPosition" type="text" list="positionList" placeholder="Ketik atau pilih posisi..." />'
);

// Populate positionList inside loadUsersList()
html = html.replace(
  /allUsers = res\.data \|\| \[\];\s*updateKPIs\(\);\s*renderTable\(\);/,
  `allUsers = res.data || [];
        const positions = [...new Set(allUsers.map(u => u.position).filter(Boolean))].sort();
        const posList = document.getElementById('positionList');
        if (posList) posList.innerHTML = positions.map(p => \`<option value="\${escapeHtml(p)}">\`).join('');
        updateKPIs();
        renderTable();`
);

fs.writeFileSync('public/pengguna.html', html);
console.log("Updated pengguna.html");
