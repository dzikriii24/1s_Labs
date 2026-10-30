import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = 'cat /home/u1zh8984/.cl.selector/htaccess_cache'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('=== htaccess_cache ===')
print(stdout.read().decode())

cmd = 'grep -A 20 oneslabs /home/u1zh8984/.cl.selector/node-selector.json'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('=== node-selector.json (oneslabs) ===')
print(stdout.read().decode())

ssh.close()
