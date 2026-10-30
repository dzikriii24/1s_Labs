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

# Find all index.js, app.js, server.js in /home/u1zh8984 (maxdepth 3)
script = """
find /home/u1zh8984 -maxdepth 3 -type f \\( -name "index.js" -o -name "app.js" -o -name "server.js" \\) ! -path "*/node_modules/*" -exec grep -l "1sLabs API" {} +
"""
run(script)

ssh.close()
