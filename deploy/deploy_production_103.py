import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
FRONTEND_LOCAL = r"c:\Users\dzikri\Downloads\1sLabs-website\dist"
FRONTEND_REMOTE = "/home/u1zh8984/public_html/1slabs.my.id"

BACKEND_LOCAL = r"c:\Users\dzikri\Downloads\1sLabs-website\backend"
BACKEND_REMOTE = "/home/u1zh8984/oneslabs-backend"

def main():
    print("=" * 60)
    print(f"Deploying to Production Server: {USER}@{HOST}")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)
    print("[1/5] SSH connection established.")

    sftp = ssh.open_sftp()
    print("[2/5] SFTP session opened.")

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

    def upload_tree(local_dir, remote_dir, ignore_dirs=None):
        if ignore_dirs is None:
            ignore_dirs = set()
        for root, dirs, files in os.walk(local_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            rel_path = os.path.relpath(root, local_dir)
            target_dir = remote_dir if rel_path == '.' else os.path.join(remote_dir, rel_path).replace('\\', '/')
            sftp_mkdir_p(target_dir)

            for file in files:
                local_file = os.path.join(root, file)
                remote_file = f"{target_dir}/{file}".replace('\\', '/')
                size = os.path.getsize(local_file)
                print(f"  Uploading: {file} ({size:,} B) -> {remote_file}")
                sftp.put(local_file, remote_file)
                try:
                    sftp.chmod(remote_file, 0o644)
                except Exception:
                    pass

    # 1. Deploy Frontend (dist)
    print("\n--- [3/5] Uploading Frontend (dist) ---")
    for item in os.listdir(FRONTEND_LOCAL):
        local_path = os.path.join(FRONTEND_LOCAL, item)
        remote_path = f"{FRONTEND_REMOTE}/{item}".replace('\\', '/')
        if os.path.isdir(local_path):
            upload_tree(local_path, remote_path)
        else:
            size = os.path.getsize(local_path)
            print(f"  Uploading root file: {item} ({size:,} B) -> {remote_path}")
            sftp.put(local_path, remote_path)
            try:
                sftp.chmod(remote_path, 0o644)
            except Exception:
                pass

    # 2. Deploy Backend src, index.js, and package.json
    print("\n--- [4/5] Uploading Backend Code (src, index.js, package.json) ---")
    backend_src_local = os.path.join(BACKEND_LOCAL, "src")
    backend_src_remote = f"{BACKEND_REMOTE}/src".replace('\\', '/')
    upload_tree(backend_src_local, backend_src_remote)

    idx_local = os.path.join(BACKEND_LOCAL, "index.js")
    if os.path.exists(idx_local):
        idx_remote = f"{BACKEND_REMOTE}/index.js"
        print(f"  Uploading: index.js -> {idx_remote}")
        sftp.put(idx_local, idx_remote)

    pkg_local = os.path.join(BACKEND_LOCAL, "package.json")
    if os.path.exists(pkg_local):
        pkg_remote = f"{BACKEND_REMOTE}/package.json"
        print(f"  Uploading: package.json -> {pkg_remote}")
        sftp.put(pkg_local, pkg_remote)

    sftp.close()

    # 3. Restart Node Application
    print("\n--- [5/5] Restarting Node Backend Application ---")
    commands = [
        "touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt",
        "cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend",
        "cat /home/u1zh8984/public_html/1slabs.my.id/index.html | grep -E 'assets/index'",
        "curl -s --max-time 5 -H 'User-Agent: Mozilla/5.0' https://1slabs.my.id/api/health"
    ]

    for cmd in commands:
        print(f"\n$ {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if out:
            print(out)
        if err:
            print("STDERR:", err)

    ssh.close()
    print("\n" + "=" * 60)
    print("Deployment completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
