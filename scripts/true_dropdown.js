const fs = require('fs');

const createPosHTML = `
          <select class="form-select" id="createUserPositionSelect" onchange="toggleNewInput('createUserPositionSelect', 'createUserPositionNew')">
            <option value="">Pilih posisi...</option>
          </select>
          <input class="form-input" id="createUserPositionNew" type="text" placeholder="Ketik posisi baru..." style="display:none; margin-top:8px;" />
`;

const editPosHTML = `
          <select class="form-select" id="editUserPositionSelect" onchange="toggleNewInput('editUserPositionSelect', 'editUserPositionNew')">
            <option value="">Pilih posisi...</option>
          </select>
          <input class="form-input" id="editUserPositionNew" type="text" placeholder="Ketik posisi baru..." style="display:none; margin-top:8px;" />
`;

const sectorHTML = `
          <select class="form-select" id="inputSectorSelect" onchange="toggleNewInput('inputSectorSelect', 'inputSectorNew')">
            <option value="">Pilih sektor...</option>
          </select>
          <input class="form-input" id="inputSectorNew" type="text" placeholder="Ketik sektor baru..." style="display:none; margin-top:8px;" />
`;

function processFile(file, isPengguna) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  // Remove datalist tags
  html = html.replace(/<datalist id="sectorList"><\/datalist>/g, '');
  html = html.replace(/<datalist id="positionList"><\/datalist>/g, '');

  // Replace Inputs with Select + Input combo
  html = html.replace(
    /<input class="form-select" id="createUserPosition" type="text" list="positionList" placeholder="Ketik atau pilih posisi\.\.\." \/>/g,
    createPosHTML
  );
  html = html.replace(
    /<input class="form-select" id="editUserPosition" type="text" list="positionList" placeholder="Ketik atau pilih posisi\.\.\." \/>/g,
    editPosHTML
  );
  
  if (!isPengguna) {
    html = html.replace(
      /<input class="form-select" id="inputSector" type="text" list="sectorList" placeholder="Ketik atau pilih sektor\.\.\." \/>/g,
      sectorHTML
    );
    
    // JS Logic for inputSector
    // In loadSectors
    html = html.replace(
      `const sectorList = document.getElementById('sectorList');
        const filter = document.getElementById('filterSector');
        
        const datalistOptions = allSectors.map(s => \`<option value="\${escapeHtml(s.name)}">\`).join('');
        if (sectorList) sectorList.innerHTML = datalistOptions;`,
      `const inputSectorSelect = document.getElementById('inputSectorSelect');
        const filter = document.getElementById('filterSector');
        
        const sectorOptions = allSectors.map(s => \`<option value="\${escapeHtml(s.name)}">\${escapeHtml(s.name)}</option>\`).join('');
        if (inputSectorSelect) inputSectorSelect.innerHTML = '<option value="">Pilih sektor...</option>' + sectorOptions + '<option value="__NEW__">+ Tambah Sektor Baru...</option>';`
    );

    // In openEditModal
    html = html.replace(
      `document.getElementById('inputSector').value = bumd.sector_name || '';`,
      `const s = document.getElementById('inputSectorSelect');
      const n = document.getElementById('inputSectorNew');
      if (bumd.sector_name) {
        if (Array.from(s.options).some(o => o.value === bumd.sector_name)) {
          s.value = bumd.sector_name;
          n.style.display = 'none';
          n.value = '';
        } else {
          s.value = '__NEW__';
          n.style.display = 'block';
          n.value = bumd.sector_name;
        }
      } else {
        s.value = '';
        n.style.display = 'none';
        n.value = '';
      }`
    );
    
    // In saveBumd
    html = html.replace(
      `const sector_id = document.getElementById('inputSector').value;`,
      `let sector_id = document.getElementById('inputSectorSelect').value;
      if (sector_id === '__NEW__') sector_id = document.getElementById('inputSectorNew').value.trim();`
    );
  }

  // JS Logic for user positions (common to both)
  // In loadUsers / loadUsersList
  const populatePosRegex = /const posList = document\.getElementById\('positionList'\);\s*if \(posList\) posList\.innerHTML = positions\.map\(p => `<option value="\$\{escapeHtml\(p\)}">`\)\.join\(''\);/;
  const populatePosReplacement = `
        const posOptions = positions.map(p => \`<option value="\${escapeHtml(p)}">\${escapeHtml(p)}</option>\`).join('');
        const createSel = document.getElementById('createUserPositionSelect');
        const editSel = document.getElementById('editUserPositionSelect');
        const defaultOptions = '<option value="">Pilih posisi...</option>' + posOptions + '<option value="__NEW__">+ Tambah Posisi Baru...</option>';
        if (createSel) createSel.innerHTML = defaultOptions;
        if (editSel) editSel.innerHTML = defaultOptions;`;
        
  html = html.replace(populatePosRegex, populatePosReplacement);

  // In openCreateUserModal
  html = html.replace(
    `document.getElementById('createUserPosition').value = '';`,
    `document.getElementById('createUserPositionSelect').value = '';
      document.getElementById('createUserPositionNew').style.display = 'none';
      document.getElementById('createUserPositionNew').value = '';`
  );

  // In openEditUserModal
  html = html.replace(
    `document.getElementById('editUserPosition').value = user.position || '';`,
    `const eS = document.getElementById('editUserPositionSelect');
          const eN = document.getElementById('editUserPositionNew');
          if (user.position) {
            if (Array.from(eS.options).some(o => o.value === user.position)) {
              eS.value = user.position;
              eN.style.display = 'none';
              eN.value = '';
            } else {
              eS.value = '__NEW__';
              eN.style.display = 'block';
              eN.value = user.position;
            }
          } else {
            eS.value = '';
            eN.style.display = 'none';
            eN.value = '';
          }`
  );

  // In submitCreateUser
  html = html.replace(
    `const position = document.getElementById('createUserPosition').value.trim();`,
    `let position = document.getElementById('createUserPositionSelect').value;
      if (position === '__NEW__') position = document.getElementById('createUserPositionNew').value.trim();`
  );

  // In submitEditUser
  html = html.replace(
    `const position = document.getElementById('editUserPosition').value.trim();`,
    `let position = document.getElementById('editUserPositionSelect').value;
      if (position === '__NEW__') position = document.getElementById('editUserPositionNew').value.trim();`
  );

  // Inject helper function
  if (!html.includes('function toggleNewInput')) {
    const helperFn = `
    function toggleNewInput(selectId, inputId) {
      const select = document.getElementById(selectId);
      const input = document.getElementById(inputId);
      if (select.value === '__NEW__') {
        input.style.display = 'block';
        input.focus();
      } else {
        input.style.display = 'none';
      }
    }
    `;
    html = html.replace('function escapeHtml(unsafe) {', helperFn + '\n    function escapeHtml(unsafe) {');
  }

  fs.writeFileSync(file, html);
}

processFile('public/daftar-bumd.html', false);
processFile('public/pengguna.html', true);

console.log("Updated to true dropdowns");
