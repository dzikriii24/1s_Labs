import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = 'ls -la /home/u1zh8984/public_html/1slabs.my.id/api'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('api contents:')
print(stdout.read().decode())

cmd = "find /home/u1zh8984/public_html/1slabs.my.id -maxdepth 3"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('1slabs.my.id all files:')
print(stdout.read().decode())

ssh.close()
