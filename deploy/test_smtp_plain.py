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
import smtplib
import ssl
import base64

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

s = smtplib.SMTP_SSL('127.0.0.1', 465, context=ctx, timeout=10)
s.set_debuglevel(2)
s.ehlo('1slabs.my.id')

user = 'info@1slabs.my.id'
pwd = 'Rabbani2401*'

# PLAIN auth format: \0username\0password
auth_str = chr(0) + user + chr(0) + pwd
auth_b64 = base64.b64encode(auth_str.encode()).decode()

print('--- Testing AUTH PLAIN ---')
code, resp = s.docmd(f'AUTH PLAIN {auth_b64}')
print('AUTH PLAIN resp:', code, resp)

s.quit()
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_plain.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /home/u1zh8984/test_plain.py")
print(stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
