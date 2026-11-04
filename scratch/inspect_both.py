import paramiko
import sys

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

print("=== 1. Check template 1 & 4 in remote MySQL ===")
cmd = "mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, template_key, body_html FROM hr_email_templates WHERE id IN (1, 4);'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print("=== 2. Check incoming email in /home/u1zh8984/mail/1slabs.my.id/hr/new ===")
cmd = "head -n 45 /home/u1zh8984/mail/1slabs.my.id/hr/new/*"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print("=== 3. Run syncHRInbox with process.exit(0) ===")
node_cmd = """cd /home/u1zh8984/oneslabs-backend && node -e "
const { syncHRInbox } = require('./src/services/hrInboundEmail.service');
syncHRInbox()
  .then(res => {
    console.log('SYNC_RESULT:', JSON.stringify(res));
    process.exit(0);
  })
  .catch(err => {
    console.error('SYNC_ERROR:', err.message);
    process.exit(1);
  });
" """
stdin, stdout, stderr = ssh.exec_command(node_cmd)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("Node Stderr:", err)

print("=== 4. Check hr_email_replies ===")
cmd = "mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, from_email, from_name, subject, candidate_id, created_at FROM hr_email_replies;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
