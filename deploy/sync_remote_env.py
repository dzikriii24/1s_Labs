import paramiko
import os

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

env_content = """# Database Config
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u1zh8984_oneslabs
DB_PASS=Rabbani2401*
DB_NAME=u1zh8984_oneslabs

# Existing keys
users=u1zh8984_oneslabs
db=u1zh8984_oneslabs
pw=Rabbani2401*
ip=194.233.65.45

# App & Security
PORT=3000
NODE_ENV=production
JWT_SECRET=oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f
JWT_EXPIRES_IN=7d
BASE_URL=https://1slabs.my.id
CPANEL_URL=https://1slabs.my.id:2083

# Mail Configuration
MAIL_HOST=mail.1slabs.my.id
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=info@1slabs.my.id
MAIL_PASSWORD=Rabbani2401*
MAIL_FROM_ADDRESS=info@1slabs.my.id
MAIL_FROM_NAME=1s Labs
MAIL_ADMIN_RECIPIENT=dzikrirabbani2401@gmail.com
"""

remote_env_path = "/home/u1zh8984/oneslabs-backend/.env"
sftp = ssh.open_sftp()
with sftp.file(remote_env_path, 'w') as f:
    f.write(env_content)
sftp.close()
print("Successfully synced .env to", remote_env_path)

# Ensure tmp dir exists and touch restart.txt
cmd = "mkdir -p /home/u1zh8984/oneslabs-backend/tmp && touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Restart command executed:", stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

# Verify .env contents
stdin, stdout, stderr = ssh.exec_command(f"cat {remote_env_path}")
print("Verified Remote .env:")
print(stdout.read().decode('utf-8'))

ssh.close()
