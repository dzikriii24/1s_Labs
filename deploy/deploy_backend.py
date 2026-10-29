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

def main():
    print("=== Deploying 1sLabs Backend to Server ===")
    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] Connected to SSH server.")

    sftp = ssh.open_sftp()
    print("[OK] SFTP channel opened.")

    # Helper function to recursively upload backend files, skipping node_modules
    def upload_dir(local_path, remote_path):
        try:
            sftp.mkdir(remote_path)
            print(f"Created remote dir: {remote_path}")
        except IOError:
            pass

        for item in os.listdir(local_path):
            if item in ['node_modules', '.git']:
                continue
            l_item = os.path.join(local_path, item)
            r_item = f"{remote_path}/{item}"
            if os.path.isdir(l_item):
                upload_dir(l_item, r_item)
            else:
                size = os.path.getsize(l_item)
                print(f"Uploading: {item} -> {r_item} ({size} bytes)")
                sftp.put(l_item, r_item)
                try:
                    sftp.chmod(r_item, 0o644)
                except Exception:
                    pass

    upload_dir(LOCAL_BACKEND, REMOTE_BACKEND)
    sftp.close()
    print("[OK] All backend files uploaded.")

    # Run npm install on remote virtualenv
    print("\nRunning npm install on remote server virtualenv...")
    npm_cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && npm install --omit=dev"
    stdin, stdout, stderr = ssh.exec_command(npm_cmd)
    npm_out = stdout.read().decode('utf-8')
    npm_err = stderr.read().decode('utf-8')
    print("NPM Output:")
    print(npm_out)
    if npm_err:
        print("NPM Stderr / Notice:")
        print(npm_err)

    # Touch restart.txt to reload Passenger
    print("\nRestarting Passenger application...")
    ssh.exec_command(f"mkdir -p {REMOTE_BACKEND}/tmp && touch {REMOTE_BACKEND}/tmp/restart.txt")
    ssh.close()
    print("[OK] Passenger restart signal sent.")

    # Verify health endpoint
    print("\nWaiting 4 seconds for Passenger reload...")
    time.sleep(4)

    health_url = "https://1slabs.my.id/api/health"
    print(f"Testing {health_url} ...")
    try:
        req = urllib.request.Request(health_url, headers={'User-Agent': 'DeployVerifier/1.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read().decode('utf-8')
            print(f"Response ({resp.status}): {data}")
    except Exception as e:
        print(f"Verification test: {e}")

    # Also test plans endpoint
    plans_url = "https://1slabs.my.id/api/plans"
    print(f"\nTesting {plans_url} ...")
    try:
        req = urllib.request.Request(plans_url, headers={'User-Agent': 'DeployVerifier/1.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read().decode('utf-8')
            print(f"Response ({resp.status}): {data[:200]}...")
    except Exception as e:
        print(f"Plans verification test: {e}")

if __name__ == "__main__":
    main()
