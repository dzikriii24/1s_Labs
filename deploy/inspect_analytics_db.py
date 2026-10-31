import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\dzikri\.ssh\id_ed25519")
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

cmd = "node -e \"const { query } = require('/home/u1zh8984/oneslabs-backend/src/db'); (async () => { const rows = await query('SELECT service_code, domain, count(*) as count FROM hosting_analytics GROUP BY service_code, domain'); console.log('GROUP:', rows); const recent = await query('SELECT id, service_code, domain, page_path, page_url, created_at FROM hosting_analytics ORDER BY id DESC LIMIT 5'); console.log('RECENT:', recent); process.exit(0); })()\""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
ssh.close()
