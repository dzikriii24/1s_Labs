import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "grep -n -C 10 '1slabs.my.id' /etc/apache2/conf/httpd.conf 2>/dev/null || true"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('httpd.conf matches:')
print(stdout.read().decode())

ssh.close()
