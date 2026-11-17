# Local Setup Guide — 1sLabs AI Content Automation & Article Generator Engine

Panduan ini menjelaskan cara menjalankan seluruh sistem AI Content Automation secara lokal tanpa bergantung pada server produksi `https://articlegenerator.1slabs.my.id/`.

---

## 1. Arsitektur Proses Lokal

Sistem berjalan sebagai 3 proses terpisah di mesin pengembang:

1. **MySQL Server Lokal (`127.0.0.1:3306`)** — Menyimpan database `u1zh8984_oneslabs` (`blog_*`, `content_*`, `users`, `article_index_inspections`, dan tabel bisnis 1sLabs).
2. **Article Generator Python Engine (`http://127.0.0.1:8000`)** — Menjalankan `C:\Users\dzikri\Downloads\Inpartner\article-generator\project\run_local_slabs_engine.py` dengan mode scheduler Inpartner dimatikan (`ENABLE_SCHEDULER=false`).
3. **1sLabs Backend + Vite Frontend (`http://127.0.0.1:3000` & `http://127.0.0.1:5173`)** — Menyediakan REST API `/api/*`, worker antrean, scheduler `Asia/Jakarta`, serta Admin UI.

> **Penting:** Jangan menyalin kredensial database generator Inpartner ke database 1sLabs, dan jangan mengaktifkan scheduler Inpartner saat menjalankan engine lokal untuk 1sLabs.

---

## 2. Daftar Environment Variables yang Dibutuhkan

### A. Python Generator (`C:\Users\dzikri\Downloads\Inpartner\article-generator\project\.env`)

Mengacu pada template `.env.example`:

- `GEMINI_API_KEY` — API Key Google Gemini untuk penulisan artikel & riset topik.
- `SLABS_INTEGRATION_KEY` — Shared secret header `X-Integration-Key` untuk endpoint `/api/v1/1slabs/*` (apabila dikosongkan, adapter membaca fallback `STORE_INTEGRATION_KEY`).
- `SLABS_ENGINE_HOST` — Default `127.0.0.1`.
- `SLABS_ENGINE_PORT` — Default `8000`.
- `ENABLE_SCHEDULER` — Wajib `false` ketika dijalankan via `run_local_slabs_engine.py` agar cron Inpartner tidak ikut berjalan.
- `GNEWS_API_KEY` / `NEWSAPI_KEY` — Opsional untuk riset berita web.

### B. 1sLabs Backend (`C:\Users\dzikri\Downloads\1sLabs-website\backend\.env`)

Mengacu pada template `backend/.env.example`:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` — Koneksi MySQL lokal (`127.0.0.1`, port `3306`, database `u1zh8984_oneslabs`).
- `JWT_SECRET`, `JWT_EXPIRES_IN` — Secret sesi otentikasi admin & marketing.
- `GEMINI_API` — API Key Gemini pada sisi Node.js (untuk 1-Click AI Optimize & fallback riset ide).
- `GENERATOR_API_URL` — Alamat adapter generator lokal, default `http://127.0.0.1:8000`.
- `GENERATOR_INTEGRATION_KEY` — Nilainya **harus sama persis** dengan `SLABS_INTEGRATION_KEY` (atau `STORE_INTEGRATION_KEY`) di engine Python.
- `AUTOMATION_CRON_SECRET` — Secret untuk memicu webhook `POST /api/content-automation/cron/tick`.
- `ENABLE_INTERNAL_AUTOMATION_SCHEDULER` — Set `true` (default) agar scheduler Node.js internal berjalan, atau `false` jika sepenuhnya memakai cron OS eksternal.
- `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `OPENVERSE_ACCESS_TOKEN` — Opsional kunci API provider gambar stok berlisensi (tersimpan strictly di `.env` backend, tidak pernah dikirim ke frontend). Secara default tanpa kunci berbayar, **Openverse** dan **Wikimedia Commons** tetap berjalan aktif sebagai provider gambar legal tanpa key.

### C. Variabel Visual Engine (`article-generator/project/.env`)

- `IMAGE_GEMINI_MODEL` — Default `gemini-2.5-flash-image`, digunakan khusus sebagai *fallback* pembangkitan ilustrasi AI hanya apabila pencarian stok relevan tidak menghasilkan kandidat yang layak.

---

## 3. Langkah Menjalankan Secara Lokal (Windows PowerShell)

### Langkah 1: Bootstrap Database Lokal

Pastikan layanan MySQL lokal (`127.0.0.1:3306`) menyala, lalu jalankan skrip bootstrap di folder `backend`:

```powershell
cd C:\Users\dzikri\Downloads\1sLabs-website\backend
node scripts/bootstrap_local_dev_db.js
```

Skrip ini secara idempoten menyiapkan tabel `users`, skema `blog_*` (`ensureBlogSchema`), dan seluruh tabel AI Content Automation beserta seed 14 kategori Knowledge Base, 11 Content Pillars strategis, kalender konten AI, dan pengaturan awal (`manual_approval`).

### Langkah 2: Jalankan Python Article Generator Engine Lokal

Buka terminal baru dan aktifkan Python virtualenv di source project generator:

```powershell
cd C:\Users\dzikri\Downloads\Inpartner\article-generator\project
.\venv\Scripts\python.exe run_local_slabs_engine.py
```

Skrip `run_local_slabs_engine.py` otomatis menyetel `ENABLE_SCHEDULER=false` dan `OPENBLAS_NUM_THREADS=1`, lalu menjalankan FastAPI/Uvicorn pada `http://127.0.0.1:8000`.

Verifikasi cepat kesehatan adapter (sesuaikan nilai `<KEY>` dengan key lokal Anda):

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/1slabs/health" -Headers @{ "X-Integration-Key" = "<KEY>" }
```

### Langkah 3: Jalankan Backend 1sLabs & Frontend React

Buka dua terminal terpisah di `C:\Users\dzikri\Downloads\1sLabs-website`:

**Terminal Backend:**

```powershell
cd C:\Users\dzikri\Downloads\1sLabs-website\backend
npm run dev
```

**Terminal Frontend:**

```powershell
cd C:\Users\dzikri\Downloads\1sLabs-website
npm run dev
```

Buka dashboard admin pada browser melalui URL dev server (mis. `http://localhost:5173/admin?tab=ai-automation`), lalu periksa kartu **Local Python Engine Adapter** di tab **Overview** atau klik **Uji Koneksi Engine** di **Automation Settings**.

---

## 4. Menjalankan Automated Test Suite Lokal

### Python Adapter Unit Tests

```powershell
cd C:\Users\dzikri\Downloads\Inpartner\article-generator\project
.\venv\Scripts\python.exe tests\test_slabs_adapter.py -v
```

### 1sLabs End-to-End Integration Suite

```powershell
cd C:\Users\dzikri\Downloads\1sLabs-website\backend
node scripts/test_content_automation_e2e.js
```

### Frontend Production Build Verification

```powershell
cd C:\Users\dzikri\Downloads\1sLabs-website
npm run build
```

