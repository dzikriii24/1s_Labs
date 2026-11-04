import paramiko
import sys
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

node_cmd = """cd /home/u1zh8984/oneslabs-backend && node -e "
const { query } = require('./src/db');
query('SELECT id, template_key, name, subject, body_html FROM hr_email_templates ORDER BY id ASC')
  .then(rows => {
    rows.forEach(r => {
      console.log('ID:', r.id, 'KEY:', r.template_key);
      console.log('NAME:', r.name);
      console.log('SUBJECT:', r.subject);
      console.log('BODY:', r.body_html.substring(0, 160));
      // Check for non-ASCII
      const nonAscii = r.body_html.match(/[^\\x00-\\x7F]/g);
      if (nonAscii) {
        console.log('  NON-ASCII found:', [...new Set(nonAscii)]);
      }
      console.log('---');
    });
    process.exit(0);
  })
  .catch(e => { console.error(e); process.exit(1); });
" """

stdin, stdout, stderr = ssh.exec_command(node_cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()

