const fs = require('fs');
let html = fs.readFileSync('public/pengguna.html', 'utf8');

// 1. Add Hapus button to table
if (!html.includes('openDeleteUserModal')) {
  html = html.replace(
    `<button class="action-btn" onclick="openEditUserModal(\${u.id})" title="Edit">
                  Edit
                </button>`,
    `<button class="action-btn" onclick="openEditUserModal(\${u.id})" title="Edit">
                  Edit
                </button>
                \${!isMe ? \`<button class="action-btn delete" onclick="openDeleteUserModal(\${u.id}, '\${escapeHtml(u.name).replace(/'/g, "\\\\'")}')" title="Hapus">
                  Hapus
                </button>\` : ''}`
  );
}

// 2. Add Modal HTML
if (!html.includes('id="deleteUserModal"')) {
  const modalHTML = `
  <!-- MODAL: HAPUS PENGGUNA -->
  <div class="modal-overlay" id="deleteUserModal">
    <div class="modal-content" style="max-width:400px; text-align:center;">
      <div class="modal-header" style="border-bottom:none; padding-bottom:0;">
        <div class="modal-title" style="color:var(--danger)">Hapus Pengguna</div>
        <button class="btn-close" onclick="closeDeleteUserModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding:24px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5" style="margin-bottom:16px;">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <p style="font-size:15px; color:#4B5563; margin:0;">
          Apakah Anda yakin ingin menghapus pengguna<br />
          <strong id="deleteUserName">-</strong>?
        </p>
        <p style="font-size:13px; color:#6B7280; margin-top:8px;">
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
      <div class="modal-footer" style="justify-content:center; gap:12px; border-top:none; padding-top:0;">
        <button class="btn-cancel" onclick="closeDeleteUserModal()">Batal</button>
        <button class="btn-submit" id="btnDeleteUser" onclick="confirmDeleteUser()" style="background:var(--danger); border-color:var(--danger)">
          Hapus
        </button>
      </div>
    </div>
  </div>
  `;
  
  html = html.replace('<!-- MODAL: CREATE PENGGUNA -->', modalHTML + '\n  <!-- MODAL: CREATE PENGGUNA -->');
}

// 3. Add JS functions
if (!html.includes('function openDeleteUserModal')) {
  const jsHTML = `
    let deletingUserId = null;

    function openDeleteUserModal(id, name) {
      deletingUserId = id;
      document.getElementById('deleteUserName').textContent = name;
      document.getElementById('deleteUserModal').classList.add('show');
    }

    function closeDeleteUserModal() {
      document.getElementById('deleteUserModal').classList.remove('show');
      deletingUserId = null;
    }

    async function confirmDeleteUser() {
      if (!deletingUserId) return;

      const btn = document.getElementById('btnDeleteUser');
      btn.disabled = true;

      try {
        await apiFetch(\`/api/auth/users/\${deletingUserId}\`, { method: 'DELETE' });
        showToast('Pengguna berhasil dihapus', 'success');
        closeDeleteUserModal();
        await loadUsersList();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    }
  `;
  
  html = html.replace('// ════════════════════════════════════════════\n    //  MODAL: CREATE PENGGUNA', jsHTML + '\n\n    // ════════════════════════════════════════════\n    //  MODAL: CREATE PENGGUNA');
}

fs.writeFileSync('public/pengguna.html', html);
console.log('done');
