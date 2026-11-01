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

print("Testing Gemini AI API on production server...")
payload = json.dumps({"prompt": "Sebutkan 3 layanan digital utama yang dibutuhkan UMKM kuliner di Indonesia dalam format JSON: {\"layanan\": []}"})

# Write payload to a temporary file on remote
sftp = ssh.open_sftp()
with sftp.file("/tmp/ai_test_payload.json", "w") as f:
    f.write(payload)
sftp.close()

curl_cmd = f'curl -s -X POST -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d @/tmp/ai_test_payload.json https://1slabs.my.id/api/admin/marketing/ai-test'
stdin, stdout, stderr = ssh.exec_command(curl_cmd)
out = stdout.read().decode('utf-8')
print("AI Test Output:", out[:500])

ssh.close()
