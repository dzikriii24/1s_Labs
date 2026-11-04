import paramiko

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# Read the email in /home/u1zh8984/mail/1slabs.my.id/hr/new
cmd = "cat /home/u1zh8984/mail/1slabs.my.id/hr/new/* | head -n 45"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("=== Email Header Preview ===")
print(stdout.read().decode('utf-8'))

# Now execute syncHRInbox via node in the backend folder
node_cmd = """cd /home/u1zh8984/oneslabs-backend && node -e "
const { syncHRInbox } = require('./src/services/hrInboundEmail.service');
syncHRInbox()
  .then(res => console.log('Sync Result:', JSON.stringify(res, null, 2)))
  .catch(err => console.error('Sync Error:', err));
" """
stdin, stdout, stderr = ssh.exec_command(node_cmd)
print("=== Node syncHRInbox output ===")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

# Check database hr_email_replies
cmd = "mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, from_email, from_name, subject, candidate_id, created_at FROM hr_email_replies;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("=== hr_email_replies in DB ===")
print(stdout.read().decode('utf-8'))

ssh.close()

