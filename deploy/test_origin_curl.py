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
        print(out)
    if err:
        print("STDERR:", err)

# Curl directly to 127.0.0.1 or 194.233.65.45 on the server with Host: 1slabs.my.id
cmd_curl = """
curl -k -i -X POST https://194.233.65.45/api/orders/check-domain \
  -H "Host: 1slabs.my.id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"domain":"kimholidaytravel.id"}'
"""
run(cmd_curl)

ssh.close()
