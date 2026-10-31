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
FRONTEND_REMOTE = "/home/u1zh8984/public_html/demo.1slabs.my.id"

BACKEND_LOCAL = r"c:\Users\dzikri\Downloads\1sLabs-website\backend"
BACKEND_REMOTE = "/home/u1zh8984/demo-oneslabs"
VENV_ACTIVATE = "/home/u1zh8984/nodevenv/demo-oneslabs/22/bin/activate"

def main():
    print("=" * 65)
    print(f"Deploying to DEMO Environment: {USER}@{HOST}")
    print(f"Frontend: https://demo.1slabs.my.id  -> {FRONTEND_REMOTE}")
    print(f"Backend : https://demo.1slabs.my.id/api -> {BACKEND_REMOTE}")
    print("=" * 65)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=30)
    print("\n[1/6] SSH connection established.")

    sftp = ssh.open_sftp()
    print("[2/6] SFTP session opened.")

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

    # 1. Deploy Frontend (dist) into demo.1slabs.my.id
    print("\n--- [3/6] Uploading Frontend (dist) to demo.1slabs.my.id ---")
    sftp_mkdir_p(FRONTEND_REMOTE)
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

    # Ensure frontend .htaccess has SPA rewrite rules & excludes /api and /uploads
    htaccess_content = (
        "Options +FollowSymLinks\n"
        "<IfModule mod_rewrite.c>\n"
        "  RewriteEngine On\n"
        "  RewriteBase /\n"
        "  RewriteRule ^api/ - [L]\n"
        "  RewriteRule ^uploads/ - [L]\n"
        "  RewriteRule ^index\\.html$ - [L]\n"
        "  RewriteCond %{REQUEST_FILENAME} !-f\n"
        "  RewriteCond %{REQUEST_FILENAME} !-d\n"
        "  RewriteRule . /index.html [L]\n"
        "</IfModule>\n"
    )
    with sftp.file(f"{FRONTEND_REMOTE}/.htaccess", "w") as f:
        f.write(htaccess_content)
    print("  Created .htaccess with SPA rewrite rules.")

    # 2. Deploy Backend files to demo-oneslabs
    print("\n--- [4/6] Uploading Backend Code (src, index.js, package.json, .env) ---")
    sftp_mkdir_p(f"{BACKEND_REMOTE}/tmp")
    sftp_mkdir_p(f"{BACKEND_REMOTE}/uploads/proofs")

    backend_src_local = os.path.join(BACKEND_LOCAL, "src")
    backend_src_remote = f"{BACKEND_REMOTE}/src".replace('\\', '/')
    upload_tree(backend_src_local, backend_src_remote)

    idx_local = os.path.join(BACKEND_LOCAL, "index.js")
    idx_remote = f"{BACKEND_REMOTE}/index.js"
    print(f"  Uploading: index.js -> {idx_remote}")
    sftp.put(idx_local, idx_remote)

    pkg_local = os.path.join(BACKEND_LOCAL, "package.json")
    pkg_remote = f"{BACKEND_REMOTE}/package.json"
    print(f"  Uploading: package.json -> {pkg_remote}")
    sftp.put(pkg_local, pkg_remote)

    # Prepare .env for demo-oneslabs
    env_local_path = os.path.join(BACKEND_LOCAL, ".env")
    with open(env_local_path, "r", encoding="utf-8") as f:
        env_content = f.read()

    # Replace BASE_URL if present with demo domain
    env_lines = []
    for line in env_content.splitlines():
        if line.startswith("BASE_URL="):
            env_lines.append("BASE_URL=https://demo.1slabs.my.id")
        else:
            env_lines.append(line)
    
    demo_env_content = "\n".join(env_lines) + "\n"
    with sftp.file(f"{BACKEND_REMOTE}/.env", "w") as f:
        f.write(demo_env_content)
    print("  Configured demo .env with BASE_URL=https://demo.1slabs.my.id")

    sftp.close()

    # 3. Backend npm install (inside virtualenv)
    print("\n--- [5/6] Installing Backend Dependencies on Remote Server ---")
    npm_cmd = f"source {VENV_ACTIVATE} && cd {BACKEND_REMOTE} && npm install --omit=dev"
    print(f"$ {npm_cmd}")
    stdin, stdout, stderr = ssh.exec_command(npm_cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip())
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err:
        print("NPM STDERR/INFO:", err)

    # 4. Restart Node application via CloudLinux Selector & touch restart.txt
    print("\n--- [6/6] Restarting Demo Node Application & Verifying ---")
    commands = [
        # Link uploads if needed
        f"ln -sfn {BACKEND_REMOTE}/uploads {FRONTEND_REMOTE}/uploads",
        f"touch {BACKEND_REMOTE}/tmp/restart.txt",
        "cloudlinux-selector restart --json --interpreter nodejs --app-root demo-oneslabs",
        f"curl -sLkI https://demo.1slabs.my.id",
        f"curl -sLk https://demo.1slabs.my.id/api/health"
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
    print("\n" + "=" * 65)
    print("🎉 Demo Deployment Completed Successfully!")
    print("Demo URL: https://demo.1slabs.my.id")
    print("=" * 65)

if __name__ == "__main__":
    main()

