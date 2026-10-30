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

run("cloudlinux-selector stop --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")
run("cloudlinux-selector start --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")
run("cloudlinux-selector restart --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend")

run("curl -k -s 'https://194.233.65.45/api/debug-domain?domain=kimholidaytravel.id' -H 'Host: 1slabs.my.id'")

ssh.close()
