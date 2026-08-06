class ChipSelector {
  constructor(options) {
    this.inputId = options.inputId;
    this.dropdownId = options.dropdownId;
    this.chipsContainerId = options.chipsContainerId;
    this.selectorId = options.selectorId;
    
    this.allUsers = options.allUsers || [];
    this.selectedUsers = options.selectedUsers || [];
    this.onSelectionChange = options.onSelectionChange || null;

    this.input = document.getElementById(this.inputId);
    this.dropdown = document.getElementById(this.dropdownId);
    this.chipsContainer = document.getElementById(this.chipsContainerId);
    this.selector = document.getElementById(this.selectorId);

    if (!this.input || !this.dropdown || !this.chipsContainer) return;

    this.initEventListeners();
    this.renderSelectedChips();
  }

  setAllUsers(users) {
    this.allUsers = users;
    this.renderChipDropdown();
  }

  setSelected(userIds) {
    this.selectedUsers = [];
    userIds.forEach(id => {
      const u = this.allUsers.find(x => Number(x.id) === Number(id));
      if (u && !this.selectedUsers.some(x => Number(x.id) === Number(id))) {
        this.selectedUsers.push(u);
      }
    });
    this.renderSelectedChips();
  }

  getSelectedIds() {
    return this.selectedUsers.map(u => u.id);
  }

  getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  initEventListeners() {
    this.input.addEventListener('input', () => this.renderChipDropdown());
    this.input.addEventListener('focus', () => this.renderChipDropdown());

    document.addEventListener('click', (e) => {
      const wrap = this.selector.parentElement;
      if (wrap && !wrap.contains(e.target)) {
        this.dropdown.classList.remove('show');
      }
    });
  }

  renderSelectedChips() {
    this.chipsContainer.innerHTML = this.selectedUsers.map((u, i) => `
      <div class="chip">
        <span class="chip-avatar">${this.getInitials(u.name)}</span>
        ${this.escapeHtml(u.name)}
        <button type="button" class="chip-remove" data-index="${i}" title="Hapus">&times;</button>
      </div>
    `).join('');

    const removeBtns = this.chipsContainer.querySelectorAll('.chip-remove');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeUser(parseInt(e.target.dataset.index));
      });
    });

    if (this.onSelectionChange) this.onSelectionChange(this.getSelectedIds());
  }

  removeUser(index) {
    this.selectedUsers.splice(index, 1);
    this.renderSelectedChips();
    this.renderChipDropdown();
  }

  addUser(userId) {
    const user = this.allUsers.find(u => Number(u.id) === Number(userId));
    if (!user) return;
    if (this.selectedUsers.some(u => Number(u.id) === Number(userId))) return;

    this.selectedUsers.push(user);
    this.input.value = '';
    this.renderSelectedChips();
    this.renderChipDropdown();
    this.input.focus();
  }

  removeUserById(userId) {
    const idx = this.selectedUsers.findIndex(u => Number(u.id) === Number(userId));
    if (idx !== -1) this.removeUser(idx);
  }

  renderChipDropdown() {
    const query = this.input.value.trim().toLowerCase();
    const selectedIds = new Set(this.selectedUsers.map(u => Number(u.id)));

    const filtered = this.allUsers.filter(u => {
      return !query || u.name.toLowerCase().includes(query) || (u.company_name && u.company_name.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      this.dropdown.innerHTML = '<div style="padding:12px;text-align:center;color:var(--slate-400);font-size:12px">User tidak ditemukan</div>';
      this.dropdown.classList.add('show');
      return;
    }

    this.dropdown.innerHTML = filtered.map(u => {
      const isSelected = selectedIds.has(Number(u.id));
      const cName = u.company_name || 'BPBUMD';
      const pos = u.position || 'Tidak ada posisi';

      let roleText = `@${this.escapeHtml(cName)} · ${this.escapeHtml(pos)}`;

      return `
        <div class="chip-dropdown-item" data-id="${u.id}" data-selected="${isSelected}">
          <div class="dd-avatar">${this.getInitials(u.name)}</div>
          <div class="dd-info">
            <div class="dd-name">${this.escapeHtml(u.name)}</div>
            <div class="dd-role">${roleText}</div>
          </div>
          ${isSelected ? `
            <svg class="dd-check" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ` : ''}
        </div>
      `;
    }).join('');

    const items = this.dropdown.querySelectorAll('.chip-dropdown-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const selected = item.dataset.selected === 'true';
        if (selected) {
          this.removeUserById(id);
        } else {
          this.addUser(id);
        }
      });
    });

    this.dropdown.classList.add('show');
  }
}
