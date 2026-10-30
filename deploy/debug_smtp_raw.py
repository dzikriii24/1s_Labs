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

s = smtplib.SMTP_SSL('194.233.65.45', 465, context=ctx, timeout=10)
s.set_debuglevel(2)
s.ehlo('1slabs.my.id')

user = 'dzikri@1slabs.my.id'
pwd = 'Rabbani2401*'

print('--- Testing AUTH LOGIN manually ---')
code, resp = s.docmd('AUTH LOGIN')
print('AUTH LOGIN resp:', code, resp)
if code == 334:
    user_b64 = base64.b64encode(user.encode()).decode()
    code, resp = s.docmd(user_b64)
    print('User resp:', code, resp)
    if code == 334:
        pwd_b64 = base64.b64encode(pwd.encode()).decode()
        code, resp = s.docmd(pwd_b64)
        print('Pass resp:', code, resp)

s.quit()
"""

stdin, stdout, stderr = ssh.exec_command(f"python3 -c \"{script}\"")
print(stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
