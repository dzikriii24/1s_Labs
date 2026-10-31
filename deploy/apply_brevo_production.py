import os
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
    print("SSH Connected.")

    sftp = ssh.open_sftp()

    # 1. Read current remote .env
    with sftp.file("/home/u1zh8984/oneslabs-backend/.env", "r") as f:
        env_content = f.read().decode('utf-8')

    # 2. Update mail configuration in .env
    new_env_lines = []
    mail_keys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_SECURE', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME', 'MAIL_ADMIN_RECIPIENT']
    for line in env_content.splitlines():
        if any(line.startswith(k + '=') for k in mail_keys) or line.strip() == '# Mail Configuration':
            continue
        new_env_lines.append(line)

    new_env_lines.append("\n# Mail Configuration (Brevo SMTP Relay - 300 emails/day)")
    new_env_lines.append("MAIL_HOST=smtp-relay.brevo.com")
    new_env_lines.append("MAIL_PORT=2525")
    new_env_lines.append("MAIL_SECURE=false")
    new_env_lines.append("MAIL_USER=c0afff001@smtp-brevo.com")
    brevo_password = os.environ.get("BREVO_SMTP_KEY", "your-brevo-smtp-key")
    new_env_lines.append(f"MAIL_PASSWORD={brevo_password}")
    new_env_lines.append("MAIL_FROM_ADDRESS=info@1slabs.my.id")
    new_env_lines.append("MAIL_FROM_NAME=1s Labs")
    new_env_lines.append("MAIL_ADMIN_RECIPIENT=dzikrirabbani2401@gmail.com\n")

    updated_env = "\n".join(new_env_lines)
    with sftp.file("/home/u1zh8984/oneslabs-backend/.env", "w") as f:
        f.write(updated_env)
    print("Updated /home/u1zh8984/oneslabs-backend/.env successfully.")

    # 3. Clean up test files
    for tmp in ["test_brevo_check.js", "test_brevo_2525.js", "check_smtp_banner.js"]:
        try:
            sftp.remove(f"/home/u1zh8984/oneslabs-backend/{tmp}")
        except:
            pass

    # 4. Restart Passenger
    ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
    print("Passenger restart triggered.")

    # 5. Test email.service.js directly from backend to verify complete pipeline
    verify_pipeline_script = """
const path = require('path');
const { sendEmail } = require('./src/services/email.service');

async function verify() {
  console.log('Sending test email via email.service.js pipeline...');
  const result = await sendEmail({
    to: 'dzikrirabbani2401@gmail.com',
    subject: '1sLabs Brevo SMTP Integration Active',
    title: 'Brevo SMTP Relay Aktif',
    preheader: 'Layanan email transaksional 1sLabs berhasil dimigrasi ke Brevo',
    badge: 'System Upgrade',
    content: '<p>Konfigurasi pengiriman email 1sLabs telah sukses dialihkan ke <b>Brevo SMTP Relay</b>.</p><p>Pengirim resmi: <b>1s Labs (info@1slabs.my.id)</b>.<br>Kapasitas: <b>300 email per hari</b> tanpa batasan limit cPanel.</p>',
    callToAction: {
      text: 'Buka Admin Dashboard',
      url: 'https://1slabs.my.id/admin'
    }
  });

  console.log('EmailService result:', JSON.stringify(result));
  process.exit(result.success ? 0 : 1);
}
verify();
"""
    with sftp.file("/home/u1zh8984/oneslabs-backend/verify_service.js", "w") as f:
        f.write(verify_pipeline_script)
    sftp.close()

    stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node verify_service.js")
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("PIPELINE TEST OUTPUT:\n", out)
    if err:
        print("PIPELINE TEST STDERR:\n", err)

    # Clean up verify script
    ssh.exec_command("rm -f /home/u1zh8984/oneslabs-backend/verify_service.js")
    ssh.close()

if __name__ == '__main__':
    main()
