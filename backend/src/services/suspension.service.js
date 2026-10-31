const fs = require('fs');
const path = require('path');
const { query } = require('../db');
const { sendEmail } = require('./email.service');
const { logActivity } = require('../utils/activityLogger');

/**
 * Creates or removes suspended placeholder in the document root
 */
function applySuspendedVhost(docroot, domain, serviceType = 'Hosting') {
  if (!fs.existsSync(docroot)) return;

  const suspendedPage = 
`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layanan Ditangguhkan - ${domain}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #09090b;
      color: #f4f4f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
    }
    .box {
      max-width: 600px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 20px;
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .icon {
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 28px;
    }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff; }
    p { color: #a1a1aa; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .btn {
      display: inline-block;
      padding: 10px 24px;
      background: #4f46e5;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">⚠️</div>
    <h1>${serviceType} Ditangguhkan</h1>
    <p>${serviceType === 'Domain' 
      ? 'Domain ini sedang ditangguhkan karena masa aktif telah berakhir. Silakan lakukan perpanjangan untuk mengaktifkan kembali layanan.' 
      : 'Hosting Anda telah ditangguhkan karena masa aktif telah berakhir. Silakan lakukan perpanjangan untuk mengaktifkan kembali layanan.'}</p>
    <a href="https://demo.1slabs.my.id/portal" class="btn">Perpanjang Layanan di 1sLabs</a>
  </div>
</body>
</html>
`;

  try {
    // Backup original index.html if not already backed up
    const indexPath = path.join(docroot, 'index.html');
    const backupPath = path.join(docroot, 'index.html.active_backup');
    if (fs.existsSync(indexPath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(indexPath, backupPath);
    }
    fs.writeFileSync(indexPath, suspendedPage, 'utf-8');
  } catch (err) {
    console.warn(`[Suspension Warning] Could not write suspended page to ${docroot}:`, err.message);
  }
}

/**
 * Restores original website upon unsuspension
 */
function restoreActiveVhost(docroot) {
  if (!fs.existsSync(docroot)) return;
  try {
    const indexPath = path.join(docroot, 'index.html');
    const backupPath = path.join(docroot, 'index.html.active_backup');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, indexPath);
      fs.unlinkSync(backupPath);
    }
  } catch (err) {
    console.warn(`[Suspension Warning] Could not restore active vhost at ${docroot}:`, err.message);
  }
}

const SuspensionService = {
  /**
   * Run full inspection and suspension of expired services.
   * Idempotent: checks status !== 'suspended' and expires_at < NOW().
   */
  async checkAndSuspendExpiredServices() {
    console.log('[SuspensionService] Running automated lifecycle & expiry inspection...');
    const results = {
      suspended_hostings: 0,
      suspended_domains: 0,
      notifications_sent: 0,
      errors: []
    };

    try {
      // 1. Suspend expired hosting services
      const expiredHostings = await query(`
        SELECT s.id, s.service_code, s.domain, s.expires_at, u.id as user_id, u.name as user_name, u.email as user_email
        FROM hosting_services s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active' AND s.expires_at IS NOT NULL AND s.expires_at < NOW()
      `);

      for (const h of expiredHostings) {
        try {
          await query("UPDATE hosting_services SET status = 'suspended', updated_at = NOW() WHERE id = ?", [h.id]);

          // Write suspended vhost
          if (h.domain) {
            applySuspendedVhost(`/home/u1zh8984/public_html/${h.domain}`, h.domain, 'Hosting');
          }

          // Insert service event
          await query(`
            INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
            VALUES (?, 'service_suspended', 'Layanan Ditangguhkan (Expired)', 'Masa aktif hosting telah berakhir pada jadwal expired.', 'system', NULL)
          `, [h.id]);

          // Send notification email
          try {
            await sendEmail({
              to: h.user_email,
              subject: `[1sLabs] Layanan Hosting ${h.service_code} Telah Ditangguhkan`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
                  <h3 style="color: #ef4444;">Hosting Ditangguhkan</h3>
                  <p>Halo <strong>${h.user_name}</strong>,</p>
                  <p>Hosting Anda untuk domain <strong>${h.domain || h.service_code}</strong> telah ditangguhkan karena masa aktif telah berakhir.</p>
                  <p>Seluruh file dan database Anda tetap tersimpan dengan aman dan tidak dihapus. Silakan lakukan perpanjangan layanan melalui dashboard 1sLabs untuk mengaktifkan kembali website Anda.</p>
                  <a href="https://demo.1slabs.my.id/portal" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">Perpanjang Hosting Sekarang</a>
                </div>
              `
            });
            results.notifications_sent++;
          } catch (mErr) {}

          await logActivity({
            userId: h.user_id,
            action: 'hosting_suspended_expired',
            entityType: 'service',
            entityId: h.id,
            details: { domain: h.domain, serviceCode: h.service_code }
          });

          results.suspended_hostings++;
        } catch (hErr) {
          results.errors.push(`Hosting ${h.service_code}: ${hErr.message}`);
        }
      }

      // 2. Suspend expired domains
      const expiredDomains = await query(`
        SELECT d.id, d.domain, d.document_root, d.expires_at, u.id as user_id, u.name as user_name, u.email as user_email
        FROM domains d
        JOIN users u ON d.user_id = u.id
        WHERE d.status = 'active' AND d.expires_at IS NOT NULL AND d.expires_at < NOW()
      `);

      for (const d of expiredDomains) {
        try {
          await query("UPDATE domains SET status = 'suspended', updated_at = NOW() WHERE id = ?", [d.id]);
          applySuspendedVhost(d.document_root, d.domain, 'Domain');

          try {
            await sendEmail({
              to: d.user_email,
              subject: `[1sLabs] Masa Aktif Domain ${d.domain} Telah Berakhir`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
                  <h3 style="color: #ef4444;">Domain Ditangguhkan</h3>
                  <p>Halo <strong>${d.user_name}</strong>,</p>
                  <p>Domain <strong>${d.domain}</strong> sedang ditangguhkan karena masa aktif telah berakhir. Silakan lakukan perpanjangan untuk mengaktifkan kembali layanan.</p>
                  <a href="https://demo.1slabs.my.id/portal" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">Perpanjang Domain</a>
                </div>
              `
            });
            results.notifications_sent++;
          } catch (mErr) {}

          await logActivity({
            userId: d.user_id,
            action: 'domain_suspended_expired',
            entityType: 'domain',
            entityId: d.id,
            details: { domain: d.domain }
          });

          results.suspended_domains++;
        } catch (dErr) {
          results.errors.push(`Domain ${d.domain}: ${dErr.message}`);
        }
      }

      // 3. Send warning notification for services expiring in 3 days
      const expiringSoon = await query(`
        SELECT s.id, s.service_code, s.domain, s.expires_at, u.name as user_name, u.email as user_email
        FROM hosting_services s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active' AND s.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
      `);

      for (const s of expiringSoon) {
        try {
          await sendEmail({
            to: s.user_email,
            subject: `[Pemberitahuan] Hosting ${s.domain || s.service_code} Akan Berakhir Dalam 3 Hari`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
                <h3 style="color: #f59e0b;">Pengingat Masa Aktif Hosting</h3>
                <p>Halo <strong>${s.user_name}</strong>,</p>
                <p>Layanan hosting Anda untuk <strong>${s.domain || s.service_code}</strong> akan berakhir pada <strong>${new Date(s.expires_at).toLocaleDateString('id-ID')}</strong>.</p>
                <p>Hindari gangguan akses website dan API Anda dengan melakukan perpanjangan sebelum tanggal jatuh tempo.</p>
                <a href="https://demo.1slabs.my.id/portal" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">Perpanjang Sekarang</a>
              </div>
            `
          });
          results.notifications_sent++;
        } catch (e) {}
      }

    } catch (globalErr) {
      console.error('[SuspensionService Global Error]:', globalErr);
      results.errors.push(globalErr.message);
    }

    console.log('[SuspensionService] Inspection complete:', results);
    return results;
  },

  /**
   * Unsuspend a hosting service upon verified payment/renewal.
   */
  async unsuspendService(serviceId) {
    const services = await query('SELECT * FROM hosting_services WHERE id = ?', [serviceId]);
    if (services.length === 0) return;

    const s = services[0];
    await query("UPDATE hosting_services SET status = 'active', updated_at = NOW() WHERE id = ?", [serviceId]);
    if (s.domain) {
      restoreActiveVhost(`/home/u1zh8984/public_html/${s.domain}`);
      await query("UPDATE domains SET status = 'active', updated_at = NOW() WHERE domain = ?", [s.domain]);
    }
    console.log(`[SuspensionService] Service ${s.service_code} (${s.domain}) successfully unsuspended.`);
  }
};

module.exports = SuspensionService;

