import paramiko
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

with open(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\.env') as f:
    cfg = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)

sftp = ssh.open_sftp()
local_sql = r"c:\Users\dzikri\Downloads\1sLabs-website\deploy\update_plans.sql"
remote_sql = "/home/u1zh8984/update_plans.sql"
sftp.put(local_sql, remote_sql)
sftp.close()

cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} < {remote_sql}"
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("STDOUT:", out)
if err:
    print("STDERR:", err)

# Check results
verify_cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e 'SELECT id, slug, name, price, period, target, description, features_json FROM hosting_plans;' -E"
stdin, stdout, stderr = ssh.exec_command(verify_cmd)
print("\n=== VERIFIED DB RECORDS ===")
print(stdout.read().decode('utf-8'))

ssh.exec_command(f"rm -f {remote_sql}")
ssh.close()
print("SUCCESS!")
