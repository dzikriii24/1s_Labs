import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"
HOST = "103.119.237.132"
USER = "u1zh8984"

def main():
    print("=" * 60)
    print("Applying Small Business & Contact Intelligence Database Migration")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=30)

    migration_script = """
const { query } = require('/home/u1zh8984/oneslabs-backend/src/db');

async function migrate() {
  console.log('1. Checking and updating marketing_companies columns...');

  const addColumnIfNotExists = async (table, column, definition) => {
    try {
      const cols = await query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
      if (cols.length === 0) {
        await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`  + Added ${column} to ${table}`);
      } else {
        console.log(`  = ${column} already exists in ${table}`);
      }
    } catch (e) {
      console.warn(`  ! Note for ${column}: ${e.message}`);
    }
  };

  // Add International & Small Business columns to marketing_companies
  await addColumnIfNotExists('marketing_companies', 'country', "VARCHAR(100) NOT NULL DEFAULT 'Indonesia'");
  await addColumnIfNotExists('marketing_companies', 'is_international', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfNotExists('marketing_companies', 'currency', "VARCHAR(10) NOT NULL DEFAULT 'IDR'");
  await addColumnIfNotExists('marketing_companies', 'language', "VARCHAR(20) NOT NULL DEFAULT 'id'");
  await addColumnIfNotExists('marketing_companies', 'timezone', "VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta'");
  await addColumnIfNotExists('marketing_companies', 'business_scale', "VARCHAR(50) NOT NULL DEFAULT 'Small Business'");
  await addColumnIfNotExists('marketing_companies', 'whatsapp_number', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'instagram_url', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'facebook_url', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'contact_page_url', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'is_priority', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfNotExists('marketing_companies', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfNotExists('marketing_companies', 'is_deleted', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfNotExists('marketing_companies', 'deleted_at', 'DATETIME DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'admin_notes', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('marketing_companies', 'tags', 'TEXT DEFAULT NULL');

  // Add Contact Intelligence columns to marketing_contacts
  console.log('\\n2. Checking and updating marketing_contacts columns...');
  await addColumnIfNotExists('marketing_contacts', 'contact_type', "VARCHAR(50) NOT NULL DEFAULT 'person'");
  await addColumnIfNotExists('marketing_contacts', 'contact_value', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('marketing_contacts', 'confidence_score', 'DECIMAL(3,2) NOT NULL DEFAULT 0.85');
  await addColumnIfNotExists('marketing_contacts', 'source_name', "VARCHAR(150) NOT NULL DEFAULT 'Direct Discovery'");

  // Modify marketing_contacts role_category and verification_status to VARCHAR for flexibility
  try {
    await query("ALTER TABLE marketing_contacts MODIFY COLUMN role_category VARCHAR(100) NOT NULL DEFAULT 'Owner'");
    console.log('  + Converted role_category to VARCHAR(100)');
  } catch (e) {
    console.warn('  ! role_category alter note:', e.message);
  }

  try {
    await query("ALTER TABLE marketing_contacts MODIFY COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'Verified'");
    console.log('  + Converted verification_status to VARCHAR(50)');
  } catch (e) {
    console.warn('  ! verification_status alter note:', e.message);
  }

  // Update existing companies: prioritize small businesses
  console.log('\\n3. Classifying existing companies into Small Business segments...');
  await query(`
    UPDATE marketing_companies 
    SET business_scale = CASE 
      WHEN category IN ('Coffee Shop', 'Restaurant', 'UMKM') THEN 'Local Business'
      WHEN category IN ('Retail') AND name NOT LIKE '%Tbk%' THEN 'Small Business'
      WHEN name LIKE '%Tbk%' OR category IN ('Company') OR name LIKE '%Persero%' THEN 'Other'
      ELSE 'Small Business'
    END
    WHERE business_scale IS NULL OR business_scale = 'Small Business'
  `);

  const scaleStats = await query('SELECT business_scale, COUNT(*) as count FROM marketing_companies GROUP BY business_scale');
  console.log('Current Business Scale Distribution:', scaleStats);

  console.log('\\nDatabase migration finished successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
"""

    sftp = ssh.open_sftp()
    with sftp.file('/home/u1zh8984/oneslabs-backend/run_migration_small_biz.js', 'w') as f:
        f.write(migration_script)
    sftp.close()

    cmd = "source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && cd /home/u1zh8984/oneslabs-backend && node run_migration_small_biz.js"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err:
        print("STDERR:", err)

    ssh.close()

if __name__ == '__main__':
    main()

