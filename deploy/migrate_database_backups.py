import paramiko
import sys

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"
DB_USER = "u1zh8984_oneslabs"
DB_NAME = "u1zh8984_oneslabs"
DB_PASS = "Rabbani2401*"

sql_migration = """
CREATE TABLE IF NOT EXISTS hosting_database_backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  database_id INT NOT NULL,
  database_name VARCHAR(100) NOT NULL,
  backup_type ENUM('daily_auto', 'manual') NOT NULL DEFAULT 'daily_auto',
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_size_formatted VARCHAR(32) NOT NULL DEFAULT '0 B',
  checksum VARCHAR(64) DEFAULT NULL,
  status ENUM('completed', 'failed', 'restoring') NOT NULL DEFAULT 'completed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backup_service (service_id),
  INDEX idx_backup_db (database_id),
  INDEX idx_backup_type (backup_type),
  CONSTRAINT fk_backup_service FOREIGN KEY (service_id) REFERENCES hosting_services(id) ON DELETE CASCADE,
  CONSTRAINT fk_backup_db FOREIGN KEY (database_id) REFERENCES hosting_databases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def main():
    print(f"Connecting to {USERNAME}@{HOSTNAME} to create hosting_database_backups table...")
    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)

    sftp = ssh.open_sftp()
    remote_sql_path = "/home/u1zh8984/create_backups_table.sql"
    with sftp.file(remote_sql_path, "w") as f:
        f.write(sql_migration)
    sftp.close()

    cmd = f"mysql -u {DB_USER} -p'{DB_PASS}' {DB_NAME} < {remote_sql_path} && rm -f {remote_sql_path}"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    err = stderr.read().decode('utf-8')
    if err and "warning" not in err.lower():
        print("Migration Error:", err)
        sys.exit(1)

    print("[OK] hosting_database_backups table created successfully!")

    # Ensure backups directory exists
    stdin, stdout, stderr = ssh.exec_command("mkdir -p /home/u1zh8984/backups/databases && chmod 700 /home/u1zh8984/backups")
    print("[OK] Remote backups directory /home/u1zh8984/backups/databases created.")

    ssh.close()

if __name__ == "__main__":
    main()
