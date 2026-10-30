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

print("1. Stopping app via cloudlinux-selector...")
run("cloudlinux-selector stop --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")

print("2. Checking health while stopped...")
run("curl -k -s -I 'https://194.233.65.45/api/health' -H 'Host: 1slabs.my.id'")

print("3. Starting app via cloudlinux-selector...")
run("cloudlinux-selector start --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")

print("4. Checking health after start...")
run("curl -k -s -I 'https://194.233.65.45/api/health' -H 'Host: 1slabs.my.id'")

ssh.close()
