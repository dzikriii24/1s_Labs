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
const nodemailer = require('/home/u1zh8984/oneslabs-backend/node_modules/nodemailer');

async function main() {
  console.log('--- Testing Sendmail Transport ---');
  const t = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  });

  try {
    const info = await t.sendMail({
      from: '"1s Labs" <info@1slabs.my.id>',
      to: 'dzikrirabbani2401@gmail.com',
      subject: '1s Labs Sendmail Transport Test - SUCCESS',
      text: 'Halo Admin,\\n\\nEmail berhasil dikirim langsung menggunakan /usr/sbin/sendmail dari Node.js backend 1s Labs.\\n\\nSalam,\\n1s Labs Team',
      html: '<div style="font-family:sans-serif;padding:20px;border:1px solid #10b981;border-radius:8px;"><h2>Sendmail Transport Berhasil</h2><p>Pengiriman email lokal tanpa delay dan tanpa ketergantungan port eksternal.</p></div>'
    });
    console.log('[SUCCESS] Email sent via sendmail! MessageID:', info.messageId);
  } catch (err) {
    console.error('[FAILED] Sendmail error:', err.message);
  }
}

main().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_nodemailer_transport.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/test_nodemailer_transport.js")
print("STDOUT:\n", stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
