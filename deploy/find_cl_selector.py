import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = 'find /home/u1zh8984 -maxdepth 3 -name ".cl*" 2>/dev/null'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('cl files:')
print(stdout.read().decode())

cmd = 'ls -la /home/u1zh8984/.cl.selector 2>/dev/null || true'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('.cl.selector:')
print(stdout.read().decode())

ssh.close()
