import paramiko
import jwt
import time

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out)
    if err:
        print("STDERR:", err)

# Generate JWT for user_id 2
token = jwt.encode(
    {"id": 2, "email": "customer_flowtest@1slabs.my.id", "role": "customer", "exp": int(time.time()) + 3600},
    "oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f",
    algorithm="HS256"
)

curl_cmd = f"""curl -k -i -X POST https://194.233.65.45/api/orders/check-domain \
  -H "Host: 1slabs.my.id" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{{"domain":"kimholidaytravel.id"}}'"""

run(curl_cmd)

ssh.close()
