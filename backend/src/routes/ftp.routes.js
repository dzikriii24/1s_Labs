const express = require('express');
const router = express.Router({ mergeParams: true });
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ftpService } = require('../services/cpanel.service');
const { getServiceRoot } = require('../utils/fileSandbox');

// Verify service access
async function verifyService(req, res, next) {
  try {
    const { serviceCode } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = 'SELECT * FROM hosting_services WHERE service_code = ?';
    const params = [serviceCode];
    if (!isUserAdmin) {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Layanan hosting tidak ditemukan.' });
    }

    req.service = rows[0];
    next();
  } catch (error) {
    console.error('Verify service error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi layanan.' });
  }
}

// 1. GET /ftp - List FTP accounts for this service
router.get('/', requireAuth, verifyService, async (req, res) => {
  try {
    const accounts = await query(
      'SELECT id, username, homedir, quota_mb, created_at FROM hosting_ftp_accounts WHERE service_id = ? ORDER BY created_at DESC',
      [req.service.id]
    );

    return res.json({
      success: true,
      accounts,
      connectionInfo: {
        host: req.service.server_ip || '103.119.237.132',
        port: 21,
        protocol: 'FTPS (FTP over TLS/SSL)',
        encryption: 'Require explicit FTP over TLS',
        recommendedClient: 'FileZilla'
      }
    });
  } catch (error) {
    console.error('Fetch FTP accounts error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar akun FTP.' });
  }
});

// 2. POST /ftp - Create new FTP account
router.post('/', requireAuth, verifyService, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Username FTP harus 3-24 karakter alfanumerik (huruf, angka, underscore).'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password FTP minimal 8 karakter.'
      });
    }

    const rawUser = username.trim().toLowerCase();
    const serviceDomain = req.service.domain || '1slabs.my.id';
    // Full cPanel virtual FTP username
    const fullFtpUser = `${rawUser}@${serviceDomain}`;

    // Check if username already exists in DB
    const existing = await query('SELECT id FROM hosting_ftp_accounts WHERE username = ?', [fullFtpUser]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username FTP sudah digunakan.' });
    }

    // Customer homedir is strictly locked to domain public_html
    const homedir = getServiceRoot(req.service.service_code, req.service.domain);

    // Call cPanel UAPI
    try {
      await ftpService.createAccount(rawUser, password, homedir, 0);
    } catch (uapiErr) {
      console.warn('cPanel UAPI FTP create warning/notice:', uapiErr.message);
      // If error is about already existing in cPanel, continue to record in DB
      if (!uapiErr.message.includes('already exists') && !uapiErr.message.includes('simulated')) {
        return res.status(400).json({
          success: false,
          message: `Gagal membuat akun FTP di server: ${uapiErr.message}`
        });
      }
    }

    // Save record to DB
    const insert = await query(
      `INSERT INTO hosting_ftp_accounts (service_id, username, homedir, quota_mb)
       VALUES (?, ?, ?, 0)`,
      [req.service.id, fullFtpUser, homedir]
    );

    // Log audit
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'ftp_account_create', ?, ?)`,
      [req.service.id, req.user.id, fullFtpUser, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: `Akun FTP '${fullFtpUser}' berhasil dibuat!`,
      account: {
        id: insert.insertId,
        username: fullFtpUser,
        homedir,
        quota_mb: 0
      }
    });
  } catch (error) {
    console.error('Create FTP error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal membuat akun FTP.' });
  }
});

// 3. PUT /ftp/:id/password - Change FTP password
router.put('/:id/password', requireAuth, verifyService, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
    }

    const rows = await query(
      'SELECT id, username FROM hosting_ftp_accounts WHERE id = ? AND service_id = ?',
      [accountId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun FTP tidak ditemukan.' });
    }

    const account = rows[0];
    const rawUser = account.username.split('@')[0];

    // Call UAPI
    await ftpService.changePassword(rawUser, password);

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'ftp_password_change', ?, ?)`,
      [req.service.id, req.user.id, account.username, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: 'Password akun FTP berhasil diperbarui.'
    });
  } catch (error) {
    console.error('Update FTP password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui password FTP.' });
  }
});

// 4. DELETE /ftp/:id - Delete FTP account
router.delete('/:id', requireAuth, verifyService, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);

    const rows = await query(
      'SELECT id, username FROM hosting_ftp_accounts WHERE id = ? AND service_id = ?',
      [accountId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun FTP tidak ditemukan.' });
    }

    const account = rows[0];
    const rawUser = account.username.split('@')[0];

    // Delete in cPanel UAPI (destroy: 0 so we never delete customer files!)
    try {
      await ftpService.deleteAccount(rawUser, 0);
    } catch (uapiErr) {
      console.warn('FTP UAPI delete notice:', uapiErr.message);
    }

    // Delete in DB
    await query('DELETE FROM hosting_ftp_accounts WHERE id = ?', [accountId]);

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'ftp_account_delete', ?, ?)`,
      [req.service.id, req.user.id, account.username, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: `Akun FTP '${account.username}' berhasil dihapus.`
    });
  } catch (error) {
    console.error('Delete FTP error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal menghapus akun FTP.' });
  }
});

module.exports = router;
