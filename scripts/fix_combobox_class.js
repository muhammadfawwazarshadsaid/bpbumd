const fs = require('fs');

const files = ['public/daftar-bumd.html', 'public/pengguna.html'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace form-input with form-select for datalist inputs
    content = content.replace(
      '<input class="form-input" id="inputSector" type="text" list="sectorList"',
      '<input class="form-select" id="inputSector" type="text" list="sectorList"'
    );
    
    content = content.replace(
      /<input class="form-input" id="createUserPosition" type="text" list="positionList"/g,
      '<input class="form-select" id="createUserPosition" type="text" list="positionList"'
    );

    content = content.replace(
      /<input class="form-input" id="editUserPosition" type="text" list="positionList"/g,
      '<input class="form-select" id="editUserPosition" type="text" list="positionList"'
    );

    fs.writeFileSync(file, content);
  }
});
console.log("Updated classes");
