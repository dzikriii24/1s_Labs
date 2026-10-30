import paramiko

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

cmd = """
TOKEN=$(/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node -e "
const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken');
console.log(jwt.sign({ id: 2, email: 'customer_flowtest@1slabs.my.id', role: 'customer' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' }));
")

echo "Token: $TOKEN"

curl -k -i -X POST https://194.233.65.45/api/orders/check-domain \
  -H "Host: 1slabs.my.id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"kimholidaytravel.id"}'
"""

run(cmd)

ssh.close()
