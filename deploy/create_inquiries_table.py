import paramiko
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out + err

ddl = """
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inquiry_type ENUM('consultation', 'website_development', 'website_maintenance', 'custom_software', 'hosting', 'other') NOT NULL DEFAULT 'consultation',
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  company VARCHAR(191) DEFAULT NULL,
  service_interested VARCHAR(191) DEFAULT NULL,
  current_website_url VARCHAR(255) DEFAULT NULL,
  budget_range VARCHAR(100) DEFAULT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'contacted', 'in_progress', 'converted', 'closed') NOT NULL DEFAULT 'new',
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inquiry_type (inquiry_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

print("Applying contact_inquiries migration...")
print(run(f"mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"{ddl}\""))

print("Verifying schema:")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'DESCRIBE contact_inquiries;'"))

ssh.close()
print("Migration completed successfully.")

