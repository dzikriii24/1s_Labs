import paramiko
import re
import jwt
import urllib.request
import json

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

stdin, stdout, stderr = ssh.exec_command("cat /home/u1zh8984/oneslabs-backend/.env")
env_content = stdout.read().decode('utf-8')
ssh.close()

jwt_secret = "oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f"
for line in env_content.splitlines():
    if line.startswith("JWT_SECRET="):
        jwt_secret = line.split("=", 1)[1].strip().strip('"').strip("'")
        break

print("Using JWT_SECRET:", jwt_secret[:6] + "...")

# Generate admin token for id=1 (admin@1slabs.my.id)
token = jwt.encode({"id": 1, "email": "admin@1slabs.my.id", "role": "admin"}, jwt_secret, algorithm="HS256")
if isinstance(token, bytes):
    token = token.decode('utf-8')

# Test 1: GET /api/admin/hr/stats
headers = {
    "Authorization": f"Bearer {token}",
    "User-Agent": "HRTester/1.0"
}

endpoints = [
    ("HR Stats", "https://1slabs.my.id/api/admin/hr/stats"),
    ("HR Positions", "https://1slabs.my.id/api/admin/hr/positions"),
    ("HR Templates", "https://1slabs.my.id/api/admin/hr/templates"),
    ("HR Candidates", "https://1slabs.my.id/api/admin/hr/candidates"),
    ("HR Inbox Threads", "https://1slabs.my.id/api/admin/hr/inbox"),
    ("HR Interview Slots", "https://1slabs.my.id/api/admin/hr/interviews/slots")
]

for name, url in endpoints:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"[OK] {name} (HTTP {resp.status}): success={data.get('success')}")
    except Exception as e:
        print(f"[FAIL] {name}: {e}")

