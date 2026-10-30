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

print('--- Test 1: Port 587 with STARTTLS ---')
try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    s = smtplib.SMTP('127.0.0.1', 587, timeout=10)
    print('Connected 587. EHLO pre-starttls:', s.ehlo())
    print('Has STARTTLS:', s.has_extn('STARTTLS'))
    s.starttls(context=ctx)
    print('EHLO post-starttls:', s.ehlo())
    print('Has AUTH:', s.has_extn('AUTH'))
    res = s.login('info@1slabs.my.id', 'Rabbani2401*')
    print('LOGIN 587 SUCCESS:', res)
    s.quit()
except Exception as e:
    print('Error on 587:', e)

print('--- Test 2: Port 465 SSL ---')
try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    s = smtplib.SMTP_SSL('127.0.0.1', 465, context=ctx, timeout=10)
    print('EHLO 465:', s.ehlo())
    print('Has AUTH 465:', s.has_extn('AUTH'))
    res = s.login('info@1slabs.my.id', 'Rabbani2401*')
    print('LOGIN 465 SUCCESS:', res)
    s.quit()
except Exception as e:
    print('Error on 465:', e)

print('--- Test 3: Connecting to mail.1slabs.my.id on 465 and 587 ---')
try:
    s = smtplib.SMTP('mail.1slabs.my.id', 587, timeout=10)
    s.starttls(context=ctx)
    s.ehlo()
    res = s.login('info@1slabs.my.id', 'Rabbani2401*')
    print('LOGIN mail.1slabs.my.id:587 SUCCESS:', res)
    s.quit()
except Exception as e:
    print('Error mail.1slabs.my.id:587:', e)
"""

stdin, stdout, stderr = ssh.exec_command(f"python3 -c \"{script}\"")
print(stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
