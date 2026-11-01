import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, model, purpose, status, latency_ms, created_at FROM marketing_ai_logs ORDER BY id DESC LIMIT 5;'")
print(stdout.read().decode())

ssh.close()

