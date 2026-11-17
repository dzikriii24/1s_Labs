# Asset Manifest: "Dari ZIP ke Live"

## 1. Static Visual Assets (`remotion/public/img/`)
- `grain.png`: 512x512 tileable 35mm film grain overlay (opacity set to 0.04 - 0.06).
- `logo-ink.png`: 600x600 high-res black Didone wordmark with transparent alpha channel.
- `logo-paper.png`: 600x600 inverted white Didone wordmark for high-contrast dark sections.

## 2. Captured UI Snapshots (`remotion/public/shots/`)
- **Checkout & Order Flow:**
  - `pay_form.png`, `pc_form_before.png`, `pc_form_after.png`, `pc_form_filled.png`
  - `pay_qr.png`, `pc_qr.png` (anonymized payment sample code)
  - `pay_proof.png` (sample receipt graphic, non-confidential)
  - `pay_status_before.png` ("Menunggu Pembayaran / Verifikasi")
  - `pay_status_after.png` ("Lunas / Terverifikasi")
  - `pc_summary_before.png`, `pc_summary_after.png`
- **Application Node.js Management:**
  - `h3_card_stopped.png`, `h3_card_running.png`, `h3_stats_stopped.png`, `h3_stats_running.png`
  - `node_stopped.png`, `node_running.png`
  - `el_card_stopped.png`, `el_card_running.png`
  - `el_create_00.png` through `el_create_13.png` (app creation dialog frames)
  - `el_logs.png` (active console streaming logs)
- **File Management & Editor:**
  - `detail_files_drag.png` (drag-and-drop target zone overlay)
  - `el_deploy_empty.png`, `el_deploy_file.png`
  - `el_files.png`, `el_editor.png` (in-browser code editing window)
- **Service Tabs:**
  - `el_tab_overview.png`, `el_tab_files.png`, `el_tab_ftp.png`, `el_tab_db.png`, `el_tab_analytics.png`
  - `detail_overview.png`, `el_menu.png`

## 3. Audio Assets (`remotion/public/audio/`)
- **Narration Voice Tracks:**
  - `vo_l1.mp3` through `vo_l8.mp3` (Edge TTS `id-ID-ArdiNeural`)
- **Music Bed:**
  - `ambient_bgm.mp3` (subtle pulse, ducked to -18dB relative to dialog)
- **Foley & Sound Effects:**
  - `swell_a.wav` (intro sub swell)
  - `tick.wav`, `tick_soft.wav` (UI tactile feedback)
  - `thock.wav` (status toggle button impact)
  - `chime_ok.wav` (success indicator)
  - `key.wav` (keyboard stroke ticks)
  - `err_low.wav` (connection drop warning)
  - `riser.wav` (tension builder into brand transition)
  - `wipe_a.wav`, `wipe_b.wav`, `wipe_c.wav` (paper whooshes)
  - `impact.wav`, `shimmer.wav` (brand logo resolve)
  - `tab_0.wav` to `tab_4.wav` (musical pentatonic tab clicks)
  - `pop.wav`, `slide.wav`, `slide_b.wav`, `whoosh_out.wav`

