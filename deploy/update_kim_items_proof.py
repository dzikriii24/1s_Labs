import sys
import paramiko
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

script_content = """
const { query } = require('./src/db');

async function run() {
  const [inv] = await query("SELECT id, invoice_number, items_json FROM invoices WHERE invoice_number = 'INV-202610-KIMHOLIDAY'");
  if (!inv) {
    console.log('Invoice INV-202610-KIMHOLIDAY not found');
    process.exit(1);
  }
  console.log('Found invoice ID:', inv.id);
  const data = typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : inv.items_json;
  console.log('Current items count:', data.items.length);
  const proofUrl = data.payment_proof_url || 'https://1slabs.my.id/uploads/proofs/proof_1793316698883_4ea7b83f2f0a53b2.jpg';
  
  // Attach proof_url to each item in the invoice so it appears per-item
  data.items = data.items.map(it => ({
    ...it,
    proof_url: proofUrl
  }));

  await query("UPDATE invoices SET items_json = ? WHERE id = ?", [JSON.stringify(data), inv.id]);
  console.log('Successfully updated items_json with per-item proof_url for all items in INV-202610-KIMHOLIDAY');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"""

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
sftp = ssh.open_sftp()

with sftp.file('/home/u1zh8984/oneslabs-backend/update_kim_items.js', 'w') as f:
    f.write(script_content)

sftp.close()

stdin, stdout, stderr = ssh.exec_command('cd /home/u1zh8984/oneslabs-backend && node update_kim_items.js')
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

ssh.close()
