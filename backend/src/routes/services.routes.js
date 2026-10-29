const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { isValidDomain, cleanDomain, calculateDaysRemaining } = require('../utils/helpers');
const { ensureServiceRoot, renameServiceDomainRoot } = require('../utils/fileSandbox');

// GET /services - List user's services
router.get('/', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    let sql = `
      SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price as plan_price,
             p.storage_gb, p.databases_count, p.bandwidth, p.ssl_type, p.backup_frequency,
             u.name as customer_name, u.email as customer_email
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' WHERE s.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY s.created_at DESC';

    const rows = await query(sql, params);

    const formatted = rows.map(s => {
      const daysLeft = calculateDaysRemaining(s.expires_at);
      let calculatedStatus = s.status;
      if (s.status === 'active' && s.expires_at && new Date(s.expires_at) < new Date()) {
        calculatedStatus = 'expired';
      }

      return {
        ...s,
        status: calculatedStatus,
        days_remaining: daysLeft,
        is_expiring_soon: calculatedStatus === 'active' && daysLeft <= 14 && daysLeft > 0
      };
    });

    return res.json({
      success: true,
      services: formatted
    });
  } catch (error) {
    console.error('Fetch services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar layanan hosting.'
    });
  }
});

// GET /services/:serviceCode - Service detail
router.get('/:serviceCode', requireAuth, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price as plan_price,
             p.period as plan_period, p.storage_gb, p.databases_count, p.bandwidth,
             p.ssl_type, p.backup_frequency, p.email_accounts, p.features_json,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             o.order_number, o.created_at as order_date,
             inv.invoice_number
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN invoices inv ON inv.service_id = s.id OR inv.order_id = o.id
      WHERE s.service_code = ?
    `;
    const params = [serviceCode];

    if (!isUserAdmin) {
      sql += ' AND s.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layanan hosting tidak ditemukan.'
      });
    }

    const service = rows[0];
    const daysLeft = calculateDaysRemaining(service.expires_at);
    let calculatedStatus = service.status;
    if (service.status === 'active' && service.expires_at && new Date(service.expires_at) < new Date()) {
      calculatedStatus = 'expired';
    }

    // Fetch timeline events
    const events = await query(
      'SELECT id, event_type, title, description, actor_type, created_at FROM service_events WHERE service_id = ? ORDER BY created_at ASC',
      [service.id]
    );

    const features = typeof service.features_json === 'string'
      ? JSON.parse(service.features_json)
      : (service.features_json || []);

    return res.json({
      success: true,
      service: {
        ...service,
        status: calculatedStatus,
        days_remaining: daysLeft,
        is_expiring_soon: calculatedStatus === 'active' && daysLeft <= 14 && daysLeft > 0,
        plan_features: features,
        events
      }
    });
  } catch (error) {
    console.error('Fetch service detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail layanan hosting.'
    });
  }
});

// POST /services/:serviceCode/setup-domain - Setup domain
router.post('/:serviceCode/setup-domain', requireAuth, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { domain, domain_type = 'existing' } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Nama domain wajib diisi.'
      });
    }

    const cleaned = cleanDomain(domain);
    if (!isValidDomain(cleaned)) {
      return res.status(400).json({
        success: false,
        message: 'Format nama domain tidak valid. Contoh format yang benar: tokosaya.com atau portfolio.my.id'
      });
    }

    // Find service and check ownership
    const services = await query(
      'SELECT id, user_id, status FROM hosting_services WHERE service_code = ?',
      [serviceCode]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layanan hosting tidak ditemukan.'
      });
    }

    const service = services[0];
    if (service.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke layanan ini.'
      });
    }

    if (service.status !== 'awaiting_domain' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Domain sudah pernah dikonfigurasi untuk layanan ini. Hubungi admin untuk perubahan domain.'
      });
    }

    // Check conflict
    const conflict = await query(
      'SELECT id FROM hosting_services WHERE domain = ? AND id != ? AND status IN (?, ?)',
      [cleaned, service.id, 'active', 'pending_provisioning']
    );

    if (conflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Domain tersebut sudah terdaftar pada layanan hosting lain di 1sLabs.'
      });
    }

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE hosting_services 
         SET domain = ?, domain_type = ?, status = 'pending_provisioning', updated_at = NOW() 
         WHERE id = ?`,
        [cleaned, domain_type, service.id]
      );

      await conn.query(
        `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
         VALUES (?, 'domain_configured', 'Domain Dikonfigurasi', ?, 'customer', ?)`,
        [
          service.id,
          `Domain ${cleaned} (${domain_type === 'new' ? 'Domain Baru' : 'Domain Sendiri'}) berhasil didaftarkan. Layanan masuk ke antrean konfigurasi server.`,
          req.user.id
        ]
      );
    });

    try {
      ensureServiceRoot(serviceCode, cleaned);
    } catch (fsErr) {
      console.warn('ensureServiceRoot notice:', fsErr.message);
    }

    return res.json({
      success: true,
      message: 'Domain berhasil disimpan. Layanan hosting Anda sedang dipersiapkan oleh tim engineer 1sLabs.',
      domain: cleaned,
      status: 'pending_provisioning'
    });
  } catch (error) {
    console.error('Setup domain error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan konfigurasi domain.'
    });
  }
});

// POST /services/:serviceCode/change-domain - Allow customer to edit/change domain
router.post('/:serviceCode/change-domain', requireAuth, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Nama domain baru wajib diisi.'
      });
    }

    const cleaned = cleanDomain(domain);
    if (!isValidDomain(cleaned)) {
      return res.status(400).json({
        success: false,
        message: 'Format nama domain tidak valid. Contoh format: tokosaya.com atau portfolio.my.id'
      });
    }

    // Find service and check ownership
    const services = await query(
      'SELECT id, user_id, domain, status FROM hosting_services WHERE service_code = ?',
      [serviceCode]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layanan hosting tidak ditemukan.'
      });
    }

    const service = services[0];
    if (service.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke layanan ini.'
      });
    }

    if (service.domain && service.domain.toLowerCase() === cleaned.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Nama domain baru sama dengan domain saat ini.'
      });
    }

    // Check conflict with other services
    const conflict = await query(
      'SELECT id FROM hosting_services WHERE domain = ? AND id != ? AND status IN (?, ?)',
      [cleaned, service.id, 'active', 'pending_provisioning']
    );

    if (conflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Domain tersebut sudah terdaftar pada layanan hosting lain di 1sLabs.'
      });
    }

    const oldDomain = service.domain;

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE hosting_services SET domain = ?, updated_at = NOW() WHERE id = ?`,
        [cleaned, service.id]
      );

      await conn.query(
        `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
         VALUES (?, 'domain_updated', 'Perubahan Domain Utama', ?, 'customer', ?)`,
        [
          service.id,
          `Domain utama berhasil diubah dari '${oldDomain || '-'}' ke '${cleaned}'. Direktori file manager otomatis berpindah ke /public_html/${cleaned}.`,
          req.user.id
        ]
      );
    });

    // Rename server root directory from old domain to new domain
    try {
      renameServiceDomainRoot(serviceCode, oldDomain, cleaned);
    } catch (fsErr) {
      console.warn('renameServiceDomainRoot notice:', fsErr.message);
    }

    return res.json({
      success: true,
      message: `Domain berhasil diperbarui menjadi ${cleaned}. Direktori file manager otomatis diperbarui ke /public_html/${cleaned}.`,
      domain: cleaned
    });
  } catch (error) {
    console.error('Change domain error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui domain.'
    });
  }
});

// Mount Hostinger-style hosting management subroutes
const fileManagerRoutes = require('./filemanager.routes');
const ftpRoutes = require('./ftp.routes');
const databaseRoutes = require('./database.routes');

router.use('/:serviceCode/files', fileManagerRoutes);
router.use('/:serviceCode/ftp', ftpRoutes);
router.use('/:serviceCode/databases', databaseRoutes);

module.exports = router;

