const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

// HTML: Create Modal
html = html.replace(
  /<div class="form-group">\s*<label class="form-label" for="createUserCompany">Perusahaan \(BUMD\)<\/label>\s*<select class="form-select" id="createUserCompany">\s*<\/select>\s*<\/div>/,
  `<div class="form-group">
          <label class="form-label" for="createUserCompanyType">Tipe Instansi</label>
          <select class="form-select" id="createUserCompanyType" onchange="toggleCompany('create')">
            <option value="bpbumd">BPBUMD (Pusat)</option>
            <option value="bumd">BUMD</option>
          </select>
        </div>
        <div class="form-group" id="createCompanyWrapper" style="display:none;">
          <label class="form-label" for="createUserCompany">Perusahaan (BUMD)</label>
          <select class="form-select" id="createUserCompany">
            <option value="">Pilih BUMD...</option>
          </select>
        </div>`
);

// HTML: Edit Modal
html = html.replace(
  /<div class="form-group">\s*<label class="form-label" for="editUserCompany">Perusahaan \(BUMD\)<\/label>\s*<select class="form-select" id="editUserCompany">\s*<\/select>\s*<\/div>/,
  `<div class="form-group">
          <label class="form-label" for="editUserCompanyType">Tipe Instansi</label>
          <select class="form-select" id="editUserCompanyType" onchange="toggleCompany('edit')">
            <option value="bpbumd">BPBUMD (Pusat)</option>
            <option value="bumd">BUMD</option>
          </select>
        </div>
        <div class="form-group" id="editCompanyWrapper" style="display:none;">
          <label class="form-label" for="editUserCompany">Perusahaan (BUMD)</label>
          <select class="form-select" id="editUserCompany">
            <option value="">Pilih BUMD...</option>
          </select>
        </div>`
);

// JS: toggleCompany
const toggleFn = `
    function toggleCompany(mode) {
      const type = document.getElementById(mode + 'UserCompanyType').value;
      const wrapper = document.getElementById(mode + 'CompanyWrapper');
      if (type === 'bumd') {
        wrapper.style.display = 'block';
      } else {
        wrapper.style.display = 'none';
      }
    }
`;
html = html.replace('function escapeHtml(unsafe) {', toggleFn + '\n    function escapeHtml(unsafe) {');

// JS: openCreateUserModal
html = html.replace(
  `companySelect.innerHTML = '<option value="">Belum ditugaskan</option>' + allBumds.map(b => \`<option value="\${b.id}">\${escapeHtml(b.name)}</option>\`).join('');\n      companySelect.value = bumdId || '';`,
  `document.getElementById('createUserCompanyType').value = 'bpbumd';
      toggleCompany('create');
      companySelect.innerHTML = '<option value="">Pilih BUMD...</option>' + allBumds.map(b => \`<option value="\${b.id}">\${escapeHtml(b.name)}</option>\`).join('');
      companySelect.value = '';`
);

// JS: openEditUserModal
html = html.replace(
  `const companySelect = document.getElementById('editUserCompany');\n      companySelect.innerHTML = '<option value="">Belum ditugaskan</option>' + allBumds.map(b => \`<option value="\${b.id}">\${escapeHtml(b.name)}</option>\`).join('');`,
  `const companySelect = document.getElementById('editUserCompany');
      companySelect.innerHTML = '<option value="">Pilih BUMD...</option>' + allBumds.map(b => \`<option value="\${b.id}">\${escapeHtml(b.name)}</option>\`).join('');`
);

html = html.replace(
  `document.getElementById('editUserCompany').value = user.company_id || '';`,
  `if (user.company_type === 'bpbumd' || !user.company_id) {
            document.getElementById('editUserCompanyType').value = 'bpbumd';
          } else {
            document.getElementById('editUserCompanyType').value = 'bumd';
          }
          toggleCompany('edit');
          document.getElementById('editUserCompany').value = user.company_type === 'bumd' ? (user.company_id || '') : '';`
);

// JS: submitCreateUser
html = html.replace(
  `const company_id = document.getElementById('createUserCompany').value;`,
  `const cType = document.getElementById('createUserCompanyType').value;
      let company_id = null;
      if (cType === 'bpbumd') company_id = 1;
      else {
        company_id = document.getElementById('createUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`
);

// JS: submitEditUser
html = html.replace(
  `const company_id = document.getElementById('editUserCompany').value;`,
  `const cType = document.getElementById('editUserCompanyType').value;
      let company_id = null;
      if (cType === 'bpbumd') company_id = 1;
      else {
        company_id = document.getElementById('editUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`
);

fs.writeFileSync('public/pengguna.html', html);
console.log('done pengguna');
