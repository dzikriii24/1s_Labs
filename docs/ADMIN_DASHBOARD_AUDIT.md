# 1sLabs Platform & Admin Dashboard - Comprehensive Audit Report
**Dokumen:** `docs/ADMIN_DASHBOARD_AUDIT.md`  
**Tanggal Audit:** 30 Oktober 2026  
**Status Audit:** Verified against live codebase, server APIs, and production database (`103.119.237.132` / `u1zh8984_oneslabs`)

---

## 1. Executive Summary & Objective

Tujuan audit ini adalah untuk memetakan arsitektur menyeluruh sistem **1sLabs Website & Hosting Management Platform**, mengidentifikasi seluruh komponen, database, service, dan API yang sudah tersedia, serta merancang blueprint pengembangan **Admin Dashboard** menjadi platform operasional bisnis & hosting (*Business & Hosting Operations Platform*) kelas enterprise dengan standar UI/UX modern SaaS (sekelas Stripe, Linear, Vercel, Cloudflare, dan Hostinger hPanel).

Pengembangan dilakukan dengan prinsip:
1. **Zero Reinvention:** Memanfaatkan seluruh sistem existing (authentication, payment flow QRIS, email service info@1slabs.my.id, cPanel UAPI, analytics tracker, and database).
2. **Zero Fake Data:** Menampilkan metrik nyata dari database dan cPanel/server API.
3. **Preserve Customer Experience:** Menjaga keutuhan alur landing page, customer portal, checkout, pembayaran, dan invoice.
4. **Enterprise Security:** Mencegah shell injection, pembocoran token/kredensial, dan memastikan RBAC (*Role-Based Access Control*) diverifikasi ketat di backend.

---

## 2. Technology Stack Audit

| Layer | Teknologi & Versi | Catatan Implementasi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 + TypeScript 5.5.3 | SPA berbasis Vite 5.4.2 |
| **Routing** | React Router DOM v7.8.2 | Mendukung dynamic routes, hash scrolling, client routing |
| **Styling & Design System** | Tailwind CSS 3.4.1 + PostCSS + Autoprefixer | Palet monokrom, glassmorphism, zinc/neutral, dark mode support |
| **Icons & Animations** | Lucide React 0.344.0 + Framer Motion 12.23.12 | Micro-animations, spring transitions, status indicators |
| **Backend Framework** | Node.js (v20+ / Passenger) + Express 4.19.2 | CORS universal, JSON/urlencoded parsers, static file uploaders |
| **Database Engine** | MySQL / MariaDB (via `mysql2/promise` 3.11.0) | Connection pooling (limit 10, keep-alive), transactions helper |
| **Authentication** | JWT (`jsonwebtoken` 9.0.2) + `bcryptjs` 2.4.3 | Bearer auth header, single-use token hashes (SHA-256) |
| **Email Transporter** | Nodemailer 10.3.0 over SMTPS (Port 465) | Host: `mail.1slabs.my.id`, Sender: `info@1slabs.my.id` |
| **File Upload Handling** | Multer 1.4.5-lts.1 | Upload bukti pembayaran (`/uploads/proofs`) & temp files |
| **Server & Hosting Integration** | cPanel UAPI (`/usr/bin/uapi`) + CloudLinux LVE | Eksekusi aman via `child_process.execFile` (tanpa shell interpolation) |
| **Analytics Engine** | Custom In-house Tracker (`tracker.js?v=2`) | Asynchronous beacon/fetch keepalive, non-intrusive cookie/localStorage |
| **Server Deployment** | CloudLinux / cPanel Passenger on `103.119.237.132` | User: `u1zh8984`, App root: `/home/u1zh8984/oneslabs-backend` |

---

## 3. Existing Architecture & Directory Map

```
1sLabs-website/
├── backend/
│   ├── index.js                     # Express entry point, static mounts, route loaders
│   ├── .env                         # DB, JWT, Mail, cPanel env configs
│   ├── package.json
│   ├── scripts/
│   │   └── run_daily_db_backups.js  # Automated daily database backup script
│   └── src/
│       ├── db.js                    # MySQL pool, query, withTransaction, executeInDatabase
│       ├── middleware/
│       │   ├── auth.js              # requireAuth, requireAdmin, requireVerifiedEmail, optionalAuth
│       │   └── upload.js            # Multer upload handler for payment proofs
│       ├── routes/
│       │   ├── admin.routes.js      # Existing admin endpoints (stats, payments, services, plans, customers)
│       │   ├── analytics.routes.js  # /collect, /tracker.js, /service/:serviceCode
│       │   ├── auth.routes.js       # Register, login, verify-email, resend, forgot/reset-password, profile
│       │   ├── database.routes.js   # cPanel MySQL DB, user privileges, table inspection, SQL backup/restore
│       │   ├── filemanager.routes.js# Web-based sandboxed file manager
│       │   ├── ftp.routes.js        # cPanel FTP account management
│       │   ├── invoices.routes.js   # Invoice listing & detail by number
│       │   ├── orders.routes.js     # Domain validation, order checkout, auto-expiration
│       │   ├── payments.routes.js   # QRIS settings, customer proof submission
│       │   ├── plans.routes.js      # Public plan catalog
│       │   └── services.routes.js   # Customer hosting services, domain change, subroutes
│       ├── services/
│       │   ├── cpanel.service.js    # cPanel UAPI wrapper (Ftp, Mysql, Quota, AddonDomain)
│       │   └── email.service.js     # Nodemailer transporter, HTML wrapper, 12 transactional email templates
│       └── utils/
│           ├── fileSandbox.js       # Safe path resolution, chroot directory enforcement
│           ├── helpers.js           # ID generators (ORD-, PAY-, INV-, SRV-), formatters
│           ├── tokens.js            # Cryptographic token generator & SHA-256 hash
│           └── validation.js        # Email & WhatsApp phone number normalizers
├── deploy/                          # SSH automation, deployment scripts, live maintenance
├── docs/                            # System and architecture documentation
├── public/                          # Static assets (logo, QRIS, tracker)
└── src/
    ├── App.tsx                      # React root router & layout provider
    ├── components/
    │   ├── hosting/                 # FileManagerTab, DatabaseManagementTab, FtpManagementTab, AnalyticsTab
    │   ├── layout/                  # Header, Footer, HeroParallax
    │   └── sections/                # About, Services, Hosting, Portfolio, Contact, etc.
    ├── contexts/
    │   ├── AuthContext.tsx          # JWT state, user payload, login/logout hooks
    │   └── LanguageContext.tsx      # ID/EN i18n localization state
    ├── pages/
    │   ├── AdminDashboardPage.tsx   # Legacy monolithic single-file admin page (102 KB)
    │   ├── CheckoutPage.tsx         # Hosting order checkout form
    │   ├── CustomerPortalPage.tsx   # Customer service and hosting control center
    │   ├── HostingPlanDetailPage.tsx# Plan feature inspection
    │   ├── InvoicePage.tsx          # Official branded invoice view & print template
    │   ├── LoginPage.tsx            # Customer & admin login form
    │   ├── PaymentPage.tsx          # QRIS payment confirmation & proof upload
    │   ├── RegisterPage.tsx         # Customer registration with email verification
    │   ├── ServiceLandingPage.tsx   # IT & Hosting service landing pages
    │   ├── SetupDomainPage.tsx      # Domain registration & configuration
    │   └── VerifyEmailPage.tsx      # Token confirmation page
    └── services/
        └── api.ts                   # Centralized Axios/fetch API client with TypeScript interfaces
```

---

## 4. Live Database Schema Audit (`u1zh8984_oneslabs`)

Audit langsung terhadap database produksi mengonfirmasi **16 tabel aktif**:

| Nama Tabel | Deskripsi & Tujuan | Foreign Keys & Relasi Utama |
| :--- | :--- | :--- |
| `users` | Akun pengguna (`customer` & `admin`), status verifikasi email, token reset kata sandi | Primary entity, direferensikan oleh orders, services, payments |
| `hosting_plans` | Katalog paket hosting (Starter, Business, Enterprise, dll), kuota disk, database, JSON features | Direferensikan oleh `orders` & `hosting_services` |
| `orders` | Pesanan hosting baru atau perpanjangan, nomor `ORD-...`, domain snapshot, status pesanan | `user_id -> users(id)`, `plan_id -> hosting_plans(id)` |
| `payments` | Transaksi pembayaran QRIS, nomor `PAY-...`, bukti transfer, approval status, verifikator | `order_id -> orders(id)`, `user_id -> users(id)` |
| `hosting_services`| Layanan hosting aktif, nomor `SRV-...`, domain, status aktivasi, tanggal kadaluarsa, disk & bandwidth usage | `user_id -> users(id)`, `order_id -> orders(id)`, `plan_id -> hosting_plans(id)` |
| `invoices` | Faktur tagihan resmi, nomor `INV-...`, rincian billing, status pembayaran, tanggal jatuh tempo | `user_id -> users(id)`, `order_id -> orders(id)`, `service_id -> hosting_services(id)` |
| `service_events` | Timeline audit log layanan (aktivasi, domain update, perpanjangan, suspensi) | `service_id -> hosting_services(id)` |
| `payment_verification_logs` | Audit trail verifikasi pembayaran (admin actor, previous status, reason, IP address) | `payment_id -> payments(id)` |
| `domain_reservations`| Kunci reservasi domain 24 jam selama masa pembayaran untuk mencegah collision | `user_id -> users(id)` |
| `email_logs` | Riwayat log pengiriman email (`queued`, `sent`, `failed`), retry attempts, metadata JSON | Audit trail komunikasi email resmi |
| `hosting_analytics` | Log event tracker pengunjung website (`pageview`, `click`), domain, visitor ID, browser, OS, device, IP | Ditautkan dengan `service_code` dan `domain` |
| `hosting_databases` | Database MySQL per layanan hosting, database user, host | `service_id -> hosting_services(id)` |
| `hosting_ftp_accounts`| Akun FTP cPanel per layanan hosting, direktori root, kuota | `service_id -> hosting_services(id)` |
| `hosting_database_backups`| Snapshot backup SQL database harian/manual | `service_id -> hosting_services(id)` |
| `hosting_audit_logs`| Audit log aktivitas pengelolaan hosting (file edit, DB create, FTP delete) | `service_id -> hosting_services(id)`, `user_id -> users(id)` |
| `hosting_settings` | Konfigurasi sistem dinamis (gambar QRIS, WhatsApp support, URL cPanel, dll) | Key-value store sistem |

---

## 5. Existing Email System Audit

Sistem email sudah terimplementasi secara lengkap di `backend/src/services/email.service.js` dengan kredensial aktif:
- **SMTP Host:** `mail.1slabs.my.id`
- **Port:** `465` (SSL/TLS direct)
- **User / Sender:** `info@1slabs.my.id`
- **Admin Alert Recipient:** `dzikrirabbani2401@gmail.com`
- **Branding Header:** Logo resmi 1sLabs (`https://r0.image2url.com/...`)
- **Desain HTML:** Desain minimalis monokrom Swiss typography, tombol hitam solid, kartu border zinc halus, dan footer legal.
- **Log Audit:** Setiap pengiriman email otomatis tercatat ke tabel `email_logs` (lengkap dengan recipient, subject, template name, messageId, status `sent`/`failed`, dan `last_error`).
- **12 Template Bawaan:**
  1. `customer_verify_email` (Verifikasi email akun)
  2. `customer_order_created` (Notifikasi pesanan dibuat & instruksi QRIS)
  3. `customer_payment_proof_received` (Penerimaan bukti transfer)
  4. `customer_payment_approved` (Pembayaran diverifikasi lunas)
  5. `customer_payment_rejected` (Pembayaran ditolak beserta alasan)
  6. `customer_hosting_activated` (Layanan hosting aktif beserta NS & IP)
  7. `customer_expiration_reminder` (Pengingat kadaluarsa hosting)
  8. `customer_password_reset` (Tautan reset kata sandi akun)
  9. `admin_new_customer` (Alert admin: pendaftaran pelanggan baru)
  10. `admin_new_order` (Alert admin: pesanan hosting baru)
  11. `admin_payment_proof` (Alert admin: bukti transfer diunggah pelanggan)
  12. `admin_provisioning_failure` (Alert kritis: kegagalan aktivasi server)

---

## 6. Existing Analytics Architecture Audit

Sistem analitik pengunjung website sudah aktif menggunakan tracker embed:
- **Snippet Script:**
  ```html
  <!-- 1sLabs Analytics Tracker -->
  <script defer src="https://1slabs.my.id/tracker.js?v=2" data-service="SRV-2026-62DECA"></script>
  ```
- **File Endpoint:**
  - `GET /tracker.js` atau `GET /api/analytics/tracker.js` melayani script klien secara asynchronous.
  - `POST/ALL /api/analytics/collect` menangani penerimaan event secara zero-auth dengan dukungan CORS universal, `navigator.sendBeacon`, dan `fetch(..., { keepalive: true })`.
- **Data yang Dikumpulkan Saat Ini:**
  - `service_code`, `domain`, `event_type` (`pageview`, `click`)
  - `page_url`, `page_path`, `page_title`, `referrer`
  - `visitor_id` (tersimpan di `localStorage['_1slabs_vid']` dengan fallback SHA-256 IP/UA hash)
  - `device` (Desktop, Mobile, Tablet)
  - `browser` (Chrome, Edge, Firefox, Safari, Opera)
  - `screen_resolution` (contoh: `1920x1080`, `390x844`)
  - `ip_address` (disimpan aman, IPv4/IPv6 truncated)
- **Status Data:**
  - Tabel `hosting_analytics` di database produksi telah memiliki live events riil untuk layanan `SRV-2026-62DECA` (`kimholidaytravel.id`).
  - Metrik agregasi saat ini baru tersedia untuk level per-layanan (`/api/analytics/service/:serviceCode`).
  - **Gap:** Belum tersedia endpoint agregasi global untuk Admin Dashboard yang mencakup seluruh domain atau filter multi-periode (Today, Yesterday, 7D, 30D, 90D, Custom range), bounce rate, session duration, dan top landing pages.

---

## 7. Existing cPanel / Server Monitoring & SSL Audit

Pengujian langsung via SSH dan cPanel UAPI pada server produksi (`103.119.237.132`):
1. **cPanel UAPI Execution:**
   - Server menjalankan CloudLinux OS dengan cPanel & UAPI `/usr/bin/uapi`.
   - Modul `cpanel.service.js` mengeksekusi perintah via `execFile('/usr/bin/uapi', args)` tanpa shell interpolation, sehingga 100% aman dari command injection.
2. **Resource Metrics Aktual (`ResourceUsage::get_usages`):**
   - **CPU Usage:** `lvecpu` (13 / 100)
   - **Memory Usage:** `lvememphy` (184.68 MB / 1,024 MB)
   - **Entry Processes:** `lveep` (5 / 12)
   - **Number of Processes:** `lvenproc` (47 / 100)
   - **Disk Usage:** `disk_usage` (19.19 GB)
   - **Database Disk:** `cachedmysqldiskusage` (678.87 MB)
   - **PostgreSQL Disk:** `cachedpostgresdiskusage` (8.2 MB)
   - **Bandwidth:** `bandwidth` (2.71 GB)
   - **IOPS:** `lveiops` (0 / 1,024)
   - **I/O Usage:** `lveio` (2 KB/s / 1 MB/s)
   - **Account Objects:** Addon Domains (13), Subdomains (15), Aliases (1), Email Accounts (7), Databases (27), FTP Accounts (2).
3. **SSL Certificate Management (`SSL::installed_hosts`, `SSL::list_certs`):**
   - UAPI mengembalikan seluruh vhost yang terpasang sertifikat SSL.
   - Status self-signed terdeteksi akurat via `is_self_signed: "0"` (Let's Encrypt valid) vs `is_self_signed: "1"` (Self-Signed bawaan server).
   - Masa berlaku sertifikat tersedia dalam epoch timestamp `not_after` & `not_before`.
   - Diagnostik masalah AutoSSL tersedia langsung via `SSL::get_autossl_problems` (contoh: kegagalan DNS DCV pada `kimholidaytravel.id.menu.co-id.id`).
   - Pemicu one-click AutoSSL check tersedia via `SSL::start_autossl_check`.
4. **Server Processes & Safety:**
   - Perintah `ps -u u1zh8984 -o pid,%cpu,%mem,etime,args` menyajikan daftar proses aktif milik akun hosting.
   - Server uptime tersedia via `uptime`.
   - **Critical Safety Rule:** Tidak boleh ada automatic mass-kill saat resource mencapai 95%. Proses terminated harus melalui konfirmasi eksplisit admin, dicatat ke audit log, dan proses penting (seperti master passenger/node daemon) dilindungi oleh whitelist.

---

## 8. Existing Invoice System Audit (`InvoicePage.tsx`)

Komponen `src/pages/InvoicePage.tsx` telah menjadi standar identitas visual dokumen tagihan 1sLabs:
- **Header:** Logo resmi 1sLabs, tagline *"High-Performance Web Hosting & Infrastructure Platform"*, alamat Bandung, Jawa Barat, email `info@1slabs.my.id`.
- **Status Badge:** Badge LUNAS / PAID hijau emerald dengan timestamp verifikasi resmi.
- **Watermark:** Tanda air diagonal *"LUNAS"* saat invoice berstatus paid.
- **Rincian:** Ditagihkan kepada (nama & email pelanggan), nomor pesanan, nomor pembayaran, metode bayar (QRIS), paket hosting, domain, dan periode tagihan.
- **Fungsi Print:** Window print dengan styling media `@media print` rapi (action bar otomatis disembunyikan saat dicetak).
- **Gap:** Saat ini pembuatan invoice hanya terjadi secara otomatis saat pembayaran pesanan baru diverifikasi. Belum ada fitur manual *Invoice Generator* bagi admin untuk menerbitkan invoice dengan multiple service items (misal: Hosting + Domain + Website Development + Maintenance) serta *Service Report Generator*.

---

## 9. Gap Analysis & Missing Features

| Kategori | Fitur yang Sudah Tersedia | Gap / Fitur yang Harus Dikembangkan |
| :--- | :--- | :--- |
| **Navigasi Admin** | Tab horizontal pada satu halaman monolitik (`AdminDashboardPage.tsx` 102 KB) | Sidebar hierarkis collapsible, pengelompokan menu (Overview, Customers, Hosting, Domain/SSL, Finance, Communication, System), responsive drawer, breadcrumb |
| **Analytics** | Tracker klien (`tracker.js`), penyimpanan event per-layanan | Global Analytics Dashboard untuk admin: aggregate metrics (Total Visitors, Unique, Pageviews, Clicks, Top Landing Pages, Devices, Browsers, Referrers, Daily Chart, multi-date filter) |
| **Customer Management** | List pelanggan dasar (nama, email, total spend) | Customer Management mendalam: customer detail view, order history, active services, payment records, email communication log, customer status filter, export CSV |
| **Hosting Management** | List layanan hosting & dialog edit sederhana | Hosting Overview metrics, Service Detail komprehensif dengan grafik pemakaian resource (CPU, RAM, nproc, IOPS, I/O, Disk, DB, Addon domains, email accounts) |
| **Server Monitoring** | Belum ada halaman dedicated | Server Health Dashboard: real-time LVE resource cards, server status & uptime, memory/disk gauges, resource threshold alerts (80% Warning, 95% Critical), safe process viewer & graceful killer |
| **Domain & SSL** | Perubahan domain dasar per layanan | Domain Management terpusat: deteksi seluruh addon/subdomain, pemantauan status SSL (Valid, Expired, Self-Signed, Not Installed), AutoSSL problem logs, One-Click AutoSSL issue/renew |
| **Finance & Invoicing** | Tabel pembayaran paid & pending verification | Financial & Revenue Dashboard (Gross, Discount, Tax, Net, Monthly/Annual Breakdown, Service Revenue split), Manual Multi-Item Invoice Generator, Invoice PDF/Print preview, Service Report Generator |
| **Email Management** | Transporter & static templates di backend | Email Management Dashboard: visualisasi log pengiriman email (`sent`, `failed`, `queued`), filter kategori, email template editor dinamis dengan placeholder variables (`{{customer_name}}`, dll), live preview, test email dispatcher |
| **System & Security** | RequireAdmin middleware dasar | Central Activity Logs (`actor`, `action`, `target`, `timestamp`, `ip`, `result`), Notification Center (alert order baru, verifikasi pending, SSL expiring, resource warning), RBAC granularitas |

---

## 10. Recommended Implementation Strategy (Phased Plan)

### PHASE 1 — Audit & Foundation (Selesai pada langkah ini)
- Menyelesaikan dokumentasi `docs/ADMIN_DASHBOARD_AUDIT.md`.
- Merancang struktur arsitektur modular admin pada `src/components/admin/` dan sub-pages.
- Menyiapkan sidebar navigasi profesional dengan icon-icon standar, collapsible mode, mobile responsive drawer, header dengan admin profile, dan breadcrumb.

### PHASE 2 — Analytics & Customers
- **Backend:** Menambahkan endpoint `/api/admin/analytics/overview` yang melakukan query agregasi dari `hosting_analytics` berdasarkan range (today, yesterday, 7d, 30d, 90d, custom) dan mengembalikan time-series, top pages, referrers, devices, browsers, dan engagement.
- **Frontend:** Membangun `AnalyticsDashboardView` dan `CustomerManagementView` lengkap dengan Customer Detail Modal/Page (riwayat order, layanan aktif, invoice, dan email communication history).

### PHASE 3 — Hosting & Server Monitoring
- **Backend:** Menambahkan endpoint `/api/admin/server/resources`, `/api/admin/server/processes`, dan `/api/admin/server/kill-process` (whitelisted safe process termination via PID matching u1zh8984) serta threshold checks.
- **Frontend:** Membangun `HostingManagementView` (overview metrics & detail view) dan `ServerMonitoringView` (gauges LVE, uptime, load averages, process list table dengan kill confirmation modal aman).

### PHASE 4 — Domain & SSL Management
- **Backend:** Menambahkan endpoint `/api/admin/domains` (menggabungkan data `domain_reservations`, `hosting_services`, dan cPanel `SSL::installed_hosts` serta `SSL::get_autossl_problems`) dan endpoint `/api/admin/ssl/start-check` / `/api/admin/ssl/recheck`.
- **Frontend:** Membangun `DomainManagementView` dan `SslCertificatesView` dengan filter status SSL (Active, Self-Signed, Expired, Not Installed), tombol One-Click Install/Renew SSL, dan live feedback status provider.

### PHASE 5 — Finance, Invoice & Service Report Generator
- **Backend:** Menambahkan endpoint `/api/admin/finance/overview` (revenue analytics, breakdowns per service), endpoint manual invoice creation `/api/admin/invoices/create` (mendukung multiple line items), dan email invoice trigger.
- **Frontend:** Membangun `RevenueDashboardView`, `InvoiceManagementView`, form generator invoice multi-item dengan live preview sesuai `InvoicePage.tsx`, serta `ServiceReportGeneratorView` (laporan aktivasi, maintenance, dan project).

### PHASE 6 — Communication & Email Management
- **Backend:** Menambahkan endpoint `/api/admin/emails/logs` (paginasi riwayat pengiriman email), `/api/admin/emails/templates` (CRUD template dari tabel `email_templates` atau fallback ke dynamic templates), dan `/api/admin/emails/test-send`.
- **Frontend:** Membangun `EmailManagementView` dan `EmailTemplateEditorView` dengan syntax preview, variable insertion pills (`{{customer_name}}`, `{{invoice_number}}`), desktop/mobile live preview, dan tombol kirim email uji coba.

### PHASE 7 — System, Activity Logs, Notifications & Finalization
- **Backend:** Menghubungkan audit logging terpusat ke tabel `system_activity_logs` dan notification feed `/api/admin/notifications`.
- **Frontend:** Activity Logs explorer, Notification Bell dropdown di top header, polish UI/UX, testing integrasi end-to-end, dan validasi fungsional menyeluruh.

---

*Laporan audit ini telah diverifikasi dan siap dijadikan panduan implementasi.*
