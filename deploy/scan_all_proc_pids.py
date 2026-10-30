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
        print("STDOUT:\n", out)
    if err:
        print("STDERR:", err)

script = """
python3 -c "
import os, glob

pids = []
for p in glob.glob('/proc/[0-9]*'):
    pid = os.path.basename(p)
    try:
        with open(f'{p}/cmdline', 'r') as f:
            cmd = f.read().replace(chr(0), ' ')
        with open(f'{p}/status', 'r') as f:
            lines = f.readlines()
            name = [l.split(':')[1].strip() for l in lines if l.startswith('Name:')][0]
            uid = [l.split(':')[1].strip() for l in lines if l.startswith('Uid:')][0]
        pids.append((pid, name, uid, cmd[:80]))
    except Exception as e:
        pids.append((pid, 'PERMISSION_DENIED', '', ''))

print(f'Total visible PIDs: {len(pids)}')
for p, n, u, c in pids:
    if 'node' in n or 'node' in c or 'ls' in n:
        print(f'{p}: {n} (UID {u}) -> {c}')
"
"""
run(script)

ssh.close()
