import paramiko
HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)
stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT COUNT(*) as total FROM system_activity_logs;'")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUT:\n", out)
if err:
    print("ERR:\n", err)
ssh.close()

