import os
import sys
import json
import re
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    print("=" * 60)
    print("1sLabs Documentation Table Migration & Seeder")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
    print("[1/3] SSH connected.")

    def run_mysql(query):
        # Escape single quotes
        escaped = query.replace("'", "'\\''")
        cmd = f"mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e '{escaped}'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        if err:
            print("MySQL STDERR:", err)
        return out

    # 1. Create table
    print("\n[2/3] Creating table `documentation_articles`...")
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS documentation_articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(191) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      category_title VARCHAR(128) NOT NULL,
      description TEXT NOT NULL,
      reading_time VARCHAR(32) DEFAULT '3 menit',
      keywords TEXT,
      toc_json LONGTEXT,
      content LONGTEXT NOT NULL,
      status VARCHAR(32) DEFAULT 'published',
      is_custom TINYINT(1) DEFAULT 0,
      view_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_category (category),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    run_mysql(create_table_sql)
    print("  Table `documentation_articles` verified.")

    # 2. Check existing count
    cnt_out = run_mysql("SELECT COUNT(*) AS total FROM documentation_articles;")
    print("  Current rows in table:", cnt_out.strip())

    ssh.close()
    print("\n[3/3] Migration done.")

if __name__ == '__main__':
    main()

