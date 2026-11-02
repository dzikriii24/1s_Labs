const { query } = require('../src/db');

async function runMigration() {
  console.log('[Migration] Creating resource optimization tables...');

  await query(`
    CREATE TABLE IF NOT EXISTS resource_optimization_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trigger_type VARCHAR(32) NOT NULL DEFAULT 'auto',
      level VARCHAR(32) NOT NULL DEFAULT 'level_1_normal',
      status_badge VARCHAR(32) NOT NULL DEFAULT 'optimal',
      dry_run TINYINT(1) NOT NULL DEFAULT 0,
      metrics_before JSON NULL,
      metrics_after JSON NULL,
      actions_taken JSON NULL,
      summary TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_level (level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS resource_metrics_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cpu_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
      mem_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
      mem_used_mb INT NOT NULL DEFAULT 0,
      mem_limit_mb INT NOT NULL DEFAULT 1024,
      ep_used INT NOT NULL DEFAULT 0,
      ep_limit INT NOT NULL DEFAULT 12,
      nproc_used INT NOT NULL DEFAULT 0,
      nproc_limit INT NOT NULL DEFAULT 100,
      io_kbps DECIMAL(10,2) NOT NULL DEFAULT 0,
      iops INT NOT NULL DEFAULT 0,
      inodes_used INT NOT NULL DEFAULT 0,
      status_badge VARCHAR(32) NOT NULL DEFAULT 'optimal',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_history_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS resource_protection_settings (
      setting_key VARCHAR(64) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const defaults = [
    ['auto_optimization_enabled', 'true'],
    ['dry_run_mode', 'false'],
    ['manual_override', 'false'],
    ['hysteresis_seconds', '180'],
    ['warning_threshold', '70'],
    ['high_usage_threshold', '80'],
    ['critical_threshold', '90'],
    ['emergency_threshold', '95'],
    ['last_optimization_level', 'level_1_normal'],
    ['last_optimization_time', new Date().toISOString()]
  ];

  for (const [key, val] of defaults) {
    await query(
      `INSERT INTO resource_protection_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_key = setting_key`,
      [key, val]
    );
  }

  const tables = await query("SHOW TABLES LIKE 'resource_%'");
  console.log('[Migration] Success! Tables:', tables);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});

