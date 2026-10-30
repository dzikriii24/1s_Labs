import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SHOW FULL PROCESSLIST;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('PROCESSLIST:')
print(stdout.read().decode())

cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT * FROM information_schema.INNODB_TRX;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('INNODB_TRX:')
print(stdout.read().decode())

ssh.close()
