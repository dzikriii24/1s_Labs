UPDATE hosting_plans 
SET price = 850000.00,
    name = 'Starter Hosting',
    target = 'Ideal for Landing Pages & Company Profiles',
    period = '/ tahun',
    description = 'Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional.',
    storage_gb = 30,
    databases_count = 10,
    bandwidth = 'Unmetered Monthly Bandwidth',
    ssl_type = 'Free SSL Certificate (Auto-SSL)',
    backup_frequency = 'Weekly Cloud',
    email_accounts = 'Akun Email Domain Mandiri',
    is_recommended = 0,
    is_active = 1,
    features_json = '["30 GB High-Speed NVMe SSD Storage","10 MySQL Databases","Unmetered Monthly Bandwidth","Free SSL Certificate (Auto-SSL)","Akses cPanel & File Manager Mandiri","Bantuan Setup & Deployment Gratis","Dukungan Teknis via WhatsApp Standar","Garansi Uptime Server 99.9%"]'
WHERE slug = 'starter';

UPDATE hosting_plans 
SET price = 1000000.00,
    name = 'Business Hosting',
    target = 'Best for Growing Companies & Active UMKM',
    period = '/ tahun',
    description = 'Pilihan paling populer dengan kapasitas penyimpanan 60 GB, 25 database, dan backup otomatis berkala.',
    storage_gb = 60,
    databases_count = 25,
    bandwidth = 'Unmetered Monthly Bandwidth',
    ssl_type = 'Free SSL Certificate (Auto-SSL)',
    backup_frequency = 'Backup Otomatis Mingguan (Weekly Cloud)',
    email_accounts = 'Akun Email Domain Mandiri',
    is_recommended = 1,
    is_active = 1,
    features_json = '["60 GB High-Speed NVMe SSD Storage","25 MySQL Databases","Unmetered Monthly Bandwidth","Free SSL Certificate (Auto-SSL)","Akses cPanel Penuh & phpMyAdmin","Backup Otomatis Mingguan (Weekly Cloud)","Bantuan Setup & Konfigurasi Domain DNS","Optimasi Kecepatan (LiteSpeed Caching)","Dukungan Teknis Prioritas via WhatsApp"]'
WHERE slug = 'business';

UPDATE hosting_plans 
SET price = 1200000.00,
    name = 'Professional Hosting',
    target = 'For High-Traffic Sites & Critical Portals',
    period = '/ tahun',
    description = 'Performa maksimal dengan unlimited storage dan dukungan prioritas untuk portal bisnis dengan lalu lintas tinggi.',
    storage_gb = -1,
    databases_count = -1,
    bandwidth = 'Unmetered Monthly Bandwidth',
    ssl_type = 'Free Commercial SSL Certificate',
    backup_frequency = 'Backup Otomatis Harian (Daily Cloud)',
    email_accounts = 'Akun Email Domain Mandiri',
    is_recommended = 0,
    is_active = 1,
    features_json = '["Unlimited High-Speed NVMe SSD Storage","Unlimited MySQL Databases","Unmetered Monthly Bandwidth","Free Commercial SSL Certificate","Resource CPU & RAM Lebih Tinggi (High-Performance)","Backup Otomatis Harian (Daily Cloud)","Bantuan Penuh Migrasi Website & Deployment","Dukungan VIP Fast-Response via WhatsApp","Proactive Monitoring & Security Audit"]'
WHERE slug = 'professional';
