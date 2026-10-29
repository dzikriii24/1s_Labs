import paramiko
import sys
import os

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

cmd = """source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node -e "
const bcrypt = require('bcryptjs');
const { query } = require('./src/db');

async function main() {
  const email = 'admin@1slabs.my.id';
  const plainPass = 'Admin1sLabs2026!';
  const hash = await bcrypt.hash(plainPass, 10);
  
  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    await query('UPDATE users SET password_hash = ?, role = \\'admin\\', name = \\'Administrator 1sLabs\\' WHERE email = ?', [hash, email]);
    console.log('[OK] Admin user updated successfully.');
  } else {
    await query('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, \\'Administrator 1sLabs\\', \\'admin\\')', [email, hash]);
    console.log('[OK] Admin user created successfully.');
  }
  process.exit(0);
}
main().catch(err => { console.error('Error:', err); process.exit(1); });
"
"""

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

stdin, stdout, stderr = ssh.exec_command(cmd)
print("Node output:")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err: print("Node error:", err)

ssh.close()
