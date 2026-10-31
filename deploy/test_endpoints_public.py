import sys
import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

    test_script = """
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testEndpoints() {
  const token = jwt.sign(
    { id: 1, email: 'admin@1slabs.my.id', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  async function check(name, url) {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      console.log(name, 'STATUS:', res.status, 'SUCCESS:', data.success, 'DATA:', JSON.stringify(data).slice(0, 200));
    } catch (e) {
      console.error(name, 'ERROR:', e.message);
    }
  }

  await check('CUSTOMERS', 'https://1slabs.my.id/api/admin/customers');
  await check('INVOICES', 'https://1slabs.my.id/api/admin/invoices');
  await check('EMAIL_LOGS', 'https://1slabs.my.id/api/admin/emails/logs');
  await check('PROCESSES', 'https://1slabs.my.id/api/admin/server/processes');
  await check('REPORTS', 'https://1slabs.my.id/api/admin/reports');
  await check('DOMAINS', 'https://1slabs.my.id/api/admin/domains');
}

testEndpoints();
"""
    sftp = ssh.open_sftp()
    with sftp.file("/home/u1zh8984/oneslabs-backend/test_admin_endpoints2.js", "w") as f:
        f.write(test_script)
    sftp.close()

    stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node test_admin_endpoints2.js")
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("OUTPUT:\n", out)
    if err:
        print("STDERR:\n", err)

    ssh.exec_command("rm -f /home/u1zh8984/oneslabs-backend/test_admin_endpoints2.js")
    ssh.close()

if __name__ == '__main__':
    main()
