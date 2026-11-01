import paramiko
import sys

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

sql = """
CREATE TABLE IF NOT EXISTS meeting_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(190) NULL,
  contact_person VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(45) NULL,
  meeting_date DATE NOT NULL,
  meeting_time VARCHAR(50) NOT NULL,
  platform VARCHAR(50) DEFAULT 'Google Meet',
  notes TEXT NULL,
  status VARCHAR(45) DEFAULT 'scheduled',
  admin_notes TEXT NULL,
  source_campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_date (meeting_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
    print("SSH Connected.")

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/create_meeting_table.sql', 'w') as f:
        f.write(sql)
    sftp.close()

    cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs < /home/u1zh8984/oneslabs-backend/create_meeting_table.sql && rm -f /home/u1zh8984/oneslabs-backend/create_meeting_table.sql"
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if err and "warning" not in err.lower():
        print("SQL Error:", err)
    else:
        print("Table meeting_schedules created successfully.")

    # Verify table
    _, stdout, _ = ssh.exec_command("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'DESCRIBE meeting_schedules;'")
    print(stdout.read().decode())
    ssh.close()

if __name__ == '__main__':
    main()

