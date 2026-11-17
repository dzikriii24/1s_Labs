# Google Search Console Setup & URL Inspection Guide — 1sLabs

Dokumen ini menjelaskan konfigurasi Google Cloud OAuth 2.0 untuk Google Search Console (GSC), pemilihan properti terverifikasi, pemantauan performa pencarian, penggunaan **URL Inspection API**, serta alur saran optimasi artikel berbasis data riil GSC.

---

## 1. Prasyarat Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/) menggunakan akun Google pemilik/pengelola properti `1slabs.my.id` di Search Console.
2. Buat atau pilih Project Google Cloud.
3. Aktifkan API berikut pada **APIs & Services → Library**:
   - **Google Search Console API** (mencakup Webmasters v3 `sites`, `searchanalytics/query`, dan `urlInspection/index:inspect`).
4. Konfigurasikan **OAuth Consent Screen**:
   - Pilih **External** (atau Internal jika Workspace) dan tambahkan email akun Anda ke daftar **Test Users** apabila status aplikasi masih Testing.
   - Pastikan scope berikut diizinkan:
     - `https://www.googleapis.com/auth/webmasters.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
5. Buat **Credentials → Create Credentials → OAuth client ID → Web application**:
   - Tambahkan **Authorized redirect URIs** sesuai lingkungan deployment:
     - Produksi: `https://1slabs.my.id/api/seo-intelligence/gsc/callback`
     - Lokal (dev): `http://localhost:3000/api/seo-intelligence/gsc/callback` (atau sesuaikan origin `PUBLIC_SITE_URL`)
6. Catat **Client ID** dan **Client Secret** (jangan pernah menyimpannya di repositori Git).

---

## 2. Menghubungkan Akun di Admin Dashboard 1sLabs

1. Masuk ke Admin Dashboard 1sLabs (`/admin`).
2. Buka menu **CONTENT & SEO INTELLIGENCE → SEO & GEO Analytics**, klik **Konfigurasi GSC**.
3. Masukkan:
   - **Site / Property URL:** `https://1slabs.my.id/` atau domain property `sc-domain:1slabs.my.id`
   - **Client ID** dan **Client Secret** dari Google Cloud Console
4. Klik **Simpan & Hubungkan OAuth** untuk menyelesaikan otorisasi Google OAuth 2.0.

---

## 3. Memilih Properti Terverifikasi & Sinkronisasi Data

Setelah OAuth terhubung, buka menu **AI Content Automation → SEO Performance**:

- Sistem otomatis memanggil `GET https://www.googleapis.com/webmasters/v3/sites` (`GET /api/seo-intelligence/gsc/sites`) untuk menampilkan seluruh properti terverifikasi yang dapat diakses akun Google tersebut.
- Klik **Sync GSC Data** (`POST /api/seo-intelligence/gsc/sync`) untuk menarik metrik klik, impresi, CTR, dan posisi 28 hari terakhir (serta perbandingan periode sebelumnya) ke tabel `blog_gsc_performance`.

---

## 4. Menggunakan Resmi URL Inspection API

Pada panel **Google Search Console URL Inspection API** di tab **SEO Performance**:

1. Klik tombol **Inspect** langsung dari daftar artikel terbit pada **Published Articles** atau tabel performa gabungan, atau tempel URL artikel penuh (mis. `https://1slabs.my.id/blog/panduan-hosting-gratis`).
2. Backend memanggil endpoint resmi Google:
   `POST https://searchconsole.googleapis.com/urlInspection/index:inspect`
3. Data yang tersimpan ke tabel riwayat `article_index_inspections`:
   - `verdict` (`PASS`, `FAIL`, `NEUTRAL`)
   - `coverage_state` (mis. *Submitted and indexed*, *Discovered - currently not indexed*)
   - `indexing_state`, `robots_txt_state`, `page_fetch_state`
   - `google_canonical` vs `user_canonical`
   - `last_crawl_time`, `crawled_as`
   - `inspection_result_link` (tautan langsung ke Search Console UI)

> **Catatan API Resmi Google (Tanpa Fitur Palsu):**  
> Google Search Console API **tidak menyediakan endpoint resmi untuk "Request Indexing" URL artikel blog biasa** (`Indexing API` resmi hanya untuk `JobPosting` dan `BroadcastEvent`). Oleh karena itu, sistem ini secara transparan hanya menjalankan pemeriksaan resmi (*URL Inspection*) dan menyediakan tautan langsung `inspection_result_link` apabila admin ingin mengklik *Request Indexing* secara manual di antarmuka resmi Google Search Console.

---

## 5. Performance Feedback Loop & Persetujuan Optimasi

Sistem menggabungkan metrik GSC (klik, impresi, CTR, posisi) dengan skor internal artikel (`seo_score`, `readability_score`, `geo_score`):

1. Klik **Buat Saran Optimasi AI** (`POST /api/seo-intelligence/suggestions/generate`) untuk memindai artikel dengan impresi tinggi tetapi CTR rendah (< 3%), posisi 5–25, atau skor SEO/GEO di bawah standar.
2. Backend membuat draf usulan pembaruan judul, `meta_title`, `meta_description`, `excerpt`, FAQ, dan konten yang disimpan di tabel `content_optimization_suggestions` dengan status `pending_approval`.
3. **Artikel terbit tidak pernah ditimpa otomatis.** Admin meninjau perbandingan *before/after* pada panel saran optimasi lalu mengklik **Setujui & Terapkan Revisi**.
4. Ketika disetujui (`POST /api/seo-intelligence/suggestions/:id/apply`), versi artikel sebelumnya **otomatis di-snapshot ke `blog_article_revisions`** sebelum pembaruan diterapkan dan di-audit ulang.

