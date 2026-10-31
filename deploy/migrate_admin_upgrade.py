import paramiko
import sys

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

sql_statements = """
-- 1. Custom / Edited Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'transactional',
  subject VARCHAR(255) NOT NULL,
  heading VARCHAR(255) DEFAULT NULL,
  body_html TEXT NOT NULL,
  button_text VARCHAR(100) DEFAULT NULL,
  button_url VARCHAR(500) DEFAULT NULL,
  footer_text TEXT DEFAULT NULL,
  brand_color VARCHAR(50) DEFAULT '#000000',
  is_customized TINYINT(1) NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tpl_key (template_key),
  INDEX idx_tpl_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Activity Logs
CREATE TABLE IF NOT EXISTS system_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT DEFAULT NULL,
  actor_name VARCHAR(191) NOT NULL DEFAULT 'System',
  actor_role VARCHAR(50) NOT NULL DEFAULT 'admin',
  action VARCHAR(100) NOT NULL,
  target VARCHAR(255) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  result ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_act_created (created_at),
  INDEX idx_act_action (action),
  INDEX idx_act_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Invoice Items & Multi-service invoice support
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT NULL AFTER domain,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0.00 AFTER subtotal,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0.00 AFTER discount_amount,
  ADD COLUMN IF NOT EXISTS items_json JSON DEFAULT NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS invoice_type ENUM('hosting_order', 'manual_service') NOT NULL DEFAULT 'hosting_order' AFTER status,
  ADD COLUMN IF NOT EXISTS due_date DATETIME DEFAULT NULL AFTER billing_end_date;

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  service_category VARCHAR(100) NOT NULL DEFAULT 'hosting',
  item_name VARCHAR(191) NOT NULL,
  description TEXT DEFAULT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_item_invoice (invoice_id),
  CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Service Reports
CREATE TABLE IF NOT EXISTS service_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(64) NOT NULL UNIQUE,
  report_type ENUM('hosting_activation', 'website_development', 'maintenance', 'it_consulting', 'project_completion', 'custom') NOT NULL DEFAULT 'hosting_activation',
  title VARCHAR(191) NOT NULL,
  customer_name VARCHAR(191) NOT NULL,
  customer_email VARCHAR(191) DEFAULT NULL,
  service_id INT DEFAULT NULL,
  period_start DATE DEFAULT NULL,
  period_end DATE DEFAULT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  work_summary TEXT NOT NULL,
  work_details_json JSON DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rep_cust (customer_name),
  INDEX idx_rep_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/migration_admin_upgrade.sql', 'w') as f:
    f.write(sql_statements)
sftp.close()

cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs < /home/u1zh8984/migration_admin_upgrade.sql && rm -f /home/u1zh8984/migration_admin_upgrade.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
err = stderr.read().decode('utf-8')
if err and "warning" not in err.lower():
    print("Migration Error:", err)
    sys.exit(1)

print("[OK] Admin upgrade schema applied successfully!")

stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SHOW TABLES;'")
print(stdout.read().decode('utf-8'))

ssh.close()
