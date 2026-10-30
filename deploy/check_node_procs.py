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

run("ls -l /proc/2097186/cwd /proc/3780294/cwd")
run("ss -tlpn | grep node")
run("netstat -tulnp | grep -E 'node|3000'")
run("cat /proc/2097186/environ | tr '\\0' '\\n' | grep -E 'PORT|DB_'")
run("cat /proc/3780294/environ | tr '\\0' '\\n' | grep -E 'PORT|DB_'")

ssh.close()
