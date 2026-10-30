import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

out, _ = run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, user_id, service_code, domain, status, created_at, updated_at FROM hosting_services;'")
print('=== hosting_services ===')
print(out)

out, _ = run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, order_number, user_id, domain, status, created_at FROM orders;'")
print('=== orders ===')
print(out)

out, _ = run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT * FROM domain_reservations;'")
print('=== domain_reservations ===')
print(out)

out, _ = run("mysql -u u1zh8984_oneslabs -pRabbani2401* -e 'SHOW DATABASES;'")
print('=== databases ===')
print(out)

ssh.close()
