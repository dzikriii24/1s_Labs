import paramiko
import sys

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    return out

print("=== TABLES IN u1zh8984_oneslabs ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SHOW TABLES;'"))

print("=== USERS COUNT & SAMPLE ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, email, name, role, email_verified, status FROM users;'"))

print("=== ORDERS COUNT & SAMPLE ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, order_number, user_id, plan_name_snapshot, domain, status FROM orders;'"))

print("=== HOSTING SERVICES SAMPLE ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, service_code, user_id, domain, status, activated_at, expires_at FROM hosting_services;'"))

print("=== EMAIL LOGS SAMPLE ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, recipient, subject, template_name, status, attempts, created_at FROM email_logs ORDER BY id DESC LIMIT 5;'"))

print("=== HOSTING ANALYTICS COUNT & SAMPLE ===")
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT COUNT(*) as total_events FROM hosting_analytics;'"))
print(run("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT id, service_code, domain, event_type, page_path, visitor_id, device, browser, created_at FROM hosting_analytics ORDER BY id DESC LIMIT 5;'"))

ssh.close()
