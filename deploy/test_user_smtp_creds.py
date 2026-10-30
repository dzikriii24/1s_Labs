import paramiko
import sys

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

test_script = """
const nodemailer = require('/home/u1zh8984/oneslabs-backend/node_modules/nodemailer');

async function testPort(port, secure) {
  console.log(`Testing SMTP on port ${port} (secure=${secure})...`);
  const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: port,
    secure: secure,
    auth: {
      user: 'info@1slabs.my.id',
      pass: 'Rabbani2401*'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const verified = await transporter.verify();
    console.log(`[SUCCESS] Port ${port} verified:`, verified);
    return transporter;
  } catch (err) {
    console.log(`[FAILED] Port ${port}:`, err.message);
    return null;
  }
}

async function main() {
  let t = await testPort(465, true);
  if (!t) {
    t = await testPort(587, false);
  }
  if (!t) {
    t = await testPort(25, false);
  }

  if (t) {
    console.log('Sending test email to dzikrirabbani2401@gmail.com...');
    try {
      const info = await t.sendMail({
        from: '"1s Labs" <info@1slabs.my.id>',
        to: 'dzikrirabbani2401@gmail.com',
        subject: '1s Labs SMTP Verification Test - LIVE',
        text: 'Halo Admin,\\n\\nKredensial SMTP info@1slabs.my.id berhasil diverifikasi dan aktif mengirim email dari server 1s Labs!\\n\\nSalam,\\n1s Labs Engineering Team',
        html: '<div style="font-family:sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">' +
              '<h2 style="color:#000;">1s Labs SMTP Berhasil Terhubung</h2>' +
              '<p>Halo Administrator,</p>' +
              '<p>Kredensial email <strong>info@1slabs.my.id</strong> berhasil diverifikasi dan terhubung ke server mail Exim.</p>' +
              '<p style="color:#10b981;font-weight:bold;">Status: LIVE & DELIVERED</p>' +
              '</div>'
      });
      console.log('[SUCCESS] Email sent successfully! MessageID:', info.messageId);
    } catch (sendErr) {
      console.error('[FAILED] Send mail error:', sendErr.message);
    }
  }
}

main().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_smtp_live.js', 'w') as f:
    f.write(test_script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/test_smtp_live.js")

print("Output:")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

ssh.close()
