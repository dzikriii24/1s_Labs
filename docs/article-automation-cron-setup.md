# Scheduler & Cron Setup Guide — 1sLabs AI Content Automation

Sistem otomatisasi jadwal 1sLabs menggunakan zona waktu **Asia/Jakarta (WIB / UTC+7)**, disertai kunci konkurensi database (*atomic DB lock*) untuk menjamin jadwal tidak pernah berjalan ganda dan tidak menghasilkan topik duplikat.

---

## 1. Dua Opsi Mekanisme Eksekusi

### Opsi A — Internal Node.js Scheduler (Default Saat Backend Aktif Terus)

Pada `backend/index.js`, `startInternalScheduler(60000)` berjalan otomatis setiap 60 detik ketika `ENABLE_INTERNAL_AUTOMATION_SCHEDULER` tidak bernilai `false`.

- Cocok untuk deployment VPS / PM2 / Phusion Passenger yang proses Node.js-nya hidup 24 jam.
- Setiap menit mengecek `content_automation_schedules WHERE is_active = 1` menggunakan evaluator cron 5-field zona waktu `Asia/Jakarta` (`cronMatchesJakartaNow`).
- Saat startup, `recoverStaleQueueItems()` memulihkan item yang terjebak pada status `researching`, `generating`, atau `auditing` ke `queued`.

### Opsi B — External OS Cron / Webhook (Direkomendasikan untuk Shared Hosting / CloudLinux)

Jika server menidurkan proses Node.js ketika tidak ada trafik (seperti beberapa konfigurasi shared hosting Passenger), gunakan salah satu mekanisme eksekusi eksternal berikut:

#### 1. Standalone CLI Runner

Script CLI: `backend/scripts/run_content_automation_cron.js`

Mode yang tersedia:

- **Evaluasi jadwal jatuh tempo (Cron rutin setiap 5 atau 15 menit):**
  ```bash
  cd /path/to/1sLabs-website/backend && /usr/bin/node scripts/run_content_automation_cron.js
  ```
- **Jalankan 1 jadwal spesifik langsung (`--force`):**
  ```bash
  node scripts/run_content_automation_cron.js --force=1
  ```
- **Proses item antrean tertunda saja (`--queue-only`):**
  ```bash
  node scripts/run_content_automation_cron.js --queue-only
  ```

Contoh entri `crontab` (berjalan setiap 15 menit; evaluator internal tetap memfilter jadwal berbasis ekspresi cron `Asia/Jakarta` masing-masing baris di tabel `content_automation_schedules`):

```cron
*/15 * * * * cd /home/user/1slabs-backend && /usr/bin/node scripts/run_content_automation_cron.js >> /home/user/logs/1slabs-content-cron.log 2>&1
```

#### 2. Authenticated Webhook Endpoint (`POST /api/content-automation/cron/tick`)

Cocok untuk layanan cron eksternal atau Task Scheduler jika Node.js berjalan sebagai API service:

- **Method:** `POST`
- **URL:** `https://1slabs.my.id/api/content-automation/cron/tick` (atau lokal `http://127.0.0.1:3000/api/content-automation/cron/tick`)
- **Header Wajib:** `X-Cron-Secret: <nilai AUTOMATION_CRON_SECRET>`

Jika menjalankan cron eksternal secara berkala dan ingin menonaktifkan loop interval internal, setel `ENABLE_INTERNAL_AUTOMATION_SCHEDULER=false` di `backend/.env`.

---

## 2. Format Cron & Zona Waktu (`Asia/Jakarta`)

Scheduler menggunakan format cron 5-field standar:

```text
<menit> <jam> <tanggal> <bulan> <hari_minggu>
```

Contoh preset bawaan:

- `0 8 * * *` -> Setiap hari pukul 08:00 WIB (Multi-pillar autonomous daily schedule)
- `0 8 * * 1,4` -> Senin & Kamis pukul 08:00 WIB
- `0 9 * * 2,5` -> Selasa & Jumat pukul 09:00 WIB
- `0 7 * * *` -> Setiap hari pukul 07:00 WIB
- `30 8 * * 1` -> Setiap Senin pukul 08:30 WIB

Seluruh jadwal mendukung pemilihan lebih dari satu Content Pillar (`pillar_codes_json`), memeriksa sisa kuota harian sebelum menjadwalkan topik, serta menyeimbangkan distribusi kandidat artikel across chosen pillars.

Seluruh pencocokan tanggal, jam, menit, dan hari menggunakan `Intl.DateTimeFormat(..., { timeZone: 'Asia/Jakarta' })`, sehingga **tidak terpengaruh timezone server OS** (meskipun VPS memakai UTC).

---

## 3. Proteksi Anti-Ganda & Error Recovery

1. **Atomic Database Lock:** Sebelum memproses jadwal, `executeSchedule()` menjalankan query atomik `UPDATE content_automation_schedules SET locked_at = NOW(), lock_token = ? WHERE id = ? AND (locked_at IS NULL OR TIMESTAMPDIFF(...) > timeout)`. Jika jadwal sedang dikunci proses lain, eksekusi dibatalkan aman dan dicatat di `content_schedule_runs` dengan status `skipped_locked`.
2. **Duplikasi Topik:** Sebelum merencanakan batch, `executeSchedule()` memfilter seluruh artikel yang sudah ada di `blog_articles` dan item antrean 30 hari terakhir melalui `checkDuplicateAndCannibalization`.
3. **Approval Mode Safe Default:** Seluruh jadwal bawaan diinisialisasi dengan `is_active = 0` (Dijeda) dan pengaturan global default `manual_approval`, sehingga admin selalu memegang kontrol penuh sebelum mengaktifkan auto-schedule maupun auto-publish.
4. **Riwayat Eksekusi & Pause/Resume:** Admin dapat menjeda, menjalankan langsung (*Run Now*), mengubah frekuensi cron, serta memantau log per eksekusi langsung dari menu **AI Content Automation → Automation Scheduler**.

