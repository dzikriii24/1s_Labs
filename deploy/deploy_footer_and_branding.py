import paramiko
import os
import sys

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
    print("Connecting to SSH...")
    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] Connected.")

    sftp = ssh.open_sftp()

    def sftp_upload_dir(local_dir, remote_dir, skip_list=None):
        if skip_list is None:
            skip_list = []
        try:
            sftp.mkdir(remote_dir)
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
                sftp.put(l_path, r_path)
                try:
                    sftp.chmod(r_path, 0o644)
                except Exception:
                    pass

    print("Uploading frontend dist...")
    sftp_upload_dir(LOCAL_DIST, REMOTE_FRONTEND)
    print("[OK] Frontend uploaded.")

    print("Uploading backend...")
    sftp_upload_dir(LOCAL_BACKEND, REMOTE_BACKEND, skip_list=['node_modules', '.git'])
    print("[OK] Backend uploaded.")

    sftp.close()

    print("Restarting Passenger...")
    restart_cmd = f"mkdir -p {REMOTE_BACKEND}/tmp && touch {REMOTE_BACKEND}/tmp/restart.txt"
    stdin, stdout, stderr = ssh.exec_command(restart_cmd)
    stdout.read()
    print("[OK] Restart triggered.")

    ssh.close()
    print("[ALL DONE] Deployed successfully!")

if __name__ == '__main__':
    main()
