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
    print("Connecting to production server to run International Small Business Discovery...")
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, pkey=pkey, timeout=20)

    run_script = """
const { runDiscoveryJob } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/discoveryScheduler.service');
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function run() {
  const [source] = await query("SELECT id, name FROM marketing_sources WHERE source_type = 'international_business' LIMIT 1");
  if (!source) {
    console.error('Source international_business not found!');
    process.exit(1);
  }

  console.log(`Running discovery for source #${source.id}: ${source.name}...`);
  const result = await runDiscoveryJob(source.id, { limit: 15 });
  console.log('Result:', result);

  const intlCompanies = await query("SELECT id, name, country, city, category, business_scale, phone, whatsapp_number, instagram_url, email FROM marketing_companies WHERE is_international = 1");
  console.log('\\nTotal International Companies:', intlCompanies.length);
  console.table(intlCompanies);

  const contacts = await query(`
    SELECT mc.id, mc.full_name, mc.position, mc.email, mc.phone, mc.contact_type, c.name as company_name 
    FROM marketing_contacts mc 
    JOIN marketing_companies c ON mc.company_id = c.id 
    WHERE c.is_international = 1
  `);
  console.log('\\nTotal International Contacts:', contacts.length);
  console.table(contacts);

  process.exit(0);
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/run_intl_discovery.js', 'w') as f:
        f.write(run_script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node run_intl_discovery.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

