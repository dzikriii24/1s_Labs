import os
import sys
import json
import subprocess
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

# Extract JSON from deploy/docsData.cjs
node_script = "const docs = require('./deploy/docsData.cjs'); console.log(JSON.stringify(docs.ALL_DOC_ARTICLES));"
res = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, encoding='utf-8')
if res.returncode != 0:
    print("Node error:", res.stderr)
    sys.exit(1)

articles = json.loads(res.stdout)
print(f"Loaded {len(articles)} articles to seed.")

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
print("SSH connected.")

sftp = ssh.open_sftp()
# Ensure scripts directory exists
try:
    sftp.mkdir("/home/u1zh8984/oneslabs-backend/scripts")
except Exception:
    pass

# Write articles json to remote /tmp
with sftp.file("/tmp/seed_articles.json", "w") as f:
    f.write(json.dumps(articles, ensure_ascii=False))
print("Uploaded /tmp/seed_articles.json")

# Upload seed_docs.js
sftp.put(r"backend\scripts\seed_docs.js", "/home/u1zh8984/oneslabs-backend/scripts/seed_docs.js")
print("Uploaded seed_docs.js")
sftp.close()

# Run via nodevenv node
cmd = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node /home/u1zh8984/oneslabs-backend/scripts/seed_docs.js"
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("Output:\n", out)
if err:
    print("Stderr:\n", err)

# Check count in MySQL
stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SELECT count(*) as total_articles, count(distinct category) as total_categories FROM documentation_articles;'")
print("Verification:\n", stdout.read().decode('utf-8', errors='replace'))

ssh.close()
