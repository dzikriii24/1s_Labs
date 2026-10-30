import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh.connect('103.119.237.132', 22, 'u1zh8984', pkey=pkey)

cmd = "sed -n '60,149p' /usr/local/cpanel/Cpanel/AddonDomain.pm"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())

ssh.close()
