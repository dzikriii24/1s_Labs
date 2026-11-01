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
ssh.connect(HOST, username=USER, pkey=pkey, timeout=15)

cmd_token = "node -e \"const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken'); console.log(jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' }));\""
stdin, stdout, stderr = ssh.exec_command(cmd_token)
token = stdout.read().decode('utf-8').strip()

print("1. Testing GET /api/admin/marketing/campaigns/candidates")
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" "https://1slabs.my.id/api/admin/marketing/campaigns/candidates?status=uncontacted"')
out = stdout.read().decode('utf-8')
print("Response preview:", out[:500])

print("\n2. Testing GET /api/admin/marketing/email-logs")
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" "https://1slabs.my.id/api/admin/marketing/email-logs"')
out = stdout.read().decode('utf-8')
print("Response preview:", out[:500])

ssh.close()

