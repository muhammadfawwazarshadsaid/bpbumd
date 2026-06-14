const fs = require('fs');
let html = fs.readFileSync('public/daftar-bumd.html', 'utf8');

// HTML REPLACEMENTS

// Add datalists near the end of body before script tags
const datalists = `
  <datalist id="sectorList"></datalist>
  <datalist id="positionList"></datalist>
`;
html = html.replace('</body>', datalists + '\n</body>');

// Replace inputSector
html = html.replace(
  /<select class="form-select" id="inputSector">[\s\S]*?<\/select>/,
  '<input class="form-input" id="inputSector" type="text" list="sectorList" placeholder="Ketik atau pilih sektor..." />'
);

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

// JS REPLACEMENTS

// In loadSectors()
const oldLoadSectors = `
    async function loadSectors() {
      try {
        const res = await apiFetch('/api/bumds/sectors');
        allSectors = res.data || [];
        
        const select = document.getElementById('inputSector');
        const filter = document.getElementById('filterSector');
        
        const options = allSectors.map(s => \`<option value="\${s.id}">\${escapeHtml(s.name)}</option>\`).join('');
        
        if (select) select.innerHTML = '<option value="">Pilih sektor...</option>' + options;
        if (filter) filter.innerHTML = '<option value="">Semua Sektor</option>' + options;
      } catch (err) {
        showToast('Gagal memuat daftar sektor', 'error');
      }
    }
`;

const newLoadSectors = `
    async function loadSectors() {
      try {
        const res = await apiFetch('/api/bumds/sectors');
        allSectors = res.data || [];
        
        const sectorList = document.getElementById('sectorList');
        const filter = document.getElementById('filterSector');
        
        const datalistOptions = allSectors.map(s => \`<option value="\${escapeHtml(s.name)}">\`).join('');
        if (sectorList) sectorList.innerHTML = datalistOptions;
        
        const filterOptions = allSectors.map(s => \`<option value="\${s.id}">\${escapeHtml(s.name)}</option>\`).join('');
        if (filter) filter.innerHTML = '<option value="">Semua Sektor</option>' + filterOptions;
      } catch (err) {
        showToast('Gagal memuat daftar sektor', 'error');
      }
    }
`;

// wait, oldLoadSectors might have different indentation or slight differences. Let's use regex.
html = html.replace(/async function loadSectors\(\) \{[\s\S]*?showToast\('Gagal memuat daftar sektor', 'error'\);\s*\}\s*\}/, newLoadSectors.trim());

// Populate positionList inside loadUsers()
// find the end of loadUsers
html = html.replace(
  /allUsers = res\.data \|\| \[\];\s*\}/,
  `allUsers = res.data || [];
        const positions = [...new Set(allUsers.map(u => u.position).filter(Boolean))].sort();
        const posList = document.getElementById('positionList');
        if (posList) posList.innerHTML = positions.map(p => \`<option value="\${escapeHtml(p)}">\`).join('');
      }`
);

// In openEditModal: change inputSector value to sector_name
html = html.replace(
  `document.getElementById('inputSector').value = bumd.sector_id || '';`,
  `document.getElementById('inputSector').value = bumd.sector_name || '';`
);

fs.writeFileSync('public/daftar-bumd.html', html);
console.log("Updated daftar-bumd.html");
