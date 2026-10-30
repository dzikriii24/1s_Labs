import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

cmd = """python3 -c '
import crypt

cache_hash = "$6$s5RuNSjXarGLe1D3$ApuTCmgwx6dX5Kldoew8wP15KwRzuP9jQDLLXnjescxtmRlzWrpqIAWYAgkmRs3t0xGSFRYvto4rpT8tO0OgU0"
computed = crypt.crypt("Rabbani2401*", "$6$s5RuNSjXarGLe1D3$")

if computed == cache_hash:
    print("YES! Rabbani2401* matches @pwcache/info!")
else:
    print("NO, computed:", computed)
'"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

ssh.close()
