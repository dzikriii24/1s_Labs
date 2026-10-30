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
        print("STDOUT:\n", out)
    if err:
        print("STDERR:", err)

# Read current index.js
sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/index.js', 'r') as f:
    code = f.read().decode('utf-8')

debug_route = """
// Temporary debug endpoint to inspect running process & DB
apiRouter.get('/debug-domain', async (req, res) => {
  const { query } = require('./src/db');
  const d = req.query.domain || 'kimholidaytravel.id';
  const [dbRow] = await query('SELECT DATABASE() as db');
  const services = await query('SELECT id, user_id, service_code, domain, status FROM hosting_services');
  const hsMatch = await query('SELECT id, domain, status FROM hosting_services WHERE domain = ?', [d]);
  return res.json({
    pid: process.pid,
    cwd: process.cwd(),
    db: dbRow.db,
    queriedDomain: d,
    hsMatch,
    allServices: services,
    timestamp: new Date().toISOString()
  });
});
"""

if 'apiRouter.get(\'/debug-domain\'' not in code:
    code = code.replace("apiRouter.get('/health',", debug_route + "\napiRouter.get('/health',")
    with sftp.file('/home/u1zh8984/oneslabs-backend/index.js', 'w') as f:
        f.write(code.encode('utf-8'))
    print("Injected /debug-domain into index.js")

sftp.close()

# Restart app via cloudlinux-selector
run("cloudlinux-selector stop --json --interpreter nodejs --app-root oneslabs-backend")
run("cloudlinux-selector start --json --interpreter nodejs --app-root oneslabs-backend")

# Call debug endpoint
run("curl -k -s 'https://194.233.65.45/api/debug-domain?domain=kimholidaytravel.id' -H 'Host: 1slabs.my.id'")

ssh.close()
