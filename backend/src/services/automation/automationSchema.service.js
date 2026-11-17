const { query } = require('../../db');
const { ensureBlogSchema } = require('../blog/blogSchema.service');
const { COMPANY_KNOWLEDGE_SEED } = require('../../data/companyKnowledgeBase');

let schemaReadyPromise = null;

const DEFAULT_PILLARS = [
  {
    code: 'free-hosting-domain',
    name: 'Free Hosting & Free Domain',
    description: 'Panduan high-intent seputar hosting gratis, subdomain *.1slabs.my.id, dan cara deploy website tanpa biaya awal.',
    default_intent: 'transactional',
    primary_cta_label: 'Klaim Subdomain & Free Hosting 1sLabs',
    primary_cta_path: '/portal?tab=freeplan',
    category_slug: 'cloud-hosting',
    sample_topics_json: JSON.stringify([
      'Cara Mendapatkan Hosting Gratis untuk Website Portofolio Mahasiswa',
      'Panduan Klaim Subdomain Gratis .1slabs.my.id dan Upload Website',
      'Hosting Gratis vs Hosting Berbayar: Kapan Bisnis Harus Upgrade?',
      'Cara Menghubungkan Custom Domain ke Server Hosting dengan A Record'
    ]),
    priority_weight: 95,
    sort_order: 1
  },
  {
    code: 'website-development',
    name: 'Website Development',
    description: 'Artikel bisnis seputar pembuatan company profile, landing page konversi tinggi, optimasi kecepatan, dan kepemilikan Pay Once.',
    default_intent: 'commercial',
    primary_cta_label: 'Konsultasi Pembuatan Website Pay Once',
    primary_cta_path: '/jasa-pembuatan-website',
    category_slug: 'web-development',
    sample_topics_json: JSON.stringify([
      'Mengapa Bisnis UMKM Membutuhkan Website Company Profile di Luar Media Sosial',
      'Website Custom Pay Once vs Builder Berlangganan: Analisis Biaya Jangka Panjang',
      'Checklist Teknis SEO On-Page Sebelum Meluncurkan Website Bisnis'
    ]),
    priority_weight: 92,
    sort_order: 2
  },
  {
    code: 'software-development',
    name: 'Custom Software Development',
    description: 'Solusi custom business software seperti aplikasi kasir POS, inventori gudang, ERP, integrasi API, dan sistem internal tanpa biaya per user.',
    default_intent: 'commercial',
    primary_cta_label: 'Diskusikan Sistem Custom Bisnis Anda',
    primary_cta_path: '/software-development',
    category_slug: 'custom-software',
    sample_topics_json: JSON.stringify([
      'Kapan Perusahaan Perlu Beralih dari Spreadsheet ke Custom Software Operasional',
      'Sistem Kasir POS dan Inventori Multi-Gudang Tanpa Biaya Lisensi per Karyawan',
      'Integrasi REST API untuk Menghubungkan Sistem Warisan dan Dashboard Modern'
    ]),
    priority_weight: 90,
    sort_order: 3
  },
  {
    code: 'it-consulting',
    name: 'IT Consulting',
    description: 'Edukasi audit arsitektur, pemilihan tech stack, mitigasi website lambat/down, dan pengawasan kualitas vendor IT.',
    default_intent: 'informational',
    primary_cta_label: 'Jadwalkan Konsultasi IT Gratis',
    primary_cta_path: '/it-consulting',
    category_slug: 'engineering-guide',
    sample_topics_json: JSON.stringify([
      'Cara Melakukan Audit Arsitektur Website yang Sering Lambat Saat Trafik Naik',
      'Panduan Memilih Tech Stack Aplikasi Bisnis: React, Node.js, Laravel, dan MySQL',
      'Checklist Mengaudit Kualitas Source Code dari Vendor IT Eksternal'
    ]),
    priority_weight: 84,
    sort_order: 4
  },
  {
    code: 'hosting-infrastructure',
    name: 'Hosting & Infrastructure',
    description: 'Tutorial deploy React/Vite, Node.js Express, Laravel, konfigurasi SSL AutoSSL, DNS, File Manager, dan manajemen MySQL.',
    default_intent: 'informational',
    primary_cta_label: 'Lihat Paket Managed Hosting 1sLabs',
    primary_cta_path: '/hosting',
    category_slug: 'cloud-hosting',
    sample_topics_json: JSON.stringify([
      'Cara Deploy Aplikasi Node.js Express ke CloudLinux Tanpa Konfigurasi SSH Rumit',
      'Panduan Deploy Website React Vite dan Konfigurasi .htaccess SPA Routing',
      'Mengenal Pentingnya Backup Database Otomatis dan Pengaturan SSL HTTPS'
    ]),
    priority_weight: 86,
    sort_order: 5
  },
  {
    code: 'portfolio-showcase',
    name: 'Portfolio & Project Showcase',
    description: 'Pembahasan teknis di balik studi kasus nyata yang dibangun tim 1sLabs tanpa melebih-lebihkan klaim.',
    default_intent: 'commercial',
    primary_cta_label: 'Konsultasikan Proyek Serupa',
    primary_cta_path: '/schedule',
    category_slug: 'custom-software',
    sample_topics_json: JSON.stringify([
      'Arsitektur Jembatan API OpenBiblio ke SLiMS untuk Sinkronisasi Katalog Perpustakaan',
      'Merancang Platform Inventaris Gudang dan Pemantauan Lapangan Berbasis Web Modern',
      'Pembelajaran Teknis Membangun Sistem Pencatatan Keuangan Inklusif Berbasis Suara'
    ]),
    priority_weight: 80,
    sort_order: 6
  },
  {
    code: 'website-maintenance',
    name: 'Website Maintenance & Support',
    description: 'Panduan pemeliharaan website tahunan, patching keamanan dependensi, tuning database MySQL, monitoring uptime, dan backup rutin.',
    default_intent: 'commercial',
    primary_cta_label: 'Pelajari Layanan Website Maintenance 1sLabs',
    primary_cta_path: '/jasa-pembuatan-website',
    category_slug: 'engineering-guide',
    sample_topics_json: JSON.stringify([
      'Mengapa Website Bisnis Tetap Membutuhkan Maintenance dan Patching Keamanan Rutin',
      'Checklist Pemeliharaan Bulanan Database MySQL dan Server Web Produksi',
      'Cara Menilai Kesehatan Website Buatan Vendor Lama Sebelum Di-takeover'
    ]),
    priority_weight: 82,
    sort_order: 7
  },
  {
    code: 'digital-transformation',
    name: 'Digital Transformation',
    description: 'Strategi digitalisasi proses manual perusahaan menuju dashboard web terintegrasi, otomasi laporan, dan efisiensi alur kerja.',
    default_intent: 'commercial',
    primary_cta_label: 'Konsultasikan Peta Jalan Digitalisasi Bisnis',
    primary_cta_path: '/software-development',
    category_slug: 'ai-automation',
    sample_topics_json: JSON.stringify([
      'Tahapan Praktis Transformasi Digital UMKM Tanpa Membebani Tim Operasional',
      'Mengubah Laporan Operasional Excel Tersebar Menjadi Dashboard Real-Time',
      'Integrasi Pembayaran QRIS dan Pelacakan Pesanan Otomatis untuk Bisnis Layanan'
    ]),
    priority_weight: 78,
    sort_order: 8
  },
  {
    code: 'technology-insights',
    name: 'Technology Insights',
    description: 'Wawasan teknologi terbaru seperti AI Workflow Automation, GEO untuk AI Search, dan keamanan web modern.',
    default_intent: 'informational',
    primary_cta_label: 'Eksplorasi Solusi AI & Automasi 1sLabs',
    primary_cta_path: '/blog',
    category_slug: 'ai-automation',
    sample_topics_json: JSON.stringify([
      'Mengenal Generative Engine Optimization (GEO) Agar Artikel Bisnis Dikutip AI Search',
      'Otomatisasi Alur Kerja Bisnis dengan Python, Background Worker, dan Webhook',
      'Praktik Dasar Keamanan REST API Express dan Mencegah SQL Injection di MySQL'
    ]),
    priority_weight: 75,
    sort_order: 9
  },
  {
    code: 'business-tech-education',
    name: 'Business & Technology Education',
    description: 'Edukasi pemilik bisnis dan pengambil keputusan tentang cara mengukur ROI website, keamanan data pelanggan, dan arsitektur scalable.',
    default_intent: 'informational',
    primary_cta_label: 'Konsultasi Edukasi Solusi Digital 1sLabs',
    primary_cta_path: '/it-consulting',
    category_slug: 'engineering-guide',
    sample_topics_json: JSON.stringify([
      'Cara Pemilik Bisnis Non-Teknis Mengevaluasi Proposal Pembuatan Website & Aplikasi',
      'Pentingnya Kepemilikan Source Code dan Domain Atas Nama Perusahaan Sendiri',
      'Mengenal Konsep Core Web Vitals dan Dampaknya pada Pengunjung Organik'
    ]),
    priority_weight: 76,
    sort_order: 10
  },
  {
    code: 'case-study-solutions',
    name: 'Case Study & Client Solutions',
    description: 'Pembedahan solusi arsitektur dan implementasi modul nyata (dashboard pelaporan lembaga, sistem inventori, aplikasi keuangan inklusif).',
    default_intent: 'commercial',
    primary_cta_label: 'Diskusikan Solusi Serupa Bersama Tim Engineer',
    primary_cta_path: '/#portfolio',
    category_slug: 'custom-software',
    sample_topics_json: JSON.stringify([
      'Pelajaran Arsitektur Sistem Monitoring Lapangan Multi-Peran di Sektor Perkebunan',
      'Merancang Portal Laporan dan Evaluasi Organisasi Publik yang Terstruktur',
      'Bagaimana Desain UI Sederhana Membantu Adopsi Sistem Keuangan bagi Disabilitas'
    ]),
    priority_weight: 79,
    sort_order: 11
  }
];

async function ensureColumn(tableName, columnName, columnDdl) {
  const cols = await query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]).catch(() => []);
  if (!cols || cols.length === 0) {
    await query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDdl}`);
  }
}

async function createAutomationTablesAndSeeds() {
  await ensureBlogSchema();

  // Safety: ensure auxiliary logging tables exist on local dev setups
  await query(`
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
      INDEX idx_mailog_date (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS system_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      actor_id INT DEFAULT NULL,
      actor_name VARCHAR(150) DEFAULT 'System',
      actor_role VARCHAR(50) DEFAULT 'admin',
      action VARCHAR(120) NOT NULL,
      target VARCHAR(255) DEFAULT NULL,
      details TEXT DEFAULT NULL,
      ip_address VARCHAR(64) DEFAULT NULL,
      result VARCHAR(40) DEFAULT 'success',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sys_act_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 1. Company Knowledge Base Entries
  await query(`
    CREATE TABLE IF NOT EXISTS content_knowledge_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entry_key VARCHAR(100) NOT NULL UNIQUE,
      category_number INT NOT NULL DEFAULT 1,
      category_label VARCHAR(120) NOT NULL,
      title VARCHAR(255) NOT NULL,
      verification_status ENUM('verified', 'needs_verification') NOT NULL DEFAULT 'verified',
      source_reference VARCHAR(500) DEFAULT NULL,
      summary TEXT NOT NULL,
      facts_json JSON NOT NULL,
      content_markdown TEXT DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      updated_by INT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_kb_cat (category_number),
      INDEX idx_kb_status (verification_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. Content Pillars (7 Service-Oriented Pillars)
  await query(`
    CREATE TABLE IF NOT EXISTS content_pillars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      description TEXT DEFAULT NULL,
      default_intent ENUM('informational', 'commercial', 'transactional', 'navigational') NOT NULL DEFAULT 'informational',
      primary_cta_label VARCHAR(200) NOT NULL,
      primary_cta_path VARCHAR(255) NOT NULL,
      category_slug VARCHAR(120) DEFAULT NULL,
      sample_topics_json JSON DEFAULT NULL,
      priority_weight INT NOT NULL DEFAULT 80,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. Automation Global Settings (Singleton row id=1)
  await query(`
    CREATE TABLE IF NOT EXISTS content_automation_settings (
      id INT PRIMARY KEY,
      approval_mode ENUM('manual_approval', 'auto_publish_qualified', 'always_save_draft') NOT NULL DEFAULT 'manual_approval',
      engine_url VARCHAR(255) NOT NULL DEFAULT 'http://127.0.0.1:8000',
      default_language VARCHAR(10) NOT NULL DEFAULT 'id',
      default_tone VARCHAR(80) NOT NULL DEFAULT 'practitioner_clear',
      default_word_count INT NOT NULL DEFAULT 1050,
      min_seo_score INT NOT NULL DEFAULT 75,
      min_readability_score INT NOT NULL DEFAULT 68,
      min_geo_score INT NOT NULL DEFAULT 70,
      min_composite_score INT NOT NULL DEFAULT 74,
      min_word_count INT NOT NULL DEFAULT 650,
      max_similarity_threshold DECIMAL(4,2) NOT NULL DEFAULT 0.72,
      daily_generation_limit INT NOT NULL DEFAULT 20,
      max_batch_size INT NOT NULL DEFAULT 10,
      auto_internal_linking TINYINT(1) NOT NULL DEFAULT 1,
      auto_web_research TINYINT(1) NOT NULL DEFAULT 0,
      timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. Schedules
  await query(`
    CREATE TABLE IF NOT EXISTS content_automation_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(180) NOT NULL,
      description VARCHAR(500) DEFAULT NULL,
      cron_expression VARCHAR(80) NOT NULL DEFAULT '0 8 * * 1,4',
      timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
      pillar_code VARCHAR(80) DEFAULT NULL,
      articles_per_run INT NOT NULL DEFAULT 2,
      approval_mode_override VARCHAR(40) DEFAULT NULL,
      enable_web_research TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      locked_at DATETIME DEFAULT NULL,
      lock_token VARCHAR(64) DEFAULT NULL,
      last_run_at DATETIME DEFAULT NULL,
      last_run_status VARCHAR(40) DEFAULT NULL,
      next_run_at DATETIME DEFAULT NULL,
      timeout_seconds INT NOT NULL DEFAULT 600,
      retry_limit INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sched_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. Generation Jobs (Manual / Batch / Scheduled container)
  await query(`
    CREATE TABLE IF NOT EXISTS content_generation_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_uuid VARCHAR(64) NOT NULL UNIQUE,
      job_type ENUM('manual', 'batch', 'scheduled') NOT NULL DEFAULT 'manual',
      schedule_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      pillar_code VARCHAR(80) DEFAULT NULL,
      approval_mode VARCHAR(40) NOT NULL DEFAULT 'manual_approval',
      status ENUM('queued', 'running', 'completed', 'partial_failed', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
      total_items INT NOT NULL DEFAULT 1,
      completed_items INT NOT NULL DEFAULT 0,
      failed_items INT NOT NULL DEFAULT 0,
      cancel_requested TINYINT(1) NOT NULL DEFAULT 0,
      created_by INT DEFAULT NULL,
      created_by_name VARCHAR(120) DEFAULT 'Admin 1sLabs',
      started_at DATETIME DEFAULT NULL,
      completed_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cjob_status (status),
      INDEX idx_cjob_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. Generation Items (Per-Article Queue + Review Queue + Audit)
  await query(`
    CREATE TABLE IF NOT EXISTS content_generation_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      topic VARCHAR(300) NOT NULL,
      target_keyword VARCHAR(191) NOT NULL,
      secondary_keywords TEXT DEFAULT NULL,
      pillar_code VARCHAR(80) DEFAULT NULL,
      search_intent ENUM('informational', 'commercial', 'transactional', 'navigational') NOT NULL DEFAULT 'informational',
      language VARCHAR(10) NOT NULL DEFAULT 'id',
      word_count_target INT NOT NULL DEFAULT 1050,
      enable_web_research TINYINT(1) NOT NULL DEFAULT 0,
      custom_instructions TEXT DEFAULT NULL,
      target_article_id INT DEFAULT NULL,
      status ENUM('queued', 'researching', 'generating', 'auditing', 'awaiting_review', 'approved', 'published', 'saved_draft', 'rejected', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
      engine_job_id VARCHAR(100) DEFAULT NULL,
      draft_title VARCHAR(255) DEFAULT NULL,
      draft_slug VARCHAR(255) DEFAULT NULL,
      draft_excerpt TEXT DEFAULT NULL,
      draft_meta_title VARCHAR(255) DEFAULT NULL,
      draft_meta_description TEXT DEFAULT NULL,
      draft_focus_keyphrase VARCHAR(191) DEFAULT NULL,
      draft_secondary_keyphrases TEXT DEFAULT NULL,
      draft_content LONGTEXT DEFAULT NULL,
      draft_faq_json JSON DEFAULT NULL,
      seo_score INT NOT NULL DEFAULT 0,
      readability_score INT NOT NULL DEFAULT 0,
      geo_score INT NOT NULL DEFAULT 0,
      composite_score INT NOT NULL DEFAULT 0,
      similarity_score DECIMAL(5,3) NOT NULL DEFAULT 0.000,
      similarity_match_title VARCHAR(255) DEFAULT NULL,
      quality_passed TINYINT(1) NOT NULL DEFAULT 0,
      quality_report_json JSON DEFAULT NULL,
      generation_trace_json JSON DEFAULT NULL,
      error_message TEXT DEFAULT NULL,
      retry_count INT NOT NULL DEFAULT 0,
      max_retries INT NOT NULL DEFAULT 2,
      published_article_id INT DEFAULT NULL,
      reviewed_by INT DEFAULT NULL,
      review_notes TEXT DEFAULT NULL,
      reviewed_at DATETIME DEFAULT NULL,
      started_at DATETIME DEFAULT NULL,
      completed_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_citem_job (job_id),
      INDEX idx_citem_status (status),
      INDEX idx_citem_pillar (pillar_code),
      INDEX idx_citem_created (created_at),
      CONSTRAINT fk_citem_job FOREIGN KEY (job_id) REFERENCES content_generation_jobs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 7. Schedule Runs History
  await query(`
    CREATE TABLE IF NOT EXISTS content_schedule_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      schedule_id INT NOT NULL,
      trigger_type ENUM('cron', 'manual') NOT NULL DEFAULT 'cron',
      lock_token VARCHAR(64) DEFAULT NULL,
      status ENUM('running', 'completed', 'partial_failed', 'failed', 'skipped_locked') NOT NULL DEFAULT 'running',
      topics_planned INT NOT NULL DEFAULT 0,
      items_succeeded INT NOT NULL DEFAULT 0,
      items_failed INT NOT NULL DEFAULT 0,
      items_published INT NOT NULL DEFAULT 0,
      job_id INT DEFAULT NULL,
      summary_json JSON DEFAULT NULL,
      error_message TEXT DEFAULT NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME DEFAULT NULL,
      INDEX idx_srun_sched (schedule_id),
      INDEX idx_srun_started (started_at),
      CONSTRAINT fk_srun_sched FOREIGN KEY (schedule_id) REFERENCES content_automation_schedules(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 8. GSC URL Inspection History
  await query(`
    CREATE TABLE IF NOT EXISTS article_index_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT DEFAULT NULL,
      inspection_url VARCHAR(500) NOT NULL,
      site_url VARCHAR(255) NOT NULL,
      verdict VARCHAR(40) DEFAULT NULL,
      coverage_state VARCHAR(255) DEFAULT NULL,
      indexing_state VARCHAR(80) DEFAULT NULL,
      robots_txt_state VARCHAR(80) DEFAULT NULL,
      page_fetch_state VARCHAR(80) DEFAULT NULL,
      google_canonical VARCHAR(500) DEFAULT NULL,
      user_canonical VARCHAR(500) DEFAULT NULL,
      last_crawl_time VARCHAR(80) DEFAULT NULL,
      crawled_as VARCHAR(40) DEFAULT NULL,
      sitemap_json JSON DEFAULT NULL,
      referring_urls_json JSON DEFAULT NULL,
      inspection_result_link VARCHAR(500) DEFAULT NULL,
      raw_result_json JSON DEFAULT NULL,
      inspected_by INT DEFAULT NULL,
      inspected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_insp_article (article_id),
      INDEX idx_insp_url (inspection_url(191)),
      INDEX idx_insp_time (inspected_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 9. Performance-driven Optimization Suggestions (Approval Required Before Overwrite)
  await query(`
    CREATE TABLE IF NOT EXISTS content_optimization_suggestions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      source ENUM('gsc_performance', 'seo_audit', 'manual') NOT NULL DEFAULT 'gsc_performance',
      trigger_metrics_json JSON DEFAULT NULL,
      proposed_title VARCHAR(255) DEFAULT NULL,
      proposed_meta_title VARCHAR(255) DEFAULT NULL,
      proposed_meta_description TEXT DEFAULT NULL,
      proposed_focus_keyphrase VARCHAR(191) DEFAULT NULL,
      proposed_excerpt TEXT DEFAULT NULL,
      proposed_content LONGTEXT DEFAULT NULL,
      proposed_faq_json JSON DEFAULT NULL,
      rationale TEXT DEFAULT NULL,
      status ENUM('pending_approval', 'applied', 'dismissed') NOT NULL DEFAULT 'pending_approval',
      created_by INT DEFAULT NULL,
      reviewed_by INT DEFAULT NULL,
      applied_revision_id INT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME DEFAULT NULL,
      INDEX idx_opt_article (article_id),
      INDEX idx_opt_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 10. AI Content Calendar Plans
  await query(`
    CREATE TABLE IF NOT EXISTS content_calendar_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scheduled_date DATE NOT NULL,
      day_label VARCHAR(40) NOT NULL,
      pillar_code VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      target_keyword VARCHAR(191) NOT NULL,
      secondary_keywords_json JSON DEFAULT NULL,
      search_intent ENUM('informational', 'commercial', 'transactional', 'navigational') NOT NULL DEFAULT 'commercial',
      target_audience VARCHAR(255) DEFAULT NULL,
      priority_score INT NOT NULL DEFAULT 80,
      rationale TEXT DEFAULT NULL,
      status ENUM('planned', 'queued', 'generated', 'published', 'skipped') NOT NULL DEFAULT 'planned',
      job_id INT DEFAULT NULL,
      item_id INT DEFAULT NULL,
      article_id INT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cal_date (scheduled_date),
      INDEX idx_cal_pillar (pillar_code),
      INDEX idx_cal_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 11. Article Images & Attribution Metadata Registry
  await query(`
    CREATE TABLE IF NOT EXISTS article_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      generation_item_id INT DEFAULT NULL,
      article_id INT DEFAULT NULL,
      role ENUM('featured', 'inline', 'backup') NOT NULL DEFAULT 'inline',
      provider VARCHAR(40) NOT NULL DEFAULT 'openverse',
      provider_image_id VARCHAR(191) DEFAULT NULL,
      original_url VARCHAR(1000) NOT NULL,
      local_url VARCHAR(500) DEFAULT NULL,
      file_path VARCHAR(600) DEFAULT NULL,
      sha256_hash VARCHAR(64) DEFAULT NULL,
      search_query VARCHAR(300) DEFAULT NULL,
      title VARCHAR(300) DEFAULT NULL,
      alt_text VARCHAR(300) DEFAULT NULL,
      caption VARCHAR(500) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      photographer_name VARCHAR(200) DEFAULT NULL,
      photographer_url VARCHAR(500) DEFAULT NULL,
      source_page_url VARCHAR(600) DEFAULT NULL,
      license_name VARCHAR(160) DEFAULT NULL,
      attribution_text VARCHAR(400) DEFAULT NULL,
      attribution_required TINYINT(1) NOT NULL DEFAULT 0,
      width INT NOT NULL DEFAULT 0,
      height INT NOT NULL DEFAULT 0,
      file_format VARCHAR(20) DEFAULT NULL,
      file_size_bytes INT NOT NULL DEFAULT 0,
      placement_section VARCHAR(255) DEFAULT NULL,
      placement_index INT NOT NULL DEFAULT 0,
      relevance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      status ENUM('local', 'external_fallback', 'failed') NOT NULL DEFAULT 'local',
      is_selected TINYINT(1) NOT NULL DEFAULT 1,
      error_detail VARCHAR(500) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_artimg_item (generation_item_id),
      INDEX idx_artimg_article (article_id),
      INDEX idx_artimg_hash (sha256_hash),
      INDEX idx_artimg_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Safe incremental schema migrations for existing production DB tables
  await ensureColumn('content_automation_settings', 'selected_pillars_json', 'JSON DEFAULT NULL');
  await ensureColumn('content_automation_settings', 'auto_optimize_below_threshold', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'max_auto_regenerations', 'INT NOT NULL DEFAULT 1');

  // Automated Image Discovery & Visual Content Management Settings
  await ensureColumn('content_automation_settings', 'enable_auto_images', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'image_primary_provider', "VARCHAR(40) NOT NULL DEFAULT 'auto'");
  await ensureColumn('content_automation_settings', 'image_fallback_provider', "VARCHAR(40) NOT NULL DEFAULT 'wikimedia'");
  await ensureColumn('content_automation_settings', 'enable_ai_image_fallback', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'max_images_per_article', 'INT NOT NULL DEFAULT 4');
  await ensureColumn('content_automation_settings', 'min_inline_images', 'INT NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'min_image_width', 'INT NOT NULL DEFAULT 800');
  await ensureColumn('content_automation_settings', 'min_image_height', 'INT NOT NULL DEFAULT 450');
  await ensureColumn('content_automation_settings', 'preferred_image_aspect', "VARCHAR(20) NOT NULL DEFAULT '16:9'");
  await ensureColumn('content_automation_settings', 'preferred_image_format', "VARCHAR(16) NOT NULL DEFAULT 'webp'");
  await ensureColumn('content_automation_settings', 'auto_download_images', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'auto_optimize_images', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'auto_image_alt_caption', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'require_attribution', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('content_automation_settings', 'inline_image_placement', "VARCHAR(40) NOT NULL DEFAULT 'after_h2_balanced'");
  await ensureColumn('content_automation_settings', 'image_quality_validation', 'TINYINT(1) NOT NULL DEFAULT 1');

  await ensureColumn('content_automation_schedules', 'pillar_codes_json', 'JSON DEFAULT NULL');

  await ensureColumn('content_generation_jobs', 'pillar_codes_json', 'JSON DEFAULT NULL');
  const jobTypeCol = await query(`SHOW COLUMNS FROM content_generation_jobs LIKE 'job_type'`).catch(() => []);
  if (jobTypeCol?.[0]?.Type && !String(jobTypeCol[0].Type).includes('autonomous')) {
    await query(
      `ALTER TABLE content_generation_jobs
       MODIFY COLUMN job_type ENUM('manual', 'batch', 'scheduled', 'autonomous') NOT NULL DEFAULT 'manual'`
    );
  }

  const itemStatusCol = await query(`SHOW COLUMNS FROM content_generation_items LIKE 'status'`).catch(() => []);
  if (itemStatusCol?.[0]?.Type && !String(itemStatusCol[0].Type).includes('fetching_images')) {
    await query(
      `ALTER TABLE content_generation_items
       MODIFY COLUMN status ENUM('queued', 'researching', 'generating', 'fetching_images', 'auditing', 'awaiting_review', 'approved', 'published', 'saved_draft', 'rejected', 'failed', 'cancelled') NOT NULL DEFAULT 'queued'`
    );
  }

  await ensureColumn('content_generation_items', 'target_audience', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumn('content_generation_items', 'recommended_category', 'VARCHAR(160) DEFAULT NULL');
  await ensureColumn('content_generation_items', 'featured_image_recommendation', 'TEXT DEFAULT NULL');
  await ensureColumn('content_generation_items', 'featured_image_alt', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumn('content_generation_items', 'draft_featured_image', 'VARCHAR(500) DEFAULT NULL');
  await ensureColumn('content_generation_items', 'draft_featured_image_caption', 'VARCHAR(500) DEFAULT NULL');
  await ensureColumn('content_generation_items', 'image_plan_json', 'JSON DEFAULT NULL');
  await ensureColumn('content_generation_items', 'image_quality_report_json', 'JSON DEFAULT NULL');
  await ensureColumn('content_generation_items', 'regeneration_attempts', 'INT NOT NULL DEFAULT 0');

  // Seed default Knowledge Base entries (non-destructive)
  for (const item of COMPANY_KNOWLEDGE_SEED) {
    await query(
      `INSERT IGNORE INTO content_knowledge_entries
       (entry_key, category_number, category_label, title, verification_status, source_reference, summary, facts_json, content_markdown, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        item.entry_key,
        item.category_number,
        item.category_label,
        item.title,
        item.verification_status,
        item.source_reference,
        item.summary,
        JSON.stringify(item.facts),
        item.content_markdown
      ]
    );
  }

  // Ensure matching blog categories exist for all 7 pillars
  const extraCategories = [
    ['Web Development', 'web-development', 'Arsitektur website modern, frontend, dan performa web.', '#2563eb', 1],
    ['Custom Software', 'custom-software', 'Pengembangan sistem bisnis custom, POS, inventori, dan integrasi API.', '#0284c7', 2],
    ['Cloud & Hosting', 'cloud-hosting', 'Managed cloud hosting, Free Plan, Node.js, Laravel, DNS, dan SSL.', '#0ea5e9', 3],
    ['AI & Automation', 'ai-automation', 'Integrasi AI, otomasi alur kerja, dan GEO search readiness.', '#4f46e5', 4],
    ['SEO & GEO Strategy', 'seo-geo-strategy', 'Optimasi mesin pencari Google dan Generative Engine Optimization.', '#059669', 5],
    ['Engineering Guide', 'engineering-guide', 'Panduan konsultasi IT, arsitektur database, dan deployment.', '#3b82f6', 6]
  ];
  for (const [name, slug, description, color, sortOrder] of extraCategories) {
    await query(
      `INSERT IGNORE INTO blog_categories (name, slug, description, color, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [name, slug, description, color, sortOrder]
    );
  }

  // Seed 7 Content Pillars
  for (const p of DEFAULT_PILLARS) {
    await query(
      `INSERT IGNORE INTO content_pillars
       (code, name, description, default_intent, primary_cta_label, primary_cta_path, category_slug, sample_topics_json, priority_weight, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        p.code,
        p.name,
        p.description,
        p.default_intent,
        p.primary_cta_label,
        p.primary_cta_path,
        p.category_slug,
        p.sample_topics_json,
        p.priority_weight,
        p.sort_order
      ]
    );
  }

  // Seed Singleton Settings (Default mode: manual_approval)
  await query(
    `INSERT IGNORE INTO content_automation_settings
     (id, approval_mode, engine_url, default_language, default_tone, default_word_count, min_seo_score, min_readability_score, min_geo_score, min_composite_score, min_word_count, max_similarity_threshold, daily_generation_limit, max_batch_size, auto_internal_linking, auto_web_research, timezone)
     VALUES (1, 'manual_approval', ?, 'id', 'practitioner_clear', 1050, 75, 68, 70, 74, 650, 0.72, 20, 10, 1, 0, 'Asia/Jakarta')`,
    [process.env.GENERATOR_API_URL || 'http://127.0.0.1:8000']
  );

  // Seed Default Schedules (paused by default until admin enables)
  await query(
    `INSERT IGNORE INTO content_automation_schedules
     (job_code, name, description, cron_expression, timezone, pillar_code, pillar_codes_json, articles_per_run, enable_web_research, is_active, timeout_seconds, retry_limit)
     VALUES
     ('slabs-weekly-service-pillar', 'Rilis Otomatis Pilar Layanan (Senin & Kamis 08:00 WIB)', 'Menghasilkan artikel strategis berotasi di seluruh pilar layanan 1sLabs tanpa duplikasi.', '0 8 * * 1,4', 'Asia/Jakarta', NULL, ?, 2, 0, 0, 600, 1),
     ('slabs-daily-freeplan-hosting', 'Siklus Harian Edukasi Hosting & Free Plan (09:00 WIB)', 'Memproduksi panduan teknis deploy website, Node.js, dan Free Plan.', '0 9 * * *', 'Asia/Jakarta', 'free-hosting-domain', ?, 1, 0, 0, 480, 1),
     ('slabs-daily-autonomous-0800', 'Autonomous Daily Content Machine (Setiap Hari 08:00 WIB)', 'Siklus otomatis harian berbasis multi-pilar: AI menemukan topik, menulis, optimasi SEO/GEO, audit quality gate, dan menerbitkan.', '0 8 * * *', 'Asia/Jakarta', 'website-development', ?, 3, 0, 0, 900, 1)`,
    [
      JSON.stringify(['website-development', 'software-development', 'it-consulting', 'hosting-infrastructure']),
      JSON.stringify(['free-hosting-domain', 'hosting-infrastructure']),
      JSON.stringify(['free-hosting-domain', 'website-development', 'software-development', 'portfolio-showcase'])
    ]
  );
}

async function ensureAutomationSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createAutomationTablesAndSeeds().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

module.exports = {
  ensureAutomationSchema,
  DEFAULT_PILLARS
};

