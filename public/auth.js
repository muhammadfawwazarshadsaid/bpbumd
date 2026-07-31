/**
 * auth.js — Shared authentication helper for BPBUMD Control Tower
 *
 * Token disimpan sebagai httpOnly cookie oleh server.
 * JavaScript TIDAK punya akses ke token — lebih aman dari XSS.
 *
 * Usage:
 *   <script src="/<base-path>/config.js"></script>
 *   <script src="/<base-path>/auth.js"></script>
 */

(function (window) {
  "use strict";

  // Dynamic base path: use config.js value, or auto-detect from URL
  const BASE = window.__BASE_PATH__ || '/' + window.location.pathname.split('/').filter(Boolean)[0] || '/diagnosticreview-demo';
  const LOGIN_URL = BASE + "/login.html";
  const USER_KEY = "bpbumd_user";

  /**
   * Get cached user data from sessionStorage (display-only, non-sensitive).
   * This is just for fast UI rendering while /api/auth/me validates.
   */
  function getUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Cache user display data in sessionStorage */
  function setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /** Clear cached user data */
  function clearUser() {
    sessionStorage.removeItem(USER_KEY);
  }

  /**
   * Helper to get user initials (e.g. "Dwi Ananto" -> "DA", "Admin BPBUMD" -> "AB")
   */
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  /**
   * Auto-initialize interactive profile dropdown attached to #userAvatarBtn
   */
  function initUserProfileDropdown(user) {
    if (!user) return;

    // Find all avatar buttons or #userAvatarBtn
    const avatarBtn = document.getElementById('userAvatarBtn') || document.querySelector('.user-avatar-btn');
    if (!avatarBtn) return;

    const initials = getInitials(user.name);
    avatarBtn.textContent = initials;
    avatarBtn.style.cursor = 'pointer';
    avatarBtn.setAttribute('title', user.name || 'Profil Pengguna');

    // Create or locate Popover Menu
    let popover = document.getElementById('userProfilePopover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'userProfilePopover';
      popover.className = 'user-profile-popover';
      popover.style.cssText = `
        display: none;
        position: fixed;
        width: 290px;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.06);
        z-index: 999999;
        padding: 16px;
        font-family: Inter, system-ui, -apple-system, sans-serif;
        box-sizing: border-box;
      `;
      document.body.appendChild(popover);
    }

    const roleName = user.role === 'admin' ? 'Administrator' : (user.role === 'superadmin' ? 'Superadmin' : 'PIC BUMD / Verifikator');
    const companyName = user.company_name || 'BPBUMD DKI Jakarta';
    const position = user.position || 'Pengguna Sistem';
    const username = user.username || '-';
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    popover.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:1px solid #F1F5F9;">
        <div style="width:42px; height:42px; min-width:42px; border-radius:50%; background:linear-gradient(135deg, #0284C7, #2563EB); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; box-shadow:0 4px 6px -1px rgba(2, 132, 199, 0.3);">
          ${initials}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700; font-size:14px; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${user.name || ''}">
            ${user.name || 'Pengguna'}
          </div>
          <div style="font-size:11px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
            ${position}
          </div>
          <div style="display:inline-block; margin-top:4px; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:#F0F9FF; color:#0284C7; border:1px solid #BAE6FD;">
            ${roleName}
          </div>
        </div>
      </div>

      <div style="padding:10px 0; border-bottom:1px solid #F1F5F9; font-size:12px; color:#475569; display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
          <svg width="14" height="14" fill="none" stroke="#0284C7" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style="font-weight:600; color:#1E293B;">Posisi / Jabatan:</span> <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${position}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
          <svg width="14" height="14" fill="none" stroke="#0284C7" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M1 21h22"/><path d="M9 7h1"/><path d="M9 11h1"/><path d="M9 15h1"/><path d="M14 7h1"/><path d="M14 11h1"/><path d="M14 15h1"/></svg>
          <span style="font-weight:600; color:#1E293B;">Perusahaan:</span> <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${companyName}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <svg width="14" height="14" fill="none" stroke="#0284C7" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span style="font-weight:600; color:#1E293B;">Username:</span> ${username}
        </div>
      </div>

      <div style="padding-top:8px; display:flex; flex-direction:column; gap:3px;">
        ${isAdmin ? `
        <button type="button" id="btnPopoverPengguna" style="width:100%; text-align:left; background:transparent; border:none; padding:8px 10px; border-radius:6px; font-size:12px; color:#334155; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.15s;" onmouseover="this.style.background='#F1F5F9'; this.style.color='#0284C7';" onmouseout="this.style.background='transparent'; this.style.color='#334155';">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1 0 7.75"/></svg>
          Manajemen Pengguna
        </button>` : ''}
        <button type="button" id="btnPopoverLogout" style="width:100%; text-align:left; background:transparent; border:none; padding:8px 10px; border-radius:6px; font-size:12px; color:#EF4444; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.15s; margin-top:2px;" onmouseover="this.style.background='#FEF2F2';" onmouseout="this.style.background='transparent';">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar (Logout)
        </button>
      </div>
    `;

    // Add click listeners to popover buttons
    const btnPengguna = popover.querySelector('#btnPopoverPengguna');
    if (btnPengguna) {
      btnPengguna.onclick = () => {
        popover.style.display = 'none';
        window.location.href = BASE + '/pengguna.html';
      };
    }

    const btnLogout = popover.querySelector('#btnPopoverLogout');
    if (btnLogout) {
      btnLogout.onclick = () => {
        popover.style.display = 'none';
        logout();
      };
    }

    // Toggle popover on avatar click
    avatarBtn.onclick = (e) => {
      e.stopPropagation();
      const rect = avatarBtn.getBoundingClientRect();
      popover.style.top = (rect.bottom + 8) + 'px';
      popover.style.right = Math.max(16, (window.innerWidth - rect.right)) + 'px';
      popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
    };

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (popover && !popover.contains(e.target) && e.target !== avatarBtn) {
        popover.style.display = 'none';
      }
    });
  }

  /**
   * Auth guard — call at the top of every protected page's DOMContentLoaded.
   * Validates session by calling GET /api/auth/me.
   * The httpOnly cookie is sent automatically by the browser.
   *
   * @returns {Promise<object>} The current user object
   */
  async function requireAuth() {
    try {
      const response = await fetch(BASE + "/api/auth/me", {
        credentials: "same-origin",
      });

      if (response.status === 401) {
        clearUser();
        window.location.href = LOGIN_URL;
        return new Promise(function () { });
      }

      if (!response.ok) {
        // Non-auth error — try cached user
        const cached = getUser();
        if (cached) {
          setTimeout(() => initUserProfileDropdown(cached), 100);
          return cached;
        }

        clearUser();
        window.location.href = LOGIN_URL;
        return new Promise(function () { });
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        setTimeout(() => initUserProfileDropdown(result.data), 100);
        return result.data;
      } else {
        clearUser();
        window.location.href = LOGIN_URL;
        return new Promise(function () { });
      }
    } catch {
      // Network error — allow page to continue with cached user data
      const cached = getUser();
      if (cached) {
        setTimeout(() => initUserProfileDropdown(cached), 100);
        return cached;
      }

      clearUser();
      window.location.href = LOGIN_URL;
      return new Promise(function () { });
    }
  }

  /**
   * Check if user might be authenticated (based on cached user data).
   * This is a fast check for the login page redirect — actual validation
   * happens in requireAuth() via the server.
   */
  function isAuthenticated() {
    return !!getUser();
  }

  /**
   * Logout — call server to clear httpOnly cookie, then redirect.
   */
  async function logout() {
    try {
      await fetch(BASE + "/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Ignore network errors on logout
    }
    clearUser();
    window.location.href = LOGIN_URL;
  }

  // Expose to global scope
  window.BPBUMDAuth = {
    getUser: getUser,
    setUser: setUser,
    clearUser: clearUser,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth,
    logout: logout,
    initUserProfileDropdown: initUserProfileDropdown,
    getBasePath: function() { return BASE; },
  };
})(window);
