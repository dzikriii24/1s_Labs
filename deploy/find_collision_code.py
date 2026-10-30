import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

script = """
import os

target = 'Domain ini sudah terdaftar pada layanan hosting aktif di platform 1sLabs'
for root, dirs, files in os.walk('/home/u1zh8984'):
    if any(skip in root for skip in ['node_modules', '.git', 'mail', 'cache', '.trash']):
        continue
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    if target in fp.read():
                        print('Found in:', p)
            except Exception:
                pass
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/search_script.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/u1zh8984/search_script.py && rm -f /home/u1zh8984/search_script.py')
print('Search results:')
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()
