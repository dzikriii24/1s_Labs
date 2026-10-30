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
        print("STDOUT:\n", out)
    if err:
        print("STDERR:", err)

script = """
const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken');
const ordersRouter = require('/home/u1zh8984/oneslabs-backend/src/routes/orders.routes.js');
const express = require('express');
const app = express();
app.use(express.json());
app.use('/orders', ordersRouter);

const token = jwt.sign(
  { id: 2, email: 'customer_flowtest@1slabs.my.id', role: 'customer' },
  'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f',
  { expiresIn: '1h' }
);

const server = app.listen(3456, async () => {
  console.log('Test server listening on 3456');
  for (const d of ['kimholidaytravel.id', 'kimholidaytravelxxx.id']) {
    console.log('\\n--- Checking local handler for:', d);
    const res = await fetch('http://127.0.0.1:3456/orders/check-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ domain: d })
    });
    console.log('HTTP', res.status, await res.json());
  }
  server.close();
  process.exit(0);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_direct_handler.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_direct_handler.js")

ssh.close()
