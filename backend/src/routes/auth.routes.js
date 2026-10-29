const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, email, dan password wajib diisi.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Format alamat email tidak valid.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal terdiri dari 6 karakter.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi password tidak cocok.'
      });
    }

    // Check if email already registered
    const existing = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Always create as 'customer'
    const insertResult = await query(
      'INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [cleanEmail, passwordHash, name.trim(), phone ? phone.trim() : null, 'customer']
    );

    const userId = insertResult.insertId;

    const token = jwt.sign(
      { id: userId, email: cleanEmail, role: 'customer' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat mendaftarkan akun.'
    });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = await query(
      'SELECT id, email, password_hash, name, phone, role, created_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat proses login.'
    });
  }
});

// GET /me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [servicesCount] = await query(
      'SELECT COUNT(*) as count FROM hosting_services WHERE user_id = ? AND status = ?',
      [req.user.id, 'active']
    );

    const [unpaidOrdersCount] = await query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status IN (?, ?)',
      [req.user.id, 'unpaid', 'pending_verification']
    );

    return res.json({
      success: true,
      user: {
        ...req.user,
        activeServicesCount: servicesCount?.count || 0,
        pendingOrdersCount: unpaidOrdersCount?.count || 0
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat profil pengguna.'
    });
  }
});

// PUT /profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (name) {
      await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
        name.trim(),
        phone ? phone.trim() : null,
        userId
      ]);
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Kata sandi saat ini diperlukan untuk membuat kata sandi baru.'
        });
      }

      const [userRecord] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      const validCurrent = await bcrypt.compare(currentPassword, userRecord.password_hash);
      if (!validCurrent) {
        return res.status(400).json({
          success: false,
          message: 'Kata sandi saat ini salah.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Kata sandi baru minimal 6 karakter.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }

    const [updated] = await query(
      'SELECT id, email, name, phone, role FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updated
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.'
    });
  }
});

module.exports = router;
