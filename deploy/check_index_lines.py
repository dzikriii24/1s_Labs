import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "sed -n '50,85p' /home/u1zh8984/oneslabs-backend/index.js"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('index.js 50-85:')
print(stdout.read().decode())

ssh.close()
