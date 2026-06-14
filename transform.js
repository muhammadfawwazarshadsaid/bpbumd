const fs = require('fs');

const dashAspek = fs.readFileSync('public/dashboard-aspek.html', 'utf8');
let daftarBumd = fs.readFileSync('public/daftar-bumd.html', 'utf8');

// Extract CSS from dashboard-aspek.html
const cssStart = dashAspek.indexOf('/* ── TOP NAVBAR');
const cssEnd = dashAspek.indexOf('/* ── SUMMARY KPI');
const newCss = dashAspek.substring(cssStart, cssEnd);

// Replace CSS in daftar-bumd.html
const oldCssStart = daftarBumd.indexOf('/* ── SIDEBAR');
const oldCssEnd = daftarBumd.indexOf('/* ── KPI SUMMARY');
daftarBumd = daftarBumd.substring(0, oldCssStart) + newCss + daftarBumd.substring(oldCssEnd);

// Extract HTML from dashboard-aspek.html
const navStart = dashAspek.indexOf('<!-- TOP NAVBAR -->');
const navEnd = dashAspek.indexOf('<!-- MAIN AREA -->');
let newNavHtml = dashAspek.substring(navStart, navEnd);

// Set the active tab correctly
newNavHtml = newNavHtml.replace('class="nav-tab active" href="/dashboard-aspek.html"', 'class="nav-tab" href="/dashboard-aspek.html"');
newNavHtml = newNavHtml.replace('class="nav-tab" href="/bumd.html"', 'class="nav-tab active" href="/daftar-bumd.html"');

newNavHtml = newNavHtml.replace('class="icon-btn active" href="/dashboard-aspek.html"', 'class="icon-btn" href="/dashboard-aspek.html"');

// Replace HTML in daftar-bumd.html
const bodyStart = daftarBumd.indexOf('<body>') + 6;
const oldMainStart = daftarBumd.indexOf('<div class="content">');

// We need to carefully replace from after <body> to <div class="content">
// But wait, daftar-bumd has:
// <!-- SIDEBAR --> ... </aside>
// <!-- MAIN --> <div class="main"> <header class="topbar"> ... </header> <div class="content">
const oldHtmlStart = daftarBumd.indexOf('<!-- SIDEBAR -->');
const contentStart = daftarBumd.indexOf('<div class="content">');

const topbarTitle = `
      <!-- PAGE HEADING -->
      <div class="page-heading" style="margin-bottom: 24px;">
        <div>
          <div class="page-heading-title" style="font-size: 20px; font-weight: 800; color: var(--slate-900); ">Daftar BUMD</div>
          <div style="font-size: 12px; color: var(--slate-400); margin-top: 4px;">Kelola data Badan Usaha Milik Daerah</div>
        </div>
        <div style="margin-left: auto;">
          <div id="topbarDate" style="font-size: 12px; color: var(--slate-500); background: white; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--slate-200); box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-weight: 500;"></div>
        </div>
      </div>
`;

// Let's replace the whole structure
daftarBumd = daftarBumd.substring(0, oldHtmlStart) +
  '\n  ' + newNavHtml +
  '\n    <main class="main-area">\n' +
  topbarTitle +
  daftarBumd.substring(contentStart + 21); // skip <div class="content">

// We also need to close the main-area and body-wrap instead of the old closing tags
// old structure ends with:
//     </div> <!-- end content -->
//   </div> <!-- end main -->
// We should find the closing tags of content and main.
const scriptStart = daftarBumd.indexOf('<!-- MODAL: CREATE/EDIT -->');
daftarBumd = daftarBumd.substring(0, scriptStart) +
  '    </main>\n  </div><!-- /body-wrap -->\n\n  ' +
  daftarBumd.substring(scriptStart);

// Remove the extra </div></div> before the modal
daftarBumd = daftarBumd.replace('    </div>\n  </div>\n\n  <!-- MODAL: CREATE/EDIT -->', '\n\n  <!-- MODAL: CREATE/EDIT -->');

// Replace root vars
const rootStart = daftarBumd.indexOf(':root {');
const rootEnd = daftarBumd.indexOf('}', rootStart) + 1;
const dashRootStart = dashAspek.indexOf(':root {');
const dashRootEnd = dashAspek.indexOf('}', dashRootStart) + 1;
const newRoot = dashAspek.substring(dashRootStart, dashRootEnd);
daftarBumd = daftarBumd.substring(0, rootStart) + newRoot + daftarBumd.substring(rootEnd);

fs.writeFileSync('public/daftar-bumd.html', daftarBumd);
console.log('done');
