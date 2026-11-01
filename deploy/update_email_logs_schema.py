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
    print("Updating Schema for Email Logs & Candidate Tracking")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=20)

    script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function migrate() {
  const addCol = async (tbl, col, def) => {
    try {
      const cols = await query(`SHOW COLUMNS FROM ${tbl} LIKE '${col}'`);
      if (cols.length === 0) {
        await query(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`);
        console.log(`+ Added ${col} to ${tbl}`);
      } else {
        console.log(`= ${col} already exists in ${tbl}`);
      }
    } catch (e) {
      console.warn(`! Note on ${col}:`, e.message);
    }
  };

  // Add recipient info & body to marketing_email_logs
  await addCol('marketing_email_logs', 'recipient_name', 'VARCHAR(191) DEFAULT NULL');
  await addCol('marketing_email_logs', 'company_name', 'VARCHAR(191) DEFAULT NULL');
  await addCol('marketing_email_logs', 'body_html', 'MEDIUMTEXT DEFAULT NULL');

  // Add contact tracking to marketing_companies
  await addCol('marketing_companies', 'last_contacted_at', 'DATETIME DEFAULT NULL');
  await addCol('marketing_companies', 'contacted_times', 'INT NOT NULL DEFAULT 0');

  // Add contact tracking to marketing_contacts
  await addCol('marketing_contacts', 'last_contacted_at', 'DATETIME DEFAULT NULL');

  console.log('Migration finished successfully!');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/run_log_migration.js', 'w') as f:
        f.write(script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node run_log_migration.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

