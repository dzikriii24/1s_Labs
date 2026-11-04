import paramiko

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd = """mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, email, role, status FROM users WHERE role IN ("admin", "super_admin");'"""
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Admin users:")
print(stdout.read().decode('utf-8'))

cmd2 = """mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, name, department, status FROM hr_positions;'"""
stdin, stdout, stderr = ssh.exec_command(cmd2)
print("HR Positions:")
print(stdout.read().decode('utf-8'))

ssh.close()

