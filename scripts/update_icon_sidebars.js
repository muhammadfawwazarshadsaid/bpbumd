const fs = require('fs');
const glob = require('fs').readdirSync('public').filter(f => f.endsWith('.html'));

const usersIcon = `
      <a class="icon-btn" href="/pengguna.html" title="Manajemen Pengguna">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </a>`;

glob.forEach(file => {
  if (file === 'pengguna.html') return; // already has it
  const path = `public/${file}`;
  let content = fs.readFileSync(path, 'utf8');
  if (content.includes('icon-sidebar-bottom') && !content.includes('/pengguna.html')) {
    content = content.replace(
      `</svg>\n      </a>\n\n      <div class="icon-sidebar-bottom">`,
      `</svg>\n      </a>\n${usersIcon}\n\n      <div class="icon-sidebar-bottom">`
    );
    // Also handle case with different spacing
    content = content.replace(
      `</svg>\n      </a>\n      <div class="icon-sidebar-bottom">`,
      `</svg>\n      </a>\n${usersIcon}\n      <div class="icon-sidebar-bottom">`
    );
    fs.writeFileSync(path, content);
  }
});
console.log("Updated icon sidebars");
