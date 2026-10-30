import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)

run("ls -ld /home/u1zh8984/oneslabs-backend")
run("ls -ld /home/u1zh8984/oneslabs-backend/tmp")
run("ls -la /home/u1zh8984/oneslabs-backend/tmp")
run("chmod 755 /home/u1zh8984/oneslabs-backend")
run("chmod 755 /home/u1zh8984/oneslabs-backend/tmp")
run("chmod 666 /home/u1zh8984/oneslabs-backend/tmp/restart.txt")

ssh.close()
