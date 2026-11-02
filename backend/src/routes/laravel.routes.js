const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { laravelService } = require('../services/laravel.service');
const { logActivity } = require('../utils/activityLogger');

const HOME_DIR = '/home/u1zh8984';

// Multer storage for ZIP deployments in tmp
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(HOME_DIR, 'tmp', 'laravel_deployments');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const unique = `laravel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.zip`;
    cb(null, unique);
  }
});

const uploadZip = multer({
  storage: uploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file arsip .zip yang diperbolehkan.'));
    }
  }
});

// GET /laravel/versions - Available PHP versions
router.get('/versions', requireAuth, async (req, res) => {
  return res.json({
    success: true,
    versions: laravelService.getPhpVersions(),
    default: '8.2'
  });
});

// GET /laravel/apps - List user applications
router.get('/apps', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    let sql = `
      SELECT l.*, d.domain_type, d.document_root, u.name as owner_name, u.email as owner_email
      FROM laravel_applications l
      LEFT JOIN domains d ON l.domain_id = d.id OR l.domain = d.domain
      LEFT JOIN users u ON l.user_id = u.id
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' WHERE l.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY l.created_at DESC';

    const apps = await query(sql, params);

    return res.json({
      success: true,
      applications: apps
    });
  } catch (err) {
    console.error('List laravel apps error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar aplikasi Laravel.'
    });
  }
});

// GET /laravel/occupied-endpoints - List all endpoints used by Node.js & Laravel across user domains
router.get('/occupied-endpoints', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    const nodeApps = await query(
      'SELECT id, app_name, domain, app_uri, app_url, "nodejs" as platform, status FROM nodejs_applications WHERE (user_id = ? OR ? = 1)',
      [req.user.id, isUserAdmin ? 1 : 0]
    );
    const laravelApps = await query(
      'SELECT id, app_name, domain, app_uri, app_url, "laravel" as platform, status FROM laravel_applications WHERE (user_id = ? OR ? = 1)',
      [req.user.id, isUserAdmin ? 1 : 0]
    );

    return res.json({
      success: true,
      endpoints: [...nodeApps, ...laravelApps]
    });
  } catch (err) {
    console.error('List occupied endpoints error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar endpoint backend.' });
  }
});

// GET /laravel/apps/:id - Application detail
router.get('/apps/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT l.*, d.domain_type, d.document_root, u.name as owner_name, u.email as owner_email
      FROM laravel_applications l
      LEFT JOIN domains d ON l.domain_id = d.id OR l.domain = d.domain
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `;
    const params = [id];

    if (!isUserAdmin) {
      sql += ' AND l.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplikasi Laravel tidak ditemukan.'
      });
    }

    const app = rows[0];

    // Fetch deployment history
    const deployments = await query(
      'SELECT id, deployment_number, source_type, status, file_size_bytes, deployed_at FROM laravel_deployments WHERE app_id = ? ORDER BY id DESC LIMIT 10',
      [app.id]
    );

    return res.json({
      success: true,
      application: {
        ...app,
        deployments
      }
    });
  } catch (err) {
    console.error('Laravel app detail error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail aplikasi Laravel.'
    });
  }
});

// POST /laravel/apps - Create new Laravel application
router.post('/apps', requireAuth, async (req, res) => {
  try {
    const {
      app_name,
      domain,
      app_uri = 'api',
      php_version = '8.2',
      app_mode = 'production',
      env_vars = {}
    } = req.body;

    if (!app_name || !domain) {
      return res.status(400).json({
        success: false,
        message: 'Nama aplikasi dan domain tujuan wajib diisi.'
      });
    }

    const safeAppName = app_name.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
    if (!safeAppName) {
      return res.status(400).json({
        success: false,
        message: 'Nama aplikasi hanya boleh berisi huruf, angka, tanda hubung, atau garis bawah.'
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    const cleanUri = app_uri ? app_uri.trim().replace(/^\/+|\/+$/g, '') : '';

    // Verify domain ownership
    const domainCheck = await query(
      'SELECT id, user_id, document_root FROM domains WHERE domain = ? AND (user_id = ? OR ? = 1) LIMIT 1',
      [cleanDomain, req.user.id, req.user.role === 'admin' ? 1 : 0]
    );

    if (domainCheck.length === 0) {
      const svcCheck = await query(
        'SELECT id, user_id FROM hosting_services WHERE domain = ? AND (user_id = ? OR ? = 1) LIMIT 1',
        [cleanDomain, req.user.id, req.user.role === 'admin' ? 1 : 0]
      );
      if (svcCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Domain ${cleanDomain} tidak terdaftar pada akun Anda.`
        });
      }
    }

    const domainId = domainCheck[0]?.id || null;
    const appRootRel = `apps/u${req.user.id}_${safeAppName}`;
    const fullAppRoot = path.join(HOME_DIR, appRootRel);

    const [existingLaravelApp] = await query(
      'SELECT id, app_name FROM laravel_applications WHERE (domain = ? AND app_uri = ?) OR app_root = ? LIMIT 1',
      [cleanDomain, cleanUri, appRootRel]
    );

    const [existingNodeApp] = await query(
      'SELECT id, app_name FROM nodejs_applications WHERE (domain = ? AND app_uri = ?) OR app_root = ? LIMIT 1',
      [cleanDomain, cleanUri, appRootRel]
    );

    if (existingLaravelApp) {
      return res.status(409).json({
        success: false,
        message: `Endpoint '/${cleanUri}' pada domain '${cleanDomain}' sudah digunakan oleh aplikasi Laravel '${existingLaravelApp.app_name}'.`
      });
    }

    if (existingNodeApp) {
      return res.status(409).json({
        success: false,
        message: `Endpoint '/${cleanUri}' pada domain '${cleanDomain}' sudah digunakan oleh aplikasi Node.js '${existingNodeApp.app_name}'. Silakan gunakan URI path lain (contoh: 'api-v2' atau 'laravel-api').`
      });
    }

    // 1. Scaffold directory & starter files
    await laravelService.createApplication({
      appRoot: appRootRel,
      domain: cleanDomain,
      appUri: cleanUri,
      envVars,
      userId: req.user.id
    });

    const appUrl = `https://${cleanDomain}${cleanUri ? '/' + cleanUri : ''}`;

    // 2. Save into database
    const insertRes = await query(
      `INSERT INTO laravel_applications
       (user_id, domain_id, app_name, app_root, full_app_root, app_uri, domain, app_url, php_version, app_mode, status, health_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', 'healthy')`,
      [
        req.user.id,
        domainId,
        safeAppName,
        appRootRel,
        fullAppRoot,
        cleanUri,
        cleanDomain,
        appUrl,
        php_version,
        app_mode
      ]
    );

    const appId = insertRes.insertId;

    await query(
      `INSERT INTO laravel_deployments (app_id, user_id, deployment_number, source_type, status, logs)
       VALUES (?, ?, 1, 'initial_scaffold', 'success', 'Laravel scaffold created and linked to domain.')`,
      [appId, req.user.id]
    );

    await logActivity({
      userId: req.user.id,
      action: 'laravel_app_created',
      entityType: 'application',
      entityId: appId,
      details: { appName: safeAppName, domain: cleanDomain, appUrl }
    });

    return res.json({
      success: true,
      message: `Aplikasi Laravel '${safeAppName}' berhasil dibuat dan terhubung ke ${appUrl}!`,
      application: {
        id: appId,
        app_name: safeAppName,
        domain: cleanDomain,
        app_url: appUrl,
        php_version,
        status: 'running'
      }
    });
  } catch (err) {
    console.error('Create Laravel app error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal membuat aplikasi Laravel.'
    });
  }
});

// POST /laravel/apps/:id/deploy - Deploy ZIP file
router.post('/apps/:id/deploy', requireAuth, uploadZip.single('zipFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File ZIP wajib diunggah.' });
    }

    const app = apps[0];
    const zipPath = req.file.path;
    const fileSize = req.file.size;

    console.log(`[Laravel Deploy] Unpacking ${req.file.originalname} (${fileSize} bytes) into ${app.app_root}`);

    const deployResult = await laravelService.deployZip(app.app_root, zipPath);

    const nextDeploymentNum = (app.deployment_count || 0) + 1;

    await query(
      `INSERT INTO laravel_deployments (app_id, user_id, deployment_number, source_type, status, file_size_bytes, logs)
       VALUES (?, ?, ?, 'zip_upload', 'success', ?, ?)`,
      [app.id, req.user.id, nextDeploymentNum, fileSize, deployResult.logs]
    );

    await query(
      'UPDATE laravel_applications SET deployment_count = ?, last_restart_at = NOW(), status = "running" WHERE id = ?',
      [nextDeploymentNum, app.id]
    );

    await logActivity({
      userId: req.user.id,
      action: 'laravel_app_deployed',
      entityType: 'application',
      entityId: app.id,
      details: { appName: app.app_name, deploymentNumber: nextDeploymentNum, fileSize }
    });

    return res.json({
      success: true,
      message: `Source code Laravel berhasil di-deploy (Deployment #${nextDeploymentNum})!`,
      deployment: {
        number: nextDeploymentNum,
        fileSize,
        logs: deployResult.logs
      }
    });
  } catch (err) {
    console.error('Laravel ZIP deploy error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal memproses deploy file ZIP.'
    });
  }
});

// POST /laravel/apps/:id/artisan - Run Artisan Command
router.post('/apps/:id/artisan', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;
    const isUserAdmin = req.user.role === 'admin';

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ success: false, message: 'Perintah artisan wajib diisi.' });
    }

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const cleanCmd = command.trim();

    // Block destructive commands
    const destructive = ['migrate:fresh', 'migrate:reset', 'db:wipe'];
    for (const d of destructive) {
      if (cleanCmd.includes(d)) {
        return res.status(400).json({
          success: false,
          message: `Perintah '${d}' dinonaktifkan demi keselamatan integritas database.`
        });
      }
    }

    const result = await laravelService.runArtisan(app.app_root, cleanCmd);

    return res.json({
      success: true,
      command: `php artisan ${cleanCmd}`,
      output: result.stdout || '(Tidak ada output)',
      error: result.stderr || null
    });
  } catch (err) {
    console.error('Run artisan error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menjalankan perintah artisan.'
    });
  }
});

// GET /laravel/apps/:id/env - Get .env content
router.get('/apps/:id/env', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const envContent = await laravelService.getEnv(app.app_root);

    return res.json({
      success: true,
      content: envContent
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat file konfigurasi .env.' });
  }
});

// PUT /laravel/apps/:id/env - Save .env content
router.put('/apps/:id/env', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    await laravelService.saveEnv(app.app_root, content || '');

    return res.json({
      success: true,
      message: 'Konfigurasi .env berhasil disimpan dan cache konfigurasi dibersihkan.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan file konfigurasi .env.' });
  }
});

// GET /laravel/apps/:id/logs - Get application logs
router.get('/apps/:id/logs', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const logs = await laravelService.getLogs(app.app_root, 150);

    return res.json({
      success: true,
      logs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat log aplikasi.' });
  }
});

// POST /laravel/apps/:id/health-check - Check HTTP health
router.post('/apps/:id/health-check', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const checkUrl = app.app_url;
    const health = await laravelService.checkHealth(checkUrl);

    const healthStatus = health.healthy ? 'healthy' : 'unhealthy';

    await query(
      `UPDATE laravel_applications
       SET health_status = ?, last_health_check = NOW(), last_response_time_ms = ?, last_http_status = ?, last_error = ?
       WHERE id = ?`,
      [
        healthStatus,
        health.responseTimeMs || null,
        health.status || null,
        health.healthy ? null : (health.statusText || 'Gagal terhubung'),
        app.id
      ]
    );

    return res.json({
      success: true,
      health: {
        ...health,
        url: checkUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memeriksa kesehatan aplikasi.' });
  }
});

// DELETE /laravel/apps/:id - Delete application
router.delete('/apps/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];

    // Remove symlinks in domain docroot
    const docroot = path.join(HOME_DIR, 'public_html', app.domain);
    if (app.app_uri) {
      const symlinkPath = path.join(docroot, app.app_uri);
      try {
        if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink()) {
          fs.unlinkSync(symlinkPath);
        }
      } catch (e) {}
    }

    await query('DELETE FROM laravel_deployments WHERE app_id = ?', [app.id]);
    await query('DELETE FROM laravel_applications WHERE id = ?', [app.id]);

    await logActivity({
      userId: req.user.id,
      action: 'laravel_app_deleted',
      entityType: 'application',
      entityId: app.id,
      details: { appName: app.app_name, domain: app.domain }
    });

    return res.json({
      success: true,
      message: `Aplikasi Laravel '${app.app_name}' berhasil dihapus.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus aplikasi Laravel.' });
  }
});

// ==========================================
// FILE MANAGER & PROCESS CONTROL FOR LARAVEL
// ==========================================

const laravelUploadTempDir = path.join(HOME_DIR, 'tmp', 'laravel_file_uploads');
if (!fs.existsSync(laravelUploadTempDir)) {
  try { fs.mkdirSync(laravelUploadTempDir, { recursive: true }); } catch (e) {}
}

const laravelFileUpload = multer({
  dest: laravelUploadTempDir,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

function getAppRootPath(app) {
  return app.full_app_root || path.join(HOME_DIR, app.app_root);
}

function resolveLaravelAppPath(fullAppRoot, userPath) {
  const normalizedRoot = path.resolve(fullAppRoot);
  const cleanRel = (userPath || '').replace(/^[\\\/]+/, '').replace(/\0/g, '');
  const resolved = path.resolve(normalizedRoot, cleanRel);
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error('Akses path di luar direktori aplikasi ditolak.');
  }
  return resolved;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getLaravelDirectorySize(dirPath) {
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item === 'vendor' || item === 'node_modules') continue;
      const full = path.join(dirPath, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        total += getLaravelDirectorySize(full);
      } else {
        total += stat.size;
      }
    }
  } catch (e) {}
  return total;
}

// POST /laravel/apps/:id/action - Start, stop, restart (clear cache)
router.post('/apps/:id/action', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    if (action === 'restart') {
      try {
        await laravelService.runArtisan(app.app_root, 'optimize:clear');
      } catch (e) {}
      await query('UPDATE laravel_applications SET status = "running", updated_at = NOW() WHERE id = ?', [app.id]);
      return res.json({ success: true, message: 'Cache aplikasi Laravel berhasil dibersihkan dan di-refresh!' });
    } else if (action === 'stop') {
      try {
        await laravelService.runArtisan(app.app_root, 'down');
      } catch (e) {}
      await query('UPDATE laravel_applications SET status = "stopped", updated_at = NOW() WHERE id = ?', [app.id]);
      return res.json({ success: true, message: 'Aplikasi Laravel dialihkan ke mode Maintenance (Stop).' });
    } else if (action === 'start') {
      try {
        await laravelService.runArtisan(app.app_root, 'up');
      } catch (e) {}
      await query('UPDATE laravel_applications SET status = "running", updated_at = NOW() WHERE id = ?', [app.id]);
      return res.json({ success: true, message: 'Aplikasi Laravel kembali Aktif (Running).' });
    } else {
      return res.status(400).json({ success: false, message: 'Aksi tidak dikenal. Gunakan start, stop, atau restart.' });
    }
  } catch (err) {
    console.error('Laravel action error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal memproses aksi aplikasi.' });
  }
});

// POST /laravel/apps/:id/composer-install - Run Composer Install
router.post('/apps/:id/composer-install', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const resComposer = await laravelService.runComposer(app.app_root, 'install --no-dev --optimize-autoloader --no-interaction');
    return res.json({
      success: true,
      message: 'Composer install berhasil diselesaikan.',
      output: resComposer.stdout || resComposer.stderr || 'Composer dependencies up to date.'
    });
  } catch (err) {
    console.error('Composer install error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menjalankan composer install.' });
  }
});

// GET /laravel/apps/:id/files - List files and directories
router.get('/apps/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    const userPath = req.query.path || '/';
    const safePath = resolveLaravelAppPath(fullAppRoot, userPath);

    if (!fs.existsSync(safePath) || !fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'Direktori tidak ditemukan.' });
    }

    const dirents = fs.readdirSync(safePath, { withFileTypes: true });
    const items = dirents.map(d => {
      const fullItemPath = path.join(safePath, d.name);
      try {
        const stat = fs.statSync(fullItemPath);
        const isDir = d.isDirectory();
        return {
          name: d.name,
          isDirectory: isDir,
          size: isDir ? 0 : stat.size,
          sizeFormatted: isDir ? '-' : formatBytes(stat.size),
          extension: isDir ? null : path.extname(d.name).toLowerCase().replace('.', ''),
          mtime: stat.mtime.toISOString(),
          mode: (stat.mode & 0o777).toString(8)
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    const relToRoot = path.relative(fullAppRoot, safePath).replace(/\\/g, '/');
    const cleanRelPath = relToRoot === '' ? '/' : '/' + relToRoot;
    const totalBytes = getLaravelDirectorySize(fullAppRoot);

    return res.json({
      success: true,
      currentPath: cleanRelPath,
      items,
      totalUsageBytes: totalBytes,
      totalUsageFormatted: formatBytes(totalBytes)
    });
  } catch (err) {
    console.error('List laravel files error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal memuat file aplikasi Laravel.' });
  }
});

// GET /laravel/apps/:id/files/read - Read text file content
router.get('/apps/:id/files/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    const targetFile = req.query.path;
    if (!targetFile) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveLaravelAppPath(fullAppRoot, targetFile);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    const stat = fs.statSync(safePath);
    if (stat.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar untuk editor browser (maks 2MB). Silakan unduh file untuk mengedit.'
      });
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    const relToRoot = '/' + path.relative(fullAppRoot, safePath).replace(/\\/g, '/');

    return res.json({
      success: true,
      path: relToRoot,
      name: path.basename(safePath),
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      content
    });
  } catch (err) {
    console.error('Read laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membaca isi file.' });
  }
});

// POST /laravel/apps/:id/files/write - Save file content from editor
router.post('/apps/:id/files/write', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: userPath, content, restart = false } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!userPath) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveLaravelAppPath(fullAppRoot, userPath);
    fs.writeFileSync(safePath, content ?? '', 'utf-8');

    if (restart) {
      try {
        await laravelService.runArtisan(app.app_root, 'optimize:clear');
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: restart ? 'File berhasil disimpan dan cache Laravel dibersihkan.' : 'File berhasil disimpan.'
    });
  } catch (err) {
    console.error('Write laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan file.' });
  }
});

// POST /laravel/apps/:id/files/create-file - Create new file
router.post('/apps/:id/files/create-file', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: parentPath = '/', name, content = '' } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Nama file wajib diisi.' });
    }

    const safeParent = resolveLaravelAppPath(fullAppRoot, parentPath);
    const safeTarget = path.join(safeParent, name.trim());
    if (fs.existsSync(safeTarget)) {
      return res.status(409).json({ success: false, message: 'File atau folder dengan nama tersebut sudah ada.' });
    }

    fs.writeFileSync(safeTarget, content, 'utf-8');

    return res.json({
      success: true,
      message: `File '${name}' berhasil dibuat.`
    });
  } catch (err) {
    console.error('Create laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat file.' });
  }
});

// POST /laravel/apps/:id/files/create-folder - Create new folder
router.post('/apps/:id/files/create-folder', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: parentPath = '/', name } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Nama folder wajib diisi.' });
    }

    const safeParent = resolveLaravelAppPath(fullAppRoot, parentPath);
    const safeTarget = path.join(safeParent, name.trim());
    if (fs.existsSync(safeTarget)) {
      return res.status(409).json({ success: false, message: 'File atau folder dengan nama tersebut sudah ada.' });
    }

    fs.mkdirSync(safeTarget, { recursive: true, mode: 0o755 });

    return res.json({
      success: true,
      message: `Folder '${name}' berhasil dibuat.`
    });
  } catch (err) {
    console.error('Create laravel folder error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat folder.' });
  }
});

// POST /laravel/apps/:id/files/upload - Upload files
router.post('/apps/:id/files/upload', requireAuth, (req, res) => {
  laravelFileUpload.array('files', 50)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { id } = req.params;
      const targetRel = req.body.path || req.query.path || '/';
      const isUserAdmin = req.user.role === 'admin';
      const apps = await query(
        'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
        [id, req.user.id, isUserAdmin ? 1 : 0]
      );

      if (apps.length === 0) {
        if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
        return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
      }

      const app = apps[0];
      const fullAppRoot = getAppRootPath(app);
      const targetDir = resolveLaravelAppPath(fullAppRoot, targetRel);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
      }

      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
      }

      for (const f of files) {
        const originalName = f.originalname;
        const dest = path.join(targetDir, originalName);
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true, mode: 0o755 });
        fs.copyFileSync(f.path, dest);
        try { fs.unlinkSync(f.path); } catch (_) {}
      }

      return res.json({
        success: true,
        message: `${files.length} file berhasil diunggah ke ${targetRel}.`
      });
    } catch (uploadErr) {
      console.error('Laravel app upload error:', uploadErr);
      return res.status(500).json({ success: false, message: uploadErr.message || 'Gagal mengunggah file.' });
    }
  });
});

// DELETE /laravel/apps/:id/files - Delete file or folder
router.delete('/apps/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: targetRel } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!targetRel || targetRel === '/' || targetRel.trim() === '') {
      return res.status(400).json({ success: false, message: 'Root direktori aplikasi tidak dapat dihapus.' });
    }

    const safePath = resolveLaravelAppPath(fullAppRoot, targetRel);
    if (safePath === path.resolve(fullAppRoot)) {
      return res.status(400).json({ success: false, message: 'Root direktori aplikasi tidak dapat dihapus.' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ success: false, message: 'File atau folder tidak ditemukan.' });
    }

    fs.rmSync(safePath, { recursive: true, force: true });

    return res.json({
      success: true,
      message: 'Item berhasil dihapus.'
    });
  } catch (err) {
    console.error('Delete laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus item.' });
  }
});

// POST /laravel/apps/:id/files/rename - Rename file or folder
router.post('/apps/:id/files/rename', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPath, newPath } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, message: 'Path lama dan baru wajib diisi.' });
    }

    const safeOld = resolveLaravelAppPath(fullAppRoot, oldPath);
    const safeNew = resolveLaravelAppPath(fullAppRoot, newPath);

    if (!fs.existsSync(safeOld)) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });
    }
    if (fs.existsSync(safeNew)) {
      return res.status(409).json({ success: false, message: 'Item dengan nama baru sudah ada.' });
    }

    fs.renameSync(safeOld, safeNew);

    return res.json({
      success: true,
      message: 'Item berhasil diubah namanya.'
    });
  } catch (err) {
    console.error('Rename laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengubah nama item.' });
  }
});

// GET /laravel/apps/:id/files/download - Download file
router.get('/apps/:id/files/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userPath = req.query.path;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM laravel_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Laravel tidak ditemukan.' });
    }

    const app = apps[0];
    const fullAppRoot = getAppRootPath(app);
    if (!userPath) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveLaravelAppPath(fullAppRoot, userPath);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    return res.download(safePath, path.basename(safePath));
  } catch (err) {
    console.error('Download laravel file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengunduh file.' });
  }
});

module.exports = router;

