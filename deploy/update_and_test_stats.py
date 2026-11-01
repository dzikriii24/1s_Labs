import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

sftp = ssh.open_sftp()
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\marketing.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/marketing.routes.js")
sftp.close()

# Restart Node
ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
ssh.exec_command("cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend")

# Generate token and test stats
cmd_token = "node -e \"const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken'); console.log(jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' }));\""
stdin, stdout, stderr = ssh.exec_command(cmd_token)
token = stdout.read().decode('utf-8').strip()

stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" https://1slabs.my.id/api/admin/marketing/stats')
out = stdout.read().decode('utf-8')
print("Stats API Result:")
print(out[:400])

ssh.close()

