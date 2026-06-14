const fs = require('fs');

let html = fs.readFileSync('public/pengguna.html', 'utf8');

// Replace PAGE HEADING
html = html.replace('<div class="page-heading-title">Daftar BUMD</div>', '<div class="page-heading-title">Manajemen Pengguna</div>');
html = html.replace('<span class="current">Daftar BUMD</span>', '<span class="current">Manajemen Pengguna</span>');

// Replace KPIs
html = html.replace('<div class="kpi-label">Total BUMD</div>', '<div class="kpi-label">Total Pengguna</div>');
html = html.replace('<div class="kpi-label">Total User Terdaftar</div>', '<div class="kpi-label">Admin BPBUMD</div>');
html = html.replace('<div class="kpi-label">Jumlah Sektor</div>', '<div class="kpi-label">User BUMD</div>');

// Replace Table title
html = html.replace('<div class="card-title">Data BUMD</div>', '<div class="card-title">Data Pengguna</div>');
html = html.replace('<div class="card-sub">Kelola daftar badan usaha dan penugasan user</div>', '<div class="card-sub">Kelola daftar pengguna sistem</div>');

// Replace Search
html = html.replace('placeholder="Cari nama BUMD..."', 'placeholder="Cari nama atau username..."');

// Replace toolbar
html = html.replace(
  /<select class="filter-select" id="filterSector">[\s\S]*?<\/select>/,
  `<select class="filter-select" id="filterRole">
    <option value="">Semua Role</option>
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </select>`
);

html = html.replace(
  '<button class="btn-primary" id="btnTambah" onclick="openModal()">',
  '<button class="btn-primary" id="btnTambah" onclick="openCreateUserModal(null, null)">'
);
html = html.replace('Tambah BUMD', 'Tambah Pengguna');

// Replace icon sidebar
const sidebarTarget = `<a class="icon-btn active" href="/daftar-bumd.html" title="Daftar BUMD">`;
const newSidebar = `<a class="icon-btn" href="/daftar-bumd.html" title="Daftar BUMD">`;
html = html.replace(sidebarTarget, newSidebar);

// Insert Users icon
const usersIcon = `
      <a class="icon-btn active" href="/pengguna.html" title="Manajemen Pengguna">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </a>`;
html = html.replace(
  `</svg>\n      </a>\n\n      <div class="icon-sidebar-bottom">`,
  `</svg>\n      </a>\n${usersIcon}\n\n      <div class="icon-sidebar-bottom">`
);

// We need to rewrite the table head
const tableHead = `
            <tr>
              <th style="width:40px">No</th>
              <th>Nama BUMD</th>
              <th>Sektor</th>
              <th>User Terdaftar</th>
              <th style="width:120px">Aksi</th>
            </tr>`;
const newTableHead = `
            <tr>
              <th style="width:40px">No</th>
              <th>Username</th>
              <th>Nama Lengkap</th>
              <th>Posisi / Jabatan</th>
              <th>Perusahaan</th>
              <th>Role</th>
              <th>Status</th>
              <th style="width:120px">Aksi</th>
            </tr>`;
html = html.replace(tableHead, newTableHead);

// Remove the bumdModal
html = html.replace(/<div class="modal-overlay" id="bumdModal">[\s\S]*?<!-- MODAL: DELETE CONFIRM -->/, '<!-- MODAL: DELETE CONFIRM -->');

// Re-write JS rendering logic
const oldScriptTarget = `    // ════════════════════════════════════════════
    //  INIT
    // ════════════════════════════════════════════`;
    
const scriptEndTarget = `    // ════════════════════════════════════════════
    //  MODAL: DELETE`;

const newScript = `    // ════════════════════════════════════════════
    //  INIT
    // ════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', async () => {
      currentUser = await BPBUMDAuth.requireAuth();
      if (currentUser && currentUser.company_type !== 'bpbumd' && currentUser.role !== 'admin') {
        // Just let them view if they have access, or we can restrict.
      }
      initUserInfo(currentUser);

      const savedSearch = localStorage.getItem('penggunaSearch');
      if (savedSearch) document.getElementById('searchInput').value = savedSearch;

      const savedRole = localStorage.getItem('penggunaFilterRole');
      if (savedRole) document.getElementById('filterRole').value = savedRole;

      initEventListeners();
      await Promise.all([loadBumds(), loadUsersList()]);
    });

    function initUserInfo(user) {
      if (!user) return;
      const avatarBtn = document.getElementById('userAvatarBtn');
      if (avatarBtn) avatarBtn.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    }

    function initEventListeners() {
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => renderTable(), 300);
      });

      document.getElementById('filterRole').addEventListener('change', () => renderTable());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeCreateUserModal();
          closeEditUserModal();
        }
      });
    }

    // ════════════════════════════════════════════
    //  API CALLS
    // ════════════════════════════════════════════

    async function apiFetch(url, options = {}) {
      const isFormData = options.body instanceof FormData;
      const headers = { ...options.headers };
      if (!isFormData) headers['Content-Type'] = 'application/json';
      const res = await fetch(url, { ...options, credentials: 'same-origin', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
      return data;
    }

    async function loadBumds() {
      try {
        const res = await apiFetch('/api/bumds');
        allBumds = res.data || [];
      } catch (err) { }
    }

    async function loadUsersList() {
      try {
        const res = await apiFetch('/api/auth/users');
        allUsers = res.data || [];
        updateKPIs();
        renderTable();
      } catch (err) {
        showToast(err.message, 'error');
        document.getElementById('tableContainer').innerHTML = \`<div class="empty-state"><div class="empty-title">Gagal memuat data</div></div>\`;
      }
    }

    function updateKPIs() {
      document.getElementById('kpiTotal').textContent = allUsers.length;
      document.getElementById('kpiUsers').textContent = allUsers.filter(u => u.role === 'admin').length;
      document.getElementById('kpiSectors').textContent = allUsers.filter(u => u.role === 'user').length;
    }

    function renderTable() {
      const search = document.getElementById('searchInput').value.toLowerCase().trim();
      const roleFilter = document.getElementById('filterRole').value;

      localStorage.setItem('penggunaSearch', search);
      localStorage.setItem('penggunaFilterRole', roleFilter);

      let filtered = allUsers.filter(u => {
        if (search && !u.name.toLowerCase().includes(search) && !u.username.toLowerCase().includes(search)) return false;
        if (roleFilter && u.role !== roleFilter) return false;
        return true;
      });

      const container = document.getElementById('tableContainer');
      if (filtered.length === 0) {
        container.innerHTML = \`<div class="empty-state"><div class="empty-title">Belum ada data pengguna</div></div>\`;
        return;
      }

      let html = \`
        <table>
          <thead>
            <tr>
              <th style="width:40px">No</th>
              <th>Username</th>
              <th>Nama Lengkap</th>
              <th>Posisi / Jabatan</th>
              <th>Perusahaan</th>
              <th>Role</th>
              <th>Status</th>
              <th style="width:120px">Aksi</th>
            </tr>
          </thead>
          <tbody>
      \`;

      filtered.forEach((u, i) => {
        const isMe = currentUser && Number(u.id) === Number(currentUser.id);
        const roleBadge = u.role === 'admin' ? \`<span style="background:#DBEAFE;color:#1E3A8A;padding:2px 8px;border-radius:12px;font-size:11px;">Admin</span>\` : \`<span style="background:#F3F4F6;color:#4B5563;padding:2px 8px;border-radius:12px;font-size:11px;">User</span>\`;
        const activeBadge = u.is_active ? \`<span style="color:#059669;font-weight:600;">Aktif</span>\` : \`<span style="color:#DC2626;font-weight:600;">Tidak Aktif</span>\`;

        html += \`
          <tr>
            <td>\${i + 1}</td>
            <td>\${escapeHtml(u.username)}</td>
            <td>\${escapeHtml(u.name)} \${isMe ? '<span style="color:var(--sky);font-size:11px;font-weight:bold;">(Anda)</span>' : ''}</td>
            <td>\${escapeHtml(u.position || '-')}</td>
            <td>\${escapeHtml(u.company_name || 'BPBUMD / Belum ditugaskan')}</td>
            <td>\${roleBadge}</td>
            <td>\${activeBadge}</td>
            <td>
              <div class="action-btns">
                <button class="action-btn" onclick="openEditUserModal(\${u.id})" title="Edit">
                  Edit
                </button>
              </div>
            </td>
          </tr>
        \`;
      });

      html += \`</tbody></table>\`;
      container.innerHTML = html;
    }

    function escapeHtml(unsafe) {
      if (!unsafe) return '';
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

`;

const firstPart = html.substring(0, html.indexOf(oldScriptTarget));
const secondPart = html.substring(html.indexOf(scriptEndTarget));
html = firstPart + newScript + secondPart;

// Wait, the API for createUser inside daftar-bumd.html is submitCreateUser(). 
// Let's modify it to call loadUsersList() after success instead of loadBumds().
html = html.replace(/await loadBumds\(\);\s*await loadUsers\(\);/g, 'await loadUsersList();');
html = html.replace(/await loadUsers\(\);/g, 'await loadUsersList();');
html = html.replace(/await loadBumds\(\);/g, 'await loadUsersList();');

// Also remove logo dropzone logic since we removed bumd modal
const logoLogicStart = html.indexOf('//  LOGO DROPZONE');
const apiCallsStart = html.indexOf('//  MODAL: CREATE PENGGUNA');
// wait, we replaced everything up to MODAL: DELETE
// Let's just strip out unused logo dropzone if present.

fs.writeFileSync('public/pengguna.html', html);
console.log("Done phase 1");
