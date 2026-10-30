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

print("Switching version to 24...")
run("cloudlinux-selector set --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend --new-version 24")

print("Restarting...")
run("cloudlinux-selector restart --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")

print("Checking .htaccess in api...")
run("cat /home/u1zh8984/public_html/1slabs.my.id/api/.htaccess")

ssh.close()
