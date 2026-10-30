import paramiko
HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"
pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)
stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'DESCRIBE users; SELECT id, email, role, name FROM users;'")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUT:\n", out)
if err:
    print("ERR:\n", err)
ssh.close()
