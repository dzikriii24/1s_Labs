import urllib.request
import json
import paramiko
import os

# 1. Get JWT token from DB
pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

cmd = """
const { generateToken } = require('./src/utils/tokens');
console.log(generateToken({ id: 21, email: 'customer_flowtest@1slabs.my.id', role: 'customer' }));
"""
stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node -e \"" + cmd.replace('"', '\\"').replace('\n', ' ') + "\"")
token = stdout.read().decode('utf-8', errors='replace').strip()
print("TOKEN:", token[:25] + "...")
ssh.close()

# 2. Try to upload dieng.svg (10.5 MB)
file_path = r'C:\Users\dzikri\Downloads\KimHolidayTravel-SC\src\mixed\dieng.svg'
with open(file_path, 'rb') as f:
    content = f.read()

print(f"Testing upload of {file_path} ({len(content) / 1024 / 1024:.2f} MB)...")

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="paths"\r\n\r\n')
body.extend(b'test_dieng.svg\r\n')
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="files"; filename="dieng.svg"\r\n')
body.extend(b'Content-Type: image/svg+xml\r\n\r\n')
body.extend(content)
body.extend(b'\r\n')
body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

req = urllib.request.Request(
    'https://1slabs.my.id/api/services/SRV-2026-62DECA/files/upload?path=/src/mixed',
    data=bytes(body),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'User-Agent': 'Mozilla/5.0'
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        print("UPLOAD SUCCESS:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}: {e.reason}")
    print("BODY:", e.read().decode('utf-8', errors='replace')[:500])
except Exception as e:
    print("ERROR:", e)
