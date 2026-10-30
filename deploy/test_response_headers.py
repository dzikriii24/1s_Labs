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

test_script = """
const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken');

async function test(domain) {
  const token = jwt.sign(
    { id: 2, email: 'customer_flowtest@1slabs.my.id', role: 'customer' },
    'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f',
    { expiresIn: '1h' }
  );

  const res = await fetch('https://1slabs.my.id/api/orders/check-domain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ domain })
  });

  console.log('Domain:', domain);
  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  const data = await res.json().catch(() => ({}));
  console.log('Body:', data);
  console.log('------------------------------');
}

test('kimholidaytravel.id').then(() => process.exit(0)).catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_headers.js', 'w') as f:
    f.write(test_script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_headers.js")

ssh.close()
