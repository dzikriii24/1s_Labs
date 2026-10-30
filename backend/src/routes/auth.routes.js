const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { generateSecureToken, hashToken } = require('../utils/tokens');
const { isValidEmail, normalizeEmail, validateAndNormalizeWhatsApp } = require('../utils/validation');
const {
  sendVerificationEmail,
  sendAdminNewCustomerNotification,
  sendPasswordResetEmail
} = require('../services/email.service');

// POST /register - Register customer with mandatory WhatsApp & email verification flow
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap wajib diisi.'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format alamat email tidak valid.'
      });
    }

    const cleanEmail = normalizeEmail(email);

    // WhatsApp validation (MANDATORY REQUIREMENT)
    const phoneValidation = validateAndNormalizeWhatsApp(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error || 'Nomor WhatsApp wajib diisi dengan format yang benar (contoh: 081234567890).'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi minimal terdiri dari 6 karakter.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi kata sandi tidak cocok.'
      });
    }

    // Check existing email
    const existing = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate single-use cryptographic verification token (valid 24h)
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(24);

    // Insert user with email_verified = 0, status = 'pending_verification'
    const insertResult = await query(
      `INSERT INTO users 
       (email, password_hash, name, phone, role, email_verified, email_verification_token_hash, email_verification_expires_at, status)
       VALUES (?, ?, ?, ?, 'customer', 0, ?, ?, 'pending_verification')`,
      [
        cleanEmail,
        passwordHash,
        name.trim(),
        phoneValidation.normalized,
        tokenHash,
        expiresAt
      ]
    );

    const userId = insertResult.insertId;

    // Issue JWT token (accessible in unverified state for restricted portal/resend actions)
    const token = jwt.sign(
      { id: userId, email: cleanEmail, role: 'customer' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const createdUser = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      phone: phoneValidation.normalized,
      role: 'customer',
      email_verified: false,
      status: 'pending_verification'
    };

    // Send verification email to customer asynchronously (isolated error handling)
    sendVerificationEmail({
      to: cleanEmail,
      name: name.trim(),
      token: rawToken
    }).catch(err => console.error('[auth] Background email sending failed:', err.message));

    // Send admin notification
    sendAdminNewCustomerNotification({ user: createdUser })
      .catch(err => console.error('[auth] Background admin alert failed:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Tautan verifikasi telah dikirim ke alamat email Anda. Silakan periksa kotak masuk atau spam.',
      token,
      user: createdUser
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat mendaftarkan akun.'
    });
  }
});

// GET & POST /verify-email - Validate token and mark email as verified
router.all('/verify-email', async (req, res) => {
  try {
    const rawToken = req.query.token || req.body.token;

    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak ditemukan atau tidak valid.'
      });
    }

    const hashed = hashToken(rawToken.trim());

    // Search user with this hash & valid expiry
    const users = await query(
      `SELECT id, email, name, phone, role, email_verified, email_verification_expires_at
       FROM users 
       WHERE email_verification_token_hash = ?`,
      [hashed]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tautan verifikasi tidak valid atau sudah pernah digunakan sebelumnya.'
      });
    }

    const user = users[0];

    // Check expiry
    if (new Date(user.email_verification_expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Tautan verifikasi telah kedaluwarsa (lebih dari 24 jam). Silakan minta tautan verifikasi baru.'
      });
    }

    // Mark as verified & clear one-time token
    await query(
      `UPDATE users 
       SET email_verified = 1,
           status = 'active',
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Selamat! Alamat email Anda telah berhasil diverifikasi. Akun Anda kini aktif penuh dan siap digunakan.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        email_verified: 1,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses verifikasi email.'
    });
  }
});

// POST /resend-verification - Resend verification email with rate limiting
router.post('/resend-verification', async (req, res) => {
  try {
    let emailToVerify = req.body.email;

    // If request contains Bearer token, check authenticated user
    const authHeader = req.headers.authorization;
    if (!emailToVerify && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const [usr] = await query('SELECT email FROM users WHERE id = ?', [decoded.id]);
        if (usr) emailToVerify = usr.email;
      } catch {}
    }

    if (!emailToVerify || !isValidEmail(emailToVerify)) {
      return res.status(400).json({
        success: false,
        message: 'Alamat email wajib dicantumkan.'
      });
    }

    const cleanEmail = normalizeEmail(emailToVerify);
    const users = await query(
      'SELECT id, name, email, email_verified, updated_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      // Do not disclose user existence, return friendly message
      return res.json({
        success: true,
        message: 'Jika alamat email terdaftar di 1sLabs, tautan verifikasi baru telah dikirimkan ke kotak masuk Anda.'
      });
    }

    const user = users[0];
    if (user.email_verified === 1) {
      return res.status(400).json({
        success: false,
        message: 'Alamat email ini sudah terverifikasi sebelumnya. Silakan langsung masuk ke akun Anda.'
      });
    }

    // Rate limiting: Ensure at least 60 seconds between resend requests
    const now = new Date();
    const lastUpdate = new Date(user.updated_at);
    if ((now.getTime() - lastUpdate.getTime()) < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: 'Mohon tunggu 1 menit sebelum meminta tautan verifikasi berikutnya.'
      });
    }

    // Generate new secure token
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(24);

    await query(
      `UPDATE users 
       SET email_verification_token_hash = ?,
           email_verification_expires_at = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [tokenHash, expiresAt, user.id]
    );

    // Send email
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: rawToken
    });

    return res.json({
      success: true,
      message: 'Tautan verifikasi baru berhasil dikirim ke alamat email Anda.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim ulang email verifikasi.'
    });
  }
});

// POST /login - Authenticate customer or admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan kata sandi wajib diisi.'
      });
    }

    const cleanEmail = normalizeEmail(email);
    const users = await query(
      'SELECT id, email, password_hash, name, phone, role, email_verified, status, created_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.'
      });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'suspended' || user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang ditangguhkan. Silakan hubungi admin 1sLabs untuk informasi lebih lanjut.'
      });
    }

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
        email_verified: user.email_verified === 1,
        status: user.status,
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

// GET /me - Profile & summary
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
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phone,
        role: req.user.role,
        email_verified: req.user.email_verified === 1,
        status: req.user.status,
        createdAt: req.user.created_at,
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

// PUT /profile - Update profile details & WhatsApp with validation
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (name && name.trim()) {
      await query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    if (phone !== undefined) {
      const phoneValidation = validateAndNormalizeWhatsApp(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          success: false,
          message: phoneValidation.error || 'Format nomor WhatsApp tidak valid.'
        });
      }
      await query('UPDATE users SET phone = ? WHERE id = ?', [phoneValidation.normalized, userId]);
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
      'SELECT id, email, name, phone, role, email_verified, status FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: {
        ...updated,
        email_verified: updated.email_verified === 1
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.'
    });
  }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.'
      });
    }

    const cleanEmail = normalizeEmail(email);
    const users = await query('SELECT id, name, email FROM users WHERE email = ?', [cleanEmail]);

    if (users.length > 0) {
      const user = users[0];
      const { rawToken, tokenHash, expiresAt } = generateSecureToken(1); // 1 hour expiry

      await query(
        `UPDATE users 
         SET password_reset_token_hash = ?,
             password_reset_expires_at = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [tokenHash, expiresAt, user.id]
      );

      sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: rawToken
      }).catch(err => console.error('[auth] Forgot password email error:', err.message));
    }

    return res.json({
      success: true,
      message: 'Jika alamat email terdaftar, instruksi pengaturan ulang kata sandi telah dikirim ke email Anda.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses permintaan reset kata sandi.'
    });
  }
});

// POST /reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token dan kata sandi baru wajib diisi.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal 6 karakter.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi kata sandi tidak cocok.'
      });
    }

    const hashed = hashToken(token.trim());
    const users = await query(
      `SELECT id, email, password_reset_expires_at 
       FROM users 
       WHERE password_reset_token_hash = ?`,
      [hashed]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token pengaturan ulang kata sandi tidak valid atau sudah digunakan.'
      });
    }

    const user = users[0];
    if (new Date(user.password_reset_expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan ajukan permintaan reset baru.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      `UPDATE users 
       SET password_hash = ?,
           password_reset_token_hash = NULL,
           password_reset_expires_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [newHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan login menggunakan kata sandi baru Anda.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengatur ulang kata sandi.'
    });
  }
});

module.exports = router;
