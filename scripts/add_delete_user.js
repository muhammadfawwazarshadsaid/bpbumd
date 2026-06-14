const fs = require('fs');

let authService = fs.readFileSync('src/services/auth.service.js', 'utf8');
if (!authService.includes('deleteUser')) {
  authService = authService.replace(
    'module.exports = {',
    `async function deleteUser(requestingUser, userId) {
  // Authorization:
  // 1. BPBUMD admin can delete anyone
  // 2. BUMD admin can delete users in their own company
  const isAdmin = requestingUser.role === 'admin';
  const isBpbumd = requestingUser.company_type === 'bpbumd';

  if (!isAdmin) {
    const error = new Error("Anda tidak memiliki akses untuk menghapus user");
    error.statusCode = 403;
    throw error;
  }

  const existing = await pool.query(
    "SELECT company_id FROM users WHERE id = $1",
    [userId]
  );

  if (existing.rowCount === 0) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!isBpbumd && Number(existing.rows[0].company_id) !== Number(requestingUser.company_id)) {
    const error = new Error("Anda tidak memiliki akses untuk menghapus user ini");
    error.statusCode = 403;
    throw error;
  }

  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
}

module.exports = {
  deleteUser,`
  );
  fs.writeFileSync('src/services/auth.service.js', authService);
}

let authRoutes = fs.readFileSync('src/routes/auth.routes.js', 'utf8');
if (!authRoutes.includes('router.delete')) {
  authRoutes += `
/**
 * DELETE /api/auth/users/:id
 */
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    await authService.deleteUser(req.user, req.params.id);
    res.json({
      success: true,
      message: "Berhasil menghapus pengguna",
    });
  } catch (error) {
    console.error("Delete User error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus pengguna",
    });
  }
});
`;
  fs.writeFileSync('src/routes/auth.routes.js', authRoutes);
}

console.log('done');
