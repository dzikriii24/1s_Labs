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
const { query } = require('./src/db');

async function testEndpoints() {
  // Generate admin token for id=1
  const token = jwt.sign(
    { id: 1, email: 'admin@1slabs.my.id', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  console.log('Testing GET http://127.0.0.1:3000/api/admin/customers ...');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/admin/customers', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Customers status:', res.status);
    const data = await res.json();
    console.log('Customers response:', JSON.stringify(data).slice(0, 300));
  } catch (e) {
    console.error('Customers fetch error:', e.message);
  }

  console.log('Testing GET http://127.0.0.1:3000/api/admin/invoices ...');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/admin/invoices', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Invoices status:', res.status);
    const data = await res.json();
    console.log('Invoices sample:', JSON.stringify(data).slice(0, 400));
  } catch (e) {
    console.error('Invoices fetch error:', e.message);
  }

  console.log('Testing GET http://127.0.0.1:3000/api/admin/emails/logs ...');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/admin/emails/logs', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Email logs status:', res.status);
    const data = await res.json();
    console.log('Email logs count:', data.logs ? data.logs.length : 'none', 'stats:', data.stats);
  } catch (e) {
    console.error('Email logs error:', e.message);
  }

  console.log('Testing GET http://127.0.0.1:3000/api/admin/server/processes ...');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/admin/server/processes', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Processes status:', res.status);
    const data = await res.json();
    console.log('Processes count:', data.count, 'sample:', JSON.stringify(data.processes ? data.processes.slice(0, 2) : 'none'));
  } catch (e) {
    console.error('Processes error:', e.message);
  }
}

testEndpoints();
"""
    sftp = ssh.open_sftp()
    with sftp.file("/home/u1zh8984/oneslabs-backend/test_admin_endpoints.js", "w") as f:
        f.write(test_script)
    sftp.close()

    stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node test_admin_endpoints.js")
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("OUTPUT:\n", out)
    if err:
        print("STDERR:\n", err)

    ssh.exec_command("rm -f /home/u1zh8984/oneslabs-backend/test_admin_endpoints.js")
    ssh.close()

if __name__ == '__main__':
    main()
