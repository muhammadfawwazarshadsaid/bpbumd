/**
 * auth.js — Shared authentication helper for BPBUMD Control Tower
 *
 * Token disimpan sebagai httpOnly cookie oleh server.
 * JavaScript TIDAK punya akses ke token — lebih aman dari XSS.
 *
 * Usage:
 *   <script src="/diagnosticreview-demo/auth.js"></script>
 */

(function (window) {
  "use strict";

  const LOGIN_URL = "/diagnosticreview-demo/login.html";
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
   * Auth guard — call at the top of every protected page's DOMContentLoaded.
   * Validates session by calling GET /api/auth/me.
   * The httpOnly cookie is sent automatically by the browser.
   *
   * @returns {Promise<object>} The current user object
   */
  async function requireAuth() {
    try {
      const response = await fetch("/diagnosticreview-demo/api/auth/me", {
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
        if (cached) return cached;

        clearUser();
        window.location.href = LOGIN_URL;
        return new Promise(function () { });
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        return result.data;
      } else {
        clearUser();
        window.location.href = LOGIN_URL;
        return new Promise(function () { });
      }
    } catch {
      // Network error — allow page to continue with cached user data
      const cached = getUser();
      if (cached) return cached;

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
      await fetch("/diagnosticreview-demo/api/auth/logout", {
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
  };
})(window);
