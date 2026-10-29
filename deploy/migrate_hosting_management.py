import paramiko
import sys
import os

# Ensure UTF-8
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

env_file = r"c:\Users\dzikri\Downloads\1sLabs-website\backend\.env"
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

db_user = env_vars.get('users', 'u1zh8984_oneslabs')
db_name = env_vars.get('db', 'u1zh8984_oneslabs')
db_pw = env_vars.get('pw', 'Rabbani2401*')

sql_migration = """
-- 1. Tabel Hosting FTP Accounts
CREATE TABLE IF NOT EXISTS hosting_ftp_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  homedir VARCHAR(255) NOT NULL,
  quota_mb INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ftp_service (service_id),
  CONSTRAINT fk_ftp_service FOREIGN KEY (service_id) REFERENCES hosting_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Hosting Databases
CREATE TABLE IF NOT EXISTS hosting_databases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  db_name VARCHAR(100) NOT NULL UNIQUE,
  db_user VARCHAR(100) NOT NULL,
  db_host VARCHAR(100) NOT NULL DEFAULT 'localhost',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_db_service (service_id),
  CONSTRAINT fk_db_service FOREIGN KEY (service_id) REFERENCES hosting_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Hosting Audit Logs
CREATE TABLE IF NOT EXISTS hosting_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

print(f"Connecting to {USERNAME}@{HOSTNAME} to run hosting management migration...")
pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

sftp = ssh.open_sftp()
remote_sql_path = "/home/u1zh8984/hosting_management_migration.sql"
with sftp.file(remote_sql_path, "w") as f:
    f.write(sql_migration)
sftp.close()

cmd = f"mysql -u {db_user} -p'{db_pw}' {db_name} < {remote_sql_path} && rm -f {remote_sql_path}"
stdin, stdout, stderr = ssh.exec_command(cmd)
err = stderr.read().decode('utf-8')
if err and "warning" not in err.lower():
    print("Migration Error:", err)
    sys.exit(1)

print("[OK] Hosting management tables created successfully!")

stdin, stdout, stderr = ssh.exec_command(f"mysql -u {db_user} -p'{db_pw}' {db_name} -e 'SHOW TABLES LIKE \"hosting_%\";'")
print("Verified hosting tables:")
print(stdout.read().decode('utf-8'))

ssh.close()
