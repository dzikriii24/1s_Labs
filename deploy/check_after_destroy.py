import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "cat /home/u1zh8984/public_html/1slabs.my.id/api/.htaccess 2>/dev/null || echo 'FILE NOT FOUND'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('api .htaccess:')
print(stdout.read().decode())

cmd = "grep -C 5 oneslabs /home/u1zh8984/.cl.selector/node-selector.json"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('node-selector.json oneslabs:')
print(stdout.read().decode())

ssh.close()
