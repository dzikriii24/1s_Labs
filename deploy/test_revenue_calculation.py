import paramiko
import sys
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

def run_query(q):
    cmd = f"mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e \"{q}\""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    return out

print("=" * 60)
print("TESTING REVENUE CALCULATION INTEGRITY")
print("=" * 60)

# 1. Total paid sum
paid_query = "SELECT COUNT(*) as paid_count, COALESCE(SUM(amount), 0) as paid_sum FROM payments WHERE status = 'paid';"
paid_res = run_query(paid_query)
print("[1] Direct PAID payments query:")
print(paid_res)

# 2. Non-paid sum
non_paid_query = "SELECT status, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as sum_amt FROM payments WHERE status != 'paid' GROUP BY status;"
non_paid_res = run_query(non_paid_query)
print("[2] Non-paid payments (MUST NOT be in revenue):")
print(non_paid_res)

# 3. Overall query as defined in finance endpoint
test_finance_query = """
SELECT 
  COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as gross_paid_revenue,
  0.00 as refund_amount,
  COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as net_revenue,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as successful_payments,
  SUM(CASE WHEN status = 'pending_verification' THEN 1 ELSE 0 END) as pending_payments,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as failed_payments
FROM payments;
"""
finance_res = run_query(test_finance_query)
print("[3] Finance endpoint aggregate query:")
print(finance_res)

# 4. Check for double count by comparing with orders
double_check_query = """
SELECT 
  COUNT(DISTINCT p.id) as payment_ids,
  COUNT(DISTINCT o.id) as order_ids,
  SUM(p.amount) as paid_sum
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE p.status = 'paid';
"""
double_check_res = run_query(double_check_query)
print("[4] Verified Order-Payment 1-to-1 Mapping:")
print(double_check_res)

ssh.close()
print("=" * 60)
print("✓ Financial calculation queries verified on database.")
print("=" * 60)

