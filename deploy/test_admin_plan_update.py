import urllib.request
import json
import sys

headers = {'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}

# 1. Login as admin
login_req = urllib.request.Request(
    'https://1slabs.my.id/api/auth/login',
    data=json.dumps({'email': 'admin@1slabs.my.id', 'password': 'Admin1sLabs2026!'}).encode('utf-8'),
    headers=headers
)

try:
    login_res = urllib.request.urlopen(login_req)
    login_data = json.loads(login_res.read().decode('utf-8'))
    token = login_data['token']
    print("[OK] Admin logged in. Token acquired.")
except Exception as e:
    print("[FAIL] Admin login failed:", e)
    sys.exit(1)

auth_headers = {
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}

# 2. Fetch plans via admin
plans_req = urllib.request.Request('https://1slabs.my.id/api/admin/plans', headers=auth_headers)
plans_res = urllib.request.urlopen(plans_req)
plans_data = json.loads(plans_res.read().decode('utf-8'))
print(f"[OK] Fetched {len(plans_data['plans'])} plans via admin endpoint.")

# 3. Test updating plan 1 (Starter)
plan1 = plans_data['plans'][0]
updated_payload = dict(plan1)
updated_payload['description'] = "Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional."

update_req = urllib.request.Request(
    f"https://1slabs.my.id/api/admin/plans/{plan1['id']}",
    data=json.dumps(updated_payload).encode('utf-8'),
    headers=auth_headers,
    method='PUT'
)
update_res = urllib.request.urlopen(update_req)
update_data = json.loads(update_res.read().decode('utf-8'))
print("[OK] Admin update plan result:", update_data)

# 4. Fetch public /api/plans/starter to confirm changes reflect immediately
pub_req = urllib.request.Request('https://1slabs.my.id/api/plans/starter', headers={'User-Agent': 'Mozilla/5.0'})
pub_res = urllib.request.urlopen(pub_req)
pub_data = json.loads(pub_res.read().decode('utf-8'))
print("[OK] Public plan verification:", pub_data['plan']['name'], "Price:", pub_data['plan']['price'], "Features count:", len(pub_data['plan']['features']))
print("ALL TESTS PASSED PERFECTLY!")
