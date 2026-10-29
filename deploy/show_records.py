import paramiko
import sys

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

with open(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\.env') as f:
    cfg = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))

sql_queries = [
    ("USERS", "SELECT id, email, name, role FROM users;"),
    ("HOSTING PLANS", "SELECT id, slug, name, price, is_active FROM hosting_plans;"),
    ("ORDERS", "SELECT id, order_number, plan_name_snapshot, price_snapshot, type, status FROM orders;"),
    ("PAYMENTS", "SELECT id, payment_number, amount, status, sender_bank_or_wallet, sender_account_name FROM payments;"),
    ("HOSTING SERVICES", "SELECT id, service_code, domain, status, server_ip, expires_at FROM hosting_services;"),
    ("INVOICES", "SELECT id, invoice_number, plan_name, amount, status, paid_at FROM invoices;"),
    ("SERVICE EVENTS", "SELECT id, service_id, event_type, title, description, created_at FROM service_events;"),
    ("AUDIT LOGS", "SELECT id, payment_id, admin_id, action, previous_status, new_status, reason FROM payment_verification_logs;")
]

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

print("=== REAL DATABASE STATUS ON MYSQL (u1zh8984_oneslabs) ===")
for title, query in sql_queries:
    print(f"\n--- {title} ---")
    cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e \"{query}\""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    print(out if out.strip() else "(No records)")

ssh.close()
