const express = require('express');
const router = express.Router({ mergeParams: true });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const { query, pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { mysqlService } = require('../services/cpanel.service');

// Configure temporary upload folder for .sql imports
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
}
const uploadSql = multer({
  dest: tempDir,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Verify service access
async function verifyService(req, res, next) {
  try {
    const { serviceCode } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT s.*, p.databases_count 
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
      return res.status(404).json({ success: false, message: 'Layanan hosting tidak ditemukan.' });
    }

    req.service = rows[0];
    next();
  } catch (error) {
    console.error('Verify service error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi layanan.' });
  }
}

// 1. GET /databases - List databases for service
router.get('/', requireAuth, verifyService, async (req, res) => {
  try {
    const databases = await query(
      'SELECT id, db_name, db_user, db_host, created_at FROM hosting_databases WHERE service_id = ? ORDER BY created_at DESC',
      [req.service.id]
    );

    // Get table count and size for each database from information_schema
    const enriched = await Promise.all(
      databases.map(async (db) => {
        try {
          const [stats] = await query(
            `SELECT COUNT(*) as table_count, 
                    COALESCE(SUM(data_length + index_length), 0) as total_size_bytes 
             FROM information_schema.tables 
             WHERE table_schema = ?`,
            [db.db_name]
          );
          return {
            ...db,
            tableCount: stats ? stats.table_count : 0,
            sizeBytes: stats ? stats.total_size_bytes : 0,
            sizeFormatted: stats ? (stats.total_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'
          };
        } catch (e) {
          return {
            ...db,
            tableCount: 0,
            sizeBytes: 0,
            sizeFormatted: '0 MB'
          };
        }
      })
    );

    return res.json({
      success: true,
      databases: enriched,
      quota: {
        allowed: req.service.databases_count,
        used: databases.length
      },
      connectionDefault: {
        host: 'localhost',
        port: 3306,
        type: 'MySQL / MariaDB'
      }
    });
  } catch (error) {
    console.error('Fetch databases error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar database.' });
  }
});

// 2. POST /databases - Create database & user via cPanel UAPI
router.post('/', requireAuth, verifyService, async (req, res) => {
  try {
    const { nameSuffix, customPassword } = req.body;

    if (!nameSuffix || !/^[a-zA-Z0-9_]{2,10}$/.test(nameSuffix.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nama database harus 2-10 karakter huruf, angka, atau underscore.'
      });
    }

    // Check plan quota limit
    const existingCount = await query(
      'SELECT COUNT(*) as count FROM hosting_databases WHERE service_id = ?',
      [req.service.id]
    );
    const used = existingCount[0]?.count || 0;
    if (req.service.databases_count !== -1 && used >= req.service.databases_count) {
      return res.status(400).json({
        success: false,
        message: `Batas kuota database paket Anda telah tercapai (${req.service.databases_count} database). Silakan upgrade paket untuk menambah database.`
      });
    }

    const cleanSuffix = nameSuffix.trim().toLowerCase();
    const cpanelPrefix = (process.env.DB_USER || 'u1zh8984').split('_')[0] + '_';

    // Unique naming convention with required cPanel prefix
    const dbSuffix = `s${req.service.id}_${cleanSuffix}`;
    // MySQL username max length limit in cPanel is 16 chars: 9 chars prefix + max 7 chars
    const userSuffix = `u${req.service.id}_${cleanSuffix}`.replace(/[^a-z0-9]/g, '').slice(0, 6);

    const fullDbName = `${cpanelPrefix}${dbSuffix}`;
    const fullUserName = `${cpanelPrefix}${userSuffix}`;

    // Generate strong password if not provided
    const password = customPassword || (crypto.randomBytes(6).toString('hex') + 'Aa1*');

    // Check if already registered in our DB
    const duplicate = await query('SELECT id FROM hosting_databases WHERE db_name = ?', [fullDbName]);
    if (duplicate.length > 0) {
      return res.status(409).json({ success: false, message: 'Database dengan nama tersebut sudah ada.' });
    }

    // 1. Create database in cPanel (must include full required prefix)
    try {
      await mysqlService.createDatabase(fullDbName);
    } catch (uapiErr) {
      console.warn('cPanel createDatabase notice:', uapiErr.message);
      if (!uapiErr.message.includes('already exists') && !uapiErr.message.includes('simulated')) {
        return res.status(400).json({
          success: false,
          message: `Gagal membuat database di cPanel: ${uapiErr.message}`
        });
      }
    }

    // 2. Create MySQL User in cPanel (must include full required prefix)
    try {
      await mysqlService.createUser(fullUserName, password);
    } catch (userErr) {
      console.warn('cPanel createUser notice:', userErr.message);
    }

    // 3. Grant privileges strictly on this database to customer user
    try {
      await mysqlService.setPrivileges(fullDbName, fullUserName, 'ALL PRIVILEGES');
    } catch (privErr) {
      console.warn('cPanel setPrivileges notice:', privErr.message);
    }

    // 3b. Also grant privileges to platform backend user so the web dashboard can query it
    try {
      const masterUser = process.env.DB_USER || `${cpanelPrefix}oneslabs`;
      await mysqlService.setPrivileges(fullDbName, masterUser, 'ALL PRIVILEGES');
    } catch (masterPrivErr) {
      console.warn('cPanel setPrivileges master notice:', masterPrivErr.message);
    }


    // 4. Save record to hosting_databases
    const insert = await query(
      `INSERT INTO hosting_databases (service_id, db_name, db_user, db_host)
       VALUES (?, ?, ?, 'localhost')`,
      [req.service.id, fullDbName, fullUserName]
    );

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'db_create', ?, ?)`,
      [req.service.id, req.user.id, fullDbName, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: `Database '${fullDbName}' berhasil dibuat!`,
      database: {
        id: insert.insertId,
        db_name: fullDbName,
        db_user: fullUserName,
        db_password: password,
        db_host: 'localhost',
        port: 3306
      }
    });
  } catch (error) {
    console.error('Create database error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal membuat database.' });
  }
});

// 3. GET /databases/:id/tables - Browse tables in customer's database
router.get('/:id/tables', requireAuth, verifyService, async (req, res) => {
  try {
    const dbId = parseInt(req.params.id, 10);
    const rows = await query(
      'SELECT id, db_name, db_user FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];

    // Fetch tables securely from information_schema
    const tables = await query(
      `SELECT table_name, table_rows, data_length, index_length, create_time, update_time 
       FROM information_schema.tables 
       WHERE table_schema = ? 
       ORDER BY table_name ASC`,
      [dbRecord.db_name]
    );

    const formatted = tables.map(t => ({
      name: t.TABLE_NAME || t.table_name,
      rows: t.TABLE_ROWS || t.table_rows || 0,
      sizeBytes: (t.DATA_LENGTH || t.data_length || 0) + (t.INDEX_LENGTH || t.index_length || 0),
      createdAt: t.CREATE_TIME || t.create_time,
      updatedAt: t.UPDATE_TIME || t.update_time
    }));

    return res.json({
      success: true,
      database: dbRecord.db_name,
      tables: formatted
    });
  } catch (error) {
    console.error('Fetch tables error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat tabel database.' });
  }
});

// 4. GET /databases/:id/tables/:tableName/records - View table records
router.get('/:id/tables/:tableName/records', requireAuth, verifyService, async (req, res) => {
  try {
    const dbId = parseInt(req.params.id, 10);
    const { tableName } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const rows = await query(
      'SELECT id, db_name FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];

    // Strict validation of table existence in this database
    const verifyTable = await query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [dbRecord.db_name, tableName]
    );

    if (verifyTable.length === 0) {
      return res.status(404).json({ success: false, message: 'Tabel tidak ditemukan pada database ini.' });
    }

    // Get column definitions
    const columns = await query(
      `SELECT column_name, data_type, is_nullable, column_key, column_default 
       FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = ? 
       ORDER BY ordinal_position ASC`,
      [dbRecord.db_name, tableName]
    );

    // Escape database and table name with backticks to prevent injection
    const escapedDb = dbRecord.db_name.replace(/`/g, '``');
    const escapedTable = tableName.replace(/`/g, '``');

    // Get total count
    const [countResult] = await query(`SELECT COUNT(*) as total FROM \`${escapedDb}\`.\`${escapedTable}\``);
    const totalRecords = countResult?.total || 0;

    // Fetch paginated data
    const records = await query(
      `SELECT * FROM \`${escapedDb}\`.\`${escapedTable}\` LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.json({
      success: true,
      tableName,
      columns: columns.map(c => ({
        name: c.COLUMN_NAME || c.column_name,
        type: c.DATA_TYPE || c.data_type,
        isNullable: (c.IS_NULLABLE || c.is_nullable) === 'YES',
        key: c.COLUMN_KEY || c.column_key
      })),
      records,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error) {
    console.error('Fetch table records error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat isi tabel.' });
  }
});

// 5. DELETE /databases/:id - Delete database
router.delete('/:id', requireAuth, verifyService, async (req, res) => {
  try {
    const dbId = parseInt(req.params.id, 10);
    const rows = await query(
      'SELECT id, db_name, db_user FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];

    // Delete database in cPanel UAPI
    try {
      await mysqlService.deleteDatabase(dbRecord.db_name);
    } catch (uapiErr) {
      console.warn('cPanel deleteDatabase notice:', uapiErr.message);
    }

    // Delete MySQL user in cPanel
    try {
      await mysqlService.deleteUser(dbRecord.db_user);
    } catch (userErr) {
      console.warn('cPanel deleteUser notice:', userErr.message);
    }

    // Delete record from DB
    await query('DELETE FROM hosting_databases WHERE id = ?', [dbId]);

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address)
       VALUES (?, ?, 'db_delete', ?, ?)`,
      [req.service.id, req.user.id, dbRecord.db_name, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: `Database '${dbRecord.db_name}' berhasil dihapus.`
    });
  } catch (error) {
    console.error('Delete database error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal menghapus database.' });
  }
});

// POST /databases/:id/query - Execute SQL query inside customer's database (CREATE TABLE, INSERT, etc.)
router.post('/:id/query', requireAuth, verifyService, async (req, res) => {
  try {
    const dbId = parseInt(req.params.id, 10);
    const { sql } = req.body;

    if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Kueri SQL wajib diisi.' });
    }

    const rows = await query(
      'SELECT id, db_name, db_user FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];

    // Security check: Block attempts to access system schemas or switch database
    const lower = sql.toLowerCase();
    if (lower.includes('information_schema') || lower.includes('performance_schema') || lower.includes('mysql.') || /\buse\s+[a-z0-9_]+/i.test(sql)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Kueri tidak diizinkan mengakses database sistem atau berpindah schema database.'
      });
    }

    // Execute query strictly inside customer's database
    const { executeInDatabase } = require('../db');
    const result = await executeInDatabase(dbRecord.db_name, sql);

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'db_query_execute', ?, ?, ?)`,
      [req.service.id, req.user.id, dbRecord.db_name, req.ip || '127.0.0.1', JSON.stringify({ snippet: sql.slice(0, 150) })]
    );

    let message = 'Kueri SQL berhasil dieksekusi.';
    if (result && result.affectedRows !== undefined) {
      message += ` (${result.affectedRows} baris terpengaruh)`;
    }

    return res.json({
      success: true,
      message,
      result: Array.isArray(result) ? result.slice(0, 50) : result
    });
  } catch (error) {
    console.error('Execute query error:', error);
    return res.status(400).json({
      success: false,
      message: `Error SQL: ${error.message}`
    });
  }
});

// 7. GET /databases/:id/export - Export database as .sql dump
router.get('/:id/export', requireAuth, verifyService, async (req, res) => {
  try {
    const dbId = parseInt(req.params.id, 10);
    const rows = await query(
      'SELECT id, db_name, db_user FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];
    const targetDb = dbRecord.db_name;
    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbPort = process.env.DB_PORT || '3306';
    const dbUser = process.env.DB_USER || 'u1zh8984_oneslabs';
    const dbPass = process.env.DB_PASS || 'Rabbani2401*';

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `${targetDb}_backup_${timestamp}.sql`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const dumpProc = spawn('mysqldump', [
      `--host=${dbHost}`,
      `--port=${dbPort}`,
      `--user=${dbUser}`,
      `--password=${dbPass}`,
      '--no-tablespaces',
      '--routines',
      '--triggers',
      '--single-transaction',
      '--add-drop-table',
      targetDb
    ]);

    dumpProc.stdout.pipe(res);

    dumpProc.stderr.on('data', (errData) => {
      console.warn('mysqldump notice:', errData.toString());
    });

    dumpProc.on('error', (err) => {
      console.error('mysqldump process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Gagal mengekspor database.' });
      }
    });

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'db_export', ?, ?, ?)`,
      [req.service.id, req.user.id, targetDb, req.ip || '127.0.0.1', JSON.stringify({ filename })]
    );
  } catch (error) {
    console.error('Export DB error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mengekspor database.' });
    }
  }
});

// 8. POST /databases/:id/import - Import .sql file or raw SQL into database
router.post('/:id/import', requireAuth, verifyService, uploadSql.single('sqlFile'), async (req, res) => {
  let tempFilePath = null;
  try {
    const dbId = parseInt(req.params.id, 10);
    const rows = await query(
      'SELECT id, db_name, db_user FROM hosting_databases WHERE id = ? AND service_id = ?',
      [dbId, req.service.id]
    );

    if (rows.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }

    const dbRecord = rows[0];
    const targetDb = dbRecord.db_name;
    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbPort = process.env.DB_PORT || '3306';
    const dbUser = process.env.DB_USER || 'u1zh8984_oneslabs';
    const dbPass = process.env.DB_PASS || 'Rabbani2401*';

    let inputStream;
    let originalName = 'query.sql';

    if (req.file) {
      tempFilePath = req.file.path;
      originalName = req.file.originalname;
      inputStream = fs.createReadStream(tempFilePath);
    } else if (req.body.sql && typeof req.body.sql === 'string') {
      const { Readable } = require('stream');
      inputStream = Readable.from([req.body.sql]);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Harap lampirkan file .sql atau teks kueri SQL.'
      });
    }

    // Execute via mysql CLI
    const mysqlProc = spawn('mysql', [
      `--host=${dbHost}`,
      `--port=${dbPort}`,
      `--user=${dbUser}`,
      `--password=${dbPass}`,
      '--default-character-set=utf8mb4',
      targetDb
    ]);

    let stderrData = '';
    mysqlProc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    inputStream.pipe(mysqlProc.stdin);

    mysqlProc.on('close', async (code) => {
      if (tempFilePath) {
        fs.unlink(tempFilePath, () => {});
      }

      if (code !== 0) {
        return res.status(400).json({
          success: false,
          message: `Gagal mengimpor database (Kode ${code}): ${stderrData || 'Kesalahan sintaks SQL'}`
        });
      }

      // Audit log
      await query(
        `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
         VALUES (?, ?, 'db_import', ?, ?, ?)`,
        [req.service.id, req.user.id, targetDb, req.ip || '127.0.0.1', JSON.stringify({ filename: originalName })]
      );

      return res.json({
        success: true,
        message: `File '${originalName}' berhasil diimpor ke dalam database '${targetDb}'.`
      });
    });

    mysqlProc.on('error', (procErr) => {
      if (tempFilePath) fs.unlink(tempFilePath, () => {});
      console.error('MySQL spawn error:', procErr);
      return res.status(500).json({
        success: false,
        message: 'Gagal menjalankan proses pemulihan MySQL pada server.'
      });
    });
  } catch (error) {
    if (tempFilePath) fs.unlink(tempFilePath, () => {});
    console.error('Import DB error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengimpor database.'
    });
  }
});

// ==========================================
// 8. CLOUD BACKUP & RESTORE ROUTES
// ==========================================

// 8a. GET /backups - List backups for service
router.get('/backups', requireAuth, verifyService, async (req, res) => {
  try {
    const { database_id } = req.query;
    let sql = `
      SELECT b.* 
      FROM hosting_database_backups b
      WHERE b.service_id = ?
    `;
    const params = [req.service.id];
    if (database_id) {
      sql += ' AND b.database_id = ?';
      params.push(database_id);
    }
    sql += ' ORDER BY b.created_at DESC';

    const backups = await query(sql, params);
    return res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('List backups error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat riwayat cadangan database.' });
  }
});

// 8b. POST /:id/backups/create - Create manual backup snapshot on demand
router.post('/:id/backups/create', requireAuth, verifyService, async (req, res) => {
  try {
    const { id } = req.params;
    const databases = await query(
      'SELECT id, service_id, db_name FROM hosting_databases WHERE id = ? AND service_id = ?',
      [id, req.service.id]
    );
    if (databases.length === 0) {
      return res.status(404).json({ success: false, message: 'Database tidak ditemukan.' });
    }
    const dbRecord = databases[0];

    const { runBackupForDatabase } = require('../../scripts/run_daily_db_backups');
    const result = await runBackupForDatabase(pool, dbRecord, true);

    // Audit log
    await query(
      `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
       VALUES (?, ?, 'db_backup_create', ?, ?, ?)`,
      [req.service.id, req.user.id, dbRecord.db_name, req.ip || '127.0.0.1', JSON.stringify({ filename: result.filename })]
    );

    return res.json({
      success: true,
      message: `Cadangan snapshot untuk database '${dbRecord.db_name}' berhasil dibuat.`,
      backup: result
    });
  } catch (error) {
    console.error('Create backup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal membuat cadangan database.' });
  }
});

// 8c. GET /backups/:backupId/download - Download backup file
router.get('/backups/:backupId/download', requireAuth, verifyService, async (req, res) => {
  try {
    const { backupId } = req.params;
    const rows = await query(
      'SELECT * FROM hosting_database_backups WHERE id = ? AND service_id = ?',
      [backupId, req.service.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File cadangan tidak ditemukan.' });
    }
    const b = rows[0];
    if (!fs.existsSync(b.file_path)) {
      return res.status(404).json({ success: false, message: 'File fisik cadangan di server tidak ditemukan.' });
    }
    return res.download(b.file_path, b.filename);
  } catch (error) {
    console.error('Download backup error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengunduh file cadangan.' });
  }
});

// 8d. POST /backups/:backupId/restore - Restore database from backup
router.post('/backups/:backupId/restore', requireAuth, verifyService, async (req, res) => {
  try {
    const { backupId } = req.params;
    const rows = await query(
      'SELECT * FROM hosting_database_backups WHERE id = ? AND service_id = ?',
      [backupId, req.service.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File cadangan tidak ditemukan.' });
    }
    const b = rows[0];
    if (!fs.existsSync(b.file_path)) {
      return res.status(404).json({ success: false, message: 'File fisik cadangan di server tidak ditemukan.' });
    }

    const dbUser = process.env.DB_USER || 'u1zh8984_oneslabs';
    const dbPass = process.env.DB_PASS || 'Rabbani2401*';
    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbPort = process.env.DB_PORT || '3306';

    const mysqlProc = spawn('mysql', [
      `--host=${dbHost}`,
      `--port=${dbPort}`,
      `--user=${dbUser}`,
      `--password=${dbPass}`,
      '--default-character-set=utf8mb4',
      b.database_name
    ]);

    let stderrData = '';
    mysqlProc.stderr.on('data', chunk => {
      stderrData += chunk.toString();
    });

    const fileStream = fs.createReadStream(b.file_path);
    fileStream.pipe(mysqlProc.stdin);

    mysqlProc.on('close', async (code) => {
      if (code !== 0) {
        return res.status(400).json({
          success: false,
          message: `Gagal memulihkan database (Kode ${code}): ${stderrData || 'Kesalahan sintaks'}`
        });
      }

      // Audit log
      await query(
        `INSERT INTO hosting_audit_logs (service_id, user_id, action, target_resource, ip_address, details)
         VALUES (?, ?, 'db_restore', ?, ?, ?)`,
        [req.service.id, req.user.id, b.database_name, req.ip || '127.0.0.1', JSON.stringify({ backupId: b.id, filename: b.filename })]
      );

      return res.json({
        success: true,
        message: `Database '${b.database_name}' berhasil dipulihkan dari cadangan '${b.filename}'.`
      });
    });

    mysqlProc.on('error', (err) => {
      console.error('Restore proc error:', err);
      return res.status(500).json({ success: false, message: 'Gagal menjalankan proses pemulihan.' });
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal memulihkan database.' });
  }
});

// 8e. DELETE /backups/:backupId - Delete a backup
router.post('/backups/:backupId/delete', requireAuth, verifyService, async (req, res) => {
  try {
    const { backupId } = req.params;
    const rows = await query(
      'SELECT * FROM hosting_database_backups WHERE id = ? AND service_id = ?',
      [backupId, req.service.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File cadangan tidak ditemukan.' });
    }
    const b = rows[0];
    if (fs.existsSync(b.file_path)) {
      try { fs.unlinkSync(b.file_path); } catch (e) {}
    }
    await query('DELETE FROM hosting_database_backups WHERE id = ?', [backupId]);
    return res.json({
      success: true,
      message: 'File cadangan berhasil dihapus.'
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus file cadangan.' });
  }
});

module.exports = router;

