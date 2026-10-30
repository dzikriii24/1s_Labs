import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd = """python3 -c "
import os

with open('/proc/3780294/environ', 'rb') as f:
    env = f.read().decode('utf-8', errors='ignore').split('\\0')
    for line in env:
        if any(k in line for k in ['DB_', 'DATABASE', 'PORT', 'NODE_']):
            print(line)
" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Environ:\n", stdout.read().decode('utf-8'))

ssh.close()
