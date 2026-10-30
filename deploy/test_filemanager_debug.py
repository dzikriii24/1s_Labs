import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

remote_test = """
const { resolveSafePath, getServiceRoot } = require('./src/utils/fileSandbox');
const fs = require('fs');
const root = getServiceRoot('SRV-2026-62DECA', 'kimholidaytravel.id');
console.log('ROOT:', root);
const safe1 = resolveSafePath('SRV-2026-62DECA', '', 'kimholidaytravel.id');
console.log('SAFE ROOT:', safe1);
try {
  const safeSrc = resolveSafePath('SRV-2026-62DECA', '/src', 'kimholidaytravel.id');
  console.log('SAFE /src:', safeSrc);
  console.log('src exists:', fs.existsSync(safeSrc), 'isDir:', fs.statSync(safeSrc).isDirectory());
  console.log('src items:', fs.readdirSync(safeSrc));
} catch(e) {
  console.error('ERROR /src:', e.message);
}
try {
  const safeMixed = resolveSafePath('SRV-2026-62DECA', '/src/mixed', 'kimholidaytravel.id');
  console.log('SAFE /src/mixed:', safeMixed);
  console.log('mixed count:', fs.readdirSync(safeMixed).length);
} catch(e) {
  console.error('ERROR /src/mixed:', e.message);
}
"""

stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node -e \"" + remote_test.replace('"', '\\"').replace('\n', ' ') + "\"")
print("NODE TEST RESULT:")
print(stdout.read().decode('utf-8', errors='replace'))
print("NODE STDERR:")
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()
