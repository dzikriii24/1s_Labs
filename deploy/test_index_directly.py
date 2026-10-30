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

script = """
const app = require('/home/u1zh8984/oneslabs-backend/index.js');
const server = app.listen(3457, async () => {
  console.log('App listening on 3457');
  const res1 = await fetch('http://127.0.0.1:3457/api/debug-domain?domain=kimholidaytravel.id');
  console.log('TEST 1 (/api/debug-domain):', res1.status, await res1.json());
  
  const res2 = await fetch('http://127.0.0.1:3457/debug-domain?domain=kimholidaytravel.id');
  console.log('TEST 2 (/debug-domain):', res2.status, await res2.json());

  server.close();
  process.exit(0);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_index_directly.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_index_directly.js")

ssh.close()
