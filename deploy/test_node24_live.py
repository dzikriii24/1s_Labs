import paramiko

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

print("1. Curling /api/health...")
run("curl -k -s 'https://194.233.65.45/api/health' -H 'Host: 1slabs.my.id'")

print("2. Curling /api/debug-domain...")
run("curl -k -s 'https://194.233.65.45/api/debug-domain?domain=kimholidaytravel.id' -H 'Host: 1slabs.my.id'")

print("3. Testing check-domain API...")
node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/24/bin/node"
run(f"{node_bin} /home/u1zh8984/test_check_api.js")

ssh.close()
