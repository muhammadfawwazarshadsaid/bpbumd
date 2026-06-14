const fs = require('fs');

// --- PENGGUNA.HTML ---
let html = fs.readFileSync('public/pengguna.html', 'utf8');

// Insert createCompanyLainnyaWrapper
html = html.replace(
  /<div class="form-group" id="createCompanyWrapper" style="display:none;">/,
  `<div class="form-group" id="createCompanyLainnyaWrapper" style="display:none;">
          <label class="form-label" for="createUserCompanyLainnya">Nama Instansi</label>
          <input class="form-input" id="createUserCompanyLainnya" type="text" placeholder="Ketik nama instansi..." />
        </div>
        <div class="form-group" id="createCompanyWrapper" style="display:none;">`
);

// Insert editCompanyLainnyaWrapper
html = html.replace(
  /<div class="form-group" id="editCompanyWrapper" style="display:none;">/,
  `<div class="form-group" id="editCompanyLainnyaWrapper" style="display:none;">
          <label class="form-label" for="editUserCompanyLainnya">Nama Instansi</label>
          <input class="form-input" id="editUserCompanyLainnya" type="text" placeholder="Ketik nama instansi..." />
        </div>
        <div class="form-group" id="editCompanyWrapper" style="display:none;">`
);

// Update toggleCompany
html = html.replace(
  `function toggleCompany(mode) {
      const type = document.getElementById(mode + 'UserCompanyType').value;
      const wrapper = document.getElementById(mode + 'CompanyWrapper');
      if (type === 'bumd') {
        wrapper.style.display = 'block';
      } else {
        wrapper.style.display = 'none';
      }
    }`,
  `function toggleCompany(mode) {
      const type = document.getElementById(mode + 'UserCompanyType').value;
      const bumdWrapper = document.getElementById(mode + 'CompanyWrapper');
      const lainnyaWrapper = document.getElementById(mode + 'CompanyLainnyaWrapper');
      if (type === 'bumd') {
        bumdWrapper.style.display = 'block';
        lainnyaWrapper.style.display = 'none';
      } else if (type === 'lainnya') {
        bumdWrapper.style.display = 'none';
        lainnyaWrapper.style.display = 'block';
      } else {
        bumdWrapper.style.display = 'none';
        lainnyaWrapper.style.display = 'none';
      }
    }`
);

// In openCreateUserModal
html = html.replace(
  `document.getElementById('createUserCompanyType').value = 'bpbumd';
      toggleCompany('create');`,
  `document.getElementById('createUserCompanyType').value = 'bpbumd';
      document.getElementById('createUserCompanyLainnya').value = '';
      toggleCompany('create');`
);

// In openEditUserModal
html = html.replace(
  `document.getElementById('editUserCompany').value = user.company_type === 'bumd' ? (user.company_id || '') : '';`,
  `document.getElementById('editUserCompany').value = user.company_type === 'bumd' ? (user.company_id || '') : '';
          document.getElementById('editUserCompanyLainnya').value = user.company_type === 'lainnya' ? (user.company_name || '') : '';`
);

// In submitCreateUser
html = html.replace(
  `const cType = document.getElementById('createUserCompanyType').value;
      let company_id = null;
      if (cType === 'bpbumd') company_id = 1;
      else if (cType === 'lainnya') company_id = null;
      else {
        company_id = document.getElementById('createUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`,
  `const cType = document.getElementById('createUserCompanyType').value;
      let company_id = null;
      let lainnya_company_name = null;
      if (cType === 'bpbumd') company_id = 1;
      else if (cType === 'lainnya') {
        lainnya_company_name = document.getElementById('createUserCompanyLainnya').value.trim();
        if (!lainnya_company_name) { showToast('Nama instansi wajib diisi', 'error'); return; }
      } else {
        company_id = document.getElementById('createUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`
);

html = html.replace(
  `body: JSON.stringify({
            company_id: company_id || null,
            name,
            username,
            password,
            position,
            role
          })`,
  `body: JSON.stringify({
            company_id: company_id || null,
            lainnya_company_name,
            name,
            username,
            password,
            position,
            role
          })`
);

// In submitEditUser
html = html.replace(
  `const cType = document.getElementById('editUserCompanyType').value;
      let company_id = null;
      if (cType === 'bpbumd') company_id = 1;
      else if (cType === 'lainnya') company_id = null;
      else {
        company_id = document.getElementById('editUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`,
  `const cType = document.getElementById('editUserCompanyType').value;
      let company_id = null;
      let lainnya_company_name = null;
      if (cType === 'bpbumd') company_id = 1;
      else if (cType === 'lainnya') {
        lainnya_company_name = document.getElementById('editUserCompanyLainnya').value.trim();
        if (!lainnya_company_name) { showToast('Nama instansi wajib diisi', 'error'); return; }
      } else {
        company_id = document.getElementById('editUserCompany').value;
        if (!company_id) { showToast('BUMD wajib dipilih', 'error'); return; }
      }`
);

html = html.replace(
  `body: JSON.stringify({
            company_id: company_id || null,
            name,
            username,
            password: password || undefined,
            position,
            role
          })`,
  `body: JSON.stringify({
            company_id: company_id || null,
            lainnya_company_name,
            name,
            username,
            password: password || undefined,
            position,
            role
          })`
);

fs.writeFileSync('public/pengguna.html', html);


// --- AUTH.SERVICE.JS ---
let authJs = fs.readFileSync('src/services/auth.service.js', 'utf8');

// In registerUser
authJs = authJs.replace(
  `const finalCompanyId = company_id || null;

  if (finalCompanyId) {`,
  `let finalCompanyId = company_id || null;

  if (payload.lainnya_company_name) {
    const checkLainnya = await pool.query(
      "SELECT id FROM companies WHERE name = $1 AND company_type = 'lainnya'",
      [payload.lainnya_company_name]
    );
    if (checkLainnya.rowCount > 0) {
      finalCompanyId = checkLainnya.rows[0].id;
    } else {
      const insert = await pool.query(
        "INSERT INTO companies (name, company_type) VALUES ($1, 'lainnya') RETURNING id",
        [payload.lainnya_company_name]
      );
      finalCompanyId = insert.rows[0].id;
    }
  } else if (finalCompanyId) {`
);

// In updateUser
authJs = authJs.replace(
  `let finalCompanyId = company_id !== undefined ? company_id : targetUser.company_id;

  if (finalCompanyId) {`,
  `let finalCompanyId = company_id !== undefined ? company_id : targetUser.company_id;

  if (payload.lainnya_company_name) {
    const checkLainnya = await pool.query(
      "SELECT id FROM companies WHERE name = $1 AND company_type = 'lainnya'",
      [payload.lainnya_company_name]
    );
    if (checkLainnya.rowCount > 0) {
      finalCompanyId = checkLainnya.rows[0].id;
    } else {
      const insert = await pool.query(
        "INSERT INTO companies (name, company_type) VALUES ($1, 'lainnya') RETURNING id",
        [payload.lainnya_company_name]
      );
      finalCompanyId = insert.rows[0].id;
    }
  } else if (finalCompanyId) {`
);

fs.writeFileSync('src/services/auth.service.js', authJs);

console.log('done');
