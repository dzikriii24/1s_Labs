import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, pkey=pkey, timeout=15)

node_test = """
const { sendMarketingEmail } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/marketingEmail.service');
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function testSend() {
  console.log('Sending test branded outreach email to admin...');
  const res = await sendMarketingEmail({
    campaignId: null,
    companyId: 25, // Adrie Basuki
    recipientEmail: 'dzikrirabbani2401@gmail.com',
    recipientName: 'Dzikri Rabbani',
    companyName: 'Adrie Basuki Batik',
    subject: 'Peluang Pengembangan Website & Digital Presence untuk {{business_name}}',
    bodyHtml: '<p>Halo Tim <strong>{{business_name}}</strong>,</p><p>Salam kenal dari <strong>1sLabs</strong>. Kami ingin menawarkan solusi pengembangan website modern dan integrasi WhatsApp untuk memperluas jangkauan bisnis Anda di {{city}}.</p><p>Paket sudah termasuk <strong>Free Cloud Hosting 1 Tahun & Garansi 1 Tahun Penuh</strong>.</p>',
    variables: {
      business_name: 'Adrie Basuki Batik',
      city: 'Bandung'
    },
    allowDuplicate: true
  });
  console.log('Test send result:', res);

  const logs = await query('SELECT id, recipient_email, recipient_name, company_name, subject, status, sent_at FROM marketing_email_logs ORDER BY id DESC LIMIT 1');
  console.log('\\nLatest Email Log in DB:');
  console.table(logs);

  process.exit(0);
}

testSend().catch(e => { console.error('Error:', e); process.exit(1); });
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/test_send_admin.js', 'w') as f:
    f.write(node_test)
sftp.close()

cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node test_send_admin.js"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
ssh.close()

