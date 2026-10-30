import paramiko

HOSTNAME = '194.233.65.45'
USERNAME = 'u1zh8984'
KEY_PATH = r'C:\Users\dzikri\.ssh\id_rsa'
PASSPHRASE = 'Rabbani2401*'

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

# Find log files in oneslabs-backend
run("ls -la /home/u1zh8984/oneslabs-backend")

# Check if there is another table in MySQL with kimholidaytravel
script_check = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db.js');

async function testExact() {
  const [dbRow] = await query('SELECT DATABASE() as db');
  console.log('Current DB:', dbRow.db);

  const tables = await query('SHOW TABLES');
  console.log('Tables:', tables.map(t => Object.values(t)[0]));

  const cleaned = 'kimholidaytravel.id';
  console.log('Checking cleaned domain:', cleaned);

  const hs = await query('SELECT id, user_id, service_code, domain, status FROM hosting_services WHERE domain LIKE "%kimholiday%"');
  console.log('hosting_services matches:', hs);

  const hs_exact = await query('SELECT id, status FROM hosting_services WHERE domain = ? AND status IN ("active", "pending_provisioning", "awaiting_domain")', [cleaned]);
  console.log('hs_exact:', hs_exact);

  const hs_all = await query('SELECT id, user_id, service_code, domain, status FROM hosting_services');
  console.log('hs_all:', hs_all);

  const res = await query('SELECT * FROM domain_reservations WHERE domain LIKE "%kimholiday%"');
  console.log('domain_reservations matches:', res);
}

testExact().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/debug_check.js', 'w') as f:
    f.write(script_check)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/debug_check.js")

ssh.close()
