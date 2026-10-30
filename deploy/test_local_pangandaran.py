import urllib.request
import json
import paramiko
import time
import os

# 1. Get JWT token
pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

cmd = "node -e 'const jwt=require(\"jsonwebtoken\"); console.log(jwt.sign({id:21,email:\"customer_flowtest@1slabs.my.id\",role:\"customer\"}, \"oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f\"));'"
stdin, stdout, stderr = ssh.exec_command(f"cd /home/u1zh8984/oneslabs-backend && {cmd}")
token = stdout.read().decode('utf-8', errors='replace').strip()
ssh.close()

# 2. Upload pangandaran2.svg
file_path = r'C:\Users\dzikri\Downloads\KimHolidayTravel-SC\src\mixed\pangandaran2.svg'
file_size = os.path.getsize(file_path)
print(f"File: {file_path} ({file_size / 1024 / 1024:.2f} MB)")

boundary = '----LocalTestBoundary987654321'
head = f'--{boundary}\r\nContent-Disposition: form-data; name="paths"\r\n\r\npangandaran2.svg\r\n--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="pangandaran2.svg"\r\nContent-Type: image/svg+xml\r\n\r\n'.encode('utf-8')
tail = f'\r\n--{boundary}--\r\n'.encode('utf-8')

with open(file_path, 'rb') as f:
    content = f.read()

body = head + content + tail
print(f"Total payload size: {len(body) / 1024 / 1024:.2f} MB. Starting upload to https://1slabs.my.id...")

start_t = time.time()
req = urllib.request.Request(
    'https://1slabs.my.id/api/services/SRV-2026-62DECA/files/upload?path=/src/mixed',
    data=body,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'User-Agent': 'Mozilla/5.0'
    }
)

try:
    with urllib.request.urlopen(req, timeout=300) as resp:
        elapsed = time.time() - start_t
        resp_body = resp.read().decode('utf-8')
        speed = (len(body) / 1024 / 1024) / elapsed
        print(f"SUCCESS in {elapsed:.1f}s ({speed:.2f} MB/s)!")
        print("RESPONSE:", resp_body[:200])
except urllib.error.HTTPError as e:
    elapsed = time.time() - start_t
    print(f"HTTP ERROR {e.code} in {elapsed:.1f}s: {e.reason}")
    print("BODY:", e.read().decode('utf-8', errors='replace')[:500])
except Exception as e:
    elapsed = time.time() - start_t
    print(f"ERROR in {elapsed:.1f}s:", e)
