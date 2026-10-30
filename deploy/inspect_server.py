import paramiko

HOSTNAME = '194.233.65.45'
USERNAME = 'u1zh8984'
KEY_PATH = r'C:\Users\dzikri\.ssh\id_rsa'
PASSPHRASE = 'Rabbani2401*'

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out)
    if err:
        print("STDERR:", err)

run("ps -ef | grep node")
run("ls -la /home/u1zh8984/oneslabs-backend/tmp")
run("cat /home/u1zh8984/oneslabs-backend/.env | grep -E 'DB_|PORT|NODE_ENV'")
run("find /home/u1zh8984 -maxdepth 3 -name '.env'")
run("find /home/u1zh8984/public_html -maxdepth 2 -name '.htaccess'")
run("cat /home/u1zh8984/public_html/1slabs.my.id/.htaccess")

ssh.close()
