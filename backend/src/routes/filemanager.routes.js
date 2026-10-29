const express = require('express');
const router = express.Router({ mergeParams: true });
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { resolveSafePath, ensureServiceRoot, getServiceRoot } = require('../utils/fileSandbox');

// Verify service ownership and get service record
async function verifyServiceAccess(req, res, next) {
  try {
    const { serviceCode } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT s.*, p.storage_gb, p.name as plan_name 
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
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
        message: 'Layanan hosting tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    const service = rows[0];
    if (service.status !== 'active' && service.status !== 'pending_provisioning' && !isUserAdmin) {
      return res.status(403).json({
        success: false,
        message: `Layanan berstatus '${service.status}'. File manager hanya tersedia untuk layanan aktif.`
      });
    }

    req.service = service;
    // Ensure service folder exists
    ensureServiceRoot(service.service_code, service.domain || 'website-anda.com');
    next();
  } catch (error) {
    console.error('Verify service error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi akses hosting.' });
  }
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const relPath = req.query.path || req.body.path || '';
      const dest = resolveSafePath(req.params.serviceCode, relPath, req.service?.domain);
      if (!fs.existsSync(dest) || !fs.statSync(dest).isDirectory()) {
        return cb(new Error('Direktori tujuan upload tidak ditemukan.'));
      }
      cb(null, dest);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper to calculate directory size recursively
function getDirectorySize(dirPath) {
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const full = path.join(dirPath, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        total += getDirectorySize(full);
      } else {
        total += stat.size;
      }
    }
  } catch (e) {
    // ignore unreadable
  }
  return total;
}

// 1. GET /files - List directory items
router.get('/', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const relPath = req.query.path || '';
    const safePath = resolveSafePath(serviceCode, relPath, req.service?.domain);
    const root = getServiceRoot(serviceCode, req.service?.domain);

    if (!fs.existsSync(safePath) || !fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({
        success: false,
        message: 'Direktori tidak ditemukan.'
      });
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

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // Compute relative path from service root for breadcrumb
    const relativeToRoot = path.relative(root, safePath).replace(/\\/g, '/');
    const cleanRelPath = relativeToRoot === '' ? '/' : '/' + relativeToRoot;

    // Calculate total disk usage of public_html
    const totalBytes = getDirectorySize(root);

    return res.json({
      success: true,
      currentPath: cleanRelPath,
      items,
      totalUsageBytes: totalBytes,
      totalUsageFormatted: formatBytes(totalBytes)
    });
  } catch (error) {
    console.error('List files error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal membaca direktori.' });
  }
});

// 2. GET /content - Read text file content
router.get('/content', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const relPath = req.query.path;
    if (!relPath) {
      return res.status(400).json({ success: false, message: 'Parameter path file wajib diisi.' });
    }

    const safePath = resolveSafePath(serviceCode, relPath, req.service?.domain);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    const stat = fs.statSync(safePath);
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar untuk dibuka di browser (maksimum 5 MB).'
      });
    }

    const content = fs.readFileSync(safePath, 'utf8');
    return res.json({
      success: true,
      path: relPath,
      name: path.basename(safePath),
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      content
    });
  } catch (error) {
    console.error('Read file content error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal membaca file.' });
  }
});

// 3. POST /content - Save text file content
router.post('/content', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { path: relPath, content } = req.body;

    if (!relPath) {
      return res.status(400).json({ success: false, message: 'Path file wajib diisi.' });
    }

    const safePath = resolveSafePath(serviceCode, relPath, req.service?.domain);
    fs.writeFileSync(safePath, content || '', 'utf8');

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'file_edit', ?, ?, ?)`,
      [req.service.id, req.user.id, relPath, req.ip || '127.0.0.1', JSON.stringify({ bytes: (content || '').length })]
    );

    return res.json({
      success: true,
      message: 'Perubahan file berhasil disimpan.'
    });
  } catch (error) {
    console.error('Save file error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal menyimpan file.' });
  }
});

// 4. POST /mkdir - Create directory
router.post('/mkdir', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { path: relPath, name } = req.body;

    if (!name || !/^[a-zA-Z0-9._-]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nama folder hanya boleh mengandung huruf, angka, titik, strip, atau underscore.'
      });
    }

    const parentPath = resolveSafePath(serviceCode, relPath || '', req.service?.domain);
    const newDirSafe = resolveSafePath(serviceCode, path.join(relPath || '', name.trim()), req.service?.domain);

    if (fs.existsSync(newDirSafe)) {
      return res.status(409).json({ success: false, message: 'Folder dengan nama tersebut sudah ada.' });
    }

    fs.mkdirSync(newDirSafe, { recursive: true, mode: 0o755 });

    return res.json({
      success: true,
      message: `Folder '${name.trim()}' berhasil dibuat.`
    });
  } catch (error) {
    console.error('Mkdir error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal membuat folder.' });
  }
});

// 4b. POST /create - Create a new empty or initial file
router.post('/create', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { path: relPath, name, content = '' } = req.body;

    if (!name || !/^[a-zA-Z0-9._-]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nama file hanya boleh mengandung huruf, angka, titik, strip, atau underscore (contoh: index.php, style.css).'
      });
    }

    const cleanName = name.trim();
    const filePath = path.join(relPath || '', cleanName);
    const safePath = resolveSafePath(serviceCode, filePath, req.service?.domain);

    if (fs.existsSync(safePath)) {
      return res.status(409).json({ success: false, message: `File '${cleanName}' sudah ada di folder ini.` });
    }

    fs.writeFileSync(safePath, content || '', 'utf8');

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'file_create', ?, ?, ?)`,
      [req.service.id, req.user.id, filePath, req.ip || '127.0.0.1', JSON.stringify({ name: cleanName })]
    );

    return res.json({
      success: true,
      message: `File '${cleanName}' berhasil dibuat.`,
      file: {
        path: filePath.replace(/\\/g, '/'),
        name: cleanName
      }
    });
  } catch (error) {
    console.error('Create file error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal membuat file baru.' });
  }
});

// 5. POST /rename - Rename file or directory
router.post('/rename', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { oldPath, newName } = req.body;

    if (!oldPath || !newName) {
      return res.status(400).json({ success: false, message: 'oldPath dan newName wajib diisi.' });
    }

    const cleanNewName = path.basename(newName.trim());
    if (!cleanNewName || !/^[a-zA-Z0-9._-]+$/.test(cleanNewName)) {
      return res.status(400).json({ success: false, message: 'Format nama baru tidak valid.' });
    }

    const safeOld = resolveSafePath(serviceCode, oldPath, req.service?.domain);
    if (!fs.existsSync(safeOld)) {
      return res.status(404).json({ success: false, message: 'Target file/folder tidak ditemukan.' });
    }

    const parentDir = path.dirname(safeOld);
    const safeNew = path.join(parentDir, cleanNewName);

    // Verify boundary of new path
    resolveSafePath(serviceCode, path.relative(getServiceRoot(serviceCode, req.service?.domain), safeNew), req.service?.domain);

    if (fs.existsSync(safeNew)) {
      return res.status(409).json({ success: false, message: 'Nama tersebut sudah digunakan.' });
    }

    fs.renameSync(safeOld, safeNew);

    return res.json({
      success: true,
      message: 'Nama berhasil diubah.'
    });
  } catch (error) {
    console.error('Rename error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal mengubah nama.' });
  }
});

// 6. POST /delete - Delete file or directory
router.post('/delete', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { path: relPath } = req.body;

    if (!relPath || relPath === '/' || relPath === '') {
      return res.status(400).json({ success: false, message: 'Root direktori tidak boleh dihapus.' });
    }

    const safePath = resolveSafePath(serviceCode, relPath, req.service?.domain);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ success: false, message: 'File atau folder tidak ditemukan.' });
    }

    fs.rmSync(safePath, { recursive: true, force: true });

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'file_delete', ?, ?)`,
      [req.service.id, req.user.id, relPath, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: 'File atau folder berhasil dihapus.'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal menghapus file/folder.' });
  }
});

// 7. POST /upload - Upload file(s)
router.post('/upload', requireAuth, verifyServiceAccess, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
    }

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'file_upload', ?, ?, ?)`,
      [
        req.service.id,
        req.user.id,
        req.query.path || '/',
        req.ip || '127.0.0.1',
        JSON.stringify({ count: files.length, names: files.map(f => f.filename) })
      ]
    );

    return res.json({
      success: true,
      message: `${files.length} file berhasil diunggah.`,
      uploadedFiles: files.map(f => ({ name: f.filename, size: f.size }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal mengunggah file.' });
  }
});

// 8. GET /download - Download a file
router.get('/download', requireAuth, verifyServiceAccess, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const relPath = req.query.path;

    if (!relPath) {
      return res.status(400).json({ success: false, message: 'Parameter path wajib diisi.' });
    }

    const safePath = resolveSafePath(serviceCode, relPath, req.service?.domain);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }

    return res.download(safePath, path.basename(safePath));
  } catch (error) {
    console.error('Download error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal mengunduh file.' });
  }
});

module.exports = router;
