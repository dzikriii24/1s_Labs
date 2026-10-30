import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd = 'printf "From: info@1slabs.my.id\\nTo: dzikrirabbani2401@gmail.com\\nSubject: Test Sendmail Audit\\n\\nThis is a test from 1sLabs audit." | /usr/sbin/sendmail -t -i'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8'))
print("STDERR:", stderr.read().decode('utf-8'))

# Check exim log if available or mail log
stdin, stdout, stderr = ssh.exec_command('tail -n 20 /var/log/exim_mainlog 2>&1 || tail -n 20 /var/log/maillog 2>&1 || echo "log not accessible by user"')
print("LOG:\n", stdout.read().decode('utf-8'))

ssh.close()
