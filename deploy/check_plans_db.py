import paramiko

HOST = '103.119.237.132'
USER = 'u1zh8984'
KEY_PATH = r'C:\Users\dzikri\.ssh\id_ed25519'

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

node_cmd = """
const jwt = require('/home/u1zh8984/demo-oneslabs/node_modules/jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' });
console.log(token);
"""
stdin, stdout, stderr = ssh.exec_command(f'node -e "{node_cmd}"')
token = stdout.read().decode('utf-8').strip()

stdin, stdout, stderr = ssh.exec_command(f'curl -sLk -H "Authorization: Bearer {token}" https://demo.1slabs.my.id/api/admin/server/monitoring')
print("Monitoring API response:", stdout.read().decode('utf-8')[:300])

stdin, stdout, stderr = ssh.exec_command(f'curl -sLk -H "Authorization: Bearer {token}" https://demo.1slabs.my.id/api/admin/finance/overview')
print("Finance API response:", stdout.read().decode('utf-8')[:300])

stdin, stdout, stderr = ssh.exec_command(f'curl -sLk -H "Authorization: Bearer {token}" https://demo.1slabs.my.id/api/admin/system/settings')
print("Settings API response:", stdout.read().decode('utf-8')[:300])
ssh.close()

