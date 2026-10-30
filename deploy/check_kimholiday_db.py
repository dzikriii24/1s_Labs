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

async function main() {
  console.log('--- 1. HOSTING SERVICES ---');
  const services = await query(
    `SELECT id, user_id, service_code, domain, status, created_at FROM hosting_services WHERE domain LIKE '%kimholiday%' OR domain LIKE '%kim%'`
  );
  console.log(JSON.stringify(services, null, 2));

  console.log('\\n--- 2. DOMAIN RESERVATIONS ---');
  const reservations = await query(
    `SELECT id, user_id, order_id, domain, status, reserved_until FROM domain_reservations WHERE domain LIKE '%kimholiday%' OR domain LIKE '%kim%'`
  );
  console.log(JSON.stringify(reservations, null, 2));

  console.log('\\n--- 3. ORDERS ---');
  const orders = await query(
    `SELECT id, user_id, order_number, domain, status, created_at FROM orders WHERE domain LIKE '%kimholiday%' OR domain LIKE '%kim%'`
  );
  console.log(JSON.stringify(orders, null, 2));

  console.log('\\n--- 4. ALL ACTIVE HOSTING SERVICES ---');
  const allServices = await query(
    `SELECT id, user_id, service_code, domain, status FROM hosting_services`
  );
  console.log(JSON.stringify(allServices, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/check_kim.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/check_kim.js")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

ssh.close()
