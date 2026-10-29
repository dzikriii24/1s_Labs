const path = require('path');
const fs = require('fs');

// Base directory for cPanel public_html virtual host document roots
// On server: /home/u1zh8984/public_html
// On local/dev fallback: <backend>/storage/public_html
const PUBLIC_HTML_BASE = process.env.PUBLIC_HTML_BASE ||
  (fs.existsSync('/home/u1zh8984/public_html')
    ? '/home/u1zh8984/public_html'
    : path.join(__dirname, '../../storage/public_html'));

// Legacy fallback directory
const CUSTOMERS_BASE_DIR = process.env.CUSTOMERS_BASE_DIR ||
  (fs.existsSync('/home/u1zh8984/customers')
    ? '/home/u1zh8984/customers'
    : path.join(__dirname, '../../storage/customers'));

// Service to domain in-memory cache
const serviceDomainCache = new Map();

/**
 * Get canonical root directory for a given service code and optional domain.
 * When domain is configured (e.g. kimholidaytravel.id), matches cPanel Document Root:
 * /home/u1zh8984/public_html/{domain}
 *
 * @param {string} serviceCode e.g. "SRV-2026-179F76"
 * @param {string} [domain] e.g. "kimholidaytravel.id"
 * @returns {string} Absolute normalized path
 */
function getServiceRoot(serviceCode, domain = null) {
  if (!serviceCode || typeof serviceCode !== 'string' || !/^[A-Za-z0-9_-]+$/.test(serviceCode)) {
    throw new Error('Kode layanan hosting tidak valid.');
  }

  // Use passed domain or cached domain
  let activeDomain = domain;
  if (!activeDomain && serviceDomainCache.has(serviceCode)) {
    activeDomain = serviceDomainCache.get(serviceCode);
  }

  const cleanDomain = activeDomain && typeof activeDomain === 'string' &&
    activeDomain.trim() !== '' &&
    activeDomain.trim() !== 'website-anda.com' &&
    /^[a-zA-Z0-9.-]+$/.test(activeDomain.trim())
      ? activeDomain.trim().toLowerCase()
      : null;

  if (cleanDomain) {
    serviceDomainCache.set(serviceCode, cleanDomain);
    // Standard cPanel Document Root: /public_html/{domain}
    return path.resolve(PUBLIC_HTML_BASE, cleanDomain);
  }

  // If no domain yet, check if legacy folder exists
  const legacyDir = path.resolve(CUSTOMERS_BASE_DIR, serviceCode, 'public_html');
  if (fs.existsSync(legacyDir)) {
    return legacyDir;
  }

  // Default to public_html/{serviceCode}
  return path.resolve(PUBLIC_HTML_BASE, serviceCode);
}

/**
 * Ensure customer root directory exists and initialize default welcome files if empty.
 * Also seamlessly migrates any files from legacy customer folder if available.
 * @param {string} serviceCode
 * @param {string} [domain]
 */
function ensureServiceRoot(serviceCode, domain = 'website-anda.com') {
  const root = getServiceRoot(serviceCode, domain);
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true, mode: 0o755 });
  }

  // Migrate files from legacy /home/u1zh8984/customers/{serviceCode}/public_html if present
  const legacyDir = path.resolve(CUSTOMERS_BASE_DIR, serviceCode, 'public_html');
  if (fs.existsSync(legacyDir) && path.resolve(legacyDir) !== path.resolve(root)) {
    try {
      const legacyItems = fs.readdirSync(legacyDir);
      for (const item of legacyItems) {
        const srcPath = path.join(legacyDir, item);
        const destPath = path.join(root, item);
        if (!fs.existsSync(destPath)) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        }
      }
    } catch (migErr) {
      console.warn('[fileSandbox] Notice during legacy migration:', migErr.message);
    }
  }

  // Check if directory is empty or only has system cgi-bin
  try {
    const files = fs.readdirSync(root).filter(f => f !== 'cgi-bin');
    if (files.length === 0) {
      const displayDomain = (domain && domain !== 'website-anda.com') ? domain : `${serviceCode}.1slabs.my.id`;
      const welcomeHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang di 1sLabs Hosting - ${displayDomain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 580px;
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      margin-bottom: 20px;
    }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 12px; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .domain-box {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 14px;
      font-family: monospace;
      font-size: 14px;
      color: #38bdf8;
      margin-bottom: 24px;
    }
    .footer { font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● Layanan Hosting Aktif</div>
    <h1>Website Anda Siap Digunakan!</h1>
    <p>Ruang web hosting untuk domain Anda telah berhasil dikonfigurasi. Silakan unggah file website Anda melalui <strong>File Manager</strong> di Portal Pelanggan 1sLabs atau via <strong>FTP</strong>.</p>
    <div class="domain-box">${displayDomain}</div>
    <div class="footer">Ditenagai oleh 1sLabs High-Performance Cloud Hosting</div>
  </div>
</body>
</html>`;
      fs.writeFileSync(path.join(root, 'index.html'), welcomeHtml, 'utf8');
    }
  } catch (err) {
    console.warn('[fileSandbox] ensureServiceRoot welcome file error:', err.message);
  }

  return root;
}

/**
 * Resolve and validate that a relative file path stays strictly within the customer root.
 * Protects against ../ traversal, symlink escapes, and null byte injection.
 * @param {string} serviceCode
 * @param {string} relativePath
 * @param {string} [domain]
 * @returns {string} Safe absolute path
 */
function resolveSafePath(serviceCode, relativePath = '', domain = null) {
  const root = getServiceRoot(serviceCode, domain);

  // Reject null bytes
  if (relativePath.indexOf('\0') !== -1) {
    throw new Error('Karakter tidak aman terdeteksi dalam path.');
  }

  // Normalize and resolve path
  const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.resolve(root, normalized.replace(/^[\/\\]+/, ''));

  // Strict boundary check: absolutePath must start with root
  if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
    throw new Error('Akses ditolak: Percobaan path traversal di luar direktori hosting Anda.');
  }

  // Symlink escape check: if file or parent exists, verify realpath
  if (fs.existsSync(absolutePath)) {
    const real = fs.realpathSync(absolutePath);
    if (real !== root && !real.startsWith(root + path.sep)) {
      throw new Error('Akses ditolak: Symlink escape terdeteksi.');
    }
  }

  return absolutePath;
}

/**
 * Rename or migrate document root when domain is updated.
 * Moves /public_html/{oldDomain} -> /public_html/{newDomain}
 * @param {string} serviceCode
 * @param {string} oldDomain
 * @param {string} newDomain
 */
function renameServiceDomainRoot(serviceCode, oldDomain, newDomain) {
  if (!newDomain) return;
  const cleanNew = newDomain.trim().toLowerCase();
  serviceDomainCache.set(serviceCode, cleanNew);

  const newPath = path.resolve(PUBLIC_HTML_BASE, cleanNew);

  if (oldDomain && oldDomain.trim() !== '') {
    const cleanOld = oldDomain.trim().toLowerCase();
    const oldPath = path.resolve(PUBLIC_HTML_BASE, cleanOld);

    if (fs.existsSync(oldPath) && oldPath !== newPath) {
      if (!fs.existsSync(newPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          return newPath;
        } catch (renameErr) {
          try {
            fs.cpSync(oldPath, newPath, { recursive: true });
            return newPath;
          } catch (cpErr) {
            console.warn('[fileSandbox] Copy error during domain rename:', cpErr.message);
          }
        }
      }
    }
  }

  // Ensure new folder exists
  ensureServiceRoot(serviceCode, cleanNew);
  return newPath;
}

module.exports = {
  PUBLIC_HTML_BASE,
  CUSTOMERS_BASE_DIR,
  getServiceRoot,
  ensureServiceRoot,
  renameServiceDomainRoot,
  resolveSafePath
};
