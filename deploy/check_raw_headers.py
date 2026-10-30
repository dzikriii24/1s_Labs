import requests
import json

# Generate token or do request
# Let's inspect headers on POST
url = "https://1slabs.my.id/api/orders/check-domain"
# But it requires token. Let's do it via node or python with pyjwt/requests
import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

script = """
const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken');

async function testHeaders() {
  const token = jwt.sign(
    { id: 2, email: 'customer_flowtest@1slabs.my.id', role: 'customer' },
    process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f',
    { expiresIn: '1h' }
  );

  const res = await fetch('https://1slabs.my.id/api/orders/check-domain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ domain: 'kimholidaytravel.id' })
  });

  console.log('STATUS:', res.status);
  console.log('HEADERS:');
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  const text = await res.text();
  console.log('BODY:', text);
}

testHeaders();
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/check_headers_raw.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/check_headers_raw.js")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

ssh.close()
