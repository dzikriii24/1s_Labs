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
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print("STDOUT:", out)
    if err:
        print("STDERR:", err)

run("kill -0 2097186 2>&1 && echo 'PID 2097186 IS ALIVE' || echo 'PID 2097186 IS DEAD'")
run("kill -0 3780294 2>&1 && echo 'PID 3780294 IS ALIVE' || echo 'PID 3780294 IS DEAD'")
run("ls -la /proc/*/cwd 2>/dev/null | grep oneslabs || true")

ssh.close()
