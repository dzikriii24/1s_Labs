import paramiko
import os
import sys
import time
import urllib.request
import json

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

REMOTE_BACKEND = "/home/u1zh8984/oneslabs-backend"
LOCAL_BACKEND = r"c:\Users\dzikri\Downloads\1sLabs-website\backend"

REMOTE_FRONTEND = "public_html/1slabs.my.id"
LOCAL_DIST = r"c:\Users\dzikri\Downloads\1sLabs-website\dist"

def main():
    print("==================================================")
    print("   1sLabs Kill Rogue Process & Deploy Updates")
    print("==================================================")

    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] SSH connection established.")

    # 1. Kill stray standalone oneslabs-backend process
    print("\n--- 1. Killing rogue standalone oneslabs-backend process ---")
    stdin, stdout, stderr = ssh.exec_command("pkill -9 -f 'oneslabs-backend/22/bin/node' || pkill -9 -f 'node index.js' || true")
    time.sleep(2)

    stdin, stdout, stderr = ssh.exec_command("ps aux | grep node")
    print("Remaining node processes:")
    print(stdout.read().decode('utf-8'))

    sftp = ssh.open_sftp()
    print("[OK] SFTP channel opened.")

    def sftp_upload_dir(local_dir, remote_dir, skip_list=None):
        if skip_list is None:
            skip_list = []
        try:
            sftp.mkdir(remote_dir)
            print(f"Created remote dir: {remote_dir}")
        except IOError:
            pass

        for item in os.listdir(local_dir):
            if item in skip_list:
                continue
            l_path = os.path.join(local_dir, item)
            r_path = f"{remote_dir}/{item}"
            if os.path.isdir(l_path):
                sftp_upload_dir(l_path, r_path, skip_list)
            else:
                size = os.path.getsize(l_path)
                print(f"Uploading: {item} -> {r_path} ({size} bytes)")
                sftp.put(l_path, r_path)
                try:
                    sftp.chmod(r_path, 0o644)
                except Exception:
                    pass

    # 2. Deploy Frontend (dist/)
    print("\n--- 2. Deploying Frontend to public_html/1slabs.my.id ---")
    sftp_upload_dir(LOCAL_DIST, REMOTE_FRONTEND)
    print("[OK] Frontend files uploaded.")

    # 3. Deploy Backend (backend/)
    print("\n--- 3. Deploying Backend to oneslabs-backend ---")
    sftp_upload_dir(LOCAL_BACKEND, REMOTE_BACKEND, skip_list=['node_modules', '.git'])
    print("[OK] Backend files uploaded.")

    sftp.close()

    # 4. Reload Passenger Node.js app
    print("\n--- 4. Reloading Passenger Backend Application ---")
    restart_cmd = f"mkdir -p {REMOTE_BACKEND}/tmp && touch {REMOTE_BACKEND}/tmp/restart.txt"
    ssh.exec_command(restart_cmd)
    print("[OK] Passenger restart signal triggered.")

    # 5. Test curl locally on server
    print("\n--- 5. Local Server Health & API test via SSH ---")
    time.sleep(3)
    cmd = "curl -s -i https://1slabs.my.id/api/health"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("curl output for /api/health:")
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("\n==================================================")
    print("   Completed Successfully!")
    print("==================================================")

if __name__ == "__main__":
    main()
