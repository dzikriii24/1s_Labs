import paramiko
import json

HOST = '103.119.237.132'
USER = 'u1zh8984'
KEY_PATH = r'C:\Users\dzikri\.ssh\id_ed25519'

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

print("=== 1. TEST CREATE NODE APPLICATION ===")
# Create test app in /home/u1zh8984/test-node-probe
out, err = run('cloudlinux-selector create --json --interpreter nodejs --app-root test-node-probe --app-uri test-node-probe-api --domain demo.1slabs.my.id --version 22.23.4 --app-mode production --startup-file app.js')
print("STDOUT:", out)
print("STDERR:", err)

print("\n=== 2. VERIFY GET APP ===")
out, err = run('cloudlinux-selector get --json --interpreter nodejs --user u1zh8984 | grep "test-node-probe"')
print(out)

print("\n=== 3. CLEANUP: DESTROY NODE APP ===")
out, err = run('cloudlinux-selector destroy --json --interpreter nodejs --app-root test-node-probe')
print("STDOUT:", out)
print("STDERR:", err)

print("\n=== 4. CLEANUP DIRECTORY IF LEFT ===")
out, err = run('rm -rf /home/u1zh8984/test-node-probe /home/u1zh8984/public_html/demo.1slabs.my.id/test-node-probe-api')
print("Cleaned up dir.")

ssh.close()

