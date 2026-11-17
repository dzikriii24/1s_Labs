# Arsitektur Sistem Otomatisasi Konten AI & SEO Intelligence 1sLabs

Dokumen ini merupakan hasil audit fase 1 dan pemetaan migrasi/integrasi antara engine **`article-generator`** (Python + FastAPI) dan platform **`1sLabs-website`** (React + Node.js/Express + MySQL).

---

## 1. Tujuan & Prinsip Arsitektur

Sistem ini mengintegrasikan kemampuan riset, komposisi bertahap, dan optimasi artikel dari project lokal **`article-generator`** ke dalam ekosistem **`1sLabs`** untuk menghasilkan **Service-Oriented Content Marketing Engine** yang terhubung penuh ke database, panel admin, dan blog publik `https://1slabs.my.id/`.

### Prinsip Utama

1. **`article-generator` tetap menjadi generation engine lokal.** Dijalankan secara lokal (tidak bergantung pada deployment eksternal `https://articlegenerator.1slabs.my.id/`).
2. **`1sLabs` adalah pusat kendali, review, kualitas, publikasi, dan analitik SEO.**
3. **Single Source of Truth artikel publikasi:** Semua artikel final, draft editorial yang disetujui, antrean publik, riwayat revisi, cluster, dan skor terpusat berada di database `1sLabs` (`blog_articles` dan tabel otomasi `content_*`).
4. **Pemisahan database & kredensial:** Kredensial database `article-generator` tidak disalin ke `1sLabs` dan sebaliknya. Komunikasi dilakukan melalui internal **Service Adapter REST API** terautentikasi token (`X-Integration-Key`).
5. **Satu standar evaluasi SEO, Readability, & GEO:** Semua artikel yang masuk atau dioptimasi wajib dievaluasi menggunakan modul terpadu `1sLabs` (`seoAnalyzer.service.js` + `blogAi.service.js`), sehingga skor pada AI Automation selalu identik dengan Article Editor.
6. **Failed-safe & Approval Gate:** Artikel yang gagal validasi atau di bawah standar Quality Gate tidak boleh dipublikasikan otomatis.

---

## 2. Diagram Alur Arsitektur Target

```text
+-----------------------------------------------------------------------+
|                           1SLABS ADMIN PANEL                          |
|  Overview | Generate | Batch | Review | Scheduler | Strategy | KB     |
+-----------------------------------+-----------------------------------+
                                    |
                          JWT Admin / Marketing Auth
                                    v
+-----------------------------------------------------------------------+
|                  1SLABS BACKEND (Express.js / Node v22)               |
|                                                                       |
|  +-----------------------+     +-----------------------------------+  |
|  | Automation Controller |<--->| Scheduler & Background Queue      |  |
|  | /api/content-automation|    | (Cron Asia/Jakarta, Lock, Retry)  |  |
|  +-----------+-----------+     +-----------------------------------+  |
|              |                                                        |
|              v                                                        |
|  +-----------------------+     +-----------------------------------+  |
|  | Company Knowledge Base|<--->| Content Strategy & Duplicate Check |  |
|  | (Verified 1sLabs Data)|     | (7 Pillars, Similarity, Keyword)  |  |
|  +-----------+-----------+     +-----------------------------------+  |
|              |                                                        |
|   HTTP + X-Integration-Key                                            |
|              v                                                        |
|  +-----------------------------------------------------------------+  |
|  |      ARTICLE GENERATOR ENGINE (Local Python FastAPI Service)    |  |
|  |      POST /api/v1/1slabs/generate  |  GET /api/v1/1slabs/health |  |
|  |  - Grounded Intent & Prompt Builder (ID / EN + Anti-AI-Slop)    |  |
|  |  - Research & Fallback (Web + KB Verified Claims Guard)         |  |
|  |  - Structured Story Plan & Narrative HTML Composer              |  |
|  +---------------------------------+-------------------------------+  |
|              | Structured Draft Payload (JSON + HTML + FAQ + Meta)    |
|              v                                                        |
|  +-----------------------------------------------------------------+  |
|  |        UNIFIED SEO / GEO ANALYZER + AI OPTIMIZER                |  |
|  |        (seoAnalyzer.service.js + blogAi.service.js)             |  |
|  +---------------------------------+-------------------------------+  |
|                                    |                                  |
|                                    v                                  |
|  +-----------------------------------------------------------------+  |
|  |                    QUALITY GATE & VALIDATOR                     |  |
|  |  Hard Rules (Slug/H1/Links/Placeholder/Claims) + Weighted Score |  |
|  +-------------------+-----------------------------+---------------+  |
|                      |                             |                  |
|                 REJECT/DRAFT                QUALIFIED + MODE          |
|                      |                             |                  |
|                      v                             v                  |
|         content_automation_items        Approval Mode Switch:         |
|         (Needs Review / Rejected)       - manual_approval (default)   |
|                                         - auto_publish_qualified      |
|                                         - always_save_draft           |
|                                                    |                  |
|                                                    v                  |
|                                         Upsert ke `blog_articles`     |
|                                         (Duplicate Check + Revision)  |
|                                                    |                  |
|                                                    v                  |
|                                      /blog & /api/sitemap.xml         |
+----------------------------------------------------+------------------+
                                                     |
                                                     v
+-----------------------------------------------------------------------+
|          GOOGLE SEARCH CONSOLE (GSC) & PERFORMANCE LOOP               |
|  - Verified Property Picker (webmasters/v3/sites)                     |
|  - Search Analytics Sync (Clicks, Impressions, CTR, Position)         |
|  - URL Inspection API (urlInspection/index:inspect -> Status Indeks)  |
|  - AI Improvement Suggestions (Require Approval Before Overwrite)     |
|  - GSC Query Gap -> Otomatis usulkan topik baru ke Content Strategy    |
+-----------------------------------------------------------------------+
```

---

## 3. Hasil Audit Arsitektur Eksisting

### 3.1 Project Sumber: `article-generator`

- **Lokasi:** `C:\Users\dzikri\Downloads\Inpartner\article-generator\project`
- **Stack:** Python 3.11 (`venv`), FastAPI `0.115.6`, Uvicorn, `a2wsgi`, SQLAlchemy `2.0.23+`, PyMySQL, `google-genai==1.2.0`, APScheduler `3.11.0`, BeautifulSoup4, `feedparser`.
- **Pipeline Generator Eksisting (`services/generator.py`):**
  1. `analyze_topic_intent` -> analisis entitas, tipe berita, sudut pandang.
  2. `discover_sources_multi_query` -> Google News RSS + GNews API + web scraping + ranking relevansi embedding (`gemini-embedding-2`).
  3. `extract_facts_and_provenance` -> ekstraksi klaim (`Claim`).
  4. `cross_verify_and_evaluate_quality` + secondary research.
  5. `generate_seo_brief` -> keyphrase & brief struktur.
  6. `generate_story_plan` -> outline & hook.
  7. `compose_narrative_draft` + `editorial_correction_and_composition` (800–1400 kata).
  8. `fact_audit_and_validation` + `EditorialCorrection` + `ArticleRevision`.
  9. `run_article_audit` (`services/seo_engine.py`, gaya Yoast berbahasa Inggris).
- **LLM Client (`services/llm_client.py`):** Pembungkus `google.genai.Client` dengan role `RESEARCH`, `REASONING`, `COMPOSITION`, `LIGHTWEIGHT`, sanitasi API key pada log error, pembatasan prompt karakter, dan mekanisme fallback model.
- **Keterbatasan Sebelum Adaptasi untuk 1sLabs:**
  - Pipeline terfokus pada berita finansial/investasi Inpartner berbahasa Inggris; gagal keras (`FAILED`) jika Google News tidak menemukan artikel berita (`sources == 0`), padahal topik teknis/edukasi/layanan `1sLabs` sering bersifat *evergreen*.
  - Belum mengenal fakta terverifikasi `1sLabs` (layanan, harga, program Free Plan, portofolio, CTA, batasan klaim).
  - Penguncian worker (`job_runner.py`) memakai `fcntl.flock` khusus Linux (no-op di Windows).
  - Database eksisting (`u1zh8984_article`) berisi data produksi Inpartner (4.246 `topics`, 49 `generated_articles`, 21 `article_topics`) sehingga integrasi `1sLabs` tidak boleh mencemari atau menimpa data Inpartner.

### 3.2 Project Target: `1sLabs-website`

- **Lokasi:** `C:\Users\dzikri\Downloads\1sLabs-website`
- **Stack:**
  - **Frontend:** React `18.3.1`, TypeScript `5.5.3`, Vite `5.4.2`, Tailwind CSS `3.4.1`, `lucide-react`, TipTap v2 (`ArticleBlockEditor`), `react-helmet-async`.
  - **Backend:** Node.js `v22.20.0`, Express `4.19.2`, `mysql2/promise`, JWT + RBAC (`admin`, `super_admin`, `marketing`, `hr`, `customer`), Nodemailer, Multer.
- **Modul Blog & SEO Eksisting:**
  - **Tabel `blog_*` (`backend/src/services/blog/blogSchema.service.js`):** `blog_categories`, `blog_tags`, `blog_article_tags`, `blog_topic_clusters`, `blog_articles`, `blog_article_revisions`, `blog_gsc_settings`, `blog_gsc_performance`, `blog_content_ideas`, `blog_seo_redirects`.
  - **Analyzer Terpadu (`backend/src/services/blog/seoAnalyzer.service.js`):** Evaluasi deterministik SEO (0–100), Readability (0–100, mendukung Bahasa Indonesia & Inggris), GEO Readiness (0–100), dan `composite_score` (`0.45*seo + 0.30*readability + 0.25*geo`), dengan status `good` bila `seo >= 75 && readability >= 70 && composite >= 75`.
  - **AI Service (`backend/src/services/blog/blogAi.service.js`):** Gemini client REST dengan `AISLOP_RULES`, `runAiSeoAudit`, `runAiAssist`, `runOneClickOptimize` (beserta Content Preservation Guard), dan `generateAiContentIdeas`, dicatat di `marketing_ai_logs`.
  - **GSC Service (`backend/src/services/blog/gsc.service.js`):** Sudah memiliki OAuth2 + `searchAnalytics/query` (Clicks, Impressions, CTR, Position), **namun belum memiliki** pemilihan property terverifikasi (`webmasters/v3/sites`), **URL Inspection API**, riwayat inspeksi indeks, serta **Performance Feedback Loop** untuk optimasi artikel terbit dan penemuan topik berbasis kesenjangan kueri.
  - **Public Blog & Technical SEO:** `/blog`, `/blog/:slug`, `/artikel`, `/artikel/:slug`, `/api/sitemap.xml`, `/api/robots.txt`, serta renderer SSR metadata/JSON-LD untuk crawler via `.htaccess`.
- **Temuan Penting DB Lokal:** Database lokal `.env` menunjuk `127.0.0.1:3306/u1zh8984_oneslabs` yang pada kondisi awal hanya memiliki 10 tabel `hr_*`. Diperlukan inisialisasi schema `users` + `blog_*` + `content_*` yang idempoten saat startup/migrasi lokal agar backend dapat berjalan utuh secara lokal tanpa mengandalkan server produksi.

---

## 4. Pemetaan Database (`u1zh8984_oneslabs`)

Seluruh tabel baru ditempatkan di database `1sLabs` dengan prefix `content_` atau terhubung ke `blog_articles`:

| Tabel | Fungsi | Relasi |
|---|---|---|
| `blog_articles` (eksisting) | Pusat penyimpanan artikel terbit & draft editor | `category_id`, `cluster_id`, `author_id` |
| `blog_article_revisions` (eksisting) | Riwayat revisi manual, autosave, dan AI optimization | `article_id` -> `blog_articles.id` |
| `blog_topic_clusters` & `blog_content_ideas` (eksisting) | Cluster pilar konten & backlog ide topik | `cluster_id`, `linked_article_id` |
| `content_knowledge_entries` (baru) | Company Knowledge Base terverifikasi & dapat diperbarui | Stand-alone + versi update |
| `content_pillars` (baru) | 11 Content Pillars strategis 1sLabs & aturan CTA/landing page | Terkait `blog_topic_clusters` |
| `content_calendar_items` (baru) | Rencana jadwal artikel AI lintas hari & pilar (`planned` -> `queued` -> `generated` -> `published`) | `job_id`, `item_id`, `article_id` |
| `content_automation_settings` (baru) | Konfigurasi mode persetujuan (`manual`/`auto`/`draft`), `selected_pillars_json`, `auto_optimize_below_threshold`, `max_auto_regenerations`, kuota harian, ambang Quality Gate, URL engine lokal | Singleton config |
| `content_automation_schedules` (baru) | Definisi jadwal cron (`Asia/Jakarta`), multi-pillar (`pillar_codes_json`), target artikel/run, lock run terakhir | Referensi ke run |
| `content_generation_jobs` (baru) | Header pekerjaan `manual` / `batch` / `scheduled` / `autonomous` (multi-pillar, status, progress, cancel flag) | Parent dari `content_generation_items` |
| `content_generation_items` (baru) | Item per artikel: topik, prompt, pilar, `target_audience`, `recommended_category`, `featured_image_alt`, status pipeline, draf HTML ter-justified, FAQ, skor SEO/GEO/Readability, `regeneration_attempts`, hasil Quality Gate, link `published_article_id` | `job_id` -> `content_generation_jobs.id`, `published_article_id` -> `blog_articles.id` |
| `content_schedule_runs` (baru) | Log eksekusi scheduler (mulai, selesai, status, jumlah dibuat/lolos/publik, alasan skip/error) | `schedule_id` -> `content_automation_schedules.id` |
| `article_index_inspections` (baru) | Riwayat inspeksi GSC URL Inspection API per artikel (`verdict`, `coverage_state`, `indexing_state`, `page_fetch_state`, canonical, `last_crawl_time`, `crawled_as`) | `article_id` -> `blog_articles.id` |
| `content_optimization_suggestions` (baru) | Rekomendasi perbaikan AI berbasis performa GSC & audit yang membutuhkan approval admin sebelum menimpa artikel terbit | `article_id` -> `blog_articles.id` |

---

## 5. Pemetaan API Antarsistem (Service Adapter)

### 5.1 Endpoint Internal Engine Generator (Python FastAPI)

Dipasang pada `article-generator/project/api/slabs_routes.py` tanpa mengubah route Inpartner:

- `GET /api/v1/1slabs/health`: Verifikasi engine aktif, ketersediaan model Gemini, versi adapter.
- `POST /api/v1/1slabs/generate`: Menerima payload terstruktur:
  - `job_item_id`, `topic`, `target_keyword`, `secondary_keywords`, `pillar`, `search_intent`, `language` (`id` | `en`), `tone`, `word_count_target`, `enable_web_research`
  - `knowledge_base`: snapshot Company Knowledge terverifikasi (layanan, fakta terlarang, kontak, internal link targets, CTA)
  - `existing_articles`: daftar judul/slug eksisting untuk internal linking valid & anti-duplikasi
  - Mengembalikan: `title`, `slug`, `excerpt`, `meta_title`, `meta_description`, `focus_keyphrase`, `secondary_keyphrases`, `content_html`, `faq_items`, `internal_links_used`, `claims_verification`, `generation_trace`, `model_used`, `warnings`.
- `POST /api/v1/1slabs/research-topics`: Menggali ide topik & gap berbasis pilar layanan, knowledge base, dan opsional query GSC.

Autentikasi: Header wajib `X-Integration-Key` yang dicocokkan constant-time terhadap `SLABS_INTEGRATION_KEY` (atau `STORE_INTEGRATION_KEY` jika disetel sama di lokal, tanpa pernah mengekspos DB URL).

### 5.2 Endpoint Backend 1sLabs (`/api/content-automation/*`)

Semua endpoint dilindungi `requireAuth` + `requireAdminOrMarketing` (kecuali endpoint trigger cron yang menerima token webhook/cron khusus atau auth admin):

- **Overview & Health:** `GET /overview`, `GET /engine/health`
- **Knowledge Base:** `GET /knowledge-base`, `PUT /knowledge-base/:key`, `POST /knowledge-base`, `POST /knowledge-base/sync-verified`
- **Content Strategy & Calendar:** `GET /strategy/pillars`, `PUT /strategy/pillars/:id`, `POST /strategy/discover-topics` (multi-pillar), `GET /strategy/gap-analysis`, `GET /strategy/calendar`, `POST /strategy/calendar/generate`, `POST /strategy/calendar/:id/queue`, `DELETE /strategy/calendar/:id`, `POST /strategy/check-duplicate`
- **Autonomous & Generation Queue:** `POST /run-autonomous` (one-click multi-pillar), `POST /generate/manual`, `POST /generate/batch`, `POST /queue/trigger`, `GET /jobs`, `GET /jobs/:id`, `POST /jobs/:id/cancel`, `POST /items/:itemId/retry`, `POST /items/:itemId/regenerate`
- **Review & Quality Gate:** `GET /review-queue`, `POST /items/:itemId/re-audit`, `POST /items/:itemId/optimize`, `POST /items/:itemId/approve`, `POST /items/:itemId/reject`, `PUT /items/:itemId`
- **Scheduler & Cron:** `GET /schedules`, `POST /schedules`, `PUT /schedules/:id`, `POST /schedules/:id/run-now`, `POST /cron/tick` (dilindungi `X-Cron-Secret` atau admin JWT), `GET /schedule-runs`
- **Settings:** `GET /settings`, `PUT /settings`
- **SEO Feedback & GSC Extensions (`/api/seo-intelligence/*`):**
  - `GET /gsc/properties` (ambil daftar verified properties dari Google API)
  - `POST /gsc/inspect-url` & `GET /gsc/inspections` (URL Inspection API resmi)
  - `POST /gsc/performance-suggestions` & `GET /gsc/suggestions` & `POST /gsc/suggestions/:id/apply` & `POST /gsc/suggestions/:id/dismiss`

---

## 6. Alur Workflow AI, SEO/GEO, & Quality Gate

1. **Knowledge Injection:** Sebelum prompt dibuat, sistem menyuntikkan fakta terverifikasi (`services`, `pricing`, `free_plan`, `portfolio`, `forbidden_claims`, `verified_links`) ke dalam payload engine. Fakta yang masih `[needs_verification]` dikunci agar AI menggunakan formulasi aman dan tidak mengarang angka/garansi palsu.
2. **Engine Generation (Python):** `services/slabs_pipeline.py` menjalankan:
   - Intent & angle mapping sesuai pilar layanan `1sLabs` (awareness / consideration / decision).
   - Opsional riset web relevan (tidak gagal apabila topik bersifat tutorial evergreen tanpa berita harian).
   - Anti-AI-Slop composition (`aislop.md` directives) dalam format HTML yang kompatibel penuh dengan kelas CSS `.oneslabs-blog-prose` dan block editor TipTap (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<table>`, `.callout-box`, CTA block internal valid).
   - Output FAQ terstruktur (`faq_items`) untuk schema `FAQPage` & optimasi GEO.
3. **Fallback & Reliability:** Jika layanan Python tidak aktif / gagal koneksi, Node adapter mengembalikan status jelas (tidak diam-diam menyelundupkan artikel dummy ke produksi). Untuk environment tanpa konektivitas eksternal, validasi deterministik dan mekanisme retry/antrean tetap berjalan terkendali dengan pencatatan error eksplisit.
4. **Unified Scoring:** Draft hasil engine langsung di-sanitize (`sanitizeArticleHtml`), dievaluasi dengan `seoAnalyzer.service.js` untuk memperoleh `seo_score`, `readability_score`, `geo_score`, `composite_score`, serta diuji kesamaan konten (Jaccard/cosine token similarity terhadap artikel terbit).
5. **Quality Gate (Hard + Weighted Rules):**
   - **Hard Validation:** Judul valid, panjang minimum terpenuhi, slug unik, tidak ada `<h1>` di dalam body, bebas placeholder (`lorem ipsum`, `TODO`, `[insert ...]`, `contoh harga RpXX`), bebas link rusak/invalid atau klaim terlarang (`200+ klien`, `500+ proyek`, `10+ tahun`, `aktivasi instan`), terdapat CTA & internal link valid, kemiripan dengan artikel eksisting di bawah batas ambang.
   - **Weighted Score Validation:** Memeriksa ambang minimal konfigurabel untuk `seo_score`, `readability_score`, `geo_score`, dan `composite_score`.
6. **Approval Mode & Publication:**
   - **`manual_approval` (Default):** Semua item lolos atau gagal masuk antrean Content Review. Publikasi hanya terjadi setelah klik Approve/Publish oleh admin/marketing.
   - **`auto_publish_qualified`:** Hanya item yang 100% lolos Hard Rules + ambang Quality Gate yang langsung dipublikasikan ke `blog_articles` (dengan `visibility='public'`, `status='published'`) dan memperbarui `/api/sitemap.xml`. Item yang tidak lolos tetap tertahan untuk direview.
   - **`always_save_draft`:** Artikel yang lolos audit tetap disimpan ke `blog_articles` sebagai `status='draft'` untuk penyuntingan akhir di TipTap Editor.
   - **Duplicate Prevention:** Saat menulis ke `blog_articles`, sistem mengecek ID tertaut, exact slug, judul dinormalisasi, atau focus keyphrase serupa untuk memilih operasi `UPDATE` (plus membuat `blog_article_revisions`) daripada menggandakan artikel.

---

## 7. Keamanan & Manajemen Environment

### Daftar Nama Environment Variable (Tanpa Nilai Rahasia)

- **Pada `article-generator/project/.env`:**
  - Koneksi & Model AI: `DATABASE_URL`, `GEMINI_API_KEY`, `GNEWS_API_KEY`, `NEWSAPI_KEY`
  - Integrasi: `GENERATOR_PUBLIC_URL`, `STORE_INTEGRATION_KEY`, `STORE_API_URL`, `STORE_FRONTEND_URL`, `SLABS_INTEGRATION_KEY` (opsional; fallback terkendali jika belum disetel untuk env lokal saja dengan dokumentasi jelas)
- **Pada `1sLabs-website/backend/.env`:**
  - Database & Server: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `PORT`, `NODE_ENV`, `BASE_URL`
  - Keamanan & Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
  - AI & Mail: `GEMINI_API`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_ADMIN_RECIPIENT`
  - Integrasi Engine & Cron Baru: `GENERATOR_API_URL` (default lokal `http://127.0.0.1:8000`), `GENERATOR_INTEGRATION_KEY`, `AUTOMATION_CRON_SECRET`

### Kontrol Keamanan

- Tidak ada kredensial database generator di `1sLabs`, maupun sebaliknya.
- Sanitasi HTML (`sanitizeArticleHtml`) dijalankan sebelum penyimpanan dan render untuk mencegah XSS.
- Endpoint manajemen dilindungi JWT + RBAC `requireAdminOrMarketing`.
- Endpoint trigger cron memakai perbandingan constant-time token `X-Cron-Secret` (atau sesi admin) dan concurrency lock untuk mencegah race condition / DoS berulang.
- Batasan kuota harian (`daily_generation_limit`) & batas batch maksimum (`max_batch_size`) menjaga pemakaian API Gemini tetap terkontrol.

---

## 8. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Engine Python lokal tidak berjalan / port sibuk | Job gagal diproses | Healthcheck realtime di UI (`GET /engine/health`), retry terkendali pada queue, status error informatif, tidak pernah mempublikasikan draft kosong. |
| AI mengarang harga / durasi Free Plan yang konflik | Ketidakpercayaan klien / komplain hukum | Inject Company Knowledge Base terverifikasi + Quality Gate Claim Guard + tanda `[needs_verification]` untuk data internal yang konflik. |
| Duplikasi / keyword cannibalization antar artikel | Penurunan ranking SERP | Pemeriksaan kesamaan judul, slug, keyphrase, dan kemiripan n-gram teks sebelum enqueue dan sebelum publish ke `blog_articles`. |
| Dua proses cron / manual mengeksekusi jadwal yang sama | Pemborosan kuota & duplikasi topik | Concurrency lock berbasis database (`content_automation_schedules.locked_at` + job status check) + timezone eksplisit `Asia/Jakarta`. |
| Limit konektivitas CloudLinux (`OPENBLAS_NUM_THREADS`, Passenger idle) | Proses Python terhenti di tengah generasi | Konfigurasi `OPENBLAS_NUM_THREADS=1`, worker terpisah dengan lease timeout & recovery job yang menggantung. |
| Overwrite artikel terbit dengan traffic bagus oleh AI | Trafik organik anjlok | Optimization feedback loop berbasis GSC selalu membuat saran `pending_approval` dan menyimpan snapshot `blog_article_revisions` sebelum perubahan. |

---

## 9. Rencana Implementasi Bertahap

1. **Fase 1 (Audit, Knowledge Base, Strategi & Arsitektur):** Menyelesaikan dokumen arsitektur, strategi 7 pilar konten, dan modul `companyKnowledgeBase.js` terverifikasi.
2. **Fase 2 (Adaptasi Python Engine):** Menambahkan `services/slabs_pipeline.py` dan `api/slabs_routes.py` di `article-generator` beserta perbaikan lock lintas-platform (Windows/Linux) sambil menjaga jalur Inpartner tetap utuh.
3. **Fase 3 (Schema & Knowledge/Strategy Backend):** Memperluas skema `u1zh8984_oneslabs` (`content_*`, `article_index_inspections`), API Knowledge Base editable, Content Strategy discovery, dan deteksi duplikasi.
4. **Fase 4 (Queue, Worker, Adapter & Quality Gate):** Implementasi antrean background manual/batch, adapter HTTP ke Python engine, evaluasi `seoAnalyzer.service.js`, validator Quality Gate, serta alur `Manual Approval` / `Auto Publish` / `Always Draft`.
5. **Fase 5 (Scheduler & Cron `Asia/Jakarta`):** Penjadwalan internal Node + CLI script/endpoint cron aman untuk cPanel/Windows Task Scheduler, anti-double-run lock, retry, dan riwayat eksekusi.
6. **Fase 6 (GSC URL Inspection & Feedback Loop):** Ekstensi `gsc.service.js` & `seoIntelligence.routes.js` dengan verified property picker, URL Inspection API, inspeksi status indeks, serta saran optimasi berbasis performa GSC.
7. **Fase 7 (Antarmuka Admin 1sLabs):** Modul **AI Content Automation** di Admin Dashboard (`AdminSidebar`, `AdminLayout`, `AdminHeader`) dengan 10 tab fungsional bertema dominan putih + aksen biru muda.
8. **Fase 8 (Pengujian Menyeluruh & Dokumentasi Final):** Uji unit, uji integrasi database/queue/quality gate/publikasi/GSC, uji typecheck/build frontend, start engine lokal + verifikasi end-to-end, serta penyusunan seluruh laporan dan panduan setup.

