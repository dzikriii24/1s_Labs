import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

script = """
const mysql = require('/home/u1zh8984/oneslabs-backend/node_modules/mysql2/promise');

async function searchAll() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'u1zh8984_oneslabs',
    password: 'Rabbani2401*',
    database: 'u1zh8984_oneslabs'
  });

  const [tables] = await conn.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0])[0];

  for (const t of tables) {
    const tableName = t[tableKey];
    try {
      const [rows] = await conn.query(`SELECT * FROM \\`${tableName}\\``);
      for (const row of rows) {
        const str = JSON.stringify(row);
        if (str.includes('kimholiday')) {
          console.log(`FOUND in table [${tableName}]:`, str);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  await conn.end();
}

searchAll().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/search_kimholiday_db.js', 'w') as f:
    f.write(script)
sftp.close()

node_bin = "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
stdin, stdout, stderr = ssh.exec_command(f"{node_bin} /home/u1zh8984/search_kimholiday_db.js")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

ssh.close()
