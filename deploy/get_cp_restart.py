import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "/opt/cloudlinux/venv/bin/python3 -c 'import clselect.clpassenger as cp; print(\"###DIR###\", dir(cp))'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('OUT:', stdout.read().decode())
print('ERR:', stderr.read().decode())

ssh.close()
