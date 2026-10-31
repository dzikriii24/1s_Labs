const fs = require('fs');
const path = require('path');
const { query, withTransaction } = require('../db');
const { subdomainService } = require('./cpanel.service');
const { generateServiceCode, generateOrderNumber, generateInvoiceNumber } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail } = require('./email.service');

// System-wide reserved words for subdomains
const RESERVED_SUBDOMAINS = [
  'mail', 'cpanel', 'whm', 'webmail', 'demo', 'api', 'admin', 'administrator',
  'ns1', 'ns2', 'ns3', 'ns4', 'dns', 'mx', 'ftp', 'smtp', 'pop', 'imap',
  'root', 'test', 'testing', 'dev', 'developer', 'staging', 'prod', 'production',
  'app', 'apps', 'auth', 'oneslabs', '1slabs', 'status', 'portal', 'server',
  'panel', 'dashboard', 'billing', 'support', 'help', 'blog', 'shop', 'store',
  'billing', 'payment', 'checkout', 'pay', 'vps', 'cloud', 'host', 'hosting'
];

/**
 * Scaffolds the default website template for the user's new subdomain.
 */
function scaffoldSubdomainDirectory(docroot, subdomain, fullDomain) {
  try {
    if (!fs.existsSync(docroot)) {
      fs.mkdirSync(docroot, { recursive: true, mode: 0o755 });
    }

    // 1. Create .htaccess for SPA and /api forwarding
    const htaccessContent = 
`# 1sLabs Hosting Platform - Managed VirtualHost
Options +FollowSymLinks
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/ - [L]
  RewriteRule ^uploads/ - [L]
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
    fs.writeFileSync(path.join(docroot, '.htaccess'), htaccessContent, 'utf-8');

    // 2. Create index.html default welcome page
    const indexHtmlContent = 
`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullDomain} &mdash; 1sLabs Cloud Hosting</title>
  <link rel="icon" type="image/png" href="https://image2url.com/images/1757349257406-33f427d1-9c4b-43ab-951a-623b6ffade7d.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #111114;
      --card-subtle: #18181c;
      --border: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(255, 255, 255, 0.2);
      --text-main: #f4f4f5;
      --text-muted: #a1a1aa;
      --text-dim: #71717a;
      --accent-green: #22c55e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }

    header {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem 1.25rem 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
    }
    .brand-logo {
      height: 36px;
      width: auto;
      display: block;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.2);
      color: #86efac;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--accent-green);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
      animation: pulse-dot 2s infinite ease-in-out;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }

    main {
      flex: 1;
      width: 100%;
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .hero-container {
      margin-top: 1.5rem;
      margin-bottom: 2.5rem;
      max-width: 760px;
    }
    .domain-tag {
      display: inline-block;
      padding: 4px 12px;
      background: #18181b;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      color: #e4e4e7;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    .domain-highlight {
      color: #ffffff;
      text-decoration: underline;
      text-decoration-color: rgba(255, 255, 255, 0.3);
      text-underline-offset: 6px;
    }
    .hero-desc {
      font-size: clamp(0.95rem, 1.8vw, 1.125rem);
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 680px;
      margin: 0 auto 2rem;
    }
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #000000;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 13px 26px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.1);
      transition: all 0.15s ease;
    }
    .cta-button:hover {
      background: #e4e4e7;
      transform: translateY(-1px);
    }
    .cta-button svg {
      width: 16px;
      height: 16px;
      transition: transform 0.15s ease;
    }
    .cta-button:hover svg {
      transform: translateX(3px);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
      text-align: left;
      margin-top: 1rem;
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s ease;
    }
    .card:hover {
      border-color: var(--border-focus);
    }
    .card-icon {
      width: 36px;
      height: 36px;
      background: var(--card-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      margin-bottom: 1rem;
    }
    .card h3 {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    .card p {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }
    .card-code {
      margin-top: auto;
      background: #09090b;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #d4d4d8;
      overflow-x: auto;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-code span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-code .badge-spec {
      color: #86efac;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .specs-strip {
      width: 100%;
      margin-top: 2rem;
      padding: 1rem 1.25rem;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
      gap: 16px;
      font-size: 12px;
      color: var(--text-dim);
    }
    .spec-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .spec-item strong {
      color: #e4e4e7;
    }

    footer {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 2.5rem 1.25rem 2rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      font-size: 12px;
      color: var(--text-dim);
      text-align: center;
    }
    .footer-links {
      display: flex;
      gap: 20px;
    }
    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <header>
    <a href="https://demo.1slabs.my.id" class="brand-link" target="_blank" rel="noopener">
      <img src="https://image2url.com/images/1757349257406-33f427d1-9c4b-43ab-951a-623b6ffade7d.png" alt="1sLabs" class="brand-logo" height="36" />
    </a>
    <div class="status-pill">
      <span class="status-dot"></span>
      Layanan Aktif &amp; Siap Digunakan
    </div>
  </header>

  <main>
    <div class="hero-container">
      <div class="domain-tag">https://${fullDomain}</div>
      <h1>Selamat Datang di <br><span class="domain-highlight">${fullDomain}</span></h1>
      <p class="hero-desc">
        Subdomain dan hosting gratis 1sLabs Anda telah berhasil dibuat dan terhubung ke server cloud berperforma tinggi.
      </p>
      <div>
        <a href="https://demo.1slabs.my.id/portal" class="cta-button" target="_blank">
          <span>Kelola di Dashboard 1sLabs &rarr;</span>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div>
          <div class="card-icon">&#9889;</div>
          <h3>⚡ Frontend Siap Upload</h3>
          <p>Unggah file HTML, React, Vue, atau Vite Anda langsung ke direktori document root server:</p>
        </div>
        <div class="card-code">
          <span>public_html/${fullDomain}</span>
        </div>
      </div>

      <div class="card">
        <div>
          <div class="card-icon">&#128640;</div>
          <h3>🚀 Node.js API Ready</h3>
          <p>Deploy backend RESTful API Node.js langsung di endpoint /api melalui dashboard.</p>
        </div>
        <div class="card-code">
          <span>https://${fullDomain}/api</span>
          <span class="badge-spec">Active</span>
        </div>
      </div>

      <div class="card">
        <div>
          <div class="card-icon">&#128274;</div>
          <h3>🔒 Auto-SSL Enabled</h3>
          <p>Sertifikat SSL Let's Encrypt aktif otomatis untuk mengamankan koneksi HTTPS pengunjung.</p>
        </div>
        <div class="card-code">
          <span>HTTPS / TLS 1.3</span>
          <span class="badge-spec">&#10003; Secure</span>
        </div>
      </div>
    </div>

    <div class="specs-strip">
      <div class="spec-item">
        <span>Infrastruktur:</span>
        <strong>LiteSpeed &bull; CloudLinux</strong>
      </div>
      <div class="spec-item">
        <span>Lokasi Server:</span>
        <strong>Indonesia (103.119.237.132)</strong>
      </div>
      <div class="spec-item">
        <span>PHP / Node.js:</span>
        <strong>Node v20 &bull; v22 &bull; v24</strong>
      </div>
      <div class="spec-item">
        <span>Status Host:</span>
        <strong style="color: #86efac;">100% Operational</strong>
      </div>
    </div>
  </main>

  <footer>
    <div class="footer-links">
      <a href="https://demo.1slabs.my.id/portal" target="_blank">Customer Portal</a>
      <a href="https://demo.1slabs.my.id/#hosting" target="_blank">Paket Hosting</a>
      <a href="https://1slabs.my.id" target="_blank">1sLabs Official</a>
    </div>
    <div>
      &copy; 2026 1sLabs. Cloud Hosting &amp; Automated Infrastructure. Seluruh hak cipta dilindungi.
    </div>
  </footer>
</body>
</html>
`;
    fs.writeFileSync(path.join(docroot, 'index.html'), indexHtmlContent, 'utf-8');

    // 3. Create api placeholder dir
    const apiDir = path.join(docroot, 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    console.log(`[Scaffold] Subdomain files created successfully for ${fullDomain} at ${docroot}`);
  } catch (err) {
    console.warn(`[Scaffold Warning] Could not scaffold directory ${docroot}:`, err.message);
  }
}

const FreePlanService = {
  /**
   * Check if a user is eligible for the Free Plan.
   * Returns claim details if already claimed.
   */
  async checkEligibility(userId) {
    const claims = await query(
      `SELECT f.*, s.service_code, s.status as service_status, d.id as domain_id, d.document_root
       FROM free_plan_claims f
       LEFT JOIN hosting_services s ON f.service_id = s.id
       LEFT JOIN domains d ON f.domain = d.domain
       WHERE f.user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (claims.length > 0) {
      const claim = claims[0];
      const now = new Date();
      const hostingExpired = new Date(claim.hosting_expires_at) < now;
      const domainExpired = new Date(claim.domain_expires_at) < now;

      return {
        eligible: false,
        alreadyClaimed: true,
        claim: {
          id: claim.id,
          subdomain: claim.subdomain,
          domain: claim.domain,
          service_code: claim.service_code,
          claimed_at: claim.claimed_at,
          hosting_expires_at: claim.hosting_expires_at,
          domain_expires_at: claim.domain_expires_at,
          is_hosting_expired: hostingExpired,
          is_domain_expired: domainExpired,
          status: claim.status,
          service_status: claim.service_status
        }
      };
    }

    return {
      eligible: true,
      alreadyClaimed: false,
      claim: null
    };
  },

  /**
   * Validate subdomain availability in DB & cPanel.
   */
  async checkSubdomainAvailability(rawSubdomain) {
    if (!rawSubdomain || typeof rawSubdomain !== 'string') {
      return { available: false, message: 'Nama subdomain wajib diisi.' };
    }

    const subdomain = rawSubdomain.trim().toLowerCase();

    // 1. Format validation (a-z, 0-9, single hyphens, 3-63 chars)
    if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(subdomain) || subdomain.length < 3) {
      return {
        available: false,
        message: 'Format subdomain tidak valid. Gunakan 3-63 karakter huruf kecil, angka, atau tanda strip (tanpa spasi/simbol).'
      };
    }

    // 2. Blacklist check
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return {
        available: false,
        message: 'Nama subdomain ini merupakan kata kunci sistem yang dicadangkan oleh 1sLabs.'
      };
    }

    const fullDomain = `${subdomain}.1slabs.my.id`;

    // 3. Database check in claims, domains, and hosting_services
    const [existingClaim] = await query(
      'SELECT id FROM free_plan_claims WHERE subdomain = ? OR domain = ? LIMIT 1',
      [subdomain, fullDomain]
    );
    if (existingClaim) {
      return { available: false, message: 'Subdomain ini sudah pernah diklaim oleh pengguna lain.' };
    }

    const [existingDomain] = await query(
      'SELECT id FROM domains WHERE domain = ? LIMIT 1',
      [fullDomain]
    );
    if (existingDomain) {
      return { available: false, message: 'Domain ini sudah terdaftar pada database sistem 1sLabs.' };
    }

    const [existingService] = await query(
      'SELECT id FROM hosting_services WHERE domain = ? LIMIT 1',
      [fullDomain]
    );
    if (existingService) {
      return { available: false, message: 'Domain ini sudah aktif terikat pada layanan hosting.' };
    }

    // 4. Live cPanel check
    const cpanelCheck = await subdomainService.checkAvailability(subdomain, '1slabs.my.id');
    if (!cpanelCheck.available) {
      return { available: false, message: cpanelCheck.reason || 'Subdomain ini sudah aktif di server hosting.' };
    }

    return {
      available: true,
      subdomain,
      domain: fullDomain,
      message: `Subdomain ${fullDomain} tersedia untuk diklaim gratis!`
    };
  },

  /**
   * Atomic claim execution with row-level locking and cPanel provisioning.
   */
  async claimFreePlan(userId, rawSubdomain) {
    const avail = await this.checkSubdomainAvailability(rawSubdomain);
    if (!avail.available) {
      throw new Error(avail.message);
    }

    const subdomain = avail.subdomain;
    const fullDomain = avail.domain;
    const docroot = `/home/u1zh8984/public_html/${fullDomain}`;

    // Get user details
    const users = await query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new Error('Pengguna tidak ditemukan.');
    }
    const user = users[0];

    // Get free-hosting plan
    const plans = await query("SELECT id, name, price FROM hosting_plans WHERE slug = 'free-hosting' LIMIT 1");
    if (plans.length === 0) {
      throw new Error('Paket Free Hosting belum dikonfigurasi pada database.');
    }
    const freePlan = plans[0];

    // Execute atomic claim and provisioning
    const result = await withTransaction(async (conn) => {
      // 1. Lock and re-verify user eligibility
      const [lockedClaim] = await conn.query(
        'SELECT id FROM free_plan_claims WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      if (lockedClaim.length > 0) {
        throw new Error('Anda sudah pernah mengklaim program Free Plan. Setiap akun hanya berhak 1 kali klaim seumur hidup.');
      }

      // 2. Lock domain in domain_reservations / domains
      const [domainConflict] = await conn.query(
        'SELECT id FROM domains WHERE domain = ? FOR UPDATE',
        [fullDomain]
      );
      if (domainConflict.length > 0) {
        throw new Error(`Domain ${fullDomain} baru saja didaftarkan oleh pengguna lain.`);
      }

      // 3. Generate Codes
      const serviceCode = generateServiceCode();
      const orderNumber = generateOrderNumber();
      const invoiceNumber = generateInvoiceNumber();

      // 4. Create Order record for Free Plan (status: paid, price: 0.00)
      const [orderInsert] = await conn.query(
        `INSERT INTO orders 
         (order_number, user_id, plan_id, domain, domain_type, plan_name_snapshot, price_snapshot, period_snapshot, type, status, customer_notes)
         VALUES (?, ?, ?, ?, 'new', ?, 0.00, '14 Hari', 'new', 'paid', 'Klaim Program Free Plan 1sLabs')`,
        [orderNumber, userId, freePlan.id, fullDomain, freePlan.name || 'Free Hosting']
      );
      const orderId = orderInsert.insertId;

      // 5. Insert into hosting_services (14 days validity)
      const [serviceInsert] = await conn.query(
        `INSERT INTO hosting_services 
         (service_code, user_id, plan_id, order_id, domain, domain_type, status, server_ip, nameservers, activated_at, expires_at)
         VALUES (?, ?, ?, ?, ?, 'new', 'active', '103.119.237.132', 'ns1.domainmurah.net, ns2.domainmurah.net', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))`,
        [serviceCode, userId, freePlan.id, orderId, fullDomain]
      );
      const serviceId = serviceInsert.insertId;

      // 6. Update order with related_service_id
      await conn.query(
        'UPDATE orders SET related_service_id = ? WHERE id = ?',
        [serviceId, orderId]
      );

      // 7. Create Invoice for record keeping (0.00 IDR paid)
      await conn.query(
        `INSERT INTO invoices 
         (invoice_number, order_id, user_id, service_id, amount, subtotal, discount_amount, tax_amount, status, invoice_type, plan_name, domain, period, billing_start_date, billing_end_date, paid_at, notes)
         VALUES (?, ?, ?, ?, 0.00, 0.00, 0.00, 0.00, 'paid', 'hosting_order', ?, ?, '14 Hari', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), NOW(), 'Klaim Free Plan - 100% Promo')`,
        [invoiceNumber, orderId, userId, serviceId, freePlan.name || 'Free Hosting', fullDomain]
      );

      // 8. Insert into domains (1 month validity for free subdomain trial)
      const [domainInsert] = await conn.query(
        `INSERT INTO domains 
         (user_id, service_id, domain, domain_type, root_domain, subdomain_prefix, document_root, status, is_free_plan, ssl_status, dns_status, registered_at, expires_at)
         VALUES (?, ?, ?, 'free_subdomain', '1slabs.my.id', ?, ?, 'active', 1, 'pending', 'connected', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
        [userId, serviceId, fullDomain, subdomain, docroot]
      );
      const domainId = domainInsert.insertId;

      // 9. Insert into free_plan_claims (hosting 14 days, domain 1 month)
      const [claimInsert] = await conn.query(
        `INSERT INTO free_plan_claims
         (user_id, subdomain, domain, service_id, order_id, claimed_at, hosting_expires_at, domain_expires_at, status, provisioning_status)
         VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', 'active')`,
        [userId, subdomain, fullDomain, serviceId, orderId]
      );
      const claimId = claimInsert.insertId;

      // 10. Insert service_events
      await conn.query(
        `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
         VALUES (?, 'service_created', 'Free Plan Diaktifkan', ?, 'customer', ?)`,
        [
          serviceId,
          `Klaim Free Plan berhasil. Subdomain ${fullDomain} aktif (1 tahun) dan Cloud Hosting aktif (14 hari). Order: ${orderNumber}.`,
          userId
        ]
      );

      return {
        claimId,
        orderId,
        orderNumber,
        serviceId,
        serviceCode,
        domainId,
        subdomain,
        fullDomain,
        docroot
      };
    });

    // 8. Provision cPanel Subdomain outside transaction (so DB lock isn't held during external exec)
    try {
      await subdomainService.addSubdomain(subdomain, '1slabs.my.id', `public_html/${fullDomain}`);
      console.log(`[FreePlan Provision] cPanel Subdomain created: ${fullDomain}`);
    } catch (cpErr) {
      console.error(`[FreePlan Provision Error] Failed to create cPanel subdomain ${fullDomain}:`, cpErr.message);
      // We log but don't fail user if it already exists or can be salvaged
    }

    // 9. Scaffold directory with template
    scaffoldSubdomainDirectory(docroot, subdomain, fullDomain);

    // 10. Log activity
    await logActivity({
      actorId: userId,
      actorName: user.name,
      actorRole: 'customer',
      action: 'free_plan_claimed',
      target: fullDomain,
      details: {
        domain: fullDomain,
        subdomain,
        serviceCode: result.serviceCode,
        orderNumber: result.orderNumber
      }
    });

    // 11. Send notification email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Selamat, Free Plan Anda Telah Aktif! 🎉</h2>
          <p style="color: #52525b; font-size: 15px;">Halo <strong>${user.name}</strong>,</p>
          <p style="color: #52525b; font-size: 15px;">Selamat! Pendaftaran program Free Plan 1sLabs Anda telah berhasil diproses.</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Nama Domain:</strong> https://${fullDomain}</p>
            <p style="margin: 4px 0;"><strong>Kode Layanan:</strong> ${result.serviceCode}</p>
            <p style="margin: 4px 0;"><strong>Masa Aktif Hosting:</strong> 14 Hari</p>
            <p style="margin: 4px 0;"><strong>Masa Aktif Domain:</strong> 1 Tahun</p>
          </div>
          <p style="color: #52525b; font-size: 14px;">Anda sekarang dapat mengelola website frontend dan membuat Node.js API langsung melalui dashboard 1sLabs.</p>
          <a href="https://demo.1slabs.my.id/portal" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Buka Dashboard Hosting</a>
        </div>
      `;
      await sendEmail({
        to: user.email,
        subject: `[1sLabs] Free Plan Aktif - https://${fullDomain}`,
        html: emailHtml
      });
    } catch (mailErr) {
      console.warn('[FreePlan Email Notice]:', mailErr.message);
    }

    return {
      success: true,
      message: `Selamat! Subdomain https://${fullDomain} dan hosting gratis 14 hari telah aktif.`,
      data: {
        domain: fullDomain,
        subdomain,
        serviceCode: result.serviceCode,
        docroot,
        hosting_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        domain_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }
};

module.exports = FreePlanService;

