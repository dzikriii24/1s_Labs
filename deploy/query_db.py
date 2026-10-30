import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"SELECT * FROM hosting_services WHERE domain LIKE '%kimholiday%';\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print('hosting_services matching kimholiday:')
print(stdout.read().decode())

cmd2 = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"SELECT id, domain FROM hosting_services WHERE domain = 'kimholidaytravel.id';\""
stdin, stdout, stderr = ssh.exec_command(cmd2)
print('Exact match kimholidaytravel.id:')
print(stdout.read().decode())

cmd3 = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"SELECT id, domain FROM hosting_services WHERE domain = 'kimholidaytravelxxx.id';\""
stdin, stdout, stderr = ssh.exec_command(cmd3)
print('Exact match kimholidaytravelxxx.id:')
print(stdout.read().decode())

ssh.close()
