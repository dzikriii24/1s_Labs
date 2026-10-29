import paramiko
import os
import sys
import time

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

with open(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\.env') as f:
    cfg = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))

def main():
    print("==================================================")
    print("   1sLabs Update PPN 11% & Deploy to Server")
    print("==================================================")

    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] SSH connection established.")

    # 1. Update Database existing records to include PPN 11%
    print("\n--- 1. Updating MySQL records with PPN 11% (850k + 11% = 943.5k, 1m + 11% = 1.11m) ---")
    sql_updates = """
    UPDATE orders SET price_snapshot = 943500.00 WHERE plan_id = 1;
    UPDATE payments p JOIN orders o ON p.order_id = o.id SET p.amount = 943500.00 WHERE o.plan_id = 1;
    UPDATE invoices inv JOIN orders o ON inv.order_id = o.id SET inv.amount = 943500.00 WHERE o.plan_id = 1;

    UPDATE orders SET price_snapshot = 1110000.00 WHERE plan_id = 2;
    UPDATE payments p JOIN orders o ON p.order_id = o.id SET p.amount = 1110000.00 WHERE o.plan_id = 2;
    UPDATE invoices inv JOIN orders o ON inv.order_id = o.id SET inv.amount = 1110000.00 WHERE o.plan_id = 2;

    UPDATE orders SET price_snapshot = 1332000.00 WHERE plan_id = 3;
    UPDATE payments p JOIN orders o ON p.order_id = o.id SET p.amount = 1332000.00 WHERE o.plan_id = 3;
    UPDATE invoices inv JOIN orders o ON inv.order_id = o.id SET inv.amount = 1332000.00 WHERE o.plan_id = 3;
    """
    cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e \"{sql_updates}\""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if err:
        print("SQL Warning/Notice:", err)
    print("[OK] Database amounts updated.")

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

    # 2. Upload Frontend (dist/)
    print("\n--- 2. Uploading Frontend to public_html/1slabs.my.id ---")
    sftp_upload_dir(LOCAL_DIST, REMOTE_FRONTEND)
    print("[OK] Frontend files uploaded.")

    # 3. Upload Backend (backend/)
    print("\n--- 3. Uploading Backend to oneslabs-backend ---")
    sftp_upload_dir(LOCAL_BACKEND, REMOTE_BACKEND, skip_list=['node_modules', '.git'])
    print("[OK] Backend files uploaded.")

    sftp.close()

    # 4. Reload Passenger Node.js app
    print("\n--- 4. Reloading Passenger Backend Application ---")
    restart_cmd = f"mkdir -p {REMOTE_BACKEND}/tmp && touch {REMOTE_BACKEND}/tmp/restart.txt"
    ssh.exec_command(restart_cmd)
    print("[OK] Passenger restart signal triggered.")

    time.sleep(3)

    # 5. Check API health & Invoices
    print("\n--- 5. Verifying Live API ---")
    cmd = "curl -s -i https://1slabs.my.id/api/health"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8'))

    # Check updated invoice record from database
    check_cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e \"SELECT id, invoice_number, plan_name, amount, status FROM invoices;\""
    stdin, stdout, stderr = ssh.exec_command(check_cmd)
    print("\nUpdated Invoices in DB:")
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("\n==================================================")
    print("   All updates deployed successfully!")
    print("==================================================")

if __name__ == "__main__":
    main()
