import paramiko
import sys
import os

# Ensure UTF-8
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

env_file = r"c:\Users\dzikri\Downloads\1sLabs-website\backend\.env"
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

db_user = env_vars.get('users')
db_name = env_vars.get('db')
db_pw = env_vars.get('pw')

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# Check mysql tables via stdin
cmd = f"mysql -u {db_user} -p'{db_pw}' {db_name} -e 'SHOW TABLES;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')

print("=== MySQL Connection Test ===")
if err and "warning" not in err.lower():
    print("MySQL Error occurred:", err.splitlines()[0] if err else "Unknown")
else:
    print("Database connected successfully!")
    print("Existing tables in database:")
    print(out if out.strip() else "(No tables yet - empty database)")

# Check node & npm in the virtualenv
check_node_cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && node -v && npm -v"
stdin, stdout, stderr = ssh.exec_command(check_node_cmd)
node_out = stdout.read().decode('utf-8')
print("\nRemote Node/NPM version in virtualenv:")
print(node_out)

ssh.close()
