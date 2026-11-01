const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const { isValidEmail, normalizeEmail } = require('../utils/validation');

// All User & Role management requires Super Admin
router.use(requireAuth, requireAdmin);

// GET /api/admin/users - List users with filtering & search
router.get('/', async (req, res) => {
  try {
    const { role, status, search, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT id, name, email, phone, role, status, email_verified, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      if (role === 'admin' || role === 'super_admin') {
        sql += ' AND (role = "admin" OR role = "super_admin")';
      } else if (role === 'pengguna' || role === 'customer') {
        sql += ' AND (role = "pengguna" OR role = "customer")';
      } else {
        sql += ' AND role = ?';
        params.push(role);
      }
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const users = await query(sql, params);

    // Get statistics
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role IN ('admin', 'super_admin') THEN 1 ELSE 0 END) as super_admin_count,
        SUM(CASE WHEN role = 'marketing' THEN 1 ELSE 0 END) as marketing_count,
        SUM(CASE WHEN role IN ('pengguna', 'customer') THEN 1 ELSE 0 END) as pengguna_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_count
      FROM users
    `);

    return res.json({
      success: true,
      users,
      stats: {
        total: Number(stats?.total) || 0,
        super_admin_count: Number(stats?.super_admin_count) || 0,
        marketing_count: Number(stats?.marketing_count) || 0,
        pengguna_count: Number(stats?.pengguna_count) || 0,
        active_count: Number(stats?.active_count) || 0,
        suspended_count: Number(stats?.suspended_count) || 0
      }
    });
  } catch (error) {
    console.error('List admin users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar pengguna sistem.'
    });
  }
});

// POST /api/admin/users - Register new user with specific role
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'pengguna' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Format alamat email tidak valid.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
    }

    const cleanEmail = normalizeEmail(email);

    // Validate role
    const validRoles = ['super_admin', 'marketing', 'pengguna', 'admin', 'customer'];
    const chosenRole = validRoles.includes(role) ? role : 'pengguna';

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Email "${cleanEmail}" sudah terdaftar di sistem. Silakan gunakan email lain.`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await query(
      `INSERT INTO users 
       (name, email, password_hash, phone, role, status, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
      [name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null, chosenRole]
    );

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'user_created',
      target: cleanEmail,
      details: { role: chosenRole, userId: insertResult.insertId },
      ip: req.ip,
      result: 'success'
    });

    return res.status(201).json({
      success: true,
      message: `Pengguna "${name.trim()}" (${chosenRole}) berhasil didaftarkan dan dapat langsung login.`,
      user: {
        id: insertResult.insertId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || null,
        role: chosenRole,
        status: 'active',
        email_verified: 1
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mendaftarkan pengguna baru.'
    });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['super_admin', 'marketing', 'pengguna', 'admin', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role yang dipilih tidak valid. Pilihan: super_admin, marketing, pengguna.'
      });
    }

    const [targetUser] = await query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    // Protect self demotion if only super_admin
    if (targetUser.id === req.user.id && (targetUser.role === 'admin' || targetUser.role === 'super_admin') && (role !== 'super_admin' && role !== 'admin')) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menurunkan hak akses akun Anda sendiri dari Super Admin.'
      });
    }

    await query('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [role, id]);

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'user_role_updated',
      target: targetUser.email,
      details: { oldRole: targetUser.role, newRole: role },
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Role pengguna "${targetUser.name}" berhasil diubah menjadi "${role}".`,
      user: { ...targetUser, role }
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui role pengguna.' });
  }
});

// PUT /api/admin/users/:id/status - Update user status (active / suspended)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const [targetUser] = await query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menangguhkan akun Anda sendiri.' });
    }

    await query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'user_status_updated',
      target: targetUser.email,
      details: { status },
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Status akun "${targetUser.name}" diubah menjadi ${status}.`
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status pengguna.' });
  }
});

// PUT /api/admin/users/:id/password - Reset password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
    }

    const [targetUser] = await query('SELECT id, name, email FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, id]);

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'user_password_reset',
      target: targetUser.email,
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Kata sandi untuk pengguna "${targetUser.name}" berhasil direset.`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mereset kata sandi pengguna.' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [targetUser] = await query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'user_deleted',
      target: targetUser.email,
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Pengguna "${targetUser.name}" (${targetUser.email}) berhasil dihapus dari sistem.`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.' });
  }
});

module.exports = router;

