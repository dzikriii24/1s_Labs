import paramiko
import os
import sys
import json
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
    print("   1sLabs Sync Plans & Full Deploy to Server")
    print("==================================================")

    pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=20)
    print("[OK] SSH connection established.")

    # 1. Update database records for plans with JSON features and matched pricing
    print("\n--- 1. Updating hosting_plans in MySQL with accurate baseline data ---")
    starter_features = json.dumps([
        "30 GB High-Speed NVMe SSD Storage",
        "10 MySQL Databases",
        "Unmetered Monthly Bandwidth",
        "Free SSL Certificate (Auto-SSL)",
        "Akses cPanel & File Manager Mandiri",
        "Bantuan Setup & Deployment Gratis",
        "Dukungan Teknis via WhatsApp Standar",
        "Garansi Uptime Server 99.9%"
    ])

    business_features = json.dumps([
        "60 GB High-Speed NVMe SSD Storage",
        "25 MySQL Databases",
        "Unmetered Monthly Bandwidth",
        "Free SSL Certificate (Auto-SSL)",
        "Akses cPanel Penuh & phpMyAdmin",
        "Backup Otomatis Mingguan (Weekly Cloud)",
        "Bantuan Setup & Konfigurasi Domain DNS",
        "Optimasi Kecepatan (LiteSpeed Caching)",
        "Dukungan Teknis Prioritas via WhatsApp"
    ])

    professional_features = json.dumps([
        "Unlimited High-Speed NVMe SSD Storage",
        "Unlimited MySQL Databases",
        "Unmetered Monthly Bandwidth",
        "Free Commercial SSL Certificate",
        "Resource CPU & RAM Lebih Tinggi (High-Performance)",
        "Backup Otomatis Harian (Daily Cloud)",
        "Bantuan Penuh Migrasi Website & Deployment",
        "Dukungan VIP Fast-Response via WhatsApp",
        "Proactive Monitoring & Security Audit"
    ])

    sql_starter = f"""
    UPDATE hosting_plans 
    SET price = 850000.00,
        name = 'Starter Hosting',
        target = 'Ideal for Landing Pages & Company Profiles',
        period = '/ tahun',
        description = 'Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional.',
        storage_gb = 30,
        databases_count = 10,
        bandwidth = 'Unmetered Monthly Bandwidth',
        ssl_type = 'Free SSL Certificate (Auto-SSL)',
        backup_frequency = 'Weekly Cloud',
        email_accounts = 'Akun Email Domain Mandiri',
        is_recommended = 0,
        is_active = 1,
        features_json = '{starter_features}'
    WHERE slug = 'starter';
    """

    sql_business = f"""
    UPDATE hosting_plans 
    SET price = 1000000.00,
        name = 'Business Hosting',
        target = 'Best for Growing Companies & Active UMKM',
        period = '/ tahun',
        description = 'Pilihan paling populer dengan kapasitas penyimpanan 60 GB, 25 database, dan backup otomatis berkala.',
        storage_gb = 60,
        databases_count = 25,
        bandwidth = 'Unmetered Monthly Bandwidth',
        ssl_type = 'Free SSL Certificate (Auto-SSL)',
        backup_frequency = 'Backup Otomatis Mingguan (Weekly Cloud)',
        email_accounts = 'Akun Email Domain Mandiri',
        is_recommended = 1,
        is_active = 1,
        features_json = '{business_features}'
    WHERE slug = 'business';
    """

    sql_professional = f"""
    UPDATE hosting_plans 
    SET price = 1200000.00,
        name = 'Professional Hosting',
        target = 'For High-Traffic Sites & Critical Portals',
        period = '/ tahun',
        description = 'Performa maksimal dengan unlimited storage dan dukungan prioritas untuk portal bisnis dengan lalu lintas tinggi.',
        storage_gb = -1,
        databases_count = -1,
        bandwidth = 'Unmetered Monthly Bandwidth',
        ssl_type = 'Free Commercial SSL Certificate',
        backup_frequency = 'Backup Otomatis Harian (Daily Cloud)',
        email_accounts = 'Akun Email Domain Mandiri',
        is_recommended = 0,
        is_active = 1,
        features_json = '{professional_features}'
    WHERE slug = 'professional';
    """

    full_sql = sql_starter + sql_business + sql_professional
    cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e \"{full_sql}\""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if err:
        print("SQL Warning/Notice:", err)
    print("[OK] MySQL hosting_plans updated with baseline prices & features.")

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
    stdin, stdout, stderr = ssh.exec_command(restart_cmd)
    stdout.read()
    print("[OK] Passenger restart signal triggered.")

    # 5. Verify records
    print("\n--- 5. Verifying MySQL hosting_plans in remote DB ---")
    verify_cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e 'SELECT id, slug, name, price, period, target, description FROM hosting_plans;' -E"
    stdin, stdout, stderr = ssh.exec_command(verify_cmd)
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("[ALL DONE] Sync and Deployment Completed Successfully!")

if __name__ == '__main__':
    main()
