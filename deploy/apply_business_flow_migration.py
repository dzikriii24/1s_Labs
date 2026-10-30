import paramiko
import sys

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\Downloads\1sLabs-website\deploy\check_mail_infra.py"  # will use id_rsa
PASSPHRASE = "Rabbani2401*"

with open(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\.env') as f:
    cfg = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))

sql_statements = """
-- 1. Safely add columns to users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER role,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64) DEFAULT NULL AFTER email_verified,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at DATETIME DEFAULT NULL AFTER email_verification_token_hash,
  ADD COLUMN IF NOT EXISTS status ENUM('pending_verification', 'active', 'suspended', 'disabled') NOT NULL DEFAULT 'pending_verification' AFTER email_verification_expires_at,
  ADD COLUMN IF NOT EXISTS pending_email VARCHAR(191) DEFAULT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS pending_email_token_hash VARCHAR(64) DEFAULT NULL AFTER pending_email,
  ADD COLUMN IF NOT EXISTS pending_email_expires_at DATETIME DEFAULT NULL AFTER pending_email_token_hash,
  ADD COLUMN IF NOT EXISTS password_reset_token_hash VARCHAR(64) DEFAULT NULL AFTER pending_email_expires_at,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at DATETIME DEFAULT NULL AFTER password_reset_token_hash;

-- Grandfather existing users so they are not blocked
UPDATE users SET email_verified = 1, status = 'active' WHERE email_verified = 0;

-- 2. Safely add domain columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS domain VARCHAR(255) DEFAULT NULL AFTER plan_id,
  ADD COLUMN IF NOT EXISTS domain_type ENUM('new', 'existing') NOT NULL DEFAULT 'existing' AFTER domain;

-- 3. Safely add admin_notes to payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL AFTER notes;

-- 4. Safely add billing dates to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS billing_start_date DATETIME DEFAULT NULL AFTER period,
  ADD COLUMN IF NOT EXISTS billing_end_date DATETIME DEFAULT NULL AFTER billing_start_date;

-- 5. Create domain_reservations table
CREATE TABLE IF NOT EXISTS domain_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  order_id INT DEFAULT NULL,
  service_id INT DEFAULT NULL,
  status ENUM('pending_payment', 'active', 'released') NOT NULL DEFAULT 'pending_payment',
  reserved_until DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain_user (user_id),
  INDEX idx_domain_status (status),
  INDEX idx_domain_reserved (reserved_until),
  CONSTRAINT fk_domain_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create email_logs table for audit & retry
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT DEFAULT NULL,
  metadata_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME DEFAULT NULL,
  INDEX idx_email_recipient (recipient),
  INDEX idx_email_status (status),
  INDEX idx_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

pkey = paramiko.RSAKey.from_private_key_file(r"C:\Users\dzikri\.ssh\id_rsa", password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/migration_flow.sql', 'w') as f:
    f.write(sql_statements)
sftp.close()

cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} < /home/u1zh8984/migration_flow.sql && rm -f /home/u1zh8984/migration_flow.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
err = stderr.read().decode('utf-8')
if err and "warning" not in err.lower():
    print("Migration Error:", err)
    sys.exit(1)

print("[OK] Database migration applied successfully!")

# Verify table structures
stdin, stdout, stderr = ssh.exec_command(f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e 'DESCRIBE users; DESCRIBE orders; SHOW TABLES;'")
print(stdout.read().decode('utf-8'))

ssh.close()
