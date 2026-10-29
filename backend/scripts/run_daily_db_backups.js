const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const BACKUPS_DIR = process.env.BACKUPS_DIR ||
  (fs.existsSync('/home/u1zh8984/backups/databases')
    ? '/home/u1zh8984/backups/databases'
    : path.resolve(__dirname, '../../storage/backups/databases'));

// Helper to format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function runBackupForDatabase(conn, dbRecord, isManual = false) {
  const dbName = dbRecord.db_name;
  const dbUser = process.env.DB_USER || 'u1zh8984_oneslabs';
  const dbPass = process.env.DB_PASS || 'Rabbani2401*';
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT || '3306';

  const targetDir = path.join(BACKUPS_DIR, dbName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true, mode: 0o700 });
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
  const typePrefix = isManual ? 'snapshot' : 'auto';
  const filename = `${dbName}_${typePrefix}_${dateStr}.sql`;
  const filePath = path.join(targetDir, filename);

  console.log(`[Backup] Starting ${typePrefix} backup for database: ${dbName} -> ${filename}`);

  return new Promise((resolve, reject) => {
    const dumpArgs = [
      `-h${dbHost}`,
      `-P${dbPort}`,
      `-u${dbUser}`,
      `-p${dbPass}`,
      '--single-transaction',
      '--quick',
      '--routines',
      '--triggers',
      '--no-tablespaces',
      dbName
    ];

    const child = spawn('mysqldump', dumpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    const writeStream = fs.createWriteStream(filePath, { flags: 'w', mode: 0o600 });
    let stderrData = '';

    child.stdout.pipe(writeStream);
    child.stderr.on('data', chunk => {
      stderrData += chunk.toString();
    });

    child.on('close', async (code) => {
      writeStream.close();
      if (code !== 0) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error(`[Backup ERR] mysqldump failed for ${dbName} (code ${code}):`, stderrData);
        return reject(new Error(stderrData || `mysqldump exited with code ${code}`));
      }

      const stat = fs.statSync(filePath);
      const sizeFormatted = formatBytes(stat.size);

      // Insert record to hosting_database_backups
      await conn.query(
        `INSERT INTO hosting_database_backups 
         (service_id, database_id, database_name, backup_type, filename, file_path, file_size, file_size_formatted, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          dbRecord.service_id,
          dbRecord.id,
          dbName,
          isManual ? 'manual' : 'daily_auto',
          filename,
          filePath,
          stat.size,
          sizeFormatted
        ]
      );

      console.log(`[Backup OK] ${filename} created (${sizeFormatted}) and recorded.`);

      // Retention cleanup: Keep last 14 automated backups for this database
      if (!isManual) {
        try {
          const [oldBackups] = await conn.query(
            `SELECT id, file_path FROM hosting_database_backups
             WHERE database_id = ? AND backup_type = 'daily_auto'
             ORDER BY created_at DESC LIMIT 100 OFFSET 14`,
            [dbRecord.id]
          );
          for (const old of oldBackups) {
            if (fs.existsSync(old.file_path)) {
              fs.unlinkSync(old.file_path);
            }
            await conn.query('DELETE FROM hosting_database_backups WHERE id = ?', [old.id]);
            console.log(`[Retention] Cleaned up older backup id ${old.id}`);
          }
        } catch (cleanErr) {
          console.warn('[Retention Notice]:', cleanErr.message);
        }
      }

      resolve({ filename, filePath, size: stat.size, sizeFormatted });
    });

    child.on('error', (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function main() {
  console.log('=== 1sLabs Automated Cloud Database Backup Runner ===');
  console.log('Timestamp:', new Date().toISOString());

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'u1zh8984_oneslabs',
    password: process.env.DB_PASS || 'Rabbani2401*',
    database: process.env.DB_NAME || 'u1zh8984_oneslabs'
  });

  try {
    // If specific database passed via args
    const targetDbName = process.argv[2];
    let sql = `
      SELECT d.id, d.service_id, d.db_name, d.db_user
      FROM hosting_databases d
      JOIN hosting_services s ON d.service_id = s.id
      WHERE s.status IN ('active', 'pending_provisioning')
    `;
    const params = [];
    if (targetDbName) {
      sql += ' AND d.db_name = ?';
      params.push(targetDbName);
    }

    const [rows] = await conn.query(sql, params);
    console.log(`Found ${rows.length} database(s) to backup.`);

    for (const db of rows) {
      try {
        await runBackupForDatabase(conn, db, false);
      } catch (err) {
        console.error(`Failed to backup ${db.db_name}:`, err.message);
      }
    }

    console.log('=== All database backups completed successfully ===');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal backup runner error:', err);
    process.exit(1);
  });
}

module.exports = {
  runBackupForDatabase,
  BACKUPS_DIR,
  formatBytes
};
