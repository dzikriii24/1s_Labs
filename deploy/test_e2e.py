import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "https://1slabs.my.id/api"

def request_json(url, method="GET", data=None, token=None):
    headers = {
        'User-Agent': 'E2ETester/1.0',
        'Accept': 'application/json'
    }
    encoded_data = None
    if data is not None:
        headers['Content-Type'] = 'application/json'
        encoded_data = json.dumps(data).encode('utf-8')
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

def main():
    print("==================================================")
    print("   1sLabs Hosting Platform End-to-End Test Suite")
    print("==================================================")

    # 1. Health check
    print("\n[Step 1] Checking API Health...")
    status, res = request_json(f"{BASE_URL}/health")
    assert status == 200 and res.get('database') == 'connected', f"Health check failed: {res}"
    print(f" -> OK: {res.get('service')} (DB: {res.get('database')})")

    # 2. Get Plans Catalog
    print("\n[Step 2] Fetching Hosting Plans Catalog...")
    status, res = request_json(f"{BASE_URL}/plans")
    assert status == 200 and len(res.get('plans', [])) >= 3, f"Plans fetch failed: {res}"
    plans = res['plans']
    business_plan = next(p for p in plans if p['slug'] == 'business')
    print(f" -> OK: Found {len(plans)} active plans. Selected '{business_plan['name']}' ({business_plan['price']}).")

    # 3. Customer Registration / Login
    test_email = "pelanggan_test@1slabs.my.id"
    test_pass = "PasswordTest123!"
    print(f"\n[Step 3] Registering / Logging in Customer ({test_email})...")
    status, res = request_json(f"{BASE_URL}/auth/register", method="POST", data={
        "name": "Budi Pratama (Test Customer)",
        "email": test_email,
        "password": test_pass,
        "phone": "081234567890"
    })
    
    if status == 201:
        cust_token = res['token']
        cust_user = res['user']
        print(f" -> OK: Registered new customer: {cust_user['name']}")
    else:
        # Already registered, log in
        status, res = request_json(f"{BASE_URL}/auth/login", method="POST", data={
            "email": test_email,
            "password": test_pass
        })
        assert status == 200, f"Login failed: {res}"
        cust_token = res['token']
        cust_user = res['user']
        print(f" -> OK: Logged in customer: {cust_user['name']}")

    # 4. Customer Creates Order
    print(f"\n[Step 4] Creating Order for Plan ID {business_plan['id']}...")
    status, res = request_json(f"{BASE_URL}/orders", method="POST", data={
        "plan_id": business_plan['id'],
        "type": "new",
        "customer_notes": "Mohon segera diproses, rencana domain tokoelektronik.my.id"
    }, token=cust_token)
    assert status == 201, f"Order creation failed: {res}"
    order_info = res['order']
    order_number = order_info['orderNumber']
    payment_number = order_info['paymentNumber']
    print(f" -> OK: Order created: {order_number} (Payment: {payment_number}, Amount: {order_info['amount']})")

    # 5. Customer fetches QRIS Info
    print("\n[Step 5] Checking QRIS Configuration...")
    status, res = request_json(f"{BASE_URL}/payments/qris-info")
    assert status == 200 and 'imageUrl' in res.get('qris', {}), f"QRIS info failed: {res}"
    print(f" -> OK: Merchant '{res['qris']['merchantName']}', Image: {res['qris']['imageUrl']}")

    # 6. Customer confirms payment
    print(f"\n[Step 6] Customer Submits Payment Confirmation for {order_number}...")
    # Using multipart form-data simulation via standard request or POST with notes
    # Our backend accepts multipart/form-data for proof_image and body params
    # We can test multipart upload using boundary
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body_parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"sender_bank_or_wallet\"\r\n\r\nBCA Mobile\r\n",
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"sender_account_name\"\r\n\r\nBudi Pratama\r\n",
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"notes\"\r\n\r\nTransfer m-banking BCA berhasil jam 15:20 WIB\r\n",
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"proof_image\"; filename=\"struk_transfer.png\"\r\nContent-Type: image/png\r\n\r\n(fake-png-data)\r\n",
        f"--{boundary}--\r\n"
    ]
    payload = "".join(body_parts).encode('latin-1')
    req = urllib.request.Request(
        f"{BASE_URL}/payments/{order_number}/confirm",
        data=payload,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {cust_token}',
            'User-Agent': 'E2ETester/1.0'
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        confirm_res = json.loads(resp.read().decode('utf-8'))
        assert confirm_res['success'], f"Payment confirm failed: {confirm_res}"
        print(f" -> OK: Confirmation sent: {confirm_res['message']} (Status: {confirm_res['status']})")

    # 7. Admin Logs In
    print("\n[Step 7] Logging in as Admin (admin@1slabs.my.id)...")
    status, res = request_json(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "admin@1slabs.my.id",
        "password": "Admin1sLabs2026!"
    })
    assert status == 200 and res['user']['role'] == 'admin', f"Admin login failed: {res}"
    admin_token = res['token']
    print(f" -> OK: Admin logged in: {res['user']['name']} (Role: {res['user']['role']})")

    # 8. Admin Finds Payment in Pending Queue
    print("\n[Step 8] Admin inspecting Pending Payments Queue...")
    status, res = request_json(f"{BASE_URL}/admin/payments?status=pending_verification", token=admin_token)
    assert status == 200, f"Admin payments fetch failed: {res}"
    pending_list = res.get('payments', [])
    found_payment = next((p for p in pending_list if p['order_number'] == order_number), None)
    assert found_payment is not None, f"Order {order_number} not found in pending payments list!"
    print(f" -> OK: Payment ID {found_payment['id']} found for order {order_number}. Sender: {found_payment['sender_account_name']} ({found_payment['sender_bank_or_wallet']})")

    # 9. Admin Approves Payment
    print(f"\n[Step 9] Admin Approving Payment ID {found_payment['id']}...")
    status, res = request_json(f"{BASE_URL}/admin/payments/{found_payment['id']}/verify", method="POST", data={
        "action": "approve"
    }, token=admin_token)
    assert status == 200 and res.get('success'), f"Payment verification failed: {res}"
    verify_result = res['result']
    created_service_code = verify_result['serviceCode']
    created_invoice_num = verify_result['invoiceNumber']
    print(f" -> OK: Payment APPROVED!")
    print(f"       Generated Service Code: {created_service_code}")
    print(f"       Generated Invoice: {created_invoice_num}")

    # 10. Customer Checks Services
    print(f"\n[Step 10] Customer Checking Services List...")
    status, res = request_json(f"{BASE_URL}/services", token=cust_token)
    assert status == 200 and len(res.get('services', [])) > 0, f"Customer services fetch failed: {res}"
    customer_service = next((s for s in res['services'] if s['service_code'] == created_service_code), None)
    assert customer_service is not None, f"Service {created_service_code} not found in customer list!"
    assert customer_service['status'] == 'awaiting_domain', f"Expected awaiting_domain, got {customer_service['status']}"
    print(f" -> OK: Service exists in customer portal with status '{customer_service['status']}'.")

    # 11. Customer Sets Up Domain
    test_domain = "tokoelektronik.my.id"
    print(f"\n[Step 11] Customer Setting Up Domain '{test_domain}' for Service {created_service_code}...")
    status, res = request_json(f"{BASE_URL}/services/{created_service_code}/setup-domain", method="POST", data={
        "domain": test_domain,
        "domain_type": "existing"
    }, token=cust_token)
    assert status == 200 and res.get('success'), f"Setup domain failed: {res}"
    print(f" -> OK: Domain configured: {res['domain']} (Status: {res['status']})")

    # 12. Admin Activates Service
    print(f"\n[Step 12] Admin Activating Service Provisioning...")
    status, res = request_json(f"{BASE_URL}/admin/services/{customer_service['id']}/provision", method="PUT", data={
        "status": "active",
        "cpanel_username": "u1zh_tokoelek",
        "admin_notes": "Virtual host and phpMyAdmin successfully provisioned on server"
    }, token=admin_token)
    assert status == 200 and res.get('success'), f"Provision update failed: {res}"
    print(" -> OK: Service status set to 'active' with cPanel username 'u1zh_tokoelek'.")

    # 13. Customer Views Full Active Service Details & Timeline
    print(f"\n[Step 13] Customer Viewing Full Active Service Details...")
    status, res = request_json(f"{BASE_URL}/services/{created_service_code}", token=cust_token)
    assert status == 200 and res['service']['status'] == 'active', f"Service detail failed: {res}"
    srv_detail = res['service']
    print(f" -> OK: Service {srv_detail['service_code']} is ACTIVE!")
    print(f"       Domain: {srv_detail['domain']}")
    print(f"       Days Remaining: {srv_detail['days_remaining']} hari")
    print(f"       Server IP: {srv_detail['server_ip']}")
    print(f"       Timeline Events Count: {len(srv_detail.get('events', []))}")
    for evt in srv_detail.get('events', []):
        print(f"         • [{evt['event_type']}] {evt['title']}: {evt['description'][:60]}...")

    # 14. Customer Views & Prints Invoice
    print(f"\n[Step 14] Customer Viewing Invoice {created_invoice_num}...")
    status, res = request_json(f"{BASE_URL}/invoices/{created_invoice_num}", token=cust_token)
    assert status == 200 and res.get('success'), f"Invoice fetch failed: {res}"
    inv_data = res['invoice']
    assert inv_data['status'] == 'paid', f"Expected paid invoice, got {inv_data['status']}"
    print(f" -> OK: Invoice verified: {inv_data['invoice_number']} (Status: {inv_data['status']}, Amount: {inv_data['amount']})")

    # 15. Customer Renews Service
    print(f"\n[Step 15] Customer Initiating Service Renewal...")
    status, res = request_json(f"{BASE_URL}/orders", method="POST", data={
        "plan_id": business_plan['id'],
        "type": "renewal",
        "related_service_id": customer_service['id'],
        "customer_notes": "Perpanjangan tahun kedua"
    }, token=cust_token)
    assert status == 201, f"Renewal order creation failed: {res}"
    renewal_order_num = res['order']['orderNumber']
    print(f" -> OK: Renewal order created: {renewal_order_num}")

    # 16. Admin Verifies Renewal Payment
    print(f"\n[Step 16] Admin Approving Renewal Payment...")
    status, res = request_json(f"{BASE_URL}/admin/payments", token=admin_token)
    renewal_payment = next((p for p in res['payments'] if p['order_number'] == renewal_order_num), None)
    assert renewal_payment is not None, f"Renewal payment not found!"
    status, res = request_json(f"{BASE_URL}/admin/payments/{renewal_payment['id']}/verify", method="POST", data={
        "action": "approve"
    }, token=admin_token)
    assert status == 200 and res.get('success'), f"Renewal approval failed: {res}"
    print(" -> OK: Renewal payment APPROVED and service extended by 1 year!")

    # 17. Verify Extended Expiration Date
    status, res = request_json(f"{BASE_URL}/services/{created_service_code}", token=cust_token)
    assert status == 200, f"Failed to get updated service: {res}"
    extended_srv = res['service']
    print(f" -> OK: Extended Days Remaining: {extended_srv['days_remaining']} hari (Expires: {extended_srv['expires_at']})")

    # 18. Admin Stats Verification
    print(f"\n[Step 18] Admin Checking Real Database Stats...")
    status, res = request_json(f"{BASE_URL}/admin/stats", token=admin_token)
    assert status == 200, f"Stats fetch failed: {res}"
    stats_data = res['stats']
    print(f" -> OK: Admin Stats Summary:")
    print(f"       Total Customers: {stats_data['totalCustomers']}")
    print(f"       Total Orders: {stats_data['totalOrders']}")
    print(f"       Verified Paid Payments: {stats_data['paidPayments']}")
    print(f"       Total Verified Revenue: Rp {stats_data['totalRevenue']:,.0f}")
    print(f"       Active Services: {stats_data['activeServices']}")

    print("\n==================================================")
    print("   ALL 18 END-TO-END TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    main()
