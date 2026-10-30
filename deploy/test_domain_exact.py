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
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db.js');

async function testDomain(domain) {
  console.log(`Checking domain: '${domain}'`);

  const [existingService] = await query(
    `SELECT id, user_id, service_code, domain, status FROM hosting_services WHERE domain = ? AND status IN ('active', 'pending_provisioning', 'awaiting_domain') LIMIT 1`,
    [domain]
  );
  console.log('existingService match:', existingService);

  const [existingReservation] = await query(
    `SELECT id, user_id, order_id, domain, status, reserved_until FROM domain_reservations 
     WHERE domain = ? AND status = 'pending_payment' AND reserved_until > NOW() LIMIT 1`,
    [domain]
  );
  console.log('existingReservation match:', existingReservation);

  const orders = await query(
    `SELECT id, user_id, order_number, domain, status, created_at FROM orders WHERE domain = ?`,
    [domain]
  );
  console.log('orders match:', orders);

  // Let's also search case-insensitively or trimmed
  const likeServices = await query(
    `SELECT id, user_id, service_code, domain, status FROM hosting_services WHERE LOWER(domain) = LOWER(?)`,
    [domain]
  );
  console.log('likeServices match:', likeServices);
}

async function main() {
  await testDomain('kimholidaytravel.id');
  await testDomain('kimholidaytravel.com');
  await testDomain('kimholidaytravelxxx.id');
  process.exit(0);
}

main().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_domain_exact.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/test_domain_exact.js")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

ssh.close()
