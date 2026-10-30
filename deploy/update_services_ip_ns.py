import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

remote_js = """
const db = require('./src/db');
(async () => {
  try {
    const updateRes = await db.query(
      "UPDATE hosting_services SET server_ip = '103.119.237.132', nameservers = 'ns1.domainmurah.net, ns2.domainmurah.net'"
    );
    console.log("UPDATE RESULT:", updateRes);
    const rows = await db.query("SELECT id, service_code, domain, server_ip, nameservers FROM hosting_services");
    console.log("UPDATED SERVICES:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/update_srv.js', 'w') as f:
    f.write(remote_js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node update_srv.js && rm -f update_srv.js")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
