import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd_dump = "mysqldump -u u1zh8984_oneslabs -p'Rabbani2401*' --no-tablespaces u1zh8984_s1_testing > /home/u1zh8984/test_backup.sql"
stdin, stdout, stderr = ssh.exec_command(cmd_dump)
print("Dump err:", stderr.read().decode('utf-8'))

cmd_import = "mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_s1_testing < /home/u1zh8984/test_backup.sql"
stdin, stdout, stderr = ssh.exec_command(cmd_import)
print("Import err:", stderr.read().decode('utf-8'))

cmd_cleanup = "rm -f /home/u1zh8984/test_backup.sql"
ssh.exec_command(cmd_cleanup)
print("All commands executed successfully!")

ssh.close()
