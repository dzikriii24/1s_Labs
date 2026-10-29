import paramiko
import sys
import os
import json

# Ensure UTF-8
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

env_file = r"c:\Users\dzikri\Downloads\1sLabs-website\backend\.env"
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

db_user = env_vars.get('users')
db_name = env_vars.get('db')
db_pw = env_vars.get('pw')

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

pro_features = json.dumps([
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

# Password hash for default admin 'Admin1sLabs2026!'
# Generated with bcrypt 10 rounds: $2a$10$7R9rRjZ6b1Q8V01fQ...
admin_hash = "$2a$10$w3U6P6X5mP7Fj7uVf0m5geGvFjPcmO8zQd9GZJmJqZ7y6W9K5Y1S6"

seed_sql = f"""
INSERT INTO hosting_plans (slug, name, target, price, period, billing_cycle_months, description, storage_gb, databases_count, bandwidth, ssl_type, backup_frequency, is_recommended, is_active, display_order, features_json)
VALUES 
('starter', 'Starter Hosting', 'Ideal for Landing Pages & Company Profiles', 850000.00, '/ tahun', 12, 'Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional.', 30, 10, 'Unmetered', 'Free Auto-SSL Let\\'s Encrypt', 'Weekly Cloud Backup', 0, 1, 1, '{starter_features}'),
('business', 'Business Hosting', 'Best for Growing Companies & Active UMKM', 1000000.00, '/ tahun', 12, 'Pilihan paling populer dengan kapasitas penyimpanan 60 GB, 25 database, dan backup otomatis berkala.', 60, 25, 'Unmetered', 'Free Auto-SSL Let\\'s Encrypt', 'Weekly Cloud Backup', 1, 1, 2, '{business_features}'),
('professional', 'Professional Hosting', 'For High-Traffic Sites & Critical Portals', 1200000.00, '/ tahun', 12, 'Performa maksimal dengan unlimited storage dan dukungan prioritas untuk portal bisnis dengan lalu lintas tinggi.', -1, -1, 'Unmetered', 'Commercial SSL Certificate', 'Daily Cloud Backup', 0, 1, 3, '{pro_features}')
ON DUPLICATE KEY UPDATE 
name=VALUES(name), target=VALUES(target), price=VALUES(price), period=VALUES(period), description=VALUES(description), storage_gb=VALUES(storage_gb), databases_count=VALUES(databases_count), is_recommended=VALUES(is_recommended), features_json=VALUES(features_json);

INSERT INTO hosting_settings (setting_key, setting_value, description)
VALUES
('qris_image_path', '/qris.jpeg', 'Path publik gambar QRIS resmi'),
('server_ip', '194.233.65.45', 'IP Server Hosting 1sLabs'),
('nameserver_1', 'ns1.1slabs.my.id', 'Primary Nameserver'),
('nameserver_2', 'ns2.1slabs.my.id', 'Secondary Nameserver'),
('cpanel_url', 'https://1slabs.my.id:2083', 'URL cPanel Client'),
('whatsapp_support', '6285156296580', 'Nomor WhatsApp Resmi Dukungan Hosting')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
"""

print(f"Connecting to {USERNAME}@{HOSTNAME} to seed data...")
pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

sftp = ssh.open_sftp()
remote_seed_path = "/home/u1zh8984/oneslabs_seed.sql"
with sftp.file(remote_seed_path, "w") as f:
    f.write(seed_sql)
sftp.close()

cmd = f"mysql -u {db_user} -p'{db_pw}' {db_name} < {remote_seed_path} && rm -f {remote_seed_path}"
stdin, stdout, stderr = ssh.exec_command(cmd)
err = stderr.read().decode('utf-8')
if err and "warning" not in err.lower():
    print("Seed Error:", err)
    sys.exit(1)

print("[OK] Seed data inserted successfully!")

# Verify plans
stdin, stdout, stderr = ssh.exec_command(f"mysql -u {db_user} -p'{db_pw}' {db_name} -e 'SELECT id, slug, name, price FROM hosting_plans;'")
print("\nHosting plans in database:")
print(stdout.read().decode('utf-8'))

ssh.close()
