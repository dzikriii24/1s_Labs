const express = require('express');
const router = express.Router();
const { requireAuth, requireAdminOrMarketing, requireAdmin } = require('../middleware/auth');
const { emailAccountService } = require('../services/cpanel.service');
const { logActivity } = require('../utils/activityLogger');

router.use(requireAuth, requireAdminOrMarketing);

// GET /api/admin/company-emails - List all company email accounts on @1slabs.my.id
router.get('/', async (req, res) => {
  try {
    const domain = '1slabs.my.id';
    const accounts = await emailAccountService.listAccounts(domain);
    return res.json({
      success: true,
      domain,
      accounts,
      count: accounts.length,
      webmailUrl: 'https://1slabs.my.id:2096',
      cpanelUrl: 'https://merapi.php.id:2083'
    });
  } catch (error) {
    console.error('List company emails error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memuat daftar akun email company dari cPanel.'
    });
  }
});

// POST /api/admin/company-emails - Create new company email account
router.post('/', async (req, res) => {
  try {
    const { username, password, quota } = req.body;
    const domain = '1slabs.my.id';

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan kata sandi email wajib diisi.'
      });
    }

    const cleanUser = String(username).trim().toLowerCase().replace(/@.*$/, '');
    if (!/^[a-z0-9._-]+$/.test(cleanUser)) {
      return res.status(400).json({
        success: false,
        message: 'Username email hanya boleh memuat huruf kecil, angka, titik, strip (-), atau underscore (_).'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi email minimal harus 8 karakter.'
      });
    }

    // Check duplicate
    const exists = await emailAccountService.accountExists(cleanUser, domain);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Akun email "${cleanUser}@${domain}" sudah terdaftar di cPanel! Mohon gunakan prefix/nama lain.`
      });
    }

    const targetQuota = (quota !== undefined && quota !== null && !isNaN(Number(quota)))
      ? Number(quota)
      : 500;

    const created = await emailAccountService.createAccount({
      username: cleanUser,
      password,
      quota: targetQuota,
      domain
    });

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'company_email_created',
      target: `${cleanUser}@${domain}`,
      details: { quota: created.quota, domain },
      ip: req.ip,
      result: 'success'
    });

    return res.status(201).json({
      success: true,
      message: `Akun email resmi ${cleanUser}@${domain} berhasil dibuat di server cPanel!`,
      data: created
    });
  } catch (error) {
    console.error('Create company email error:', error);
    const isConflict = error.message && error.message.includes('sudah terdaftar');
    return res.status(isConflict ? 409 : 500).json({
      success: false,
      message: error.message || 'Gagal membuat akun email di cPanel.'
    });
  }
});

// PUT /api/admin/company-emails/:user/password - Update password
router.put('/:user/password', async (req, res) => {
  try {
    const { user } = req.params;
    const { password } = req.body;
    const domain = '1slabs.my.id';

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal 8 karakter.'
      });
    }

    await emailAccountService.changePassword({
      username: user,
      password,
      domain
    });

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'company_email_password_updated',
      target: `${user}@${domain}`,
      details: { domain },
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Kata sandi untuk ${user}@${domain} berhasil diperbarui di cPanel.`
    });
  } catch (error) {
    console.error('Update company email password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memperbarui kata sandi email di cPanel.'
    });
  }
});

// PUT /api/admin/company-emails/:user/quota - Update quota
router.put('/:user/quota', async (req, res) => {
  try {
    const { user } = req.params;
    const { quota } = req.body;
    const domain = '1slabs.my.id';

    const updated = await emailAccountService.editQuota({
      username: user,
      quota,
      domain
    });

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'company_email_quota_updated',
      target: `${user}@${domain}`,
      details: { quota: updated.quota, domain },
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Batas kuota penyimpanan untuk ${user}@${domain} berhasil diubah menjadi ${updated.quota}.`,
      data: updated
    });
  } catch (error) {
    console.error('Update company email quota error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengubah kuota email di cPanel.'
    });
  }
});

// DELETE /api/admin/company-emails/:user - Delete email account (Super Admin only for safety)
router.delete('/:user', requireAdmin, async (req, res) => {
  try {
    const { user } = req.params;
    const domain = '1slabs.my.id';

    await emailAccountService.deleteAccount({
      username: user,
      domain
    });

    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'company_email_deleted',
      target: `${user}@${domain}`,
      details: { domain },
      ip: req.ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Akun email ${user}@${domain} telah berhasil dihapus dari cPanel.`
    });
  } catch (error) {
    console.error('Delete company email error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menghapus akun email dari cPanel.'
    });
  }
});

module.exports = router;

