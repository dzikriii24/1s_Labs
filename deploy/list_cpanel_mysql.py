import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(f"=== {cmd} ===")
    print(stdout.read().decode('utf-8', errors='replace'))

run("uapi Mysql list_databases")
run("uapi Mysql list_users")

ssh.close()
