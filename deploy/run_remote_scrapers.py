import paramiko
import sys

KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
HOST = "103.119.237.132"
USER = "u1zh8984"

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=30)

    # Remote script to execute scraping for KADIN, ISEF, and Google Business
    remote_script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');
const { runDiscoveryJob } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/discoveryScheduler.service');
const { extractAndEnrichBusiness } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/gemini.service');

async function run() {
  console.log('--- Marketing Sources ---');
  const sources = await query('SELECT id, name, is_active FROM marketing_sources');
  console.log(sources);

  // 1. Run KADIN Scraper (Source #2)
  const kadin = sources.find(s => s.name.includes('KADIN'));
  if (kadin) {
    console.log(`\\n[1/3] Running KADIN Scraper (Source #${kadin.id})...`);
    try {
      const resKadin = await runDiscoveryJob(kadin.id, { limit: 30 });
      console.log('KADIN Result:', resKadin);
    } catch (e) {
      console.error('KADIN error:', e.message);
    }
  }

  // 2. Run ISEF Business Matching Scraper (Source #1)
  const isef = sources.find(s => s.name.includes('ISEF'));
  if (isef) {
    console.log(`\\n[2/3] Running ISEF Scraper (Source #${isef.id})...`);
    try {
      const resIsef = await runDiscoveryJob(isef.id, { limit: 30 });
      console.log('ISEF Result:', resIsef);
    } catch (e) {
      console.error('ISEF error:', e.message);
    }
  }

  // 3. Run Google Business / Local Discovery Scraper (Source #5)
  const gbiz = sources.find(s => s.name.includes('Google') || s.name.includes('Discovery'));
  if (gbiz) {
    console.log(`\\n[3/3] Running Google Business Discovery (Source #${gbiz.id})...`);
    try {
      const resGbiz = await runDiscoveryJob(gbiz.id, { limit: 20 });
      console.log('Google Discovery Result:', resGbiz);
    } catch (e) {
      console.error('Google Discovery error:', e.message);
    }
  }

  // Check saved companies count
  const countRows = await query('SELECT COUNT(*) as total, category FROM marketing_companies GROUP BY category');
  console.log('\\n--- Companies by Category in Database ---');
  console.log(countRows);

  const total = await query('SELECT COUNT(*) as total FROM marketing_companies');
  console.log(`Total Companies in Database: ${total[0].total}`);

  const contactsTotal = await query('SELECT COUNT(*) as total FROM marketing_contacts');
  console.log(`Total Contacts in Database: ${contactsTotal[0].total}`);

  // Test AI Enrichment on 3 companies
  console.log('\\n--- Testing AI Enrichment on Sample Companies ---');
  const companiesToEnrich = await query('SELECT id, name, category, website_url FROM marketing_companies WHERE ai_enrichment_status = "pending" LIMIT 3');
  for (const comp of companiesToEnrich) {
    console.log(`Enriching company #${comp.id} (${comp.name})...`);
    try {
      const enriched = await extractAndEnrichBusiness(comp.id);
      console.log(`Enriched #${comp.id}: Lead Score=${enriched.lead_score}, Needs=${JSON.stringify(enriched.recommended_services || [])}`);
    } catch (err) {
      console.error(`Enrichment failed for #${comp.id}:`, err.message);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/run_scrapers_test.js', 'w') as f:
        f.write(remote_script)
    sftp.close()

    print("Executing remote scraping runner...")
    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node run_scrapers_test.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)

    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

