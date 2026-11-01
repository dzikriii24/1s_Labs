import paramiko
import json

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

cmd_token = "node -e \"const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken'); console.log(jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' }));\""
stdin, stdout, stderr = ssh.exec_command(cmd_token)
token = stdout.read().decode('utf-8').strip()

# Run source 4 (Open Data Jabar) with limit 5
print("Triggering discovery for Source 4 (Open Data Jabar)...")
curl_cmd = f'curl -s -X POST -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"limit": 5, "province": "Jawa Barat", "sector": "Industri & UMKM"}}\' https://1slabs.my.id/api/admin/marketing/sources/4/run'
stdin, stdout, stderr = ssh.exec_command(curl_cmd)
res = stdout.read().decode('utf-8')
print("Run result:", res[:400])

# Now check stats again
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" https://1slabs.my.id/api/admin/marketing/stats')
print("\nNew Stats:", stdout.read().decode('utf-8')[:350])

ssh.close()

