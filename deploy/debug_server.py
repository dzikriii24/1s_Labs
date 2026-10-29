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

cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node index.js"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=5)
try:
    print("STDOUT:", stdout.read().decode('utf-8'))
except Exception as e:
    print("Stdout read (timed out as server is listening, which is expected!):", e)

try:
    err = stderr.read().decode('utf-8')
    if err:
        print("STDERR:", err)
except Exception as e:
    pass

# Also check passenger restart
print("Touching restart.txt...")
ssh.exec_command("mkdir -p /home/u1zh8984/oneslabs-backend/tmp && touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")

ssh.close()
