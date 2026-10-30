import paramiko
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)

print("[1] Uploading updated backend routes & test suite to remote server...")
sftp = ssh.open_sftp()
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\orders.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/orders.routes.js")
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\auth.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/auth.routes.js")
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\invoices.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/invoices.routes.js")
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\payments.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/payments.routes.js")
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\deploy\remote_e2e_suite.js", "/home/u1zh8984/remote_e2e_suite.js")
sftp.close()
ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
print("[OK] Routes & test suite uploaded. Passenger restarted.")
import time
time.sleep(2)

print("\n[2] Executing remote test suite with Node 22...")
cmd = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node /home/u1zh8984/remote_e2e_suite.js"
stdin, stdout, stderr = ssh.exec_command(cmd)

out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')

print(out)
if err:
    print("STDERR:\n", err)

ssh.close()

if "ALL 14 END-TO-END BUSINESS FLOW & SECURITY TESTS PASSED!" in out:
    sys.exit(0)
else:
    sys.exit(1)
