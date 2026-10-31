import requests
import json
import jwt
import time

# Create a JWT token for user id 2 (Dzikri, customer)
JWT_SECRET = "jwt_secret_dev_1slabs_2026_super_safe"
payload = {
    "id": 2,
    "email": "dzikrirabbani2401@gmail.com",
    "role": "customer",
    "iat": int(time.time()),
    "exp": int(time.time()) + 3600
}
token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

BASE_URL = "https://demo.1slabs.my.id/api"

print("=" * 60)
print("TESTING NODE.JS MANAGER ON DEMO ENVIRONMENT")
print("=" * 60)

# 1. Test List Apps
print("\n1. GET /nodejs/apps")
r = requests.get(f"{BASE_URL}/nodejs/apps", headers=headers)
print("Status:", r.status_code)
apps = r.json().get("applications", [])
print(f"Found {len(apps)} apps:")
for a in apps:
    print(f" - ID: {a['id']}, Name: {a['app_name']}, Ver: {a['nodejs_version']}, Mode: {a['app_mode']}, Startup: {a['startup_file']}, Root: ~/{a['app_root']}")

# 2. Test 1-App Free Plan Limit (Trying to create a 2nd app for user 2)
print("\n2. POST /nodejs/apps (Free Plan Limit Test)")
r_create = requests.post(f"{BASE_URL}/nodejs/apps", headers=headers, json={
    "app_name": "second-app",
    "domain": "dzikri.1slabs.my.id",
    "app_uri": "second",
    "nodejs_version": "22.23.4"
})
print("Status:", r_create.status_code)
print("Response:", r_create.json())
assert r_create.status_code == 403, "Should be rejected with 403 Free Plan limit!"
print(">>> PASS: Free plan 1-app limit successfully enforced!")

# 3. Test File Manager: List files in app root
print("\n3. GET /nodejs/apps/1/files")
r_files = requests.get(f"{BASE_URL}/nodejs/apps/1/files", headers=headers)
print("Status:", r_files.status_code)
file_data = r_files.json()
print("Current Path:", file_data.get("currentPath"))
print(f"Items count: {len(file_data.get('items', []))}")
for item in file_data.get("items", []):
    print(f" - {'[DIR] ' if item['isDirectory'] else '[FILE]'} {item['name']} ({item['sizeFormatted']})")

# 4. Test File Manager: Read index.js
print("\n4. GET /nodejs/apps/1/files/read?path=/index.js")
r_read = requests.get(f"{BASE_URL}/nodejs/apps/1/files/read?path=/index.js", headers=headers)
print("Status:", r_read.status_code)
read_data = r_read.json()
print("Filename:", read_data.get("name"))
print("First 3 lines of content:\n", "\n".join(read_data.get("content", "").splitlines()[:3]))

# 5. Test Update Config
print("\n5. PUT /nodejs/apps/1/config (Update mode & startup file)")
r_config = requests.put(f"{BASE_URL}/nodejs/apps/1/config", headers=headers, json={
    "nodejs_version": "22.23.4",
    "app_mode": "production",
    "startup_file": "index.js",
    "env_vars": {
        "PORT": "3000",
        "APP_ENV": "production",
        "APP_NAME": "backend-dzikri"
    }
})
print("Status:", r_config.status_code)
print("Response:", r_config.json())
assert r_config.json().get("success") is True, "Config update should succeed!"
print(">>> PASS: Config update successfully executed!")

print("\n" + "=" * 60)
print("ALL NODE.JS MANAGER TESTS PASSED!")
print("=" * 60)

