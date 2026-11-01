import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
HOST = "103.119.237.132"
USER = "u1zh8984"

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=30)

    node_script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');
async function run() {
  const comps = await query('SELECT id, name, category, city, province, website_url, email, phone, primary_source_name FROM marketing_companies');
  const contacts = await query('SELECT * FROM marketing_contacts');

  const compContactMap = {};
  for (const c of contacts) {
    if (!compContactMap[c.company_id]) compContactMap[c.company_id] = [];
    compContactMap[c.company_id].push(c);
  }

  let noEmail = 0, noPhone = 0, noWeb = 0, noContacts = 0, completelyBlank = 0;
  for (const c of comps) {
    const hasEmail = Boolean(c.email);
    const hasPhone = Boolean(c.phone);
    const hasWeb = Boolean(c.website_url);
    const hasContacts = Boolean(compContactMap[c.id] && compContactMap[c.id].length > 0);

    if (!hasEmail) noEmail++;
    if (!hasPhone) noPhone++;
    if (!hasWeb) noWeb++;
    if (!hasContacts) noContacts++;
    if (!hasEmail && !hasPhone && !hasWeb && !hasContacts) completelyBlank++;
  }

  console.log(JSON.stringify({
    totalCompanies: comps.length,
    noEmail,
    noPhone,
    noWeb,
    noContactsTableRecord: noContacts,
    completelyBlank
  }, null, 2));

  console.log('\\nSample 15 companies and their current status:');
  const sample = comps.slice(0, 15).map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    city: c.city,
    hasWeb: !!c.website_url,
    hasEmail: !!c.email,
    hasPhone: !!c.phone,
    contactsCount: compContactMap[c.id] ? compContactMap[c.id].length : 0
  }));
  console.log(JSON.stringify(sample, null, 2));

  process.exit(0);
}
run();
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/audit_existing.js', 'w') as f:
        f.write(node_script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node audit_existing.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

