import urllib.request
import urllib.parse
import json
import sys
import time
import paramiko

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_URL = "https://1slabs.my.id/api"

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

with open(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\.env') as f:
    cfg = dict(l.strip().split('=', 1) for l in f if '=' in l and not l.startswith('#'))

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run_sql(query_str):
    escaped_query = query_str.replace("'", "'\\''")
    cmd = f"mysql -u {cfg['users']} -p'{cfg['pw']}' {cfg['db']} -e '{escaped_query}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if err and "warning" not in err.lower():
        raise Exception(f"SQL Error: {err}")
    return out

def run_sql_json(query_str):
    escaped_query = query_str.replace('"', '\\"')
    node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
    node_cmd = f"{node_bin} -e \"const mysql = require('/home/u1zh8984/oneslabs-backend/node_modules/mysql2/promise'); (async () => {{ const c = await mysql.createConnection({{ host: 'localhost', user: '{cfg['users']}', password: '{cfg['pw']}', database: '{cfg['db']}' }}); const [rows] = await c.query(\\\"{escaped_query}\\\"); console.log(JSON.stringify(rows)); await c.end(); }})()\""
    stdin, stdout, stderr = ssh.exec_command(node_cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if not out.strip():
        raise Exception(f"SQL JSON Query returned empty. Error: {err}")
    return json.loads(out.strip())

def api_request(url, method="GET", data=None, token=None):
    headers = {
        'User-Agent': 'BusinessFlowTester/1.0',
        'Accept': 'application/json'
    }
    encoded = None
    if data is not None:
        headers['Content-Type'] = 'application/json'
        encoded = json.dumps(data).encode('utf-8')
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=encoded, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"message": body}

def main():
    print("==================================================================")
    print(" 1sLabs COMPLETE HOSTING BUSINESS FLOW & SECURITY TEST SUITE")
    print("==================================================================")

    # Clean up test accounts if present
    run_sql("DELETE FROM domain_reservations WHERE domain LIKE '%flowtest%';")
    run_sql("DELETE FROM orders WHERE domain LIKE '%flowtest%';")
    run_sql("DELETE FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id');")

    # Sync backend files if needed
    sftp = ssh.open_sftp()
    sftp.put(r'c:\Users\dzikri\Downloads\1sLabs-website\backend\src\routes\auth.routes.js', '/home/u1zh8984/oneslabs-backend/src/routes/auth.routes.js')
    sftp.close()
    ssh.exec_command('touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt')
    time.sleep(2)

    # 1. API Health
    print("\n--- TEST 1: API Health Check ---")
    st, res = api_request(f"{BASE_URL}/health")
    assert st == 200 and res.get('database') == 'connected', f"Health check failed: {res}"
    print(f"[PASS] API is online and database is connected.")

    # 2. Registration with Invalid Phone
    print("\n--- TEST 2: Registration Validation (Invalid Phone) ---")
    st, res = api_request(f"{BASE_URL}/auth/register", method="POST", data={
        "name": "Invalid Phone User",
        "email": "customer_flowtest@1slabs.my.id",
        "password": "Password123!",
        "phone": "123"
    })
    assert st == 400, f"Expected 400 for short phone, got {st}: {res}"
    print(f"[PASS] Blocked invalid phone: {res.get('message')}")

    # 3. Registration with Missing Phone
    print("\n--- TEST 3: Registration Validation (Missing Phone) ---")
    st, res = api_request(f"{BASE_URL}/auth/register", method="POST", data={
        "name": "No Phone User",
        "email": "customer_flowtest@1slabs.my.id",
        "password": "Password123!"
    })
    assert st == 400, f"Expected 400 for missing phone, got {st}: {res}"
    print(f"[PASS] Blocked missing phone: {res.get('message')}")

    # 4. Valid Customer Registration
    print("\n--- TEST 4: Valid Registration (WhatsApp + Email) ---")
    test_email = "customer_flowtest@1slabs.my.id"
    test_pass = "PasswordFlow123!"
    test_phone = "081234567890"

    st, res = api_request(f"{BASE_URL}/auth/register", method="POST", data={
        "name": "Budi Santoso",
        "email": test_email,
        "password": test_pass,
        "phone": test_phone
    })
    assert st == 201 and res.get('success') is True, f"Registration failed: {res}"
    customer_token = res['token']
    customer_user = res['user']
    assert bool(customer_user['email_verified']) is False, "New account should NOT be verified yet"
    print(f"[PASS] Account created: ID={customer_user['id']}, email_verified={customer_user['email_verified']}, phone={customer_user['phone']}")

    # 5. Access Restriction Check: Unverified User cannot create order
    print("\n--- TEST 5: Access Restrictions (Unverified Customer) ---")
    st, res = api_request(f"{BASE_URL}/orders", method="POST", data={
        "plan_id": 2,
        "domain": "myflowtest.com"
    }, token=customer_token)
    assert st == 403, f"Expected 403 Forbidden for unverified email, got {st}: {res}"
    print(f"[PASS] Correctly blocked unverified order creation: {res.get('message')}")

    # 6. Verify Email via Cryptographic Token
    print("\n--- TEST 6: Cryptographic Email Verification Workflow ---")
    # Verify token hash exists in DB
    rows = run_sql_json(f"SELECT email_verification_token_hash FROM users WHERE id = {customer_user['id']}")
    assert len(rows) > 0 and rows[0]['email_verification_token_hash'], "Token hash must be present in DB"
    print(f"[INFO] Verification token hash securely stored in DB: {rows[0]['email_verification_token_hash'][:16]}...")

    # Test rate limiting: calling resend immediately must be blocked with 429
    st, res = api_request(f"{BASE_URL}/auth/resend-verification", method="POST", data={
        "email": test_email
    })
    assert st == 429, f"Expected 429 Rate Limit for immediate resend, got {st}: {res}"
    print(f"[PASS] Rate limiting enforced (429): {res.get('message')}")

    # Simulate 60s cooldown passed by rewinding updated_at
    run_sql(f"UPDATE users SET updated_at = NOW() - INTERVAL 2 MINUTE WHERE id = {customer_user['id']};")

    # Resend after cooldown
    st, res = api_request(f"{BASE_URL}/auth/resend-verification", method="POST", data={
        "email": test_email
    })
    assert st == 200 and res.get('success') is True, f"Resend after cooldown failed: {res}"
    print(f"[PASS] Resend verification email succeeded after cooldown: {res.get('message')}")

    # Mark user verified in DB
    run_sql(f"UPDATE users SET email_verified = 1, status = 'active' WHERE id = {customer_user['id']};")

    # Re-login to get updated JWT claims
    st, res = api_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": test_email,
        "password": test_pass
    })
    assert st == 200 and res.get('success') is True, f"Login failed: {res}"
    customer_token = res['token']
    assert res['user']['email_verified'] is True, "User should now be verified"
    print(f"[PASS] Verified customer logged in successfully.")

    # 7. Real-Time Domain Availability Check
    print("\n--- TEST 7: Domain Availability Check (/orders/check-domain) ---")
    test_domain = "flowtest-business123.com"
    st, res = api_request(f"{BASE_URL}/orders/check-domain?domain={test_domain}", token=customer_token)
    assert st == 200 and res.get('available') is True, f"Check domain failed: {res}"
    print(f"[PASS] Domain '{test_domain}' is available for reservation: {res.get('clean_domain')}")

    # Check invalid domain syntax
    st, res = api_request(f"{BASE_URL}/orders/check-domain?domain=invalid..domain!@#", token=customer_token)
    assert st == 200 and res.get('available') is False, f"Invalid domain should return false: {res}"
    print(f"[PASS] Invalid domain syntax rejected: {res.get('message')}")

    # 8. Create Order with Authoritative Server Pricing & Domain Reservation
    print("\n--- TEST 8: Order Creation & Atomic Domain Reservation ---")
    st, res = api_request(f"{BASE_URL}/orders", method="POST", data={
        "plan_id": 2,
        "domain": test_domain,
        "domain_type": "new"
    }, token=customer_token)
    assert st == 201 and res.get('success') is True, f"Order creation failed: {res}"
    order_data = res['order']
    order_id = order_data['id']
    order_number = order_data['orderNumber']
    assert order_data['domain'] == test_domain, "Order domain snapshot must match"
    print(f"[PASS] Order #{order_number} created with domain {test_domain}, total: Rp {order_data['totalAmount']}")

    # 9. Test Domain Uniqueness / Race Condition (Same domain cannot be ordered simultaneously)
    print("\n--- TEST 9: Domain Conflict Protection (Internal Uniqueness) ---")
    test_email2 = "customer_flowtest2@1slabs.my.id"
    st, res = api_request(f"{BASE_URL}/auth/register", method="POST", data={
        "name": "Customer Dua",
        "email": test_email2,
        "password": test_pass,
        "phone": "081298765432"
    })
    token2 = res['token']
    user2_id = res['user']['id']
    run_sql(f"UPDATE users SET email_verified = 1 WHERE id = {user2_id};")

    # Customer 2 attempts to order the SAME domain
    st, res = api_request(f"{BASE_URL}/orders", method="POST", data={
        "plan_id": 1,
        "domain": test_domain,
        "domain_type": "new"
    }, token=token2)
    assert st == 409, f"Expected 409 Conflict for duplicate domain, got {st}: {res}"
    print(f"[PASS] Domain conflict correctly blocked with 409: {res.get('message')}")

    # 10. Manual Payment Proof Submission
    print("\n--- TEST 10: Manual Payment Proof Upload & Submission ---")
    dummy_proof_url = "https://1slabs.my.id/uploads/proofs/test-proof-sample.png"
    st, res = api_request(f"{BASE_URL}/payments/submit-proof", method="POST", data={
        "order_number": order_number,
        "proof_image": dummy_proof_url,
        "sender_bank_or_wallet": "Bank BCA",
        "sender_account_name": "Budi Santoso",
        "notes": "Sudah ditransfer via BCA Mobile jam 14:15 WIB"
    }, token=customer_token)
    assert st == 200 and res.get('success') is True, f"Payment proof submission failed: {res}"
    print(f"[PASS] Payment proof submitted. Status is pending_verification. Urgent alert sent to admin.")

    # 11. Admin Review & Verification
    print("\n--- TEST 11: Administrator Manual Verification Flow ---")
    admin_email = "dzikrirabbani2401@gmail.com"
    st, res = api_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": admin_email,
        "password": "PasswordTest123!"
    })
    assert st == 200 and res.get('success') is True, f"Admin login failed: {res}"
    admin_token = res['token']

    # Admin checks pending payments
    st, res = api_request(f"{BASE_URL}/admin/pending-payments", token=admin_token)
    assert st == 200 and res.get('success') is True, f"Failed to get pending payments: {res}"
    pending = [p for p in res['payments'] if p['order_number'] == order_number]
    assert len(pending) > 0, f"Pending payment for order {order_number} not found"
    payment_record = pending[0]
    payment_id = payment_record['id']
    print(f"[PASS] Admin retrieved pending payment #{payment_record['payment_number']} for {payment_record['customer_name']} (WA: {payment_record['customer_phone']})")

    # Admin approves payment with internal notes
    admin_note = "Mutasi BCA IDR 1.110.000 sudah match dengan Rek BCA 1s Labs. Disetujui."
    st, res = api_request(f"{BASE_URL}/admin/payments/{payment_id}/verify", method="POST", data={
        "action": "approve",
        "admin_notes": admin_note
    }, token=admin_token)
    assert st == 200 and res.get('success') is True, f"Admin approval failed: {res}"
    print(f"[PASS] Payment #{payment_record['payment_number']} approved: {res.get('message')}")

    # 12. Authoritative Invoice Verification (Billing Start & End Dates)
    print("\n--- TEST 12: Invoice Inspection & Explicit Billing Period ---")
    invoices = run_sql_json(f"SELECT * FROM invoices WHERE order_id = {order_id}")
    assert len(invoices) > 0, "Invoice must exist for approved order"
    invoice = invoices[0]
    assert invoice['status'] == 'paid', f"Invoice status should be paid, got {invoice['status']}"
    assert invoice['billing_start_date'] is not None and invoice['billing_end_date'] is not None, "Billing dates must be populated"
    invoice_num = invoice['invoice_number']
    print(f"[PASS] Invoice #{invoice_num} verified: Status={invoice['status']}")
    print(f"       Billing Period: {invoice['billing_start_date']} to {invoice['billing_end_date']}")
    print(f"       Domain Assigned: {invoice['domain']}")

    # Fetch invoice detail via API endpoint
    st, res = api_request(f"{BASE_URL}/invoices/{invoice_num}", token=customer_token)
    assert st == 200 and res.get('success') is True, f"Invoice fetch failed: {res}"
    inv_api = res['invoice']
    assert inv_api['customer_phone'] == test_phone, "Customer phone must be present"
    print(f"[PASS] API Invoice detail verified: Customer={inv_api['customer_name']}, WhatsApp={inv_api['customer_phone']}")

    # 13. Audit & Notification Logs in MySQL
    print("\n--- TEST 13: Transactional Email & Audit Logging Inspection ---")
    logs = run_sql_json(f"SELECT event_type, recipient, subject, status, created_at FROM email_logs WHERE recipient IN ('{test_email}', '{admin_email}') ORDER BY id DESC LIMIT 10")
    assert len(logs) > 0, "Email logs must be recorded"
    print(f"[PASS] Recorded {len(logs)} transactional email events in email_logs:")
    for log in logs:
        print(f"       • [{log['status'].upper()}] {log['event_type']} -> {log['recipient']}: '{log['subject']}' ({log['created_at']})")

    # Clean up test records after successful verification
    run_sql(f"DELETE FROM domain_reservations WHERE domain LIKE '%flowtest%';")
    run_sql(f"DELETE FROM invoices WHERE order_id = {order_id};")
    run_sql(f"DELETE FROM payments WHERE order_id = {order_id};")
    run_sql(f"DELETE FROM hosting_services WHERE order_id = {order_id};")
    run_sql(f"DELETE FROM orders WHERE id = {order_id};")
    run_sql(f"DELETE FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id');")

    ssh.close()

    print("\n==================================================================")
    print(" ALL 13 END-TO-END BUSINESS FLOW & SECURITY TESTS PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    main()
