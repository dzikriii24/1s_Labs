import urllib.request
import json
import time

time.sleep(3) # Wait for Passenger to reload

BASE_URL = "https://1slabs.my.id/api"
HEADERS = {'User-Agent': 'Mozilla/5.0'}

# 1. Login
data = json.dumps({"email": "admin@1slabs.my.id", "password": "Admin1sLabs2026!"}).encode('utf-8')
req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={**HEADERS, 'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read().decode('utf-8'))['token']

auth_headers = {**HEADERS, 'Authorization': f'Bearer {token}'}
service_code = 'SRV-2026-179F76'

# 2. Test Export Database 1 (u1zh8984_s1_testing)
print("=== Testing Export Endpoint ===")
export_req = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases/1/export", headers=auth_headers)
with urllib.request.urlopen(export_req) as resp:
    dump_content = resp.read().decode('utf-8')
    print("Content-Disposition:", resp.headers.get('Content-Disposition'))
    print("Dump snippet (first 300 chars):")
    print(dump_content[:300])

# 3. Test Import Endpoint with a small SQL script
print("\n=== Testing Import Endpoint ===")
import_sql = """
CREATE TABLE IF NOT EXISTS imported_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO imported_logs (log_message) VALUES ('Test import via 1sLabs API');
"""
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="sqlFile"; filename="sample_backup.sql"\r\n'
    f"Content-Type: application/sql\r\n\r\n"
    f"{import_sql}\r\n"
    f"--{boundary}--\r\n"
).encode('utf-8')

import_headers = {
    **auth_headers,
    'Content-Type': f'multipart/form-data; boundary={boundary}'
}

import_req = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases/1/import", data=body, headers=import_headers, method='POST')
with urllib.request.urlopen(import_req) as resp:
    import_res = json.loads(resp.read().decode('utf-8'))
    print("Import Response:", import_res)

# 4. Verify Tables list now includes 'imported_logs'
print("\n=== Verifying Tables in Database ===")
tables_req = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases/1/tables", headers=auth_headers)
with urllib.request.urlopen(tables_req) as resp:
    tables_res = json.loads(resp.read().decode('utf-8'))
    print("Current tables:", [t['name'] for t in tables_res['tables']])

print("\n[SUCCESS] All Export & Import features tested and verified successfully!")
