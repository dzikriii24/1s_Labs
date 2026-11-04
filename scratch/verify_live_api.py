import paramiko
import json
import urllib.request

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# 1. Check positions in database directly
stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, title, department, employment_type, is_active FROM hr_positions LIMIT 5;'")
print("HR Positions in Remote DB:")
print(stdout.read().decode('utf-8'))

# 2. Check templates in database directly
stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT id, template_code, name, subject FROM hr_email_templates LIMIT 5;'")
print("HR Email Templates in Remote DB:")
print(stdout.read().decode('utf-8'))

# 3. Test generating admin token via node script on server to query /admin/hr/stats
node_test = """
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, process.env.JWT_SECRET || '1slabs_jwt_secret_key_prod_2025_secure');
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/admin/hr/stats',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Stats Response:', data.substring(0, 300));
  });
});
req.on('error', (e) => console.error('Req error:', e.message));
req.end();
"""

stdin, stdout, stderr = ssh.exec_command(f"cd /home/u1zh8984/oneslabs-backend && node -e \"{node_test}\"")
print("Local Server API Test (/admin/hr/stats):")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("Error:", err)

ssh.close()

