import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out)
    if err:
        print("STDERR:", err)

# 1. Inspect lines 55-75 of orders.routes.js
run("sed -n '55,75p' /home/u1zh8984/oneslabs-backend/src/routes/orders.routes.js")

# 2. Add debug marker in orders.routes.js
sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/src/routes/orders.routes.js', 'r') as f:
    content = f.read().decode('utf-8')

old_code = """    // 1. Check existing active/pending hosting services
    const [existingService] = await query(
      `SELECT id FROM hosting_services WHERE domain = ? AND status IN ('active', 'pending_provisioning', 'awaiting_domain') LIMIT 1`,
      [cleaned]
    );"""

new_code = """    // 1. Check existing active/pending hosting services
    const hsRows = await query(
      `SELECT id, domain, status FROM hosting_services WHERE domain = ? AND status IN ('active', 'pending_provisioning', 'awaiting_domain') LIMIT 1`,
      [cleaned]
    );
    const existingService = hsRows[0];
    const fs = require('fs');
    fs.appendFileSync('/home/u1zh8984/oneslabs-backend/check_domain_debug.log', 
      new Date().toISOString() + ' cleaned: ' + cleaned + ' hsRows: ' + JSON.stringify(hsRows) + '\\n');"""

if old_code in content:
    content = content.replace(old_code, new_code)
    # Also inject a header in the response
    content = content.replace("res.status(409).json({", "res.set('X-Debug-Marker', 'ONESLABS_DEBUG').status(409).json({")
    with sftp.file('/home/u1zh8984/oneslabs-backend/src/routes/orders.routes.js', 'w') as f:
        f.write(content.encode('utf-8'))
    print("Successfully replaced orders.routes.js with debug code!")
else:
    print("WARNING: old_code not found in orders.routes.js!")

sftp.close()

# 3. Touch restart.txt and kill node to reload
run("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
run("pkill -9 -f 'lsnode:/home/u1zh8984/oneslabs-backend' || true")

# 4. Run test_check_api.js
node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
run(f"{node_bin} /home/u1zh8984/test_check_api.js")

# 5. Check if debug log was written
run("cat /home/u1zh8984/oneslabs-backend/check_domain_debug.log || true")

ssh.close()
