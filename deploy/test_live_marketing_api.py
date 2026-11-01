import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

# Generate admin JWT token using backend secret
cmd_token = "node -e \"const jwt = require('/home/u1zh8984/oneslabs-backend/node_modules/jsonwebtoken'); console.log(jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f', { expiresIn: '1h' }));\""
stdin, stdout, stderr = ssh.exec_command(cmd_token)
token = stdout.read().decode('utf-8').strip()
print("Generated Admin Token:", token[:25] + "...")

# 1. Test /api/admin/marketing/stats
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" https://1slabs.my.id/api/admin/marketing/stats')
out = stdout.read().decode('utf-8')
print("\n--- 1. Marketing Stats Response ---")
print(out[:400])

# 2. Test /api/admin/marketing/companies?scope=indonesia
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" "https://1slabs.my.id/api/admin/marketing/companies?scope=indonesia&limit=3"')
out = stdout.read().decode('utf-8')
print("\n--- 2. Indonesia Small Businesses Response ---")
print(out[:400])

# 3. Test /api/admin/marketing/companies?scope=international
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" "https://1slabs.my.id/api/admin/marketing/companies?scope=international&limit=3"')
out = stdout.read().decode('utf-8')
print("\n--- 3. International Small Businesses Response ---")
print(out[:400])

# 4. Test /api/admin/marketing/contacts
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" "https://1slabs.my.id/api/admin/marketing/contacts?limit=3"')
out = stdout.read().decode('utf-8')
print("\n--- 4. Marketing Contacts Response ---")
print(out[:400])

# 5. Test /api/admin/marketing/campaigns
stdin, stdout, stderr = ssh.exec_command(f'curl -s -H "Authorization: Bearer {token}" https://1slabs.my.id/api/admin/marketing/campaigns')
out = stdout.read().decode('utf-8')
print("\n--- 5. Marketing Campaigns & Templates Response ---")
print(out[:400])

ssh.close()
