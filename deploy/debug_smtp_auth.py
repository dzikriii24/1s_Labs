import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

remote_code = """
import smtplib
import ssl

print('--- Testing smtplib auth on port 465 (SSL) ---')
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

candidates = [
    ('info@1slabs.my.id', 'Rabbani2401*'),
    ('dzikri@1slabs.my.id', 'Rabbani2401*'),
    ('info+1slabs.my.id', 'Rabbani2401*'),
    ('u1zh8984', 'Rabbani2401*'),
    ('info@1slabs.my.id', 'Admin1sLabs2026!'),
    ('dzikri@1slabs.my.id', 'Admin1sLabs2026!')
]

for user, pwd in candidates:
    try:
        with smtplib.SMTP_SSL('127.0.0.1', 465, context=ctx, timeout=5) as s:
            s.set_debuglevel(0)
            res = s.login(user, pwd)
            print(f'SUCCESS! user={user} login={res}')
            break
    except Exception as e:
        print(f'FAILED user={user} (pwd len={len(pwd)}): {e}')

"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_smtp_debug.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /home/u1zh8984/test_smtp_debug.py")
print("STDOUT:\n", stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
