import os
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
    sftp = ssh.open_sftp()

    # 1. Upload updated backend services
    files_to_upload = [
        (r"backend\src\services\marketing\gemini.service.js", "/home/u1zh8984/oneslabs-backend/src/services/marketing/gemini.service.js"),
        (r"backend\src\services\marketing\discoveryScheduler.service.js", "/home/u1zh8984/oneslabs-backend/src/services/marketing/discoveryScheduler.service.js"),
        (r"backend\src\services\marketing\scrapers\GoogleBusinessAdapter.js", "/home/u1zh8984/oneslabs-backend/src/services/marketing/scrapers/GoogleBusinessAdapter.js"),
    ]

    for local_f, remote_f in files_to_upload:
        print(f"Uploading {local_f} -> {remote_f}")
        sftp.put(local_f, remote_f)

    # 2. Update .env with GEMINI_MODEL=gemini-3.5-flash-lite
    with sftp.file('/home/u1zh8984/oneslabs-backend/.env', 'r') as f:
        env_content = f.read().decode('utf-8')

    import re
    env_content = re.sub(r'GEMINI_MODEL=.*', 'GEMINI_MODEL=gemini-3.5-flash-lite', env_content)
    with sftp.file('/home/u1zh8984/oneslabs-backend/.env', 'w') as f:
        f.write(env_content)

    # 3. Create runner script
    runner_script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');
const { runDiscoveryJob } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/discoveryScheduler.service');
const { extractAndEnrichBusiness } = require('/home/u1zh8984/oneslabs-backend/src/services/marketing/gemini.service');

async function main() {
  console.log('=== RUNNING GOOGLE BUSINESS DISCOVERY ===');
  const gbizRes = await runDiscoveryJob(6, { limit: 15 });
  console.log('Google Business Discovery result:', gbizRes);

  console.log('\\n=== DATABASE SUMMARY ===');
  const totalComps = await query('SELECT COUNT(*) as total FROM marketing_companies');
  console.log(`Total Companies in Database: ${totalComps[0].total}`);

  const byCat = await query('SELECT category, COUNT(*) as count FROM marketing_companies GROUP BY category ORDER BY count DESC');
  console.log('Distribution by Category:');
  console.table(byCat);

  const totalContacts = await query('SELECT COUNT(*) as total FROM marketing_contacts');
  console.log(`Total Contacts in Database: ${totalContacts[0].total}`);

  const contactsByRole = await query('SELECT role_category, COUNT(*) as count FROM marketing_contacts GROUP BY role_category ORDER BY count DESC');
  console.log('Contacts by Role:');
  console.table(contactsByRole);

  console.log('\\n=== TESTING GEMINI AI ENRICHMENT (gemini-3.5-flash-lite) ===');
  const sampleComps = await query('SELECT id, name, category, website_url FROM marketing_companies WHERE lead_score = 0 LIMIT 3');
  for (const comp of sampleComps) {
    console.log(`Enriching company #${comp.id}: ${comp.name}...`);
    try {
      const enriched = await extractAndEnrichBusiness(comp.id);
      console.log(`Enrichment OK for #${comp.id}:`, {
        category: enriched.category,
        needs: enriched.potential_needs?.slice(0, 2),
        services: enriched.recommended_services?.slice(0, 2),
        confidence: enriched.research_confidence
      });
      // Update lead score in DB
      await query(
        `UPDATE marketing_companies 
         SET lead_score = ?,
             potential_needs_json = ?,
             recommended_services_json = ?,
             status = 'Verified',
             enrichment_count = enrichment_count + 1,
             last_enriched_at = NOW()
         WHERE id = ?`,
        [
          Math.round((enriched.research_confidence || 0.8) * 100),
          JSON.stringify(enriched.potential_needs || []),
          JSON.stringify(enriched.recommended_services || []),
          comp.id
        ]
      );
    } catch (e) {
      console.error(`Enrichment failed for #${comp.id}:`, e.message);
    }
  }

  const verifiedCount = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE status = "Verified"');
  console.log(`\\nTotal Verified Companies: ${verifiedCount[0].total}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
"""

    with sftp.file('/home/u1zh8984/oneslabs-backend/test_final_enrich.js', 'w') as f:
        f.write(runner_script)
    sftp.close()

    print("\nExecuting test runner on production server...")
    cmd = (
        "touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt && "
        "cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend && "
        "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && "
        "cd /home/u1zh8984/oneslabs-backend && node test_final_enrich.js"
    )
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()
