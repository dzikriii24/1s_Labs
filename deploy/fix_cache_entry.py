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
import shutil
import os

src = '/home/u1zh8984/etc/1slabs.my.id/@pwcache/info'
dst = '/home/u1zh8984/etc/1slabs.my.id/@pwcache/info@1slabs.my.id'

content = '''passwd:$6$s5RuNSjXarGLe1D3$ApuTCmgwx6dX5Kldoew8wP15KwRzuP9jQDLLXnjescxtmRlzWrpqIAWYAgkmRs3t0xGSFRYvto4rpT8tO0OgU0
quota:0
homedir:/home/u1zh8984/mail/1slabs.my.id/info
strength:88
lastchanged:-1
perms:rw
'''

with open(dst, 'w') as f:
    f.write(content)
os.chmod(dst, 0o640)
print('Created @pwcache/info@1slabs.my.id')

# Also check passwd file in /home/u1zh8984/etc/1slabs.my.id/passwd
passwd_file = '/home/u1zh8984/etc/1slabs.my.id/passwd'
with open(passwd_file, 'r') as f:
    print('Current passwd file:\\n' + f.read())
"""

stdin, stdout, stderr = ssh.exec_command(f"python3 -c \"{script}\"")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Stderr:", err)

ssh.close()
