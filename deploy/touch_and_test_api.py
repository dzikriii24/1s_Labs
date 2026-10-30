import paramiko
import time

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)

run("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
run("touch /home/u1zh8984/oneslabs-backend/index.js")
run("touch /home/u1zh8984/public_html/1slabs.my.id/api/.htaccess")
run("cloudlinux-selector restart --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")

time.sleep(2)

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_check_api.js")

ssh.close()
