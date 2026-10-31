import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

script = """
const jwt = require('/home/u1zh8984/demo-oneslabs/node_modules/jsonwebtoken');
require('/home/u1zh8984/demo-oneslabs/node_modules/dotenv').config({ path: '/home/u1zh8984/demo-oneslabs/.env' });

const secret = process.env.JWT_SECRET || 'jwt_secret_dev_1slabs_2026_super_safe';
const token = jwt.sign({ id: 2, email: 'dzikrirabbani2401@gmail.com', role: 'customer' }, secret, { expiresIn: '1h' });

async function run() {
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  console.log('--- 1. List Apps ---');
  const r1 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps', { headers });
  const d1 = await r1.json();
  console.log('Apps:', d1.applications.map(a => ({ id: a.id, name: a.app_name, ver: a.nodejs_version, mode: a.app_mode, startup: a.startup_file, root: a.app_root })));

  console.log('\\n--- 2. Free Plan Limit Test (Attempt create 2nd app) ---');
  const r2 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      app_name: 'test-second',
      domain: 'dzikri.1slabs.my.id',
      app_uri: 'test2'
    })
  });
  console.log('HTTP Status:', r2.status);
  const d2 = await r2.json();
  console.log('Response:', d2);
  if (r2.status === 403) {
    console.log('>>> SUCCESS: Free Plan 1-app limit correctly rejected second application creation!');
  } else {
    console.error('FAILED: Expected status 403, got ' + r2.status);
  }

  console.log('\\n--- 3. List Files in App 1 (File Manager) ---');
  const r3 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps/1/files', { headers });
  const d3 = await r3.json();
  console.log('Current Path:', d3.currentPath);
  console.log('Total Usage:', d3.totalUsageFormatted);
  console.log('Files in root:', d3.items.map(i => (i.isDirectory ? '[DIR] ' : '[FILE] ') + i.name + ' (' + i.sizeFormatted + ')'));

  console.log('\\n--- 4. Read File in App 1 (index.js) ---');
  const r4 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps/1/files/read?path=/index.js', { headers });
  const d4 = await r4.json();
  console.log('File Name:', d4.name, '| Size:', d4.sizeFormatted);
  console.log('File Content Preview:');
  console.log(d4.content.split('\\n').slice(0, 5).join('\\n'));

  console.log('\\n--- 5. Update App 1 Config (Mode, Version, Startup File, Env Vars) ---');
  const r5 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps/1/config', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      nodejs_version: '22.23.4',
      app_mode: 'production',
      startup_file: 'index.js',
      env_vars: {
        PORT: '3000',
        NODE_ENV: 'production',
        MANAGED_BY: '1sLabs'
      }
    })
  });
  console.log('Config Update Status:', r5.status);
  const d5 = await r5.json();
  console.log('Config Update Message:', d5.message);
  if (d5.success) {
    console.log('>>> SUCCESS: App configuration updated and restarted via CloudLinux Selector!');
  }

  console.log('\\n--- 6. Health Check after restart ---');
  const r6 = await fetch('https://demo.1slabs.my.id/api/nodejs/apps/1/health', { headers });
  const d6 = await r6.json();
  console.log('Health Response:', d6);
}

run().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file("/home/u1zh8984/demo-oneslabs/test_runner.js", "w") as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /home/u1zh8984/demo-oneslabs/test_runner.js")
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("STDERR:", err)

# Cleanup
ssh.exec_command("rm -f /home/u1zh8984/demo-oneslabs/test_runner.js")
ssh.close()
