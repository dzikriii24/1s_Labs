# Voiceover Documentation: "Dari ZIP ke Live"

## 1. Engine & Configuration
- **Synthesis Engine:** Microsoft Edge TTS (`edge-tts`)
- **Voice Profile:** `id-ID-ArdiNeural` (Indonesian Male, natural professional timbre)
- **Speaking Rate:** `-4%` (slightly measured, calm, deliberate technical pace)
- **Pitch:** Default (`+0Hz`)
- **Audio Output:** MP3 (24kHz, 48kbps, mono dialogue)

## 2. Voice Lines Inventory

| Clip ID | Target Scene | Spoken Indonesian Script | File Path | Duration (s) | Word Count |
|---|---|---|---|---|---|
| `l1` | Scene 1: Hook | "Kodenya sudah jadi." | `assets/audio/vo/vo_l1.mp3` | 1.47s | 3 |
| `l2` | Scene 2: Gap | "Di laptop, semuanya jalan. Di internet, belum." | `assets/audio/vo/vo_l2.mp3` | 4.74s | 7 |
| `l3` | Scene 3: Brand | "Hosting dari 1sLabs." | `assets/audio/vo/vo_l3.mp3` | 1.69s | 3 |
| `l4` | Scene 4: Pay | "Pilih paket, bayar lewat QRIS, kirim bukti. Tim kami yang memverifikasi." | `assets/audio/vo/vo_l4.mp3` | 5.84s | 10 |
| `l5` | Scene 5: Portal | "Setelah aktif, buat aplikasi Node.js dari panel. Pilih versi, jalankan, lihat lognya." | `assets/audio/vo/vo_l5.mp3` | 7.68s | 12 |
| `l6` | Scene 6: Files | "Unggah ZIP-nya. Edit file langsung di browser." | `assets/audio/vo/vo_l6.mp3` | 3.86s | 6 |
| `l7` | Scene 7: Tabs | "File, FTP, database, analitik. Satu panel." | `assets/audio/vo/vo_l7.mp3` | 5.78s | 6 |
| `l8` | Scene 8: CTA | "Mulai di 1slabs.my.id/hosting." | `assets/audio/vo/vo_l8.mp3` | 2.50s | 4 |

## 3. Word-Level Alignment Data
Every word timestamp was extracted and saved to `voData.json`, enabling frame-accurate visual synchronization with text animations and UI cursor events.

