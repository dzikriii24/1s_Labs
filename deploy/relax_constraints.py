import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    print("=" * 60)
    print("Updating Schema & Uploading Fixed contactRecovery.service.js")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=20)

    # 1. Update Schema
    node_sql = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function fixCols() {
  try {
    await query("ALTER TABLE marketing_companies MODIFY COLUMN lead_grade VARCHAR(50) NOT NULL DEFAULT 'cold'");
    console.log('+ marketing_companies.lead_grade is now VARCHAR(50)');
  } catch (e) {
    console.warn('lead_grade alter note:', e.message);
  }

  try {
    await query("ALTER TABLE marketing_contacts MODIFY COLUMN confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.85");
    console.log('+ marketing_contacts.confidence_score is now DECIMAL(5,2)');
  } catch (e) {
    console.warn('confidence_score alter note:', e.message);
  }

  process.exit(0);
}
fixCols();
"""
    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/fix_cols.js', 'w') as f:
        f.write(node_sql)
    
    # 2. Upload contactRecovery.service.js
    sftp.put(
        r"backend\src\services\marketing\contactRecovery.service.js",
        "/home/u1zh8984/oneslabs-backend/src/services/marketing/contactRecovery.service.js"
    )
    print("+ Uploaded fixed contactRecovery.service.js")
    sftp.close()

    # Run SQL migration
    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node fix_cols.js && touch tmp/restart.txt && cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

