import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

remote_js = """
const db = require('./src/db');

(async () => {
  try {
    const createSql = `
    CREATE TABLE IF NOT EXISTS hosting_analytics (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      service_code VARCHAR(50) NOT NULL,
      domain VARCHAR(255) NOT NULL,
      event_type ENUM('pageview', 'click') NOT NULL DEFAULT 'pageview',
      page_url VARCHAR(500) NOT NULL,
      page_path VARCHAR(255) NOT NULL,
      page_title VARCHAR(255) DEFAULT '',
      referrer VARCHAR(500) DEFAULT '',
      visitor_id VARCHAR(64) NOT NULL,
      element_text VARCHAR(255) DEFAULT NULL,
      element_tag VARCHAR(50) DEFAULT NULL,
      device VARCHAR(50) DEFAULT 'Desktop',
      browser VARCHAR(50) DEFAULT 'Chrome',
      screen_resolution VARCHAR(50) DEFAULT '',
      ip_address VARCHAR(45) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_srv_created (service_code, created_at),
      INDEX idx_srv_visitor (service_code, visitor_id),
      INDEX idx_srv_path (service_code, page_path),
      INDEX idx_srv_event (service_code, event_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db.query(createSql);
    console.log("TABLE hosting_analytics CREATED SUCCESSFULLY!");

    // No dummy data seeded - purely real-time live visitor events
    console.log("Analytics table ready for real-time traffic tracking.");

    const rows = await db.query("SELECT COUNT(*) as total FROM hosting_analytics");
    console.log("TOTAL ANALYTICS ROWS:", rows[0].total);
    process.exit(0);
  } catch(e) {
    console.error("Migration error:", e);
    process.exit(1);
  }
})();
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/create_analytics.js', 'w') as f:
    f.write(remote_js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node create_analytics.js && rm -f create_analytics.js")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
