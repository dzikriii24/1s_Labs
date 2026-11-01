import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=15)

script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function check() {
  const candidates = await query(`
    SELECT c.id, c.name, c.email, c.country, c.city, c.status, c.is_international,
           (SELECT COUNT(*) FROM marketing_email_logs l WHERE l.company_id = c.id) as email_sent_count,
           (SELECT MAX(sent_at) FROM marketing_email_logs l WHERE l.company_id = c.id) as last_email_sent_at,
           (SELECT mc.full_name FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL LIMIT 1) as contact_person_name
    FROM marketing_companies c
    WHERE (c.email IS NOT NULL AND c.email != '')
       OR EXISTS (SELECT 1 FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '')
    ORDER BY c.id DESC
  `);

  console.log('Total companies with valid email contact:', candidates.length);
  console.table(candidates.slice(0, 10));

  const emailLogs = await query('SELECT * FROM marketing_email_logs ORDER BY id DESC LIMIT 5');
  console.log('\\nEmail logs count in DB:', emailLogs.length);
  console.table(emailLogs);

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/check_candidates.js', 'w') as f:
    f.write(script)
sftp.close()

cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node check_candidates.js"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
ssh.close()
