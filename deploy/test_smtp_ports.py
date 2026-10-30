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

commands = [
    "python3 -c \"import socket; print('Port 25:', socket.socket().connect_ex(('127.0.0.1', 25))); print('Port 587:', socket.socket().connect_ex(('127.0.0.1', 587))); print('Port 465:', socket.socket().connect_ex(('127.0.0.1', 465)))\"",
    "ls -la /home/u1zh8984/etc/1slabs.my.id/ || ls -la /home/u1zh8984/mail/1slabs.my.id/",
    "host mail.1slabs.my.id"
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8').strip()
    err = stderr.read().decode('utf-8').strip()
    if out:
        print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)

ssh.close()
