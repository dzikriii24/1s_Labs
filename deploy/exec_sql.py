import sys
import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

sql = sys.argv[1] if len(sys.argv) > 1 else "SHOW TABLES;"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

# Escape single quotes in sql
escaped_sql = sql.replace("'", "'\\''")
cmd = f"mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e '{escaped_sql}'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("ERR:", err)
ssh.close()

