# 1sLabs Video Brand Guidelines

Operating rules for every 1sLabs video. Derived from `brand-context.md`, `product-catalog.md` and `visual-identity.md`.
Also follows the writing rules in `aislop.md` at the repo root (no em dashes, no rule of three by default, concrete over generic).

## 1. Voice

- Indonesian first, informal-professional ("kamu" for developers and students, "Anda" for business owners as the site does). English cut later.
- A practitioner talking, not a salesperson. Short, concrete, no superlatives.
- One idea per sentence. Name real things: Node.js, QRIS, ZIP, file manager.
- No em dashes anywhere. No exclamation marks in voice-over. No "revolusioner", "terdepan", "all-in-one solution", "seamless".
- Sentences vary in length. Do not stack three same-length lines.

## 2. Visual principles

1. **Ink on paper.** Warm light neutral (`#EAEAEA` family) or ink black `#111111`. Never a purple-blue AI gradient.
2. **One accent.** `#007AFF` for interaction moments (cursor, focus ring, a single highlighted word). Status colours only when the UI itself shows status.
3. **The product is the hero.** Real UI, large, cropped for legibility. No stock footage, no abstract 3D, no floating particles.
4. **Didone for statements, Inter for UI.** Hero text in Bodoni Moda (pending owner confirmation), everything else Inter.
5. **Calm motion.** Ease-out, 20 to 40 px travel, springs with damping 18 to 26. Camera moves are slow pushes (1.00 to 1.08 over 3 to 5 s).
6. **Every scene earns its place.** If a scene can be removed without losing a fact or a feeling, remove it.
7. **Texture, not glow.** Subtle grain and vignette are fine. Neon glows are not.

## 3. Logo usage

- Use the supplied files only. Never retype "1sLabs" as a replacement for the wordmark in brand moments.
- Minimum clear space: the height of the "S" counter on every side.
- Black wordmark on light, white (knocked-out copy) on dark. Never tint the wordmark with the accent.
- The teal mark is used only if the owner confirms it is current.
- Hold the final logo lock-up at least 1.5 s.

## 4. Claims register

### 4.1 Allowed (verified [V])

| Claim | Condition |
|---|---|
| Deploy a Node.js app from a web panel (create, start, restart, logs, environment variables) | Shown on real UI |
| Upload a ZIP to deploy a Node.js or Laravel app | Sizes 50 MB and 100 MB are limits, mention only if needed |
| Choose a Node.js version from the panel | Do not list numbers unless confirmed in staging |
| Run artisan commands and Composer for Laravel | |
| File manager with drag-and-drop upload and in-browser code editing | |
| Create and manage MySQL databases, run SQL, export, import, backups | Say "backup database", not "backup website" |
| Create FTP accounts | |
| Built-in visitor analytics for hosted sites | Pageviews, unique visitors, clicks, top pages only |
| Pay with QRIS, upload proof, receive confirmation after verification | Never "instan" |
| Invoice with PPN 11% | |
| Five-level adaptive resource protection with dry-run and protected core processes | Wording in section 4.4 |
| Free Plan for learners with a `*.1slabs.my.id` subdomain | No duration |
| Free IT consultation and a public booking page | |
| "Pay Once. Own & Use Forever." for custom builds | Company promise, attribute to 1sLabs |
| Indonesian and English interface | |

### 4.2 Allowed only after owner confirmation

| Claim | Why |
|---|---|
| Any price or plan spec | Three conflicting price sets in source |
| Free Plan duration | Three conflicting values |
| AutoSSL / "free SSL" as a customer-visible feature | Customer badge may never turn active |
| Python app hosting | Security issue in the download route |
| Any partner or client logo | Needs written permission |
| Dicoding x DBS "Top 15 Capstone" | No proof file |
| Naming Dzikri Rabbani as founder | Not stated publicly on the site |
| Backup frequency per plan | Only the DB backup job is verified |

### 4.3 Forbidden

| Claim | Reason |
|---|---|
| 200+ clients, 500+ projects, 10+ years, 25+ experts | Unsupported hard-coded numbers |
| 99.9% uptime, SLA, 1 Gbps, Anti-DDoS, LiteSpeed Enterprise | Static portal text |
| "Real-time" storage or resource donuts in the customer portal | Hard-coded |
| Instant activation or fully automatic provisioning | Payment is manual, admin approves |
| Isolated container or CageFS per customer | One shared account, app-level checks |
| phpMyAdmin one-click login, remote MySQL access | Not found |
| Free `.com` domain with plans | Only in FAQ text, no code support |
| Domain registration | No registrar API |
| Zero-downtime migration | No code, no evidence |
| "AI recruiting", "Google Calendar sync", "drag-and-drop Kanban" | Not implemented |
| "Verified emails" for Lead Acquisition | It is a DNS MX check only |
| "Live Google or KADIN scraping" | Fixed lists |
| "Automated, scheduled campaigns" | Manual batches |
| Any testimonial, rating, revenue number, "trusted by" | None exist |
| Comparisons to named competitors | No research |
| "Mobile app development" | Only in old `demo/` |

### 4.4 Safe phrasing for the resource optimizer

Say: "Lima level perlindungan. Proses penting dilindungi. Simulasikan dulu dengan dry-run." Do not say: "otomatis 24 jam", "server tidak pernah overload", "lockdown mode", "bekukan antrean".

## 5. Data and privacy

- No real customer name, email, domain, phone, IP, order number, payment proof or invoice may appear. Use a fictional brand such as "Kopi Senja" with the
  `*.1slabs.my.id` pattern only if the owner approves the subdomain.
- Blur or replace the QRIS image with a generic sample. The real `qris.jpeg` is a payment instrument.
- Replace the admin email and WhatsApp numbers of private persons. The company WhatsApp +62 851-5629-6580 and `info@1slabs.my.id` are public and may be shown in the CTA.
- Server IP `103.x.x.x` must never be on screen.
- Do not open or screenshot `.env`, deploy scripts or backend config.

## 6. Audio rules

- Music: licensed or generated with a recorded licence in `audio-credits.md`. No commercial tracks.
- Sound effects: one distinct sound per action type, never the same whoosh twice in a row.
- Voice-over: natural Indonesian, no robotic reading. Pronunciation notes: "Node.js" read "nod jay-es", "QRIS" read "kyu-ris", "ZIP" as "zip", "1sLabs" as "wan-es labs" (confirm with owner).
- Mix target: voice is the loudest element, music ducks 8 to 10 dB under voice, final loudness -14 LUFS, true peak at or below -1.5 dBTP.

## 7. Technical standards

| Item | Value |
|---|---|
| Frame rate | 30 fps |
| Landscape | 1920 by 1080, H.264 MP4 |
| Vertical | 1080 by 1920, keep text inside the middle 75% of height |
| Safe margins | 6% horizontal, 12% top and bottom for vertical |
| Source of truth for colour and type | one `theme.ts` per video project |
| Captions | burned in, Indonesian, synced to voice-over word timestamps |
| Delivery | final MP4 plus caption-free master plus a QA report |

## 8. Review checklist (run before every approval gate)

1. Every on-screen sentence maps to a row in section 4.1 or a confirmed row in 4.2.
2. No forbidden item from 4.3 appears in script, caption, UI crop or voice-over.
3. No private data visible at 200% zoom on any frame.
4. Logo has clear space and is held at least 1.5 s.
5. First frame is not blank and something moves within 15 frames.
6. Text is readable at phone size.
7. No em dashes in any text.
