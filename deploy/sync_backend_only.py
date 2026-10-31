import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
BACKEND_LOCAL = r"c:\Users\dzikri\Downloads\1sLabs-website\backend"
BACKEND_REMOTE = "/home/u1zh8984/oneslabs-backend"

def main():
    print(f"Connecting to {USER}@{HOST}...")
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

    sftp = ssh.open_sftp()

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

    backend_src_local = os.path.join(BACKEND_LOCAL, "src")
    backend_src_remote = f"{BACKEND_REMOTE}/src".replace('\\', '/')
    upload_tree(backend_src_local, backend_src_remote)

    idx_local = os.path.join(BACKEND_LOCAL, "index.js")
    idx_remote = f"{BACKEND_REMOTE}/index.js"
    sftp.put(idx_local, idx_remote)

    sftp.close()

    print("Restarting Node backend application...")
    commands = [
        "touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt",
        "cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend",
        "curl -s https://1slabs.my.id/api/health"
    ]
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(f"$ {cmd}")
        print(stdout.read().decode('utf-8', errors='replace').strip())

    ssh.close()
    print("Backend synced and restarted successfully!")

if __name__ == '__main__':
    main()
