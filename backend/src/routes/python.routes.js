const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { pythonService } = require('../services/cpanel.service');
const { logActivity } = require('../utils/activityLogger');

const HOME_DIR = '/home/u1zh8984';

// Multer storage for uploads
const pythonUploadTempDir = path.join(HOME_DIR, 'tmp', 'python_uploads');
if (!fs.existsSync(pythonUploadTempDir)) {
  try { fs.mkdirSync(pythonUploadTempDir, { recursive: true }); } catch (e) {}
}

const pythonFileUpload = multer({
  dest: pythonUploadTempDir,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Helper: resolve app root directory safely
function getPythonAppRoot(appName) {
  if (!appName) throw new Error('Parameter appName tidak boleh kosong.');
  const clean = appName.trim().replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');
  const resolved = path.resolve(HOME_DIR, clean);
  if (!resolved.startsWith(HOME_DIR)) {
    throw new Error('Akses direktori tidak valid.');
  }
  return resolved;
}

// Helper: resolve relative file path inside app root
function resolvePythonAppPath(appRoot, userPath = '/') {
  const normalizedRoot = path.resolve(appRoot);
  const cleanRel = (userPath || '').replace(/^[\\\/]+/, '').replace(/\0/g, '');
  const resolved = path.resolve(normalizedRoot, cleanRel);
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error('Akses path di luar direktori aplikasi dilarang.');
  }
  return resolved;
}

// Helper: format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper: calculate folder size
function calculateFolderSize(dirPath) {
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (['virtualenv', '.git', '__pycache__', '.pytest_cache'].includes(entry.name)) continue;
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          totalSize += calculateFolderSize(full);
        } else {
          const st = fs.statSync(full);
          totalSize += st.size;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return totalSize;
}

// Helper: verify user ownership of python app
async function verifyAppOwnership(req, appName) {
  const isUserAdmin = ['admin', 'superadmin', 'super_admin'].includes(req.user.role) || [1, 2, 23].includes(req.user.id);
  if (isUserAdmin) {
    return true;
  }
  const clean = (appName || '').trim().replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');
  if (clean.startsWith(`apps/u${req.user.id}_`) || clean.startsWith(`u${req.user.id}_`)) {
    return true;
  }
  const userDomainRows = await query(
    `SELECT DISTINCT d.domain as domain_name 
     FROM domains d 
     WHERE d.user_id = ? 
     UNION 
     SELECT DISTINCT hs.domain as domain_name 
     FROM hosting_services hs 
     WHERE hs.user_id = ?`,
    [req.user.id, req.user.id]
  );
  const userDomains = new Set(userDomainRows.map(r => (r.domain_name || '').toLowerCase()));

  const apps = await pythonService.listApplications();
  const matched = apps.find(a => a.app_name === clean || a.app_name === appName);
  if (matched && matched.domain && userDomains.has(matched.domain.toLowerCase())) {
    return true;
  }
  if (req.user.role === 'customer_free' || matched) {
    return true;
  }
  return false;
}

// ==========================================
// 1. VERSIONS & OCCUPIED ENDPOINTS
// ==========================================

// GET /python/versions - Available Python versions
router.get('/versions', requireAuth, async (req, res) => {
  try {
    const versions = await pythonService.getAvailableVersions();
    return res.json({
      success: true,
      versions,
      default: '3.11.17'
    });
  } catch (err) {
    console.error('Get python versions error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar versi Python.'
    });
  }
});

// GET /python/occupied-endpoints - Cross-framework route collision check
router.get('/occupied-endpoints', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = ['admin', 'superadmin', 'super_admin'].includes(req.user.role) || [1, 2, 23].includes(req.user.id);

    const nodeApps = await query(
      'SELECT id, app_name, domain, app_uri, app_url, "nodejs" as platform, status FROM nodejs_applications WHERE (user_id = ? OR ? = 1)',
      [req.user.id, isUserAdmin ? 1 : 0]
    );

    const laravelApps = await query(
      'SELECT id, app_name, domain, app_uri, app_url, "laravel" as platform, status FROM laravel_applications WHERE (user_id = ? OR ? = 1)',
      [req.user.id, isUserAdmin ? 1 : 0]
    );

    const pythonAppsList = await pythonService.listApplications();
    const pythonApps = pythonAppsList.map((app, idx) => ({
      id: idx + 1,
      app_name: app.app_name,
      domain: app.domain || '',
      app_uri: app.app_uri || '',
      app_url: app.domain ? `https://${app.domain}${app.app_uri ? `/${app.app_uri.replace(/^\/+/, '')}` : ''}` : '',
      platform: 'python',
      status: app.app_status === 'started' ? 'running' : 'stopped'
    }));

    return res.json({
      success: true,
      endpoints: [...nodeApps, ...laravelApps, ...pythonApps]
    });
  } catch (err) {
    console.error('Occupied endpoints error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa endpoint.' });
  }
});

// ==========================================
// 2. APPLICATION CRUD & ACTIONS
// ==========================================

// GET /python/apps - List Python applications
router.get('/apps', requireAuth, async (req, res) => {
  try {
    const apps = await pythonService.listApplications();
    const isUserAdmin = ['admin', 'superadmin', 'super_admin'].includes(req.user.role) || [1, 2, 23].includes(req.user.id);
    const isFreePlanUser = req.user.role === 'customer_free';

    let filteredApps = apps;
    if (!isUserAdmin) {
      const userDomainRows = await query(
        `SELECT DISTINCT d.domain as domain_name 
         FROM domains d 
         WHERE d.user_id = ? 
         UNION 
         SELECT DISTINCT hs.domain as domain_name 
         FROM hosting_services hs 
         WHERE hs.user_id = ?`,
        [req.user.id, req.user.id]
      );
      const userDomains = new Set(userDomainRows.map(r => (r.domain_name || '').toLowerCase()));
      filteredApps = apps.filter(app => {
        if (!app.domain) {
          return isFreePlanUser;
        }
        const domMatch = userDomains.has(app.domain.toLowerCase());
        const userAppPrefix = `apps/u${req.user.id}_`;
        const prefixMatch = app.app_name && (app.app_name.startsWith(userAppPrefix) || app.app_name.startsWith(`u${req.user.id}_`));
        return domMatch || prefixMatch || isFreePlanUser;
      });
    }

    // Enhance each app with full app_url, status, etc.
    const enhancedApps = filteredApps.map(app => {
      const fullUrl = app.domain ? `https://${app.domain}${app.app_uri ? `/${app.app_uri.replace(/^\/+/, '')}` : ''}` : null;
      return {
        ...app,
        app_url: fullUrl,
        status: app.app_status === 'started' ? 'running' : 'stopped'
      };
    });

    return res.json({
      success: true,
      apps: enhancedApps
    });
  } catch (err) {
    console.error('List python apps error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar aplikasi Python.'
    });
  }
});

// POST /python/apps - Create new Python application
router.post('/apps', requireAuth, async (req, res) => {
  try {
    const { appName, targetDomain, appUri = 'api', pythonVersion = '3.11.17', startupFile = 'passenger_wsgi.py', entryPoint = 'application' } = req.body;

    if (!appName || !targetDomain) {
      return res.status(400).json({
        success: false,
        message: 'Nama aplikasi dan domain tujuan wajib diisi.'
      });
    }

    const cleanName = appName.trim().replace(/[^a-zA-Z0-9_\-\/]/g, '');
    const cleanDomain = targetDomain.trim().toLowerCase();
    const cleanUri = appUri ? appUri.trim().replace(/^\/+/, '') : '';

    const isUserAdmin = ['admin', 'superadmin', 'super_admin'].includes(req.user.role) || [1, 2, 23].includes(req.user.id);
    if (!isUserAdmin) {
      const userDomainRows = await query(
        `SELECT DISTINCT d.domain as domain_name 
         FROM domains d 
         WHERE d.user_id = ? 
         UNION 
         SELECT DISTINCT hs.domain as domain_name 
         FROM hosting_services hs 
         WHERE hs.user_id = ?`,
        [req.user.id, req.user.id]
      );
      const userDomains = new Set(userDomainRows.map(r => (r.domain_name || '').toLowerCase()));
      if (!userDomains.has(cleanDomain)) {
        return res.status(403).json({
          success: false,
          message: `Domain ${cleanDomain} tidak terdaftar pada akun Anda.`
        });
      }
    }

    const appRoot = `apps/u${req.user.id}_${cleanName}`;
    const fullRoot = path.join(HOME_DIR, appRoot);

    if (!fs.existsSync(fullRoot)) {
      fs.mkdirSync(fullRoot, { recursive: true });
    }

    // Ensure default starter passenger_wsgi.py exists
    const wsgiPath = path.join(fullRoot, startupFile);
    if (!fs.existsSync(wsgiPath)) {
      const starterCode = `# 1sLabs CloudLinux Python Application
import sys
import os

# Add application directory to sys.path
app_dir = os.path.dirname(__file__)
sys.path.insert(0, app_dir)

def ${entryPoint}(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'application/json; charset=utf-8')]
    start_response(status, response_headers)
    py_ver = sys.version.split()[0]
    return [b'{"status": "online", "message": "1sLabs Python Application is running!", "python": "' + py_ver.encode() + b'"}']
`;
      fs.writeFileSync(wsgiPath, starterCode, 'utf8');
    }

    // Ensure requirements.txt exists
    const reqPath = path.join(fullRoot, 'requirements.txt');
    if (!fs.existsSync(reqPath)) {
      fs.writeFileSync(reqPath, '# Python dependencies\n', 'utf8');
    }

    // Ensure tmp directory for restart.txt
    const tmpDir = path.join(fullRoot, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (_) {}
    }

    const result = await pythonService.createApplication({
      appRoot,
      appUri: cleanUri,
      domain: cleanDomain,
      version: pythonVersion,
      startupFile,
      entryPoint
    });

    logActivity(req.user.id, 'CREATE_PYTHON_APP', `Aplikasi Python didaftarkan: ${cleanName} pada ${cleanDomain}/${cleanUri}`);

    return res.json({
      success: true,
      message: 'Aplikasi Python berhasil dibuat.',
      data: result
    });
  } catch (err) {
    console.error('Create python app error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal membuat aplikasi Python.'
    });
  }
});

// POST /python/apps/:appName/action - Unified Start, Stop, Restart
router.post('/apps/:appName/action', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName;
    const { action } = req.body; // 'start', 'stop', 'restart'

    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Aksi tidak valid.' });
    }

    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    if (action === 'start') {
      await pythonService.startApplication(appName);
    } else if (action === 'stop') {
      await pythonService.stopApplication(appName);
    } else if (action === 'restart') {
      await pythonService.restartApplication(appName);
    }

    logActivity(req.user.id, `PYTHON_APP_${action.toUpperCase()}`, `Aksi ${action} pada aplikasi: ${appName}`);

    return res.json({
      success: true,
      message: `Aplikasi Python ${appName} berhasil di-${action}.`
    });
  } catch (err) {
    console.error('Python app action error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengeksekusi aksi.' });
  }
});

// POST /python/apps/:appName/restart - Restart app
router.post('/apps/:appName/restart', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    await pythonService.restartApplication(appName);
    logActivity(req.user.id, 'RESTART_PYTHON_APP', `Restart aplikasi Python: ${appName}`);
    return res.json({
      success: true,
      message: 'Aplikasi Python berhasil di-restart.'
    });
  } catch (err) {
    console.error('Restart python app error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal me-restart aplikasi Python.'
    });
  }
});

// POST /python/apps/:appName/start - Start app
router.post('/apps/:appName/start', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    await pythonService.startApplication(appName);
    return res.json({
      success: true,
      message: 'Aplikasi Python berhasil dijalankan.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menjalankan aplikasi Python.'
    });
  }
});

// POST /python/apps/:appName/stop - Stop app
router.post('/apps/:appName/stop', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    await pythonService.stopApplication(appName);
    return res.json({
      success: true,
      message: 'Aplikasi Python berhasil dihentikan.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menghentikan aplikasi Python.'
    });
  }
});

// DELETE /python/apps/:appName - Destroy app
router.delete('/apps/:appName', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    await pythonService.destroyApplication(appName);
    logActivity(req.user.id, 'DELETE_PYTHON_APP', `Hapus aplikasi Python: ${appName}`);
    return res.json({
      success: true,
      message: 'Aplikasi Python berhasil dihapus.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menghapus aplikasi Python.'
    });
  }
});

// POST /python/apps/:appName/install-modules - Run pip install
router.post('/apps/:appName/install-modules', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const { requirementsFile = 'requirements.txt' } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const result = await pythonService.installModules({
      appRoot: appName,
      requirementsFile
    });
    return res.json({
      success: true,
      message: 'Instalasi dependensi Python selesai.',
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menginstal dependensi Python.'
    });
  }
});

// POST /python/apps/:appName/health-check - Health ping
router.post('/apps/:appName/health-check', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const apps = await pythonService.listApplications();
    const app = apps.find(a => a.app_name === appName);
    if (!app || !app.domain) {
      return res.status(404).json({ success: false, message: 'Aplikasi atau domain tidak ditemukan.' });
    }

    const cleanUri = (app.app_uri || '').replace(/^\/+/, '');
    const baseUrl = `https://${app.domain}${cleanUri ? `/${cleanUri}` : ''}`;
    let health = await pythonService.checkHealth(baseUrl);
    let finalUrl = baseUrl;

    if (!health.healthy) {
      // Fallback 1: with trailing slash
      const slashUrl = `${baseUrl}/`;
      const slashHealth = await pythonService.checkHealth(slashUrl);
      if (slashHealth.healthy) {
        health = slashHealth;
        finalUrl = slashUrl;
      } else {
        // Fallback 2: /health
        const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`;
        const endpointHealth = await pythonService.checkHealth(healthUrl);
        if (endpointHealth.healthy) {
          health = endpointHealth;
          finalUrl = healthUrl;
        }
      }
    }

    return res.json({
      success: true,
      health: {
        ...health,
        url: finalUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal melakukan health check.' });
  }
});

// GET /python/apps/:appName/logs - Get server logs
router.get('/apps/:appName/logs', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullRoot = getPythonAppRoot(appName);
    const logCandidates = [
      path.join(fullRoot, 'stderr.log'),
      path.join(fullRoot, 'request.log'),
      path.join(fullRoot, 'passenger.log'),
      path.join(fullRoot, 'app.log')
    ];

    let combinedLogs = '';
    for (const logPath of logCandidates) {
      if (fs.existsSync(logPath)) {
        try {
          const content = fs.readFileSync(logPath, 'utf8');
          combinedLogs += `=== ${path.basename(logPath)} ===\n` + content.slice(-5000) + '\n\n';
        } catch (_) {}
      }
    }

    if (!combinedLogs.trim()) {
      combinedLogs = '[Info]: Belum ada entri log server yang tercatat pada direktori aplikasi ini.';
    }

    return res.json({ success: true, logs: combinedLogs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal membaca log server.' });
  }
});

// GET /python/apps/:appName/env - Get .env file
router.get('/apps/:appName/env', requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullRoot = getPythonAppRoot(appName);
    const envPath = path.join(fullRoot, '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    return res.json({ success: true, content });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal membaca .env.' });
  }
});

// PUT & POST /python/apps/:appName/env - Save .env file
const saveEnvHandler = async (req, res) => {
  try {
    const appName = req.params.appName;
    const { content } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullRoot = getPythonAppRoot(appName);
    const envPath = path.join(fullRoot, '.env');
    fs.writeFileSync(envPath, content || '', 'utf8');

    // Touch restart.txt
    const restartFile = path.join(fullRoot, 'tmp', 'restart.txt');
    try {
      if (!fs.existsSync(path.dirname(restartFile))) {
        fs.mkdirSync(path.dirname(restartFile), { recursive: true });
      }
      fs.utimesSync(restartFile, new Date(), new Date());
    } catch (_) {}

    return res.json({ success: true, message: 'Konfigurasi .env berhasil disimpan & server diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan .env.' });
  }
};
router.put('/apps/:appName/env', requireAuth, saveEnvHandler);
router.post('/apps/:appName/env', requireAuth, saveEnvHandler);

// ==========================================
// 3. INTEGRATED FILE MANAGER ENDPOINTS
// ==========================================

// GET /python/apps/:appName/files - List files and directories
router.get(['/apps/:appName/files', '/files'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.query.appName;
    if (!appName) return res.status(400).json({ success: false, message: 'Parameter appName wajib disertakan.' });

    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullAppRoot = getPythonAppRoot(appName);
    const userPath = req.query.path || '/';
    const safePath = resolvePythonAppPath(fullAppRoot, userPath);

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

    const totalUsage = calculateFolderSize(fullAppRoot);

    return res.json({
      success: true,
      currentPath: userPath,
      items,
      totalUsageFormatted: formatBytes(totalUsage)
    });
  } catch (err) {
    console.error('List python files error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal memuat daftar file.' });
  }
});

// GET /python/apps/:appName/files/read - Read file content
router.get(['/apps/:appName/files/read', '/files/read'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.query.appName;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullAppRoot = getPythonAppRoot(appName);
    const userPath = req.query.path;
    if (!userPath) return res.status(400).json({ success: false, message: 'Path file wajib disertakan.' });

    const safePath = resolvePythonAppPath(fullAppRoot, userPath);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    const stat = fs.statSync(safePath);
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File terlalu besar untuk dibuka di editor teks (> 5MB).' });
    }

    const content = fs.readFileSync(safePath, 'utf8');
    return res.json({
      success: true,
      content,
      size: stat.size,
      path: userPath,
      name: path.basename(safePath)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal membaca isi file.' });
  }
});

// POST /python/apps/:appName/files/write - Save file content
router.post(['/apps/:appName/files/write', '/files/write'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName;
    const { path: userPath, content, restart = false } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullAppRoot = getPythonAppRoot(appName);
    const safePath = resolvePythonAppPath(fullAppRoot, userPath);

    fs.writeFileSync(safePath, content ?? '', 'utf8');

    if (restart) {
      const restartFile = path.join(fullAppRoot, 'tmp', 'restart.txt');
      try {
        if (!fs.existsSync(path.dirname(restartFile))) {
          fs.mkdirSync(path.dirname(restartFile), { recursive: true });
        }
        fs.utimesSync(restartFile, new Date(), new Date());
      } catch (_) {}
    }

    return res.json({ success: true, message: 'File berhasil disimpan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan file.' });
  }
});

// POST /python/apps/:appName/files/create-file - Create new file
router.post(['/apps/:appName/files/create-file', '/files/create-file'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName;
    const { path: userPath, name, content = '' } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama file wajib diisi.' });
    }

    const fullAppRoot = getPythonAppRoot(appName);
    const targetDir = resolvePythonAppPath(fullAppRoot, userPath);
    const targetFile = path.join(targetDir, name.trim());

    if (fs.existsSync(targetFile)) {
      return res.status(400).json({ success: false, message: 'File dengan nama tersebut sudah ada.' });
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    return res.json({ success: true, message: `File '${name}' berhasil dibuat.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat file.' });
  }
});

// POST /python/apps/:appName/files/create-folder - Create new folder
router.post(['/apps/:appName/files/create-folder', '/files/create-folder'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName;
    const { path: userPath, name } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama folder wajib diisi.' });
    }

    const fullAppRoot = getPythonAppRoot(appName);
    const targetDir = resolvePythonAppPath(fullAppRoot, userPath);
    const newFolder = path.join(targetDir, name.trim());

    if (fs.existsSync(newFolder)) {
      return res.status(400).json({ success: false, message: 'Folder dengan nama tersebut sudah ada.' });
    }

    fs.mkdirSync(newFolder, { recursive: true });
    return res.json({ success: true, message: `Folder '${name}' berhasil dibuat.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal membuat folder.' });
  }
});

// POST /python/apps/:appName/files/upload - Upload files
router.post(['/apps/:appName/files/upload', '/files/upload'], requireAuth, (req, res) => {
  pythonFileUpload.array('files', 50)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah berkas.' });
    }

    try {
      const appName = req.params.appName || req.body.appName;
      const targetPath = req.body.path || '/';
      const authorized = await verifyAppOwnership(req, appName);
      if (!authorized) {
        if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
      }

      const fullAppRoot = getPythonAppRoot(appName);
      const destinationFolder = resolvePythonAppPath(fullAppRoot, targetPath);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
      }

      for (const file of req.files) {
        const destFile = path.join(destinationFolder, file.originalname);
        fs.copyFileSync(file.path, destFile);
        try { fs.unlinkSync(file.path); } catch (_) {}
      }

      return res.json({
        success: true,
        message: `${req.files.length} file berhasil diunggah.`
      });
    } catch (uploadErr) {
      if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
      return res.status(500).json({ success: false, message: uploadErr.message || 'Gagal memproses unggahan file.' });
    }
  });
});

// DELETE /python/apps/:appName/files - Delete file or folder
router.delete(['/apps/:appName/files', '/files'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName || req.query.appName;
    const userPath = req.body.path || req.query.path;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    if (!userPath || userPath === '/' || userPath === '') {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus direktori root aplikasi.' });
    }

    const fullAppRoot = getPythonAppRoot(appName);
    const target = resolvePythonAppPath(fullAppRoot, userPath);

    if (!fs.existsSync(target)) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });
    }

    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.unlinkSync(target);
    }

    return res.json({ success: true, message: 'Item berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus item.' });
  }
});

// POST /python/apps/:appName/files/rename - Rename file or folder
router.post(['/apps/:appName/files/rename', '/files/rename'], requireAuth, async (req, res) => {
  try {
    const appName = req.params.appName || req.body.appName;
    const { oldPath, newPath } = req.body;
    const authorized = await verifyAppOwnership(req, appName);
    if (!authorized) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const fullAppRoot = getPythonAppRoot(appName);
    const safeOld = resolvePythonAppPath(fullAppRoot, oldPath);
    const safeNew = resolvePythonAppPath(fullAppRoot, newPath);

    if (!fs.existsSync(safeOld)) {
      return res.status(404).json({ success: false, message: 'Item asal tidak ditemukan.' });
    }

    if (fs.existsSync(safeNew)) {
      return res.status(400).json({ success: false, message: 'Nama item tujuan sudah ada.' });
    }

    fs.renameSync(safeOld, safeNew);
    return res.json({ success: true, message: 'Item berhasil diubah namanya.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengubah nama item.' });
  }
});

// GET /python/apps/:appName/files/download - Download file
router.get(['/apps/:appName/files/download', '/files/download'], async (req, res) => {
  try {
    const appName = req.params.appName || req.query.appName;
    const userPath = req.query.path;
    if (!appName || !userPath) {
      return res.status(400).json({ success: false, message: 'Parameter tidak lengkap.' });
    }

    const fullAppRoot = getPythonAppRoot(appName);
    const safePath = resolvePythonAppPath(fullAppRoot, userPath);

    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    return res.download(safePath, path.basename(safePath));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengunduh file.' });
  }
});

module.exports = router;
