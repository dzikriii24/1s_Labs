const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const multer = require('multer');
const { query, withTransaction } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { nodejsService } = require('../services/cpanel.service');
const { logActivity } = require('../utils/activityLogger');

const HOME_DIR = '/home/u1zh8984';

// Multer storage for ZIP deployments in tmp
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(HOME_DIR, 'tmp', 'deployments');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.zip`;
    cb(null, unique);
  }
});

const uploadZip = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file arsip .zip yang diperbolehkan.'));
    }
  }
});

// GET /nodejs/versions - Available Node.js versions
router.get('/versions', requireAuth, async (req, res) => {
  try {
    const versions = await nodejsService.getAvailableVersions();
    return res.json({
      success: true,
      versions,
      default: '22.23.4'
    });
  } catch (err) {
    console.error('Get nodejs versions error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar versi Node.js.'
    });
  }
});

// GET /nodejs/apps - List user applications
router.get('/apps', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    let sql = `
      SELECT n.*, d.domain_type, d.document_root, u.name as owner_name, u.email as owner_email
      FROM nodejs_applications n
      LEFT JOIN domains d ON n.domain_id = d.id OR n.domain = d.domain
      LEFT JOIN users u ON n.user_id = u.id
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' WHERE n.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY n.created_at DESC';

    const apps = await query(sql, params);

    // Format env vars to masked representation for security
    const formatted = apps.map(app => {
      let envCount = 0;
      if (app.env_vars_encrypted) {
        try {
          const parsed = JSON.parse(app.env_vars_encrypted);
          envCount = Object.keys(parsed).length;
        } catch (e) {}
      }

      return {
        ...app,
        env_vars_encrypted: undefined, // Never expose raw encrypted/plain to list
        env_vars_count: envCount
      };
    });

    return res.json({
      success: true,
      applications: formatted
    });
  } catch (err) {
    console.error('List nodejs apps error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar aplikasi Node.js.'
    });
  }
});

// GET /nodejs/apps/:id - Application detail
router.get('/apps/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT n.*, d.domain_type, d.document_root, u.name as owner_name, u.email as owner_email
      FROM nodejs_applications n
      LEFT JOIN domains d ON n.domain_id = d.id OR n.domain = d.domain
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `;
    const params = [id];

    if (!isUserAdmin) {
      sql += ' AND n.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplikasi Node.js tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    const app = rows[0];

    // Fetch deployment history
    const deployments = await query(
      'SELECT id, deployment_number, source_type, status, file_size_bytes, deployed_at FROM nodejs_deployments WHERE app_id = ? ORDER BY id DESC LIMIT 10',
      [app.id]
    );

    // Masked env vars: expose keys and masked values (e.g. "sk-****")
    let maskedEnv = {};
    if (app.env_vars_encrypted) {
      try {
        const parsed = JSON.parse(app.env_vars_encrypted);
        for (const [k, v] of Object.entries(parsed)) {
          const strVal = String(v);
          maskedEnv[k] = strVal.length > 6 
            ? `${strVal.substring(0, 3)}••••${strVal.substring(strVal.length - 2)}`
            : '••••••';
        }
      } catch (e) {}
    }

    return res.json({
      success: true,
      application: {
        ...app,
        env_vars_encrypted: undefined,
        env_vars_masked: maskedEnv,
        deployments
      }
    });
  } catch (err) {
    console.error('Node.js app detail error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rincian aplikasi Node.js.'
    });
  }
});

// POST /nodejs/apps - Create new Node.js application
router.post('/apps', requireAuth, async (req, res) => {
  try {
    const {
      app_name,
      domain,
      app_uri = 'api',
      nodejs_version = '22.23.4',
      app_mode = 'production',
      startup_file = 'index.js',
      env_vars = {}
    } = req.body;

    if (!app_name || !domain) {
      return res.status(400).json({
        success: false,
        message: 'Nama aplikasi dan domain tujuan wajib diisi.'
      });
    }

    // Sanitize app name
    const safeAppName = app_name.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
    if (!safeAppName) {
      return res.status(400).json({
        success: false,
        message: 'Nama aplikasi hanya boleh berisi huruf, angka, tanda hubung, atau garis bawah.'
      });
    }

    // Check Free Plan limit: Free plan users are strictly allowed at most 1 Node.js application
    const isUserAdmin = req.user.role === 'admin';
    if (!isUserAdmin) {
      const paidServices = await query(
        `SELECT s.id FROM hosting_services s 
         JOIN hosting_plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? AND s.status = 'active' AND p.slug != 'free-hosting'`,
        [req.user.id]
      );
      const isPaidUser = paidServices.length > 0;
      if (!isPaidUser) {
        const [appCountRow] = await query(
          'SELECT COUNT(*) as count FROM nodejs_applications WHERE user_id = ?',
          [req.user.id]
        );
        if (appCountRow && appCountRow.count >= 1) {
          return res.status(403).json({
            success: false,
            message: 'Pengguna program Free Plan dibatasi maksimal 1 aplikasi Node.js. Silakan upgrade ke paket Cloud Hosting untuk menambah aplikasi.'
          });
        }
      }
    }

    const cleanDomain = domain.trim().toLowerCase();
    const cleanUri = app_uri.trim().replace(/^\/+|\/+$/g, '');

    // Verify domain ownership
    const domainCheck = await query(
      'SELECT id, user_id, document_root FROM domains WHERE domain = ? AND (user_id = ? OR ? = 1) LIMIT 1',
      [cleanDomain, req.user.id, req.user.role === 'admin' ? 1 : 0]
    );

    if (domainCheck.length === 0) {
      // Also check hosting_services domain
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

    // Check duplicate app name or path for user
    const appRootRel = `apps/u${req.user.id}_${safeAppName}`;
    const fullAppRoot = path.join(HOME_DIR, appRootRel);

    const [existingApp] = await query(
      'SELECT id FROM nodejs_applications WHERE (domain = ? AND app_uri = ?) OR app_root = ? LIMIT 1',
      [cleanDomain, cleanUri, appRootRel]
    );

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: `Aplikasi dengan URI '/${cleanUri}' pada domain ${cleanDomain} sudah terdaftar.`
      });
    }

    // 1. Scaffold initial directory & starter index.js
    if (!fs.existsSync(fullAppRoot)) {
      fs.mkdirSync(fullAppRoot, { recursive: true, mode: 0o755 });
    }
    const tmpDir = path.join(fullAppRoot, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true, mode: 0o755 });
    }

    const starterPkg = {
      name: safeAppName,
      version: '1.0.0',
      description: `1sLabs Managed Node.js API for ${cleanDomain}`,
      main: startup_file,
      scripts: {
        start: `node ${startup_file}`
      },
      dependencies: {
        express: '^4.19.2',
        cors: '^2.8.5'
      }
    };
    fs.writeFileSync(path.join(fullAppRoot, 'package.json'), JSON.stringify(starterPkg, null, 2), 'utf-8');

    const starterCode = 
`// 1sLabs Managed Node.js Application
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Application Health Check
app.get(['/health', '/${cleanUri}/health'], (req, res) => {
  res.json({
    status: 'healthy',
    application: '${safeAppName}',
    domain: '${cleanDomain}',
    uptime_seconds: Math.floor(process.uptime()),
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

// Root API Endpoint
app.get(['/', '/${cleanUri}'], (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di API Node.js ${safeAppName} (${cleanDomain})!',
    endpoints: {
      health: '/${cleanUri}/health',
      root: '/${cleanUri}'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server ${safeAppName} berjalan pada port \${PORT}\`);
});
`;
    fs.writeFileSync(path.join(fullAppRoot, startup_file), starterCode, 'utf-8');

    // Write initial .env if variables provided
    if (env_vars && Object.keys(env_vars).length > 0) {
      const envLines = Object.entries(env_vars).map(([k, v]) => `${k}=${v}`).join('\n');
      fs.writeFileSync(path.join(fullAppRoot, '.env'), envLines, 'utf-8');
    }

    // 2. Call CloudLinux Selector to register application
    try {
      await nodejsService.createApplication({
        appRoot: appRootRel,
        appUri: cleanUri,
        domain: cleanDomain,
        version: nodejs_version,
        appMode: app_mode,
        startupFile: startup_file
      });
      console.log(`[CloudLinux Selector] Successfully created ${safeAppName} on ${cleanDomain}/${cleanUri}`);
    } catch (cpErr) {
      console.error('[CloudLinux Selector Create Error]:', cpErr.message);
      // If error, continue to record or throw descriptive error
      if (!cpErr.message.includes('already exists')) {
        throw new Error(`Gagal membuat aplikasi di server CloudLinux: ${cpErr.message}`);
      }
    }

    const appUrl = `https://${cleanDomain}/${cleanUri}`;

    // 3. Save to database
    const insertRes = await query(
      `INSERT INTO nodejs_applications
       (user_id, domain_id, app_name, app_root, full_app_root, app_uri, domain, app_url, nodejs_version, app_mode, startup_file, env_vars_encrypted, status, health_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', 'healthy')`,
      [
        req.user.id,
        domainId,
        safeAppName,
        appRootRel,
        fullAppRoot,
        cleanUri,
        cleanDomain,
        appUrl,
        nodejs_version,
        app_mode,
        startup_file,
        JSON.stringify(env_vars || {})
      ]
    );

    const appId = insertRes.insertId;

    // Log initial deployment
    await query(
      `INSERT INTO nodejs_deployments (app_id, user_id, deployment_number, source_type, status, logs)
       VALUES (?, ?, 1, 'initial_scaffold', 'success', 'Starter Node.js Express API scaffolded and started successfully.')`,
      [appId, req.user.id]
    );

    await logActivity({
      userId: req.user.id,
      action: 'nodejs_app_created',
      entityType: 'application',
      entityId: appId,
      details: { appName: safeAppName, domain: cleanDomain, appUrl }
    });

    return res.json({
      success: true,
      message: `Aplikasi Node.js '${safeAppName}' berhasil dibuat dan online di ${appUrl}!`,
      application: {
        id: appId,
        app_name: safeAppName,
        domain: cleanDomain,
        app_url: appUrl,
        nodejs_version,
        app_mode,
        startup_file,
        status: 'running'
      }
    });
  } catch (err) {
    console.error('Create Node.js app error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal membuat aplikasi Node.js.'
    });
  }
});

// POST /nodejs/apps/:id/action - Start, stop, restart app
router.post('/apps/:id/action', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'start', 'stop', 'restart'

    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Aksi tidak valid. Pilihan aksi: 'start', 'stop', 'restart'."
      });
    }

    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Node.js tidak ditemukan.' });
    }

    const app = apps[0];

    if (action === 'start') {
      await nodejsService.startApplication(app.app_root);
      await query("UPDATE nodejs_applications SET status = 'running', updated_at = NOW() WHERE id = ?", [app.id]);
    } else if (action === 'stop') {
      await nodejsService.stopApplication(app.app_root);
      await query("UPDATE nodejs_applications SET status = 'stopped', health_status = 'unknown', updated_at = NOW() WHERE id = ?", [app.id]);
    } else if (action === 'restart') {
      await nodejsService.restartApplication(app.app_root);
      await query("UPDATE nodejs_applications SET status = 'running', last_restart_at = NOW(), updated_at = NOW() WHERE id = ?", [app.id]);
    }

    await logActivity({
      userId: req.user.id,
      action: `nodejs_app_${action}`,
      entityType: 'application',
      entityId: app.id,
      details: { appName: app.app_name, action }
    });

    return res.json({
      success: true,
      message: `Aplikasi ${app.app_name} berhasil di-${action}.`
    });
  } catch (err) {
    console.error('Node.js app action error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menjalankan aksi pada aplikasi Node.js.'
    });
  }
});

// POST /nodejs/apps/:id/deploy - Deploy source code from ZIP archive
router.post('/apps/:id/deploy', requireAuth, (req, res) => {
  uploadZip.single('source_zip')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File ZIP source code wajib diunggah.' });
    }

    const zipPath = req.file.path;
    const { id } = req.params;

    try {
      const isUserAdmin = req.user.role === 'admin';
      const apps = await query(
        'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
        [id, req.user.id, isUserAdmin ? 1 : 0]
      );

      if (apps.length === 0) {
        fs.unlinkSync(zipPath);
        return res.status(404).json({ success: false, message: 'Aplikasi Node.js tidak ditemukan.' });
      }

      const app = apps[0];
      const targetDir = app.full_app_root;

      // Extract ZIP safely via /usr/bin/unzip
      await new Promise((resolve, reject) => {
        execFile('/usr/bin/unzip', ['-o', zipPath, '-d', targetDir], { timeout: 60000 }, (err, stdout, stderr) => {
          if (err) {
            return reject(new Error(stderr || err.message || 'Gagal mengekstrak arsip ZIP.'));
          }
          resolve(stdout);
        });
      });

      // Cleanup uploaded ZIP
      try { fs.unlinkSync(zipPath); } catch (e) {}

      // Run npm install in virtualenv if available
      const venvActivate = path.join(HOME_DIR, 'nodevenv', app.app_root, app.nodejs_version.split('.')[0], 'bin', 'activate');
      let npmLog = '';
      if (fs.existsSync(venvActivate)) {
        await new Promise((resolve) => {
          execFile('/bin/bash', ['-c', `source ${venvActivate} && cd ${targetDir} && npm install --omit=dev`], { timeout: 120000 }, (err, stdout, stderr) => {
            npmLog = stdout + (stderr ? '\n' + stderr : '');
            resolve();
          });
        });
      }

      // Restart application
      await nodejsService.restartApplication(app.app_root);

      // Increment deployment count & log
      const newCount = app.deployment_count + 1;
      await query(
        'UPDATE nodejs_applications SET deployment_count = ?, last_restart_at = NOW(), updated_at = NOW() WHERE id = ?',
        [newCount, app.id]
      );

      await query(
        `INSERT INTO nodejs_deployments (app_id, user_id, deployment_number, source_type, status, logs, file_size_bytes)
         VALUES (?, ?, ?, 'zip_upload', 'success', ?, ?)`,
        [app.id, req.user.id, newCount, npmLog.slice(0, 1000) || 'Deployment completed successfully.', req.file.size]
      );

      await logActivity({
        userId: req.user.id,
        action: 'nodejs_app_deployed',
        entityType: 'application',
        entityId: app.id,
        details: { appName: app.app_name, deployment: newCount }
      });

      return res.json({
        success: true,
        message: `Deployment #${newCount} untuk aplikasi ${app.app_name} berhasil dan server telah direstart!`,
        deployment_number: newCount
      });
    } catch (deployErr) {
      try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch (e) {}
      console.error('Deploy error:', deployErr);
      return res.status(500).json({
        success: false,
        message: deployErr.message || 'Terjadi kesalahan saat memproses deployment.'
      });
    }
  });
});

// GET /nodejs/apps/:id/health - Force immediate HTTP health ping
router.get('/apps/:id/health', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Node.js tidak ditemukan.' });
    }

    const app = apps[0];
    const targetUrl = `${app.app_url}/health`;
    const health = await nodejsService.checkHealth(targetUrl);

    // If /health returns 404, fallback check to root
    let finalHealth = health;
    if (health.status === 404) {
      finalHealth = await nodejsService.checkHealth(app.app_url);
    }

    const healthStatus = finalHealth.healthy ? 'healthy' : 'error';

    await query(
      `UPDATE nodejs_applications 
       SET health_status = ?, last_health_check = NOW(), last_response_time_ms = ?, last_http_status = ?, last_error = ?, updated_at = NOW()
       WHERE id = ?`,
      [healthStatus, finalHealth.responseTimeMs, finalHealth.status, finalHealth.healthy ? null : finalHealth.statusText, app.id]
    );

    return res.json({
      success: true,
      url: targetUrl,
      health: {
        healthy: finalHealth.healthy,
        status: finalHealth.status,
        statusText: finalHealth.statusText,
        responseTimeMs: finalHealth.responseTimeMs,
        checkedAt: finalHealth.checkedAt
      }
    });
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(500).json({ success: false, message: 'Gagal melakukan health check aplikasi.' });
  }
});

// GET /nodejs/apps/:id/logs - Fetch application stderr / stdout logs
router.get('/apps/:id/logs', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Node.js tidak ditemukan.' });
    }

    const app = apps[0];
    const stderrLogPath = path.join(app.full_app_root, 'stderr.log');
    let logs = '';

    if (fs.existsSync(stderrLogPath)) {
      const stats = fs.statSync(stderrLogPath);
      // Read last 32KB of log
      const start = Math.max(0, stats.size - 32768);
      const buffer = Buffer.alloc(Math.min(stats.size, 32768));
      const fd = fs.openSync(stderrLogPath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, start);
      fs.closeSync(fd);
      logs = buffer.toString('utf-8');
    } else {
      logs = 'Belum ada log error yang tercatat pada aplikasi ini.';
    }

    return res.json({
      success: true,
      app_name: app.app_name,
      logs
    });
  } catch (err) {
    console.error('Get logs error:', err);
    return res.status(500).json({ success: false, message: 'Gagal membaca log aplikasi.' });
  }
});

// POST /nodejs/apps/:id/env - Update environment variables
router.post('/apps/:id/env', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { env_vars } = req.body;

    if (!env_vars || typeof env_vars !== 'object') {
      return res.status(400).json({ success: false, message: 'Format environment variables tidak valid.' });
    }

    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    const envFilePath = path.join(app.full_app_root, '.env');

    const envLines = Object.entries(env_vars).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(envFilePath, envLines, 'utf-8');

    // Update in database
    await query(
      'UPDATE nodejs_applications SET env_vars_encrypted = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(env_vars), app.id]
    );

    // Restart app
    await nodejsService.restartApplication(app.app_root);

    return res.json({
      success: true,
      message: 'Environment variables berhasil diperbarui dan aplikasi telah direstart.'
    });
  } catch (err) {
    console.error('Update env error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui environment variables.' });
  }
});

// DELETE /nodejs/apps/:id - Destroy application
router.delete('/apps/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];

    // Destroy via CloudLinux selector
    try {
      await nodejsService.destroyApplication(app.app_root);
    } catch (cpErr) {
      console.warn('Selector destroy notice:', cpErr.message);
    }

    // Delete DB record
    await query('DELETE FROM nodejs_applications WHERE id = ?', [app.id]);
    await query('DELETE FROM nodejs_deployments WHERE app_id = ?', [app.id]);

    await logActivity({
      userId: req.user.id,
      action: 'nodejs_app_deleted',
      entityType: 'application',
      entityId: app.id,
      details: { appName: app.app_name, domain: app.domain }
    });

    return res.json({
      success: true,
      message: `Aplikasi Node.js '${app.app_name}' berhasil dihapus dari server.`
    });
  } catch (err) {
    console.error('Delete app error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus aplikasi Node.js.' });
  }
});

// Node.js application file upload engine
const nodeUploadTempDir = path.join(os.tmpdir(), '1slabs-node-uploads');
if (!fs.existsSync(nodeUploadTempDir)) {
  try { fs.mkdirSync(nodeUploadTempDir, { recursive: true }); } catch (_) {}
}

const nodeFileUpload = multer({
  dest: nodeUploadTempDir,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

function resolveAppPath(fullAppRoot, userPath) {
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

function getAppDirectorySize(dirPath) {
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item === 'node_modules') continue;
      const full = path.join(dirPath, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        total += getAppDirectorySize(full);
      } else {
        total += stat.size;
      }
    }
  } catch (e) {}
  return total;
}

// PUT /nodejs/apps/:id/config - Update Node.js application configuration
router.put('/apps/:id/config', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nodejs_version, app_mode, startup_file, env_vars } = req.body;
    const isUserAdmin = req.user.role === 'admin';

    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi Node.js tidak ditemukan.' });
    }

    const app = apps[0];
    const updates = {};
    const selectorPayload = { appRoot: app.app_root };

    // 1. Version update
    if (nodejs_version && nodejs_version !== app.nodejs_version) {
      const availableVersions = await nodejsService.getAvailableVersions();
      if (!availableVersions.includes(nodejs_version)) {
        return res.status(400).json({
          success: false,
          message: `Versi Node.js ${nodejs_version} tidak tersedia di server.`
        });
      }
      selectorPayload.newVersion = nodejs_version;
      updates.nodejs_version = nodejs_version;
    }

    // 2. Mode update
    if (app_mode && ['production', 'development'].includes(app_mode)) {
      selectorPayload.appMode = app_mode;
      updates.app_mode = app_mode;
    }

    // 3. Startup file update
    if (startup_file && typeof startup_file === 'string') {
      const cleanStartup = startup_file.trim().replace(/^[\\\/]+/, '');
      if (cleanStartup) {
        const startupFilePath = path.join(app.full_app_root, cleanStartup);
        if (!fs.existsSync(startupFilePath)) {
          const defaultStarter = `// 1sLabs Node.js Starter: ${cleanStartup}\nconst express = require('express');\nconst app = express();\napp.use(express.json());\napp.get('*', (req, res) => res.json({ status: 'running', file: '${cleanStartup}' }));\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log('Listening on port ' + PORT));\n`;
          const startupDir = path.dirname(startupFilePath);
          if (!fs.existsSync(startupDir)) fs.mkdirSync(startupDir, { recursive: true, mode: 0o755 });
          fs.writeFileSync(startupFilePath, defaultStarter, 'utf-8');
        }
        selectorPayload.startupFile = cleanStartup;
        updates.startup_file = cleanStartup;
      }
    }

    // 4. Env vars update
    if (env_vars && typeof env_vars === 'object') {
      const envFilePath = path.join(app.full_app_root, '.env');
      const envLines = Object.entries(env_vars).map(([k, v]) => `${k}=${v}`).join('\n');
      fs.writeFileSync(envFilePath, envLines, 'utf-8');
      selectorPayload.envVars = env_vars;
      updates.env_vars_encrypted = JSON.stringify(env_vars);
    }

    // Update with selector
    try {
      await nodejsService.updateApplication(selectorPayload);
    } catch (selErr) {
      console.warn('[Selector update warning]:', selErr.message);
    }

    // Save DB
    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const setValues = Object.values(updates);
      setValues.push(app.id);
      await query(`UPDATE nodejs_applications SET ${setClauses}, updated_at = NOW() WHERE id = ?`, setValues);
    }

    // Restart app
    await nodejsService.restartApplication(app.app_root);

    await logActivity({
      userId: req.user.id,
      action: 'nodejs_app_config_updated',
      entityType: 'application',
      entityId: app.id,
      details: { appName: app.app_name, updates }
    });

    const [updatedApp] = await query('SELECT * FROM nodejs_applications WHERE id = ?', [app.id]);

    return res.json({
      success: true,
      message: 'Konfigurasi aplikasi berhasil diperbarui dan server telah direstart.',
      application: {
        ...updatedApp,
        env_vars_encrypted: undefined
      }
    });
  } catch (err) {
    console.error('Update config error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui konfigurasi aplikasi.' });
  }
});

// POST /nodejs/apps/:id/npm-install - Execute npm install in app virtualenv
router.post('/apps/:id/npm-install', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    const targetDir = app.full_app_root;
    const majorVer = app.nodejs_version.split('.')[0];
    const venvActivate = path.join(HOME_DIR, 'nodevenv', app.app_root, majorVer, 'bin', 'activate');

    let output = '';
    await new Promise((resolve, reject) => {
      const cmd = fs.existsSync(venvActivate)
        ? `source ${venvActivate} && cd ${targetDir} && npm install`
        : `cd ${targetDir} && npm install`;

      execFile('/bin/bash', ['-c', cmd], { timeout: 120000 }, (err, stdout, stderr) => {
        output = (stdout || '') + (stderr ? '\n' + stderr : '');
        if (err && !output) return reject(new Error(stderr || err.message));
        resolve();
      });
    });

    // Restart app
    await nodejsService.restartApplication(app.app_root);

    return res.json({
      success: true,
      message: 'NPM install selesai dan aplikasi telah direstart.',
      output
    });
  } catch (err) {
    console.error('NPM install error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menjalankan npm install.' });
  }
});

// === NODE.JS APPLICATION FILE MANAGER ENDPOINTS ===

// 1. GET /nodejs/apps/:id/files - List files and directories
router.get('/apps/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    const userPath = req.query.path || '/';
    const safePath = resolveAppPath(app.full_app_root, userPath);

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

    const relToRoot = path.relative(app.full_app_root, safePath).replace(/\\/g, '/');
    const cleanRelPath = relToRoot === '' ? '/' : '/' + relToRoot;
    const totalBytes = getAppDirectorySize(app.full_app_root);

    return res.json({
      success: true,
      currentPath: cleanRelPath,
      items,
      totalUsageBytes: totalBytes,
      totalUsageFormatted: formatBytes(totalBytes)
    });
  } catch (err) {
    console.error('List app files error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal memuat file aplikasi.' });
  }
});

// 2. GET /nodejs/apps/:id/files/read - Read text file content for code editor
router.get('/apps/:id/files/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    const targetFile = req.query.path;
    if (!targetFile) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveAppPath(app.full_app_root, targetFile);
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
    const relToRoot = '/' + path.relative(app.full_app_root, safePath).replace(/\\/g, '/');

    return res.json({
      success: true,
      path: relToRoot,
      name: path.basename(safePath),
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      content
    });
  } catch (err) {
    console.error('Read app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membaca isi file.' });
  }
});

// 3. POST /nodejs/apps/:id/files/write - Save file content from editor
router.post('/apps/:id/files/write', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: userPath, content, restart = false } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!userPath) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveAppPath(app.full_app_root, userPath);
    fs.writeFileSync(safePath, content ?? '', 'utf-8');

    if (restart) {
      await nodejsService.restartApplication(app.app_root);
    }

    return res.json({
      success: true,
      message: restart ? 'File berhasil disimpan dan aplikasi telah direstart.' : 'File berhasil disimpan.'
    });
  } catch (err) {
    console.error('Write app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan file.' });
  }
});

// 4. POST /nodejs/apps/:id/files/create-file - Create new file
router.post('/apps/:id/files/create-file', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: parentPath = '/', name, content = '' } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Nama file wajib diisi.' });
    }

    const safeParent = resolveAppPath(app.full_app_root, parentPath);
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
    console.error('Create app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat file.' });
  }
});

// 5. POST /nodejs/apps/:id/files/create-folder - Create new directory
router.post('/apps/:id/files/create-folder', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: parentPath = '/', name } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Nama folder wajib diisi.' });
    }

    const safeParent = resolveAppPath(app.full_app_root, parentPath);
    const safeTarget = path.join(safeParent, name.trim());
    if (fs.existsSync(safeTarget)) {
      return res.status(409).json({ success: false, message: 'Folder dengan nama tersebut sudah ada.' });
    }

    fs.mkdirSync(safeTarget, { recursive: true, mode: 0o755 });

    return res.json({
      success: true,
      message: `Folder '${name}' berhasil dibuat.`
    });
  } catch (err) {
    console.error('Create app folder error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat folder.' });
  }
});

// 6. POST /nodejs/apps/:id/files/upload - Upload file(s) into current directory
router.post('/apps/:id/files/upload', requireAuth, (req, res) => {
  nodeFileUpload.array('files', 50)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { id } = req.params;
      const targetRel = req.body.path || req.query.path || '/';
      const isUserAdmin = req.user.role === 'admin';
      const apps = await query(
        'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
        [id, req.user.id, isUserAdmin ? 1 : 0]
      );

      if (apps.length === 0) {
        if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
        return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
      }

      const app = apps[0];
      const targetDir = resolveAppPath(app.full_app_root, targetRel);
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
      console.error('App upload error:', uploadErr);
      return res.status(500).json({ success: false, message: uploadErr.message || 'Gagal mengunggah file.' });
    }
  });
});

// 7. DELETE /nodejs/apps/:id/files - Delete file or folder
router.delete('/apps/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { path: targetRel } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!targetRel || targetRel === '/' || targetRel.trim() === '') {
      return res.status(400).json({ success: false, message: 'Root direktori aplikasi tidak dapat dihapus.' });
    }

    const safePath = resolveAppPath(app.full_app_root, targetRel);
    if (safePath === path.resolve(app.full_app_root)) {
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
    console.error('Delete app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus item.' });
  }
});

// 8. POST /nodejs/apps/:id/files/rename - Rename file or folder
router.post('/apps/:id/files/rename', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPath, newPath } = req.body;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, message: 'Path lama dan baru wajib diisi.' });
    }

    const safeOld = resolveAppPath(app.full_app_root, oldPath);
    const safeNew = resolveAppPath(app.full_app_root, newPath);

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
    console.error('Rename app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengubah nama item.' });
  }
});

// 9. GET /nodejs/apps/:id/files/download - Download file
router.get('/apps/:id/files/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userPath = req.query.path;
    const isUserAdmin = req.user.role === 'admin';
    const apps = await query(
      'SELECT * FROM nodejs_applications WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, isUserAdmin ? 1 : 0]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
    }

    const app = apps[0];
    if (!userPath) {
      return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });
    }

    const safePath = resolveAppPath(app.full_app_root, userPath);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    return res.download(safePath, path.basename(safePath));
  } catch (err) {
    console.error('Download app file error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengunduh file.' });
  }
});

module.exports = router;

