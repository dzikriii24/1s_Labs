const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { query, withTransaction } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { domainService, subdomainService, sslService } = require('../services/cpanel.service');
const { cleanDomain, isValidDomain, calculateDaysRemaining } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');

const SERVER_IP = '103.119.237.132';
const NAMESERVERS = ['ns1.domainmurah.net', 'ns2.domainmurah.net'];

// Helper to check live DNS resolution for custom domain
async function checkDnsStatus(domain) {
  try {
    const addresses = await dns.resolve4(domain);
    if (addresses.includes(SERVER_IP)) {
      return { connected: true, ip: addresses[0], message: 'DNS mengarah dengan tepat ke server 1sLabs.' };
    }
    return { connected: false, ip: addresses[0] || null, message: `Domain mengarah ke IP ${addresses[0] || 'tidak dikenal'}, bukan ${SERVER_IP}.` };
  } catch (err) {
    return { connected: false, ip: null, message: 'Catatan A Record belum terdeteksi pada DNS publik.' };
  }
}

// GET /domains - List user's domains
router.get('/', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    let sql = `
      SELECT d.*, s.service_code, s.status as service_status, p.name as plan_name,
             u.name as owner_name, u.email as owner_email
      FROM domains d
      LEFT JOIN hosting_services s ON d.service_id = s.id
      LEFT JOIN hosting_plans p ON s.plan_id = p.id
      LEFT JOIN users u ON d.user_id = u.id
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' WHERE d.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY d.created_at DESC';

    const rows = await query(sql, params);

    const formatted = rows.map(d => {
      const daysLeft = calculateDaysRemaining(d.expires_at);
      let calculatedStatus = d.status;
      if (d.status === 'active' && d.expires_at && new Date(d.expires_at) < new Date()) {
        calculatedStatus = 'expired';
      }

      return {
        ...d,
        status: calculatedStatus,
        days_remaining: daysLeft,
        is_expiring_soon: calculatedStatus === 'active' && daysLeft <= 30 && daysLeft > 0
      };
    });

    return res.json({
      success: true,
      domains: formatted
    });
  } catch (err) {
    console.error('List domains error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar domain.'
    });
  }
});

// GET /domains/:id - Detail of a domain
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT d.*, s.service_code, s.status as service_status, p.name as plan_name,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM domains d
      LEFT JOIN hosting_services s ON d.service_id = s.id
      LEFT JOIN hosting_plans p ON s.plan_id = p.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `;
    const params = [id];

    if (!isUserAdmin) {
      sql += ' AND d.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domain tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    const domainData = rows[0];
    const daysLeft = calculateDaysRemaining(domainData.expires_at);
    let calculatedStatus = domainData.status;
    if (domainData.status === 'active' && domainData.expires_at && new Date(domainData.expires_at) < new Date()) {
      calculatedStatus = 'expired';
    }

    // Check live DNS for custom domain
    let dnsReport = { connected: true, message: 'Domain internal terkelola penuh.' };
    if (domainData.domain_type === 'custom_domain') {
      dnsReport = await checkDnsStatus(domainData.domain);
    }

    const dnsInstructions = {
      server_ip: SERVER_IP,
      nameservers: NAMESERVERS,
      a_record: {
        type: 'A',
        name: '@ (root) atau ' + domainData.domain,
        target: SERVER_IP,
        ttl: 14400
      },
      cname_record: {
        type: 'CNAME',
        name: 'www',
        target: domainData.domain,
        ttl: 14400
      }
    };

    return res.json({
      success: true,
      domain: {
        ...domainData,
        status: calculatedStatus,
        days_remaining: daysLeft,
        dns_report: dnsReport,
        dns_instructions: dnsInstructions
      }
    });
  } catch (err) {
    console.error('Domain detail error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rincian domain.'
    });
  }
});

// POST /domains/check - Validate availability for any domain (custom or subdomain)
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { domain, domain_type = 'custom_domain' } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, available: false, message: 'Nama domain wajib diisi.' });
    }

    const cleaned = cleanDomain(domain);
    if (!isValidDomain(cleaned)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Format nama domain tidak valid (contoh: bisnisanda.com).'
      });
    }

    // Check DB conflicts
    const [dbConflict] = await query('SELECT id, user_id FROM domains WHERE domain = ? LIMIT 1', [cleaned]);
    if (dbConflict) {
      return res.status(409).json({
        success: false,
        available: false,
        message: 'Domain ini sudah terdaftar di sistem 1sLabs.'
      });
    }

    // Check hosting services conflicts
    const [svcConflict] = await query('SELECT id FROM hosting_services WHERE domain = ? LIMIT 1', [cleaned]);
    if (svcConflict) {
      return res.status(409).json({
        success: false,
        available: false,
        message: 'Domain ini sudah aktif digunakan pada hosting lain.'
      });
    }

    // Check live cPanel addon domains
    try {
      const addons = await domainService.listAddonDomains();
      const match = addons.find(a => (a.domain && a.domain.toLowerCase() === cleaned) || (a.fullsubdomain && a.fullsubdomain.toLowerCase() === cleaned));
      if (match) {
        return res.status(409).json({
          success: false,
          available: false,
          message: 'Domain ini sudah terkonfigurasi di server hosting.'
        });
      }
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      available: true,
      domain: cleaned,
      message: `Domain ${cleaned} tersedia untuk dihubungkan ke hosting 1sLabs!`
    });
  } catch (err) {
    console.error('Check domain error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa domain.' });
  }
});

// POST /domains/custom - Register custom domain to user account
router.post('/custom', requireAuth, async (req, res) => {
  try {
    const { domain, service_id } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Nama domain wajib diisi.' });
    }

    const cleaned = cleanDomain(domain);
    if (!isValidDomain(cleaned)) {
      return res.status(400).json({ success: false, message: 'Format domain kustom tidak valid.' });
    }

    // Verify service if supplied
    let serviceId = null;
    if (service_id) {
      const services = await query('SELECT id FROM hosting_services WHERE id = ? AND user_id = ?', [service_id, req.user.id]);
      if (services.length > 0) {
        serviceId = services[0].id;
      }
    }

    const docroot = `/home/u1zh8984/public_html/${cleaned}`;

    // Execute insertion in transaction
    const result = await withTransaction(async (conn) => {
      const [existing] = await conn.query('SELECT id FROM domains WHERE domain = ? FOR UPDATE', [cleaned]);
      if (existing.length > 0) {
        throw new Error('Domain ini sudah terdaftar.');
      }

      const [insertRes] = await conn.query(
        `INSERT INTO domains 
         (user_id, service_id, domain, domain_type, root_domain, subdomain_prefix, document_root, status, is_free_plan, ssl_status, dns_status, registered_at, expires_at)
         VALUES (?, ?, ?, 'custom_domain', ?, '', ?, 'active', 0, 'pending', 'pending', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [req.user.id, serviceId, cleaned, cleaned, docroot]
      );

      return { domainId: insertRes.insertId };
    });

    // Provision cPanel Addon Domain
    try {
      await domainService.addAddonDomain(cleaned, null, `public_html/${cleaned}`);
    } catch (cpErr) {
      console.warn(`[cPanel Custom Domain notice for ${cleaned}]:`, cpErr.message);
    }

    // Scaffolding docroot if not exists
    if (!fs.existsSync(docroot)) {
      try {
        fs.mkdirSync(docroot, { recursive: true, mode: 0o755 });
        fs.writeFileSync(path.join(docroot, '.htaccess'), `Options +FollowSymLinks\n<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteBase /\n  RewriteRule ^api/ - [L]\n  RewriteRule ^uploads/ - [L]\n  RewriteRule ^index\\.html$ - [L]\n  RewriteCond %{REQUEST_FILENAME} !-f\n  RewriteCond %{REQUEST_FILENAME} !-d\n  RewriteRule . /index.html [L]\n</IfModule>\n`);
      } catch (e) {
        console.warn('Docroot scaffold error:', e.message);
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'domain_added',
      entityType: 'domain',
      entityId: result.domainId,
      details: { domain: cleaned, docroot }
    });

    return res.json({
      success: true,
      message: `Domain ${cleaned} berhasil didaftarkan. Silakan arahkan DNS domain Anda ke IP ${SERVER_IP}.`,
      data: {
        id: result.domainId,
        domain: cleaned,
        document_root: docroot,
        server_ip: SERVER_IP,
        nameservers: NAMESERVERS
      }
    });
  } catch (err) {
    console.error('Add custom domain error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Gagal menambahkan domain.' });
  }
});

// POST /domains/:id/renew - Create renewal invoice / order for domain
router.post('/:id/renew', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const domains = await query('SELECT * FROM domains WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (domains.length === 0) {
      return res.status(404).json({ success: false, message: 'Domain tidak ditemukan.' });
    }

    const domainObj = domains[0];
    const renewalPrice = 10000; // Rp 10.000 / bulan untuk perpanjangan domain .1slabs.my.id

    // Return renewal price info or proceed with order
    return res.json({
      success: true,
      message: `Permintaan perpanjangan domain ${domainObj.domain} siap diproses.`,
      renewal: {
        domain: domainObj.domain,
        price: renewalPrice,
        period: '/ bulan',
        current_expires_at: domainObj.expires_at,
        new_expires_at: new Date(new Date(domainObj.expires_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (err) {
    console.error('Renew domain error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses perpanjangan domain.' });
  }
});

module.exports = router;

