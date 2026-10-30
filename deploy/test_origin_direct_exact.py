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
const https = require('https');

const token = jwt.sign(
  { id: 2, email: 'customer_flowtest@1slabs.my.id', role: 'customer' },
  process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f',
  { expiresIn: '1h' }
);

function makeReq(domain) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ domain });
    const req = https.request({
      hostname: '194.233.65.45',
      port: 443,
      path: '/api/orders/check-domain',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Host': '1slabs.my.id',
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing ORIGIN DIRECTLY for kimholidaytravel.id:');
  const r1 = await makeReq('kimholidaytravel.id');
  console.log('R1:', r1.status, r1.body);
  console.log('R1 Headers:', r1.headers);

  console.log('\\nTesting ORIGIN DIRECTLY for kimholidaytravelxxx.id:');
  const r2 = await makeReq('kimholidaytravelxxx.id');
  console.log('R2:', r2.status, r2.body);
}

run();
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_origin_exact.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/test_origin_exact.js")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

ssh.close()
