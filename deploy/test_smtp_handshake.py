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
python3 -c "
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('Test email from 1sLabs local SMTP audit')
msg['Subject'] = '1sLabs SMTP Connectivity Test'
msg['From'] = 'info@1slabs.my.id'
msg['To'] = 'dzikrirabbani2401@gmail.com'

try:
    with smtplib.SMTP('127.0.0.1', 25, timeout=10) as server:
        print('Connected to 127.0.0.1:25')
        print('Banner/EHLO:', server.ehlo())
except Exception as e:
    print('Port 25 test error:', e)

try:
    with smtplib.SMTP('127.0.0.1', 587, timeout=10) as server:
        print('Connected to 127.0.0.1:587')
        print('EHLO 587:', server.ehlo())
except Exception as e:
    print('Port 587 test error:', e)
"
"""

stdin, stdout, stderr = ssh.exec_command(test_script)
print("STDOUT:\n", stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
