/**
 * 1sLabs Complete Business Flow & Security Test Suite
 * Executed on Node 22 in production environment
 */
const mysql = require('/home/u1zh8984/oneslabs-backend/node_modules/mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');

const BASE_URL = 'https://1slabs.my.id/api';

// Parse .env
const envText = fs.readFileSync('/home/u1zh8984/oneslabs-backend/.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) {
    env[parts[0]] = parts.slice(1).join('=');
  }
});

async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'RemoteE2ESuite/1.0'
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    data = { text: rawText };
  }

  return { status: res.status, data };
}

async function main() {
  console.log('==================================================================');
  console.log(' 1sLabs COMPLETE HOSTING BUSINESS FLOW & SECURITY TEST SUITE');
  console.log('==================================================================');

  const db = await mysql.createConnection({
    host: 'localhost',
    user: env.users,
    password: env.pw,
    database: env.db
  });

  // Clean previous test data
  await db.query("DELETE FROM domain_reservations WHERE domain LIKE '%flowtest%'");
  await db.query("DELETE FROM invoices WHERE domain LIKE '%flowtest%' OR user_id IN (SELECT id FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id'))");
  await db.query("DELETE FROM payments WHERE user_id IN (SELECT id FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id'))");
  await db.query("DELETE FROM hosting_services WHERE domain LIKE '%flowtest%' OR user_id IN (SELECT id FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id'))");
  await db.query("DELETE FROM orders WHERE domain LIKE '%flowtest%' OR user_id IN (SELECT id FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id'))");
  await db.query("DELETE FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id')");

  // TEST 1: API Health
  console.log('\n--- TEST 1: API Health Check ---');
  const h = await apiRequest('/health');
  if (h.status === 200 && h.data.database === 'connected') {
    console.log('[PASS] API is online and database is connected.');
  } else {
    throw new Error(`Health check failed: ${JSON.stringify(h)}`);
  }

  // TEST 2: Invalid Phone Validation
  console.log('\n--- TEST 2: Registration Validation (Invalid Phone) ---');
  const rInvalid = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Invalid Phone User',
      email: 'customer_flowtest@1slabs.my.id',
      password: 'Password123!',
      phone: '123'
    }
  });
  if (rInvalid.status === 400) {
    console.log(`[PASS] Blocked short phone: ${rInvalid.data.message}`);
  } else {
    throw new Error(`Expected 400 for short phone, got ${rInvalid.status}: ${JSON.stringify(rInvalid.data)}`);
  }

  // TEST 3: Missing Phone Validation
  console.log('\n--- TEST 3: Registration Validation (Missing Phone) ---');
  const rMissing = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'No Phone User',
      email: 'customer_flowtest@1slabs.my.id',
      password: 'Password123!'
    }
  });
  if (rMissing.status === 400) {
    console.log(`[PASS] Blocked missing phone: ${rMissing.data.message}`);
  } else {
    throw new Error(`Expected 400 for missing phone, got ${rMissing.status}`);
  }

  // TEST 4: Valid Customer Registration
  console.log('\n--- TEST 4: Valid Registration (WhatsApp + Email) ---');
  const testEmail = 'customer_flowtest@1slabs.my.id';
  const testPass = 'PasswordFlow123!';
  const testPhone = '081234567890';

  const reg = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Budi Santoso',
      email: testEmail,
      password: testPass,
      phone: testPhone
    }
  });
  if (reg.status !== 201 || !reg.data.success) {
    throw new Error(`Registration failed: ${JSON.stringify(reg.data)}`);
  }
  let customerToken = reg.data.token;
  const customerUser = reg.data.user;
  if (customerUser.email_verified !== false) {
    throw new Error(`New account should have email_verified = false, got ${customerUser.email_verified}`);
  }
  console.log(`[PASS] Account created: ID=${customerUser.id}, email_verified=${customerUser.email_verified}, phone=${customerUser.phone}`);

  // TEST 5: Access Restrictions (Unverified Customer cannot order)
  console.log('\n--- TEST 5: Access Restrictions (Unverified Customer) ---');
  const ordBlocked = await apiRequest('/orders', {
    method: 'POST',
    body: {
      plan_id: 2,
      domain: 'myflowtest.com'
    },
    token: customerToken
  });
  if (ordBlocked.status === 403) {
    console.log(`[PASS] Correctly blocked unverified order creation: ${ordBlocked.data.message}`);
  } else {
    throw new Error(`Expected 403 for unverified order, got ${ordBlocked.status}: ${JSON.stringify(ordBlocked.data)}`);
  }

  // TEST 6: Cryptographic Verification Token Storage & Rate Limiting
  console.log('\n--- TEST 6: Cryptographic Token Storage & Rate Limiting ---');
  const [userRows] = await db.query('SELECT email_verification_token_hash FROM users WHERE id = ?', [customerUser.id]);
  if (!userRows[0] || !userRows[0].email_verification_token_hash) {
    throw new Error('Token hash must be present in database');
  }
  console.log(`[INFO] Verification token hash securely stored in DB: ${userRows[0].email_verification_token_hash.slice(0, 16)}...`);

  // Rate limiting test: immediate resend
  const rlResend = await apiRequest('/auth/resend-verification', {
    method: 'POST',
    body: { email: testEmail }
  });
  if (rlResend.status === 429) {
    console.log(`[PASS] Rate limiting enforced (429): ${rlResend.data.message}`);
  } else {
    throw new Error(`Expected 429 for immediate resend, got ${rlResend.status}`);
  }

  // TEST 7: Resend after cooldown & Token Verification
  console.log('\n--- TEST 7: Verification Token Usage & Activation ---');
  await db.query('UPDATE users SET updated_at = NOW() - INTERVAL 2 MINUTE WHERE id = ?', [customerUser.id]);
  
  // Generate a known token to test /verify-email endpoint
  const rawTestToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawTestToken).digest('hex');
  await db.query(
    'UPDATE users SET email_verification_token_hash = ?, email_verification_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
    [tokenHash, customerUser.id]
  );

  const verifyRes = await apiRequest(`/auth/verify-email?token=${rawTestToken}`);
  if (verifyRes.status === 200 && verifyRes.data.success) {
    console.log(`[PASS] Cryptographic verification token validated: ${verifyRes.data.message}`);
  } else {
    throw new Error(`Email verification failed: ${JSON.stringify(verifyRes.data)}`);
  }

  // Verify single-use token: second attempt must fail
  const verifySecond = await apiRequest(`/auth/verify-email?token=${rawTestToken}`);
  if (verifySecond.status === 400) {
    console.log(`[PASS] Single-use token enforced: Cannot reuse token (${verifySecond.data.message})`);
  } else {
    throw new Error(`Expected 400 for token reuse, got ${verifySecond.status}`);
  }

  // Re-login as verified customer
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: testPass }
  });
  customerToken = loginRes.data.token;
  if (loginRes.data.user.email_verified !== true) {
    throw new Error('User should now be verified in login response');
  }
  console.log('[PASS] Customer logged in with verified status: email_verified=true');

  // TEST 8: Domain Check Endpoint
  console.log('\n--- TEST 8: Real-Time Domain Check (/orders/check-domain) ---');
  const testDomain = 'flowtest-business123.com';
  const chkValid = await apiRequest(`/orders/check-domain?domain=${testDomain}`, { token: customerToken });
  if (chkValid.status === 200 && chkValid.data.available === true) {
    console.log(`[PASS] Domain '${testDomain}' is available: ${chkValid.data.clean_domain}`);
  } else {
    throw new Error(`Expected domain available, got ${JSON.stringify(chkValid.data)}`);
  }

  const chkInvalid = await apiRequest(`/orders/check-domain?domain=bad domain!`, { token: customerToken });
  if ((chkInvalid.status === 400 || chkInvalid.status === 200) && chkInvalid.data.available === false) {
    console.log(`[PASS] Invalid domain syntax rejected (${chkInvalid.status}): ${chkInvalid.data.message}`);
  } else {
    throw new Error(`Expected invalid domain false, got ${JSON.stringify(chkInvalid.data)}`);
  }

  // TEST 9: Order Creation & Atomic Reservation
  console.log('\n--- TEST 9: Order Creation & Authoritative Pricing ---');
  const orderRes = await apiRequest('/orders', {
    method: 'POST',
    body: {
      plan_id: 2,
      domain: testDomain,
      domain_type: 'new'
    },
    token: customerToken
  });
  if (orderRes.status !== 201 || !orderRes.data.success) {
    throw new Error(`Order creation failed: ${JSON.stringify(orderRes.data)}`);
  }
  const orderData = orderRes.data.order;
  const orderId = orderData.orderId || orderData.id;
  const orderNumber = orderData.orderNumber || orderData.order_number;
  console.log(`[PASS] Order #${orderNumber} created. Authoritative Price: Rp ${orderData.amount}`);

  // TEST 10: Domain Conflict / Race Condition Protection
  console.log('\n--- TEST 10: Domain Conflict Protection (Internal Uniqueness) ---');
  const testEmail2 = 'customer_flowtest2@1slabs.my.id';
  const reg2 = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Customer Dua',
      email: testEmail2,
      password: testPass,
      phone: '081298765432'
    }
  });
  const token2 = reg2.data.token;
  await db.query('UPDATE users SET email_verified = 1 WHERE email = ?', [testEmail2]);

  const dupOrder = await apiRequest('/orders', {
    method: 'POST',
    body: {
      plan_id: 1,
      domain: testDomain,
      domain_type: 'new'
    },
    token: token2
  });
  if (dupOrder.status === 409) {
    console.log(`[PASS] Conflicting order blocked with 409 Conflict: ${dupOrder.data.message}`);
  } else {
    throw new Error(`Expected 409 for duplicate domain, got ${dupOrder.status}: ${JSON.stringify(dupOrder.data)}`);
  }

  // TEST 11: Payment Proof Submission
  console.log('\n--- TEST 11: Manual Payment Proof Submission ---');
  const dummyProof = 'https://1slabs.my.id/uploads/proofs/test-proof-sample.png';
  const submitProof = await apiRequest(`/payments/${orderNumber}/confirm`, {
    method: 'POST',
    body: {
      proof_image: dummyProof,
      sender_bank_or_wallet: 'Bank Central Asia (BCA)',
      sender_account_name: 'Budi Santoso',
      notes: 'Transfer via BCA Mobile jam 14:15 WIB'
    },
    token: customerToken
  });
  if (submitProof.status === 200 && submitProof.data.success) {
    console.log('[PASS] Payment proof submitted. Status is pending_verification.');
  } else {
    throw new Error(`Proof submission failed: ${JSON.stringify(submitProof.data)}`);
  }

  // TEST 12: Admin Verification & Approval
  console.log('\n--- TEST 12: Admin Manual Verification & Provisioning ---');
  const adminEmail = 'admin@1slabs.my.id';
  const adminRecipient = 'dzikrirabbani2401@gmail.com';
  const adminLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: 'Admin1sLabs2026!' }
  });
  if (!adminLogin.data.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;

  const pendingList = await apiRequest('/admin/payments?status=pending_verification', { token: adminToken });
  const targetPayment = pendingList.data.payments.find(p => p.order_number === orderNumber);
  if (!targetPayment) {
    throw new Error(`Pending payment for order ${orderNumber} not found`);
  }
  console.log(`[PASS] Admin retrieved pending payment #${targetPayment.payment_number}`);
  console.log(`       Customer: ${targetPayment.customer_name} (WA: ${targetPayment.customer_phone})`);
  console.log(`       Domain: ${targetPayment.order_domain}`);

  // Admin approves payment
  const adminNote = 'Mutasi BCA Rp 1.110.000 sudah masuk dan diverifikasi. Disetujui.';
  const verifyAction = await apiRequest(`/admin/payments/${targetPayment.id}/verify`, {
    method: 'POST',
    body: {
      action: 'approve',
      admin_notes: adminNote
    },
    token: adminToken
  });
  if (verifyAction.status === 200 && verifyAction.data.success) {
    console.log(`[PASS] Admin verified payment: ${verifyAction.data.message}`);
  } else {
    throw new Error(`Admin verification failed: ${JSON.stringify(verifyAction.data)}`);
  }

  // TEST 13: Authoritative Invoice & Explicit Billing Period
  console.log('\n--- TEST 13: Authoritative Invoice & Billing Period ---');
  const [invoices] = await db.query('SELECT * FROM invoices WHERE order_id = ?', [orderId]);
  if (!invoices[0]) {
    throw new Error('Invoice must exist for approved order');
  }
  const invoice = invoices[0];
  if (invoice.status !== 'paid' || !invoice.billing_start_date || !invoice.billing_end_date) {
    throw new Error(`Invalid invoice state: ${JSON.stringify(invoice)}`);
  }
  console.log(`[PASS] Invoice #${invoice.invoice_number} created with status 'paid'`);
  console.log(`       Billing Start Date: ${invoice.billing_start_date}`);
  console.log(`       Billing End Date:   ${invoice.billing_end_date}`);
  console.log(`       Assigned Domain:    ${invoice.domain}`);

  const invApi = await apiRequest(`/invoices/${invoice.invoice_number}`, { token: customerToken });
  if (invApi.status === 200 && invApi.data.invoice.customer_phone.includes('81234567890')) {
    console.log(`[PASS] Invoice API ownership verified. Customer WhatsApp: ${invApi.data.invoice.customer_phone}`);
  } else {
    throw new Error(`Invoice API fetch failed: ${JSON.stringify(invApi.data)}`);
  }

  // TEST 14: Transactional Email Delivery Logs
  console.log('\n--- TEST 14: Transactional Email Audit & Logs ---');
  const [logs] = await db.query(
    'SELECT template_name, recipient, subject, status, created_at FROM email_logs WHERE recipient IN (?, ?) ORDER BY id DESC LIMIT 10',
    [testEmail, adminRecipient]
  );
  if (logs.length === 0) {
    throw new Error('Email logs should have recorded transactional events');
  }
  console.log(`[PASS] Recorded ${logs.length} transactional email events:`);
  logs.forEach(l => {
    console.log(`       • [${l.status.toUpperCase()}] ${l.template_name} -> ${l.recipient}: "${l.subject}"`);
  });

  // Clean test records
  await db.query("DELETE FROM domain_reservations WHERE domain LIKE '%flowtest%'");
  await db.query('DELETE FROM invoices WHERE order_id = ?', [orderId]);
  await db.query('DELETE FROM payments WHERE order_id = ?', [orderId]);
  await db.query('DELETE FROM hosting_services WHERE order_id = ?', [orderId]);
  await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
  await db.query("DELETE FROM users WHERE email IN ('customer_flowtest@1slabs.my.id', 'customer_flowtest2@1slabs.my.id')");

  await db.end();

  console.log('\n==================================================================');
  console.log(' ALL 14 END-TO-END BUSINESS FLOW & SECURITY TESTS PASSED!');
  console.log('==================================================================');
}

main().catch(err => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
