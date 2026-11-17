#!/usr/bin/env node
/**
 * Ensures local MySQL database `u1zh8984_oneslabs` has minimal required base tables (`users`)
 * plus all Blog, SEO Intelligence, and AI Content Automation schemas for offline/local integration testing.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { query } = require('../src/db');
const { ensureBlogSchema } = require('../src/services/blog/blogSchema.service');
const { ensureAutomationSchema } = require('../src/services/automation/automationSchema.service');

async function main() {
  // Minimal users table matching backend/src/middleware/auth.js queries
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      username VARCHAR(100) DEFAULT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      phone VARCHAR(40) DEFAULT NULL,
      password VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      role_title VARCHAR(100) DEFAULT NULL,
      email_verified TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Ensure missing columns if created previously without them
  const cols = await query('SHOW COLUMNS FROM users');
  const colNames = new Set(cols.map((c) => c.Field));
  if (!colNames.has('phone')) {
    await query('ALTER TABLE users ADD COLUMN phone VARCHAR(40) DEFAULT NULL AFTER email');
  }
  if (!colNames.has('email_verified')) {
    await query('ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 AFTER role_title');
  }

  await ensureBlogSchema();
  await ensureAutomationSchema();

  const tables = await query('SHOW TABLES');
  console.log(`[Bootstrap] Local DB ready. Total tables: ${tables.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Bootstrap] Error:', err.message);
  process.exit(1);
});
