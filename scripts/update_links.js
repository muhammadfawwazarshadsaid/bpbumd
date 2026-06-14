const fs = require('fs');

const files = ['public/dashboard.html', 'public/dashboard-aspek.html'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // In dashboard sidebars:
    const oldLink = `<a class="nav-item">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Manajemen Pengguna
      </a>`;
      
    const newLink = `<a class="nav-item" href="/pengguna.html">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Manajemen Pengguna
      </a>`;
      
    content = content.replace(oldLink, newLink);

    // Also update "Daftar BUMD" link in dashboard to actually point to /daftar-bumd.html if it doesn't
    const bumdLink = `<a class="nav-item" onclick="setPage('bumd')">`;
    const newBumdLink = `<a class="nav-item" href="/daftar-bumd.html">`;
    content = content.replace(bumdLink, newBumdLink);
    
    fs.writeFileSync(file, content);
  }
});

console.log("Updated sidebars");
