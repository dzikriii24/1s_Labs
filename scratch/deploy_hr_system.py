import paramiko
import os
import sys
import time
import urllib.request
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

REMOTE_BACKEND = "/home/u1zh8984/oneslabs-backend"
LOCAL_BACKEND = r"c:\Users\dzikri\Downloads\1sLabs-website\backend"

REMOTE_FRONTEND = "public_html/1slabs.my.id"
LOCAL_DIST = r"c:\Users\dzikri\Downloads\1sLabs-website\dist"

def main():
    print("==================================================")
    print("   1sLabs HR & Recruitment System Deployment")
    print("==================================================")

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=30)
    print("[OK] SSH connection established.")

    sftp = ssh.open_sftp()
    print("[OK] SFTP channel opened.")

    def sftp_mkdir_p(remote_directory):
        dirs = []
        dir_cur = remote_directory
        while dir_cur and dir_cur != "/":
            dirs.append(dir_cur)
            dir_cur = os.path.dirname(dir_cur)
        dirs.reverse()
        for d in dirs:
            try:
                sftp.stat(d)
            except IOError:
                try:
                    sftp.mkdir(d)
                except IOError:
                    pass

    def sftp_upload_dir(local_dir, remote_dir, skip_list=None):
        if skip_list is None:
            skip_list = []
        sftp_mkdir_p(remote_dir)

        for item in os.listdir(local_dir):
            if item in skip_list:
                continue
            l_path = os.path.join(local_dir, item)
            r_path = f"{remote_dir}/{item}".replace('\\', '/')
            if os.path.isdir(l_path):
                sftp_upload_dir(l_path, r_path, skip_list)
            else:
                size = os.path.getsize(l_path)
                sftp.put(l_path, r_path)
                try:
                    sftp.chmod(r_path, 0o644)
                except Exception:
                    pass

    # 1. Upload Frontend dist/
    print("\n--- 1. Deploying Frontend to public_html/1slabs.my.id ---")
    sftp_upload_dir(LOCAL_DIST, REMOTE_FRONTEND)
    print("[OK] Frontend files uploaded successfully.")

    # 2. Upload Backend src/ and index.js
    print("\n--- 2. Deploying Backend to oneslabs-backend ---")
    sftp_upload_dir(os.path.join(LOCAL_BACKEND, "src"), f"{REMOTE_BACKEND}/src")
    sftp.put(os.path.join(LOCAL_BACKEND, "index.js"), f"{REMOTE_BACKEND}/index.js")
    try:
        sftp.chmod(f"{REMOTE_BACKEND}/index.js", 0o644)
    except Exception:
        pass
    print("[OK] Backend files uploaded successfully.")

    sftp.close()

    # 3. Reload Backend
    print("\n--- 3. Restarting Node.js Backend Application ---")
    commands = [
        f"mkdir -p {REMOTE_BACKEND}/tmp && touch {REMOTE_BACKEND}/tmp/restart.txt",
        "cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend"
    ]
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        print(f"$ {cmd}")
        if out:
            print(f"  Stdout: {out}")
        if err:
            print(f"  Stderr: {err}")

    time.sleep(3)

    # 4. Verification on Remote Server via curl
    print("\n--- 4. Verification on Server ---")
    test_cmds = [
        "curl -s https://1slabs.my.id/api/health",
        "curl -s -o /dev/null -w 'HTTP %{http_code}' https://1slabs.my.id/interview/schedule"
    ]
    for cmd in test_cmds:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        print(f"$ {cmd} -> {out}")

    ssh.close()
    print("\n==================================================")
    print("   1sLabs Deployment Completed Successfully!")
    print("==================================================")

if __name__ == "__main__":
    main()

