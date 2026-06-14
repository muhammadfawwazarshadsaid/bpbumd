const fs = require('fs');
let service = fs.readFileSync('src/services/bumd.service.js', 'utf8');

const targetStr = `    // Cek apakah masih ada user yang terikat ke BUMD ini
    const userCheck = await client.query(
      "SELECT COUNT(*)::INT AS count FROM users WHERE company_id = $1",
      [bumdId]
    );

    if (Number(userCheck.rows[0].count) > 0) {
      const error = new Error(
        \`BUMD tidak bisa dihapus karena masih memiliki \${userCheck.rows[0].count} user. Pindahkan user terlebih dahulu.\`
      );
      error.statusCode = 422;
      throw error;
    }`;

const replacementStr = `    // Lepaskan semua user dari BUMD ini dan nonaktifkan mereka
    // agar foreign key fk_users_company tidak mencegah penghapusan
    await client.query(
      "UPDATE users SET company_id = NULL, is_active = FALSE WHERE company_id = $1",
      [bumdId]
    );`;

if (service.includes(targetStr)) {
  service = service.replace(targetStr, replacementStr);
  fs.writeFileSync('src/services/bumd.service.js', service);
  console.log('done');
} else {
  console.log('not found');
}
