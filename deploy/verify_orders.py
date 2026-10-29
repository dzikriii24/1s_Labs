import paramiko
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)

# Login
login_cmd = "curl -s -X POST https://1slabs.my.id/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@1slabs.my.id\",\"password\":\"Admin1sLabs2026!\"}'"
stdin, stdout, stderr = ssh.exec_command(login_cmd)
raw = stdout.read().decode('utf-8')
print("Login response:", raw)
login_res = json.loads(raw)
token = login_res.get('token')

# Call /api/orders?status=paid
order_cmd = f"curl -s -i -H 'Authorization: Bearer {token}' 'https://1slabs.my.id/api/orders?status=paid'"
stdin, stdout, stderr = ssh.exec_command(order_cmd)
resp = stdout.read().decode('utf-8')
print("\n=== Response for /api/orders?status=paid ===")
print(resp[:600])

ssh.close()
