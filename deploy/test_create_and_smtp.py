import paramiko
import time

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# Step 1: Create fresh POP account
print("Creating fresh email account testsmtp@1slabs.my.id...")
cmd = "uapi Email add_pop email=testsmtp domain=1slabs.my.id password='Rabbani2401*' quota=100"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Create output:\n", stdout.read().decode('utf-8'))

# Step 2: Test SMTP login on port 465 and 587
test_code = """
import smtplib
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

user = 'testsmtp@1slabs.my.id'
pwd = 'Rabbani2401*'

print('--- Testing testsmtp on port 465 (SSL) ---')
try:
    with smtplib.SMTP_SSL('127.0.0.1', 465, context=ctx, timeout=10) as s:
        s.ehlo('1slabs.my.id')
        res = s.login(user, pwd)
        print('SUCCESS ON 465:', res)
except Exception as e:
    print('FAILED ON 465:', e)

print('--- Testing testsmtp on port 587 (STARTTLS) ---')
try:
    with smtplib.SMTP('127.0.0.1', 587, timeout=10) as s:
        s.ehlo('1slabs.my.id')
        s.starttls(context=ctx)
        s.ehlo('1slabs.my.id')
        res = s.login(user, pwd)
        print('SUCCESS ON 587:', res)
except Exception as e:
    print('FAILED ON 587:', e)
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_fresh_smtp.py', 'w') as f:
    f.write(test_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /home/u1zh8984/test_fresh_smtp.py")
print("SMTP Test Output:\n", stdout.read().decode('utf-8'))
print("SMTP Test Stderr:\n", stderr.read().decode('utf-8'))

# Step 3: Cleanup test account
print("Deleting testsmtp@1slabs.my.id...")
ssh.exec_command("uapi Email delete_pop email=testsmtp domain=1slabs.my.id")

ssh.close()
