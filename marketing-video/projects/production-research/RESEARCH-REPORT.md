# 1sLabs Phase 1 Research Report

Phase: research and pre-production. **Nothing was rendered, deployed, modified or purchased.**
Studio root: `marketing-video/` (it already existed inside the source repo and held the skill and setup notes).
Companion files: `brand/brand-context.md`, `brand/services-catalog.md`, `brand/product-catalog.md`, `brand/visual-identity.md`,
`brand/brand-guidelines.md`, `brand/video-marketing-strategy.md`, `source-projects/README.md`.

Evidence tags: **[V]** verified in code, **[P]** partial, **[X]** claimed but not found, **[I]** interpretation, **[U]** unverified.

---

## 1. How the research was done

| Step | Detail |
|---|---|
| Entry points | `source-projects/README.md` did not exist. Used `marketing-video/setup-project.md`, which lists three paths that all resolve to the same monorepo |
| Read directly | `README.md`, `public/llms.txt`, `index.html`, `tailwind.config.js`, `src/index.css`, `src/App.tsx`, home sections (Hero, Stats, About, Services, Portfolio, ExperiencePartners), `AdminSidebar.tsx`, `ServerMonitoringView.tsx`, `docs/ADMIN_DASHBOARD_AUDIT.md`, logo images |
| Parallel code audits | Two read-only sub-agents: (a) marketing and HR modules, (b) hosting platform, portal, backend and README claims |
| Not done | App was not run. No database or server was queried. `backend/.env` and `backend/uploads/` (likely payment proofs) were intentionally not opened. No competitor research. No network research on references |
| Screenshots in repo | **None.** Only logos and favicons. Portfolio images are stock photos |

## 2. Discovered projects

There is one monorepo with these sub-projects (details and evidence in `brand/product-catalog.md`):

| ID | Sub-project | State |
|---|---|---|
| P1 | Public marketing website | Live design, some weak claims |
| P2 | Customer hosting platform (checkout, QRIS, portal) | Implemented, manual payment approval |
| P3 | Node.js, Laravel, Python app managers | Node.js and Laravel solid. Python has a security gap |
| P4 | Free Plan Developer Program | Implemented, terms contradict across files |
| P5 | Admin Operations Dashboard (about 35 views) | Mostly implemented, two views doubtful |
| P6 | Adaptive Resource Management (CloudLinux LVE) | Core implemented, README overstates levels 4 and 5 |
| P7 | Lead Acquisition (B2B) | Internal. Several features are stubs or fixed lists |
| P8 | HR and Recruitment | Internal. Implemented, no AI |
| P9 | Meetings, inquiries, docs center, analytics tracker | Implemented |
| P10 | Portfolio (15 projects) | Metadata only, source not in repo |
| P11 | `demo/` older template | Not a product |

## 3. Verified capabilities (condensed)

**Safe to show and say**

- Create, start, stop, restart a Node.js app from the portal. View logs, edit environment variables, run `npm install`, deploy by ZIP, choose a Node version.
- Laravel: ZIP deploy, artisan console, Composer install, env editor.
- File manager with drag-and-drop upload queue, in-browser code editing, archive extraction.
- MySQL manager: tables, SQL console, import, export, manual and daily backups.
- FTP accounts. Per-site visitor analytics. Five service sub-tabs: Overview, Analytics, File Manager, FTP, Database.
- Checkout with PPN 11%, QRIS payment with proof upload, admin verification with audit trail, invoice with LUNAS watermark.
- Five-level resource protection with dry-run, manual override, protected core processes, graceful SIGTERM pruning, log and temp cleanup.
- Free Plan for learners (no duration), free consultation, public booking page.

**Must not be shown or said** (full table in `brand/brand-guidelines.md` section 4.3)

200+/500+/10+/25+ stats, 99.9% uptime, 1 Gbps, Anti-DDoS, "real-time" portal gauges, instant activation, per-customer isolation, phpMyAdmin SSO,
domain registration, "verified emails", live Google or KADIN scraping, drag-and-drop Kanban, AI recruiting, any testimonial.

## 4. Visual identity summary

- Logo: stacked didone-serif "1S / LABS" wordmark in black. A separate flat teal geometric mark exists. They do not match the UI blue. [V]
- UI: monochrome ink and zinc, one accent `#007AFF`, Inter, very rounded cards, pill buttons, calm ease-out motion, WebGL wave hero with grain. [V]
- "Mori" is referenced for headings but never loaded. Bodoni Moda and others are loaded but unused. [V]
- Recommended video look: **ink on paper**, Bodoni Moda for statements (to confirm), Inter for UI, one blue accent, grain and vignette, slow camera. See `brand/visual-identity.md`.

## 5. Ranking and the three strongest candidates

Weighted scoring is in `brand/video-marketing-strategy.md` section 2. Top of the table:

| Rank | Candidate | Score |
|---|---|---|
| 1 | Hosting platform: Node.js and Laravel panel, QRIS checkout | 4.05 |
| 2 | "Pay Once" services brand film | 3.90 |
| 3 | Adaptive Resource Management | 3.85 |
| 4 | Free Plan for learners | 3.45 |
| 5 | Lead Acquisition | 3.20 |

Recommendation: campaigns in the order **1, 2, 3**. The first is the best mix of real product, revenue relevance and capturable screens.

## 6. The first video: three creative concepts

**Subject:** the 1sLabs hosting platform, story "Dari ZIP ke Live".
**Shared audience:** Indonesian developers, students and freelancers who have a finished Node.js or Laravel app and need somewhere to run it.
**Shared objective:** drive visits and registrations at `1slabs.my.id/hosting` and position 1sLabs as an engineer-built host for modern runtimes.
**Shared fact base (all from the allowed list):** panel-based Node.js deploy, ZIP upload, file manager, database, FTP, analytics, QRIS payment with manual verification.
**Not used:** prices, Free Plan duration, SSL as a feature, Python, uptime, partner logos.
**Voice-over:** Indonesian, no em dashes, no exclamation marks. All on-screen UI is real capture (mocked data) unless marked *illustrative*.

---

### Concept A: Cinematic Premium Product Showcase

| | |
|---|---|
| Main message | "Deploy aplikasi Node.js langsung dari browser." |
| Duration | 45 s, 30 fps, 1920 by 1080 (a 9:16 reframe is a later cut) |
| Hook (0 to 3 s) | Black frame. A macro push-in on a Node.js app row. The status badge flips to the running state with a soft low click. Bodoni line mask-reveals: "Kodenya sudah jadi." Something moves in frame 1. Badge label to be copied from the real UI in Phase 2 |
| Look | Ink on paper. Real UI large on a light neutral stage, 2.5D camera, hairline serif text, grain and vignette. One blue cursor |
| Pace | Slow. Holds of about 1 s after each key fact |

**Storyboard**

| # | Time (frames) | Visual | On-screen text | Animation and camera | Voice-over | Sound |
|---|---|---|---|---|---|---|
| 1 | 0:00 to 0:03.5 (0 to 105) | Black. Macro of the Node.js apps list, status badge flips to running | "Kodenya sudah jadi." | Push-in 1.00 to 1.06, badge spring, text mask-reveal per line | "Kodenya sudah jadi." | Low sub swell, one soft click on the flip |
| 2 | 0:03.5 to 0:09 (105 to 270) | *Illustrative.* A plain terminal shows `npm run dev` and `localhost:3000`, then the cursor leaves the window to an empty browser tab | "Jalan di laptop." then "Belum jalan di internet." | Typewriter on frame count, second line slides up and the first dims to 40% | "Di laptop, semuanya jalan. Di internet, belum." | Keyboard ticks (soft), room tone drops out on the second line |
| 3 | 0:09 to 0:13 (270 to 390) | Paper wipe reveals the 1sLabs wordmark. Hairlines draw in, then fill | "Hosting dari 1sLabs." | Ink-edge wipe, wordmark scales 0.96 to 1.0, hold 1.5 s | "Hosting dari 1sLabs." | Short riser, silence for 0.4 s, then a single warm tone on the lock-up |
| 4 | 0:13 to 0:20 (390 to 600) | Plan cards (price cropped out), checkout, QRIS page with a generic sample code, proof upload, status "menunggu verifikasi" | "Bayar lewat QRIS." "Kirim bukti." "Kami verifikasi." | Cards deal in with 4 f stagger, camera drifts left to right, number steps appear one at a time | "Pilih paket, bayar lewat QRIS, kirim bukti. Tim kami yang memverifikasi." | Tactile ticks per step, soft success tone on the upload |
| 5 | 0:20 to 0:30 (600 to 900) | Portal, Node.js APIs, create-app dialog (version, startup file), app row, start, logs streaming | "Buat aplikasi." "Pilih versi." "Jalankan." | Cursor eased path with a click ripple in the accent, camera follows cursor, depth blur on side panels | "Setelah aktif, buat aplikasi Node.js dari panel. Pilih versi, jalankan, lihat lognya." | Distinct click per control, a low confirm on the start, light pulse enters at 0:24 |
| 6 | 0:30 to 0:36 (900 to 1080) | File manager, drag overlay appears, upload queue fills, a code editor modal opens | "Unggah ZIP." "Edit di browser." | Overlay fades in, progress bars animate to the frame, modal scales from 0.96 | "Unggah ZIP-nya. Edit file langsung di browser." | Upload tick pattern, keyboard tap in the editor |
| 7 | 0:36 to 0:41 (1080 to 1230) | The five tabs light up in turn: Overview, Analytics, File Manager, FTP, Database | "Satu panel. Lima tab." | Tab underline travels, matching screen crossfades with a 6 f overlap | "File, FTP, database, analitik. Satu panel." | Five tonal ticks that step up in pitch |
| 8 | 0:41 to 0:45 (1230 to 1350) | Wordmark on paper, URL below, WhatsApp number small | "1slabs.my.id/hosting" "Konsultasi IT gratis" | Slow pull-back, URL mask-reveal, hold 2 s | "Mulai di 1slabs.my.id/hosting." | Music resolves, tail of the pad |

Sound direction: sparse analog pulse near 90 BPM, no drums until scene 5, ducked 8 to 10 dB under voice. Hit points land on the status flip, the logo and the CTA. The paper-wipe whoosh is used for at most three transitions.
References (vocabulary, not yet viewed in Phase 1): restrained product films from developer-tool brands. To be collected into `brand/references/` and mapped to video-shotcraft shot cards in Phase 2.
CTA: "Mulai di 1slabs.my.id/hosting".

---

### Concept B: Modern SaaS Product Advertisement

| | |
|---|---|
| Main message | "Satu panel untuk Node.js dan Laravel kamu." |
| Duration | 30 s, 30 fps, 1080 by 1920 (16:9 reframe later) |
| Hook (0 to 3 s) | Two UI cards (Node.js tab and QRIS payment) snap onto a light stage with a quick stagger. Bold caption "Deploy dari browser. Bayar pakai QRIS." |
| Look | Light paper stage, white rounded cards with soft shadows, floating UI in slight perspective, bold Inter captions, blue cursor |
| Pace | Fast. A new visual about every 2 s. Beat-synced |

| # | Time | Visual | On-screen text | Voice-over | Sound |
|---|---|---|---|---|---|
| 1 | 0:00 to 0:03 | Card deal-in: Node.js tab, QRIS page | "Deploy dari browser. Bayar pakai QRIS." | "Deploy dari browser. Bayar pakai QRIS." | Snap, short bass tick |
| 2 | 0:03 to 0:07 | Payment page zoomed, proof upload, check | "Kirim bukti. Kami verifikasi." | "Kirim bukti, kami verifikasi." | Tactile tick, success tone |
| 3 | 0:07 to 0:13 | Create Node.js app, start, logs | "Node.js. Pilih versi, jalankan." | "Buat aplikasi Node.js, pilih versi, jalankan." | Clicks, confirm |
| 4 | 0:13 to 0:18 | Laravel: artisan console runs `cache:clear`, Composer install | "Laravel juga bisa." | "Laravel juga bisa, lengkap dengan artisan." | Keyboard, tick |
| 5 | 0:18 to 0:23 | File manager upload queue, code editor | "Unggah ZIP. Edit di browser." | "Unggah ZIP, edit file di browser." | Upload ticks |
| 6 | 0:23 to 0:27 | SQL console, backups list | "Database dan backup." | "Database dan backup ada di panel yang sama." | Light pulse |
| 7 | 0:27 to 0:30 | Wordmark and URL | "1slabs.my.id/hosting" | "Mulai di 1slabs.my.id/hosting." | Resolve |

Animation: spring entrances with opacity, translate and scale together, 3 to 5 frame stagger, exits shorter than entrances, parallax between card layers, cursor click ripples.
Sound: tighter, around 112 BPM with a soft kick, UI hits sync to beats.
Risk: closest to a generic SaaS template. Needs strong typography and real UI to avoid that look.
CTA: "Mulai di 1slabs.my.id/hosting".

---

### Concept C: High-Energy Kinetic Typography

| | |
|---|---|
| Main message | "Dari kode jadi ke live." |
| Duration | 20 s, 30 fps, 1080 by 1920 |
| Hook (0 to 3 s) | Giant Bodoni "KODE JADI." slams in letter by letter, then "BELUM LIVE." cuts over it with a hard beat |
| Look | Black and paper-white blocks, oversized Bodoni and Inter Black, one blue word per phase, one-second real UI inserts as proof |
| Pace | 120 BPM, 40 beats, cuts on beats, at most three camera-level impacts in total |

| # | Time | Visual | On-screen text | Voice-over | Sound |
|---|---|---|---|---|---|
| 1 | 0:00 to 0:03 | Letter slam, hard cut | "KODE JADI." "BELUM LIVE." | "Kode jadi. Belum live." | Kick on slam, snare on cut |
| 2 | 0:03 to 0:06 | Word stack fills the frame | "UNGGAH ZIP." | "Unggah ZIP." | Hat pattern |
| 3 | 0:06 to 0:09 | Insert: file manager upload queue, 1 s | "JALANKAN." | "Jalankan." | Tick |
| 4 | 0:09 to 0:12 | Insert: logs scrolling | "LIHAT LOG." | "Lihat lognya." | Tick |
| 5 | 0:12 to 0:15 | Insert: QRIS page | "BAYAR QRIS." | "Bayar pakai QRIS." | Impact 2 |
| 6 | 0:15 to 0:17.5 | Words collapse to one line | "NODE.JS. LARAVEL." | (silence) | Riser |
| 7 | 0:17.5 to 0:20 | Wordmark and URL | "1slabs.my.id/hosting" | "Mulai di 1slabs.my.id/hosting." | Impact 3, resolve |

Best use: a short teaser or a loop. Weakest at explaining the full flow, and Python or other runtimes are deliberately left out.
CTA: "Mulai di 1slabs.my.id/hosting".

---

### Comparison

| | A Cinematic | B SaaS ad | C Kinetic type |
|---|---|---|---|
| Fit to brand (ink, didone, calm) | Highest | Medium | Medium |
| Shows the real workflow | Best | Good | Weak |
| Risk of looking generic | Lowest | Highest | Medium |
| Reuse for other cuts | Master for all | Paid-ad cut | Teaser |
| Build effort (my estimate) | Highest | Medium | Lowest |

## 7. Recommended first video

**Concept A, "Dari ZIP ke Live", 45 s master in 16:9.**

Why:

1. It matches the real brand character: calm, monochrome, serif-led. Concepts B and C pull towards a generic ad look.
2. It tells the full verified journey (pay, create app, deploy, manage) with real UI, which is the product's actual strength.
3. One capture session feeds everything else: a 9:16 cut-down of 20 to 25 s, the B-style paid cut and C-style teasers can all reuse the same textures.
4. Its claims are all on the allowed list. No price, no duration, no SSL, no uptime.

Follow-ups: 9:16 cut-down of A, then the Pay Once film, then the resource-protection video.

## 8. Required assets

| Group | Asset | Status |
|---|---|---|
| Logo | Wordmark, knocked-out white version, mark | Black PNG copied to `shared-assets/logos/`. Knock-out and vector copy to make in Phase 2 |
| Captures | Plan cards (price cropped), checkout, QRIS page with generic sample, portal overview, Node.js apps list, create-app dialog, logs, file manager with drag overlay, upload queue, code modal, five sub-tabs, DB console | To capture from the mocked local build |
| Recordings | Status flip, drag-and-drop upload, cursor paths | To record at 60 fps and retime |
| Illustrative | Terminal with `localhost:3000` (scene 2) | Build in Remotion, marked as illustrative |
| Fonts | Bodoni Moda, Inter, a monospace | OFL fonts via Google Fonts, to download into `shared-assets/fonts/` |
| Voice-over | Indonesian narration | Not generated. Provider is a decision (below) |
| Music | One bed, about 90 BPM | Not sourced. Needs a licence record |
| SFX | Clicks, ticks, success tone, whoosh, riser, impacts | Not sourced. Candidate source: Freesound CC0 |
| Fictional data | "Kopi Senja" demo identity and sample QR | To create and approve |
| Fixtures | JSON mock responses per API route | To write from `src/services/api.ts` types |

## 9. Production plan

Follows the 1sLabs approval gates. Each phase ends with a stop.

| Phase | Work | Output | Gate |
|---|---|---|---|
| 1 (done) | Research and knowledge base | This report and `brand/*` | **Your approval of the concept** |
| 2 | Brief, script, storyboard v2 in the project folder `projects/dari-zip-ke-live/`. Logo knock-out. Fonts. Capture plan finalised | `brief.md`, `script.md`, `storyboard.md`, asset manifest | Approve script and storyboard |
| 3 | Mocked capture: Vite dev server read-only plus Playwright with fixture JSON. 2x textures, element crops, `layout.json`, short recordings | `assets/screenshots/`, `assets/footage/` | Approve captured frames and anonymisation |
| 4 | Voice-over (Indonesian), check each take against the script, music and SFX sourcing with licence log | `voiceover.md`, `audio-credits.md`, audio files | Approve voice and music |
| 5 | Remotion project: one `theme.ts`, reusable components (PageCam, Cursor, WordReveal, Wipe, Grain), scenes, audio pinned to voice timestamps | `remotion/` | Preview render |
| 6 | Preview render, frame inspection at every transition, fix, re-render | `previews/`, `qa/` | Approve preview |
| 7 | Final render, loudness to -14 LUFS, final frame inspection, independent review | `renders/`, QA report | Delivery |
| 8 | 9:16 cut-down and captions | `deliverables/` | Approve |

Tooling already on this machine: Node 22.20 and npm 10.9, Google Chrome. No system ffmpeg (Remotion bundles its own, and loudness work will use `ffmpeg-static`).
No paid service is needed for the default path.

## 10. Decisions and questions for you

1. **Approve Concept A as the first video**, or choose B or C.
2. **Capture method:** approve the mocked-API capture from the local build (recommended). Production capture is not recommended.
3. **Prices and Free Plan:** confirm live numbers, or keep both out of the video (default).
4. **Python manager:** it has an unauthenticated file-download route. Fix it before any Python content. Not needed for video 1.
5. **`Stats.tsx` counters and README claims** (CageFS isolation, phpMyAdmin SSO, "freeze queue", "lockdown"): consider correcting them, because the video must not echo them and visitors will compare.
6. **Brand:** is the teal mark still current? May I make a white-on-transparent copy of the wordmark? Is Bodoni Moda acceptable for display text?
7. **Voice:** free Edge TTS Indonesian voices (default, to be auditioned) or ElevenLabs (needs your API key, paid)?
8. **Remotion licence:** Remotion is free for individuals and small teams, but a company may need a paid licence. Please check the current terms for 1sLabs before delivery. I will not purchase anything.
9. **Founder or team on screen:** none planned. Say if you want a human presence.
10. **Fictional demo brand "Kopi Senja"** and its sample QR: acceptable?

## 11. Findings outside marketing scope

Reported only so you can act on them. None were exploited or tested.

- Python download route without authentication, prefix-only path scoping, weak ownership check.
- Hard-coded fallback database password in `backend/scripts/run_daily_db_backups.js`, and a hard-coded fallback JWT secret in `marketingEmail.service.js`. Rotate them if they were ever real.
- CORS `origin: '*'`, email TLS verification disabled.
- Server IP and admin email appear in several files and in the public README.
- `SslCertificatesView.tsx` calls two admin API functions that may not exist in `src/services/api.ts`.
- Marketing settings (daily limit, schedule, score weights) are saved but ignored. Pause and Resume in discovery is cosmetic.
- HR dashboard failed-email count is always 0 because of a filter bug.
- The `docs/ADMIN_DASHBOARD_AUDIT.md` file lists a plan, and a share of it has since been built, so it understates the current system.

## 12. Limits of this research

- Static code reading only. A flow that exists in code may still fail in production.
- Live plan prices, live Free Plan behaviour and cron wiring are unverified.
- Visual references are named by category only, none were fetched.
- Scores in the ranking are judgement.
- Colour values read from the logo are approximate until sampled.
