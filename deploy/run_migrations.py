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

db_user = env_vars.get('users')
db_name = env_vars.get('db')
db_pw = env_vars.get('pw')

sql_script = """
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hosting_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  target VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  period VARCHAR(50) NOT NULL DEFAULT '/ tahun',
  billing_cycle_months INT NOT NULL DEFAULT 12,
  description TEXT NOT NULL,
  storage_gb INT NOT NULL DEFAULT 30,
  databases_count INT NOT NULL DEFAULT 10,
  bandwidth VARCHAR(100) NOT NULL DEFAULT 'Unmetered',
  ssl_type VARCHAR(100) NOT NULL DEFAULT 'Free Auto-SSL Let\\'s Encrypt',
  backup_frequency VARCHAR(100) NOT NULL DEFAULT 'Weekly Cloud Backup',
  email_accounts VARCHAR(100) NOT NULL DEFAULT 'Unlimited Webmail',
  is_recommended TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  features_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  plan_name_snapshot VARCHAR(191) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL,
  period_snapshot VARCHAR(50) NOT NULL,
  type ENUM('new', 'renewal') NOT NULL DEFAULT 'new',
  related_service_id INT DEFAULT NULL,
  status ENUM('unpaid', 'pending_verification', 'paid', 'cancelled', 'expired') NOT NULL DEFAULT 'unpaid',
  customer_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_user (user_id),
  INDEX idx_order_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_plan FOREIGN KEY (plan_id) REFERENCES hosting_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(64) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) NOT NULL DEFAULT 'qris',
  status ENUM('unpaid', 'pending_verification', 'paid', 'rejected', 'expired') NOT NULL DEFAULT 'unpaid',
  proof_image VARCHAR(255) DEFAULT NULL,
  sender_bank_or_wallet VARCHAR(100) DEFAULT NULL,
  sender_account_name VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  verified_by INT DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_order (order_id),
  INDEX idx_payment_user (user_id),
  INDEX idx_payment_status (status),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hosting_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_code VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  order_id INT NOT NULL,
  domain VARCHAR(255) DEFAULT NULL,
  domain_type ENUM('new', 'existing') NOT NULL DEFAULT 'existing',
  status ENUM('awaiting_domain', 'pending_provisioning', 'active', 'suspended', 'expired', 'cancelled') NOT NULL DEFAULT 'awaiting_domain',
  server_ip VARCHAR(64) NOT NULL DEFAULT '103.119.237.132',
  nameservers VARCHAR(255) NOT NULL DEFAULT 'ns1.domainmurah.net, ns2.domainmurah.net',
  cpanel_username VARCHAR(64) DEFAULT NULL,
  cpanel_url VARCHAR(255) DEFAULT 'https://1slabs.my.id:2083',
  activated_at DATETIME DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  disk_usage_mb INT NOT NULL DEFAULT 0,
  disk_limit_mb INT NOT NULL DEFAULT 30720,
  bandwidth_usage_mb INT NOT NULL DEFAULT 0,
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_user (user_id),
  INDEX idx_service_status (status),
  INDEX idx_service_domain (domain),
  CONSTRAINT fk_services_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_plan FOREIGN KEY (plan_id) REFERENCES hosting_plans(id),
  CONSTRAINT fk_services_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  payment_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  service_id INT DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('unpaid', 'paid', 'cancelled') NOT NULL DEFAULT 'paid',
  plan_name VARCHAR(191) NOT NULL,
  domain VARCHAR(255) DEFAULT NULL,
  period VARCHAR(50) NOT NULL,
  paid_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_user (user_id),
  INDEX idx_invoice_order (order_id),
  CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  actor_type ENUM('system', 'admin', 'customer') NOT NULL DEFAULT 'system',
  actor_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_service (service_id),
  CONSTRAINT fk_events_service FOREIGN KEY (service_id) REFERENCES hosting_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_verification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approve', 'reject') NOT NULL,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  reason TEXT DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_payment (payment_id),
  CONSTRAINT fk_logs_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hosting_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

print(f"Connecting to {USERNAME}@{HOSTNAME} to run migrations...")
pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# Save sql script to a temp file on server then pipe to mysql
sftp = ssh.open_sftp()
remote_sql_path = "/home/u1zh8984/oneslabs_schema.sql"
with sftp.file(remote_sql_path, "w") as f:
    f.write(sql_script)
sftp.close()

cmd = f"mysql -u {db_user} -p'{db_pw}' {db_name} < {remote_sql_path} && rm -f {remote_sql_path}"
stdin, stdout, stderr = ssh.exec_command(cmd)
err = stderr.read().decode('utf-8')
if err and "warning" not in err.lower():
    print("Migration Error:", err)
    sys.exit(1)

print("[OK] Schema created successfully!")

# Verify created tables
stdin, stdout, stderr = ssh.exec_command(f"mysql -u {db_user} -p'{db_pw}' {db_name} -e 'SHOW TABLES;'")
tables_out = stdout.read().decode('utf-8')
print("\nCurrent database tables:")
print(tables_out)

ssh.close()
