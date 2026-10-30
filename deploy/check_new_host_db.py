import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_ed25519')

cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, service_code, domain, status, updated_at FROM hosting_services;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('hosting_services on 103.119.237.132:')
print(stdout.read().decode())

cmd2 = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"SELECT id, order_number, domain, status FROM orders WHERE domain LIKE '%kimholiday%';\""
stdin, stdout, stderr = ssh.exec_command(cmd2)
print('orders matching kimholiday on 103.119.237.132:')
print(stdout.read().decode())

cmd3 = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT * FROM domain_reservations;'"
stdin, stdout, stderr = ssh.exec_command(cmd3)
print('domain_reservations on 103.119.237.132:')
print(stdout.read().decode())

ssh.close()
