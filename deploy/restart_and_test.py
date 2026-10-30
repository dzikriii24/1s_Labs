import paramiko
import time

HOSTNAME = '194.233.65.45'
USERNAME = 'u1zh8984'
KEY_PATH = r'C:\Users\dzikri\.ssh\id_rsa'
PASSPHRASE = 'Rabbani2401*'

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out)
    if err:
        print("STDERR:", err)

# 1. Kill old node processes
run("kill -9 2097186 3780294 || true")
run("pkill -9 -f 'lsnode:/home/u1zh8984/oneslabs-backend' || true")
run("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")

time.sleep(2)
run("ps -ef | grep -E 'node|lsnode'")

# 2. Re-test check domain API
node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_check_api.js")

ssh.close()
