import paramiko
import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
PASSPHRASE = "Rabbani2401*"
REMOTE_BASE = "public_html/1slabs.my.id"
LOCAL_DIST = r"c:\Users\dzikri\Downloads\1sLabs-website\dist"

def main():
    print("=== 1sLabs Deployment Script ===")
    print(f"Connecting to {USERNAME}@{HOSTNAME}...")
    
    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] SSH connected successfully.")

    # Check remote directory
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {REMOTE_BASE}")
    print(f"\nCurrent files in {REMOTE_BASE}:")
    print(stdout.read().decode('utf-8'))

    sftp = ssh.open_sftp()
    print("[OK] SFTP channel opened.")

    # Function to recursively upload a folder
    def sftp_upload_dir(local_dir, remote_dir):
        try:
            sftp.mkdir(remote_dir)
            print(f"Created remote dir: {remote_dir}")
        except IOError:
            pass  # Directory already exists
            
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            remote_path = f"{remote_dir}/{item}"
            if os.path.isdir(local_path):
                sftp_upload_dir(local_path, remote_path)
            else:
                size = os.path.getsize(local_path)
                print(f"Uploading: {item} -> {remote_path} ({size} bytes)...")
                sftp.put(local_path, remote_path)
                # Set permissions to 644 for files
                try:
                    sftp.chmod(remote_path, 0o644)
                except Exception:
                    pass

    # Ensure remote assets dir is clean or ready
    print("\nStarting upload from local dist/ ...")
    for item in os.listdir(LOCAL_DIST):
        local_path = os.path.join(LOCAL_DIST, item)
        remote_path = f"{REMOTE_BASE}/{item}"
        if os.path.isdir(local_path):
            sftp_upload_dir(local_path, remote_path)
        else:
            size = os.path.getsize(local_path)
            print(f"Uploading: {item} -> {remote_path} ({size} bytes)...")
            sftp.put(local_path, remote_path)
            try:
                sftp.chmod(remote_path, 0o644)
            except Exception:
                pass

    print("\n[OK] All files uploaded successfully!")

    # Verify remote files
    print(f"\nFinal state in {REMOTE_BASE}:")
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {REMOTE_BASE} && ls -la {REMOTE_BASE}/assets")
    print(stdout.read().decode('utf-8'))

    sftp.close()
    ssh.close()
    print("Deployment finished successfully!")

if __name__ == "__main__":
    main()
