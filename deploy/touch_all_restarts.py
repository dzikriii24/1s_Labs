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
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print("STDOUT:\n", out)
    if err:
        print("STDERR:", err)

# Create tmp/restart.txt in all possible Passenger roots
dirs = [
    "/home/u1zh8984/oneslabs-backend/tmp",
    "/home/u1zh8984/public_html/1slabs.my.id/tmp",
    "/home/u1zh8984/public_html/1slabs.my.id/api/tmp"
]

for d in dirs:
    run(f"mkdir -p {d} && touch {d}/restart.txt && ls -la {d}/restart.txt")

# Let's check cPanel restart API
run("uapi NodeJs restart app_root=oneslabs-backend || true")
run("uapi NodeJs restart app_root=/home/u1zh8984/oneslabs-backend || true")

ssh.close()
