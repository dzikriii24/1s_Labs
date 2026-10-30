import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "find /home/u1zh8984 -maxdepth 4 -name '.env*' 2>/dev/null"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('all .env files:')
print(stdout.read().decode())

ssh.close()
