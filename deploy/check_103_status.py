import paramiko
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

print("=== Connected to 103.119.237.132 ===")

def run(cmd):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out.strip())
    if err:
        print("STDERR:", err.strip())

run("ls -la public_html/1slabs.my.id")
run("ls -la public_html/1slabs.my.id/assets")
run("cat public_html/1slabs.my.id/index.html | grep -E 'assets/index' || true")
run("cloudlinux-selector status --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend || true")
run("ps aux | grep -E 'node|passenger' | grep -v grep || true")

ssh.close()
