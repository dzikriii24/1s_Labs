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

matches = []
for p in glob.glob('/proc/[0-9]*/maps'):
    pid = p.split('/')[2]
    try:
        with open(p, 'r') as f:
            content = f.read()
            if 'oneslabs' in content or '1slabs' in content:
                cmdline = ''
                try:
                    with open(f'/proc/{pid}/cmdline', 'r') as cf:
                        cmdline = cf.read().replace(chr(0), ' ')
                except:
                    pass
                matches.append((pid, cmdline))
    except:
        pass

print('MATCHES:', matches)
"
"""
run(script)

ssh.close()
