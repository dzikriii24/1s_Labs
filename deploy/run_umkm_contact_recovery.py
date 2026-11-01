import os
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    print("=" * 60)
    print("Running Stage 2 Contact Recovery on Indonesian UMKM...")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=20)

    script = """
const { runBatchContactRecovery, getContactRecoveryStats } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/contactRecovery.service');
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function testRecovery() {
  console.log('--- Initial Contact Stats ---');
  const initialStats = await getContactRecoveryStats();
  console.log(initialStats);

  console.log('\\nRunning batch contact recovery on 5 Indonesian businesses without contacts...');
  const batchResult = await runBatchContactRecovery({ filter: 'no_contacts', limit: 5 });
  console.log('Batch Recovery Result:', batchResult);

  console.log('\\n--- Updated Contact Stats ---');
  const updatedStats = await getContactRecoveryStats();
  console.log(updatedStats);

  const sampleRecovered = await query(`
    SELECT c.id, c.name, c.city, c.whatsapp_number, c.instagram_url, c.website_url, c.email,
           (SELECT COUNT(*) FROM marketing_contacts mc WHERE mc.company_id = c.id) as contacts_count
    FROM marketing_companies c
    WHERE c.whatsapp_number IS NOT NULL OR c.instagram_url IS NOT NULL OR c.email IS NOT NULL
    LIMIT 10
  `);
  console.log('\\nSample Companies with Recovered Contacts:');
  console.table(sampleRecovered);

  process.exit(0);
}

testRecovery().catch(err => {
  console.error('Error during recovery test:', err);
  process.exit(1);
});
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/test_recovery.js', 'w') as f:
        f.write(script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node test_recovery.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

