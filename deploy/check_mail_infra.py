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
    "which sendmail",
    "which mail",
    "ss -tuln | grep -E ':(25|465|587) '",
    "host -t MX 1slabs.my.id",
    "host -t TXT 1slabs.my.id",
    "cat /etc/redhat-release || cat /etc/os-release"
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
