import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\dzikri\.ssh\id_ed25519")
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

cmd = "node -e \"const { query } = require('/home/u1zh8984/oneslabs-backend/src/db'); (async () => { const cols = await query('DESCRIBE email_logs'); console.log('COLS:', cols.map(c => c.Field)); const logs = await query('SELECT * FROM email_logs ORDER BY id DESC LIMIT 15'); console.log('LOGS:', logs); process.exit(0); })()\""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
ssh.close()
