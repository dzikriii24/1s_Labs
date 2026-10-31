import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

# Collect frontend dist files
files_to_sync = [
    (r"c:\Users\dzikri\Downloads\1sLabs-website\dist\index.html", "/home/u1zh8984/public_html/1slabs.my.id/index.html"),
    (r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\admin.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/admin.routes.js"),
    (r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\analytics.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/analytics.routes.js"),
    (r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\invoices.routes.js", "/home/u1zh8984/oneslabs-backend/src/routes/invoices.routes.js"),
    (r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\services\email.service.js", "/home/u1zh8984/oneslabs-backend/src/services/email.service.js"),
]

dist_assets = r"c:\Users\dzikri\Downloads\1sLabs-website\dist\assets"
for f in os.listdir(dist_assets):
    local_path = os.path.join(dist_assets, f)
    if os.path.isfile(local_path):
        remote_path = f"/home/u1zh8984/public_html/1slabs.my.id/assets/{f}"
        files_to_sync.append((local_path, remote_path))

print(f"Connecting to {USER}@{HOST}...", flush=True)
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
sftp = ssh.open_sftp()

for local, remote in files_to_sync:
    size = os.path.getsize(local)
    print(f"Uploading {os.path.basename(local)} ({size:,} B) -> {remote}", flush=True)
    sftp.put(local, remote)

sftp.close()

print("Restarting Passenger...", flush=True)
ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
stdin, stdout, stderr = ssh.exec_command("cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend")
print("Selector restart:", stdout.read().decode().strip(), flush=True)

ssh.close()
print("Fast sync completed successfully!", flush=True)
