import os
import sys
import paramiko

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

migration_sql = """
-- =====================================================
-- 1sLabs Marketing Intelligence & Automation Schema
-- =====================================================

-- 1. Marketing Sources
CREATE TABLE IF NOT EXISTS marketing_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  url VARCHAR(500) DEFAULT NULL,
  source_type ENUM('isef', 'kadin', 'satu_data_umkm', 'gov_open_data', 'official_website', 'google_business', 'custom_directory', 'manual_import') NOT NULL DEFAULT 'custom_directory',
  data_category VARCHAR(100) DEFAULT 'UMKM & Business',
  collection_method ENUM('api', 'scraper', 'rss', 'manual', 'crawler') NOT NULL DEFAULT 'scraper',
  api_config_json JSON DEFAULT NULL,
  permission_notes TEXT DEFAULT NULL,
  schedule_cron VARCHAR(100) DEFAULT '0 6 * * *',
  rate_limit_per_minute INT DEFAULT 30,
  max_records_per_run INT DEFAULT 100,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  health_status ENUM('healthy', 'degraded', 'failing', 'idle') NOT NULL DEFAULT 'idle',
  total_records_collected INT DEFAULT 0,
  last_successful_run DATETIME DEFAULT NULL,
  last_failed_run DATETIME DEFAULT NULL,
  last_error_message TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source_type (source_type),
  INDEX idx_source_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Marketing Scraping Jobs
CREATE TABLE IF NOT EXISTS marketing_scraping_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  target_sector VARCHAR(150) DEFAULT NULL,
  target_province VARCHAR(150) DEFAULT NULL,
  target_city VARCHAR(150) DEFAULT NULL,
  status ENUM('pending', 'running', 'paused', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  records_found INT DEFAULT 0,
  records_saved INT DEFAULT 0,
  records_duplicate INT DEFAULT 0,
  records_enriched INT DEFAULT 0,
  error_summary TEXT DEFAULT NULL,
  started_at DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_source (source_id),
  INDEX idx_job_status (status),
  CONSTRAINT fk_mkt_job_source FOREIGN KEY (source_id) REFERENCES marketing_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Marketing Scraping Logs
CREATE TABLE IF NOT EXISTS marketing_scraping_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  level ENUM('info', 'warn', 'error', 'debug') NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_job (job_id),
  INDEX idx_log_level (level),
  CONSTRAINT fk_mkt_log_job FOREIGN KEY (job_id) REFERENCES marketing_scraping_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Marketing Raw Records (Staging Area)
CREATE TABLE IF NOT EXISTS marketing_raw_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  job_id INT DEFAULT NULL,
  source_record_id VARCHAR(255) DEFAULT NULL,
  content_hash VARCHAR(64) NOT NULL,
  raw_payload JSON NOT NULL,
  status ENUM('pending', 'processed', 'duplicate', 'failed') NOT NULL DEFAULT 'pending',
  error_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME DEFAULT NULL,
  INDEX idx_raw_source (source_id),
  INDEX idx_raw_hash (content_hash),
  INDEX idx_raw_status (status),
  CONSTRAINT fk_mkt_raw_source FOREIGN KEY (source_id) REFERENCES marketing_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Marketing Companies (Prospect Central Database)
CREATE TABLE IF NOT EXISTS marketing_companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  category ENUM(
    'UMKM', 'Company', 'Coffee Shop', 'Restaurant', 'Retail', 'Distributor', 
    'Manufacturing', 'Hospitality', 'Education', 'Healthcare', 'Logistics', 
    'Startup', 'Professional Services', 'Other Businesses'
  ) NOT NULL DEFAULT 'UMKM',
  business_type VARCHAR(100) DEFAULT NULL,
  industry VARCHAR(150) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  province VARCHAR(100) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  full_address TEXT DEFAULT NULL,
  website_url VARCHAR(500) DEFAULT NULL,
  normalized_domain VARCHAR(255) DEFAULT NULL,
  google_maps_url VARCHAR(500) DEFAULT NULL,
  google_place_id VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(100) DEFAULT NULL,
  normalized_phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(191) DEFAULT NULL,
  social_media_url VARCHAR(500) DEFAULT NULL,
  social_media_json JSON DEFAULT NULL,
  business_status VARCHAR(50) DEFAULT 'Active',
  
  -- Digital Presence
  has_website TINYINT(1) DEFAULT 0,
  website_status VARCHAR(50) DEFAULT 'unverified',
  ssl_status VARCHAR(50) DEFAULT 'unknown',
  is_mobile_responsive TINYINT(1) DEFAULT NULL,
  performance_score INT DEFAULT NULL,
  last_website_checked DATETIME DEFAULT NULL,
  digital_presence_findings TEXT DEFAULT NULL,
  
  -- Lead Scoring & Qualification
  lead_score INT DEFAULT 0,
  lead_grade ENUM('cold', 'warm', 'hot') NOT NULL DEFAULT 'cold',
  lead_score_breakdown JSON DEFAULT NULL,
  potential_needs_json JSON DEFAULT NULL,
  recommended_services_json JSON DEFAULT NULL,
  
  -- Outreach & Status
  status ENUM(
    'New Discovery', 'Researching', 'Enrichment Pending', 'Verified', 
    'Qualified', 'Outreach Eligible', 'Contacted', 'Responded', 
    'Interested', 'Consultation Scheduled', 'Negotiation', 'Converted', 
    'Not Interested', 'Unqualified', 'Do Not Contact'
  ) NOT NULL DEFAULT 'New Discovery',
  
  outreach_eligibility ENUM('eligible', 'ineligible', 'needs_review') NOT NULL DEFAULT 'needs_review',
  outreach_ineligible_reason TEXT DEFAULT NULL,
  
  -- Provenance & Timestamps
  primary_source_name VARCHAR(150) DEFAULT NULL,
  first_discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enrichment_count INT DEFAULT 0,
  last_enriched_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_comp_norm_name (normalized_name),
  INDEX idx_comp_category (category),
  INDEX idx_comp_industry (industry),
  INDEX idx_comp_province (province),
  INDEX idx_comp_city (city),
  INDEX idx_comp_domain (normalized_domain),
  INDEX idx_comp_phone (normalized_phone),
  INDEX idx_comp_email (email),
  INDEX idx_comp_status (status),
  INDEX idx_comp_eligibility (outreach_eligibility),
  INDEX idx_comp_score (lead_score),
  INDEX idx_comp_first_disc (first_discovered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Marketing Company Sources
CREATE TABLE IF NOT EXISTS marketing_company_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  source_id INT NOT NULL,
  external_identifier VARCHAR(255) DEFAULT NULL,
  source_url VARCHAR(500) DEFAULT NULL,
  discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_snapshot JSON DEFAULT NULL,
  INDEX idx_cs_company (company_id),
  INDEX idx_cs_source (source_id),
  CONSTRAINT fk_mkt_cs_company FOREIGN KEY (company_id) REFERENCES marketing_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_mkt_cs_source FOREIGN KEY (source_id) REFERENCES marketing_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Marketing Contacts (Professional Contact Intelligence)
CREATE TABLE IF NOT EXISTS marketing_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(150) DEFAULT NULL,
  role_category ENUM(
    'Owner', 'Founder', 'CEO', 'Director', 'HR Manager', 'Human Resources',
    'Business Development', 'Marketing Manager', 'IT Manager', 'General Manager',
    'Operations Manager', 'Other'
  ) NOT NULL DEFAULT 'Other',
  business_relationship VARCHAR(100) DEFAULT 'Internal Executive',
  email VARCHAR(191) DEFAULT NULL,
  phone VARCHAR(100) DEFAULT NULL,
  channel VARCHAR(100) DEFAULT 'Email',
  profile_url VARCHAR(500) DEFAULT NULL,
  source_url VARCHAR(500) DEFAULT NULL,
  verification_status ENUM('verified', 'unverified', 'unknown', 'bounced') NOT NULL DEFAULT 'unverified',
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  outreach_eligible TINYINT(1) NOT NULL DEFAULT 0,
  outreach_ineligible_reason TEXT DEFAULT NULL,
  data_collection_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mkt_cont_company (company_id),
  INDEX idx_mkt_cont_email (email),
  INDEX idx_mkt_cont_role (role_category),
  INDEX idx_mkt_cont_primary (is_primary),
  CONSTRAINT fk_mkt_cont_company FOREIGN KEY (company_id) REFERENCES marketing_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Marketing Website Audits
CREATE TABLE IF NOT EXISTS marketing_website_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  http_status INT DEFAULT NULL,
  ssl_valid TINYINT(1) DEFAULT 0,
  ssl_issuer VARCHAR(255) DEFAULT NULL,
  ssl_expiry_date DATE DEFAULT NULL,
  load_time_ms INT DEFAULT NULL,
  is_responsive TINYINT(1) DEFAULT 1,
  has_contact_page TINYINT(1) DEFAULT 0,
  has_catalog TINYINT(1) DEFAULT 0,
  tech_stack_json JSON DEFAULT NULL,
  audit_findings_json JSON DEFAULT NULL,
  audit_score INT DEFAULT 0,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_company (company_id),
  CONSTRAINT fk_mkt_audit_company FOREIGN KEY (company_id) REFERENCES marketing_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Marketing Email Templates
CREATE TABLE IF NOT EXISTS marketing_email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(100) DEFAULT 'General Outreach',
  subject VARCHAR(255) NOT NULL,
  body_html LONGTEXT NOT NULL,
  body_text LONGTEXT DEFAULT NULL,
  variables_json JSON DEFAULT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tpl_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  template_id INT DEFAULT NULL,
  target_industry VARCHAR(150) DEFAULT NULL,
  target_province VARCHAR(150) DEFAULT NULL,
  target_category VARCHAR(100) DEFAULT NULL,
  target_lead_score_min INT DEFAULT 0,
  subject VARCHAR(255) NOT NULL,
  body_html LONGTEXT NOT NULL,
  status ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  scheduled_at DATETIME DEFAULT NULL,
  started_at DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  responded_count INT DEFAULT 0,
  interested_count INT DEFAULT 0,
  unsubscribed_count INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_camp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Marketing Campaign Recipients
CREATE TABLE IF NOT EXISTS marketing_campaign_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  company_id INT NOT NULL,
  contact_id INT DEFAULT NULL,
  recipient_email VARCHAR(191) NOT NULL,
  recipient_name VARCHAR(255) DEFAULT NULL,
  company_name VARCHAR(255) DEFAULT NULL,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', 'responded', 'unsubscribed') NOT NULL DEFAULT 'pending',
  sent_at DATETIME DEFAULT NULL,
  response_at DATETIME DEFAULT NULL,
  retry_count INT DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mcr_camp (campaign_id),
  INDEX idx_mcr_comp (company_id),
  INDEX idx_mcr_email (recipient_email),
  INDEX idx_mcr_status (status),
  CONSTRAINT fk_mcr_camp FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_mcr_comp FOREIGN KEY (company_id) REFERENCES marketing_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Marketing Email Logs
CREATE TABLE IF NOT EXISTS marketing_email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT DEFAULT NULL,
  company_id INT DEFAULT NULL,
  contact_id INT DEFAULT NULL,
  recipient_email VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) DEFAULT NULL,
  status ENUM('sent', 'failed', 'rejected') NOT NULL DEFAULT 'sent',
  error_details TEXT DEFAULT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mel_email (recipient_email),
  INDEX idx_mel_date (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Marketing Email Replies (Inbox)
CREATE TABLE IF NOT EXISTS marketing_email_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT DEFAULT NULL,
  company_id INT DEFAULT NULL,
  contact_id INT DEFAULT NULL,
  original_email_log_id INT DEFAULT NULL,
  from_email VARCHAR(191) NOT NULL,
  from_name VARCHAR(255) DEFAULT NULL,
  subject VARCHAR(255) NOT NULL,
  body_text LONGTEXT NOT NULL,
  body_html LONGTEXT DEFAULT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  classification ENUM(
    'Interested', 'Requesting Information', 'Asking for Pricing', 
    'Consultation Requested', 'Not Interested', 'Follow-up Later', 
    'Out of Office', 'Unsubscribe', 'Other'
  ) NOT NULL DEFAULT 'Other',
  ai_summary TEXT DEFAULT NULL,
  sentiment ENUM('positive', 'neutral', 'negative') NOT NULL DEFAULT 'neutral',
  status ENUM('unread', 'read', 'assigned', 'replied', 'closed') NOT NULL DEFAULT 'unread',
  assigned_to_user_id INT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mer_email (from_email),
  INDEX idx_mer_class (classification),
  INDEX idx_mer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Marketing Follow-ups
CREATE TABLE IF NOT EXISTS marketing_followups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  contact_id INT DEFAULT NULL,
  reply_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  notes TEXT DEFAULT NULL,
  due_date DATETIME NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  assigned_to_user_id INT DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mf_company (company_id),
  INDEX idx_mf_status (status),
  INDEX idx_mf_due (due_date),
  CONSTRAINT fk_mf_company FOREIGN KEY (company_id) REFERENCES marketing_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Marketing Suppressions (Global Do-Not-Contact)
CREATE TABLE IF NOT EXISTS marketing_suppressions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) DEFAULT NULL,
  domain VARCHAR(255) DEFAULT NULL,
  reason ENUM('unsubscribe', 'complaint', 'bounce', 'manual', 'do_not_contact') NOT NULL DEFAULT 'unsubscribe',
  notes TEXT DEFAULT NULL,
  source VARCHAR(100) DEFAULT 'user_optout',
  suppressed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sup_email (email),
  INDEX idx_sup_domain (domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Marketing Daily Quotas (Enforces 100 emails/day hard limit in Asia/Jakarta)
CREATE TABLE IF NOT EXISTS marketing_daily_quotas (
  quota_date DATE PRIMARY KEY,
  sent_count INT NOT NULL DEFAULT 0,
  max_limit INT NOT NULL DEFAULT 100,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Marketing Activity Logs
CREATE TABLE IF NOT EXISTS marketing_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT DEFAULT NULL,
  details_json JSON DEFAULT NULL,
  ip_address VARCHAR(50) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mact_action (action),
  INDEX idx_mact_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Marketing AI Research Logs
CREATE TABLE IF NOT EXISTS marketing_ai_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  purpose VARCHAR(100) NOT NULL,
  company_id INT DEFAULT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  input_snapshot TEXT DEFAULT NULL,
  output_snapshot TEXT DEFAULT NULL,
  status ENUM('success', 'failed', 'rate_limited') NOT NULL DEFAULT 'success',
  latency_ms INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mailog_company (company_id),
  INDEX idx_mailog_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Marketing Settings
CREATE TABLE IF NOT EXISTS marketing_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL SEEDING
-- =====================================================

-- Seed initial Scraping Sources if not exist
INSERT IGNORE INTO marketing_sources (id, name, url, source_type, data_category, collection_method, permission_notes, schedule_cron, rate_limit_per_minute, max_records_per_run, is_active, health_status)
VALUES 
(1, 'ISEF Business Matching', 'https://bm.isef.co.id/umkm', 'isef', 'UMKM & Halal Business', 'scraper', 'Direktori publik peserta pameran business matching ISEF.', '0 6 * * *', 20, 50, 1, 'healthy'),
(2, 'KADIN Indonesia Directory', 'https://kadin.id/', 'kadin', 'Perusahaan & Industri', 'scraper', 'Direktori anggota publik Kamar Dagang dan Industri Indonesia.', '0 7 * * *', 15, 40, 1, 'healthy'),
(3, 'Satu Data UMKM Kemenkop', 'https://satudata.umkm.go.id/', 'satu_data_umkm', 'UMKM Nasional', 'api', 'Dataset publik Satu Data UMKM Kementerian Koperasi & UKM.', '0 8 * * *', 30, 100, 1, 'healthy'),
(4, 'Open Data Jawa Barat', 'https://opendata.jabarprov.go.id/', 'gov_open_data', 'Dataset Bisnis & UMKM Jabar', 'api', 'Portal data terbuka Pemprov Jawa Barat (CKAN / API).', '0 9 * * *', 30, 100, 1, 'healthy'),
(5, 'Official Business Website Crawler', 'https://1slabs.my.id', 'official_website', 'Website Profil Bisnis', 'crawler', 'Pemeriksaan halaman About Us, Team, dan Contact resmi dari domain yang ditemukan.', '0 10 * * *', 15, 30, 1, 'healthy'),
(6, 'Google Business Profile Discovery', 'https://www.google.com/maps', 'google_business', 'Bisnis Lokal & Coffee Shop', 'scraper', 'Pencarian profil bisnis publik & Google Maps listing.', '0 11 * * *', 10, 25, 1, 'healthy');

-- Seed initial Email Template (Official 1sLabs General Outreach from Section 12)
INSERT IGNORE INTO marketing_email_templates (id, name, category, subject, body_html, variables_json, is_default)
VALUES (
  1,
  '1sLabs General Business Opportunity Outreach',
  'General Outreach',
  'Exploring Digital Opportunities for {{business_name}}',
  '<p>Halo Tim <strong>{{business_name}}</strong>,</p>
<p>Perkenalkan, kami dari <strong>1sLabs</strong>, sebuah digital technology partner yang membantu UMKM dan perusahaan mengembangkan kebutuhan digital melalui website, custom web application, business management system, API integration, serta berbagai solusi teknologi lainnya.</p>
<p>Kami ingin membuka kesempatan untuk berdiskusi mengenai kebutuhan digital yang mungkin dapat membantu operasional maupun perkembangan bisnis {{business_name}}.</p>
<p>Di 1sLabs, kami menyediakan konsultasi dan online meeting secara gratis agar kami dapat memahami kebutuhan bisnis terlebih dahulu sebelum memberikan rekomendasi solusi.</p>
<p>Untuk proyek website yang memenuhi ketentuan program, tersedia beberapa benefit:</p>
<ul>
  <li>Free subdomain <code>.1slabs.my.id</code>.</li>
  <li>Free hosting selama 1 tahun.</li>
  <li>Free minor maintenance selama 1 tahun.</li>
  <li>Garansi 1 tahun setelah development selesai.</li>
</ul>
<p>Estimasi pengerjaan website umumnya sekitar 1–2 minggu, tergantung kompleksitas kebutuhan.</p>
<p>Kami tidak ingin menawarkan solusi yang belum tentu dibutuhkan. Karena itu, kami akan lebih senang jika dapat berdiskusi terlebih dahulu mengenai kebutuhan dan tantangan digital bisnis Anda.</p>
<p>Apabila berkenan, apakah kami dapat menjadwalkan online meeting singkat?</p>
<p>Terima kasih.<br><br>Salam,<br><strong>1sLabs Team</strong><br><a href="https://1slabs.my.id" target="_blank" style="color: #10b981; text-decoration: none;">https://1slabs.my.id/</a></p>
<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
<p style="font-size: 11px; color: #71717a;">Anda menerima email ini karena informasi kontak publik bisnis Anda terdaftar pada direktori bisnis nasional. <a href="{{unsubscribe_url}}" style="color: #71717a; text-decoration: underline;">Berhenti berlangganan / Jangan kirim email penawaran berikutnya</a></p>',
  '["business_name", "contact_name", "city", "province", "unsubscribe_url"]',
  1
);

-- Seed default Settings
INSERT IGNORE INTO marketing_settings (setting_key, setting_value, description)
VALUES
('daily_email_limit', '100', 'Batas maksimal pengiriman email penawaran per hari (Asia/Jakarta)'),
('discovery_cron', '0 6 * * *', 'Jadwal discovery otomatis harian (06:00 WIB)'),
('gemini_model', 'gemini-3.8-flash', 'Model Gemini yang digunakan untuk enrichment dan intent classification'),
('auto_enrich_on_discovery', 'true', 'Apakah prospek baru otomatis dianalisis oleh Gemini AI'),
('lead_score_no_website', '25', 'Bobot lead score jika bisnis belum memiliki website'),
('lead_score_not_responsive', '20', 'Bobot lead score jika website tidak mobile-friendly'),
('lead_score_error', '20', 'Bobot lead score jika website error / HTTP 5xx / 4xx'),
('lead_score_slow', '15', 'Bobot lead score jika waktu muat website > 3 detik'),
('lead_score_ssl_invalid', '10', 'Bobot lead score jika SSL tidak valid atau kedaluwarsa'),
('lead_score_digital_need', '10', 'Bobot lead score jika AI mendeteksi kebutuhan transformasi digital'),
('admin_notification_email', 'dzikrirabbani2401@gmail.com', 'Alamat email untuk notifikasi balasan prospek tertarik');
"""

def main():
    print("=" * 60)
    print("Applying Marketing Intelligence Migration to Production DB")
    print("=" * 60)

    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)
    print("[1/3] Connected to remote SSH.")

    sftp = ssh.open_sftp()
    remote_sql_path = "/tmp/marketing_migration.sql"
    with sftp.file(remote_sql_path, "w") as f:
        f.write(migration_sql)
    sftp.close()
    print("[2/3] Migration SQL uploaded to /tmp/marketing_migration.sql")

    # Run mysql command
    cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs < /tmp/marketing_migration.sql"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    err = stderr.read().decode('utf-8')
    out = stdout.read().decode('utf-8')
    
    if err and "Warning" not in err:
        print("[ERROR]:", err)
    else:
        print("[3/3] Migration executed successfully!")
        if err:
            print("[Notes]:", err)

    # Verify tables created
    stdin, stdout, stderr = ssh.exec_command("mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'SHOW TABLES LIKE \"marketing_%\";'")
    tables = stdout.read().decode('utf-8')
    print("\nVerified Marketing Tables in Database:")
    print(tables)

    # Verify initial daily quota record for today
    today_cmd = "mysql -u u1zh8984_oneslabs -pRabbani2401* u1zh8984_oneslabs -e 'INSERT IGNORE INTO marketing_daily_quotas (quota_date, sent_count, max_limit) VALUES (CURDATE(), 0, 100); SELECT * FROM marketing_daily_quotas WHERE quota_date = CURDATE();'"
    stdin, stdout, stderr = ssh.exec_command(today_cmd)
    print("\nToday Daily Quota Status:")
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("\n[DONE] Database ready for Marketing Intelligence System.")

if __name__ == "__main__":
    main()

