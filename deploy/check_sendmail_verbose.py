import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd = 'echo "Subject: test" | /usr/sbin/sendmail -v dzikrirabbani2401@gmail.com 2>&1'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Output:\n", stdout.read().decode('utf-8'))

ssh.close()
