const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

// Replace create HTML
html = html.replace(
  /<div class="form-group" id="createCompanyLainnyaWrapper" style="display:none;">\s*<label class="form-label" for="createUserCompanyLainnya">Nama Instansi<\/label>\s*<input class="form-input" id="createUserCompanyLainnya" type="text" placeholder="Ketik nama instansi\.\.\." \/>\s*<\/div>/,
  `<div class="form-group" id="createCompanyLainnyaWrapper" style="display:none;">
          <label class="form-label" for="createUserCompanyLainnyaSelect">Nama Instansi</label>
          <select class="form-select" id="createUserCompanyLainnyaSelect" onchange="toggleNewInput('createUserCompanyLainnyaSelect', 'createUserCompanyLainnyaNew')">
            <option value="">Pilih instansi...</option>
          </select>
          <input class="form-input" id="createUserCompanyLainnyaNew" type="text" placeholder="Ketik instansi baru..." style="display:none; margin-top:8px;" />
        </div>`
);

// Replace edit HTML
html = html.replace(
  /<div class="form-group" id="editCompanyLainnyaWrapper" style="display:none;">\s*<label class="form-label" for="editUserCompanyLainnya">Nama Instansi<\/label>\s*<input class="form-input" id="editUserCompanyLainnya" type="text" placeholder="Ketik nama instansi\.\.\." \/>\s*<\/div>/,
  `<div class="form-group" id="editCompanyLainnyaWrapper" style="display:none;">
          <label class="form-label" for="editUserCompanyLainnyaSelect">Nama Instansi</label>
          <select class="form-select" id="editUserCompanyLainnyaSelect" onchange="toggleNewInput('editUserCompanyLainnyaSelect', 'editUserCompanyLainnyaNew')">
            <option value="">Pilih instansi...</option>
          </select>
          <input class="form-input" id="editUserCompanyLainnyaNew" type="text" placeholder="Ketik instansi baru..." style="display:none; margin-top:8px;" />
        </div>`
);

// Update loadUsersList
html = html.replace(
  `const positions = [...new Set(allUsers.map(u => u.position).filter(Boolean))].sort();

        const posOptions = positions.map(p => \`<option value="\${escapeHtml(p)}">\${escapeHtml(p)}</option>\`).join('');`,
  `const positions = [...new Set(allUsers.map(u => u.position).filter(Boolean))].sort();
        const lainnya = [...new Set(allUsers.filter(u => u.company_type === 'lainnya').map(u => u.company_name).filter(Boolean))].sort();

        const posOptions = positions.map(p => \`<option value="\${escapeHtml(p)}">\${escapeHtml(p)}</option>\`).join('');
        const lainOptions = lainnya.map(l => \`<option value="\${escapeHtml(l)}">\${escapeHtml(l)}</option>\`).join('');`
);

html = html.replace(
  `editSel.innerHTML = '<option value="">Pilih posisi...</option>' + posOptions + '<option value="__NEW__" style="font-weight:600;color:var(--brand)">+ Tambah Baru</option>';`,
  `editSel.innerHTML = '<option value="">Pilih posisi...</option>' + posOptions + '<option value="__NEW__" style="font-weight:600;color:var(--brand)">+ Tambah Baru</option>';
        document.getElementById('createUserCompanyLainnyaSelect').innerHTML = '<option value="">Pilih instansi...</option>' + lainOptions + '<option value="__NEW__" style="font-weight:600;color:var(--brand)">+ Tambah Baru</option>';
        document.getElementById('editUserCompanyLainnyaSelect').innerHTML = '<option value="">Pilih instansi...</option>' + lainOptions + '<option value="__NEW__" style="font-weight:600;color:var(--brand)">+ Tambah Baru</option>';`
);

// Update openCreateUserModal
html = html.replace(
  `document.getElementById('createUserCompanyLainnya').value = '';`,
  `document.getElementById('createUserCompanyLainnyaSelect').value = '';
      document.getElementById('createUserCompanyLainnyaNew').style.display = 'none';
      document.getElementById('createUserCompanyLainnyaNew').value = '';`
);

// Update submitCreateUser
html = html.replace(
  `lainnya_company_name = document.getElementById('createUserCompanyLainnya').value.trim();`,
  `let lName = document.getElementById('createUserCompanyLainnyaSelect').value;
        if (lName === '__NEW__') lName = document.getElementById('createUserCompanyLainnyaNew').value.trim();
        lainnya_company_name = lName;`
);

// Update submitEditUser
html = html.replace(
  `lainnya_company_name = document.getElementById('editUserCompanyLainnya').value.trim();`,
  `let lName = document.getElementById('editUserCompanyLainnyaSelect').value;
        if (lName === '__NEW__') lName = document.getElementById('editUserCompanyLainnyaNew').value.trim();
        lainnya_company_name = lName;`
);

fs.writeFileSync('public/pengguna.html', html);
console.log('done');
