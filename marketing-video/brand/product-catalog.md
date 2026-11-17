# 1sLabs Product Catalog

Tags: **[V]** verified in code (route or service exists and a screen calls it), **[P]** partial or stubbed,
**[X]** claimed somewhere but not found or contradicted by code, **[I]** interpretation, **[U]** unverified.

Method: direct reading of the source for the public site, admin shell, monitoring view and server routes;
two parallel read-only code audits for (a) the hosting platform and (b) the marketing and HR modules.
Nothing was executed, no database or live server was queried, and no `.env` was opened. "Verified" therefore means
"the code does it", not "production does it today".

Record fields per product: purpose, users, problem, features, UI, tech, assets, benefits, angles.

---

## P2. 1sLabs Managed Hosting Platform (customer side)

**Purpose.** Sell shared cloud hosting and let customers run their own sites and apps from a web panel.
**Users.** Indonesian developers, students, small businesses.
**Problem.** Getting a Node.js, Laravel or Python app online normally means SSH and server work. Here it is a panel.

### Journey as coded

| Step | Status | Evidence |
|---|---|---|
| Browse plans (three cards, subdomain checker toggle) | [V] | `Hosting.tsx`, `plans.routes.js` |
| Register with WhatsApp number, verify email by 24h token | [V] | `auth.routes.js`, `VerifyEmailPage.tsx` |
| Checkout, server re-reads price, adds PPN 11%, reserves domain 24h | [V] | `orders.routes.js`, `CheckoutPage.tsx` |
| Pay by QRIS, enter exact amount, upload proof screenshot | [V], manual | `payments.routes.js`, `PaymentPage.tsx` |
| Admin approves or rejects with reason, audit log, customer email | [V] | `admin.routes.js` payments verify |
| Provisioning: service row, invoice, docroot with welcome page, cPanel addon domain or subdomain | [P] | no per-customer cPanel account is created |
| Portal | [V] | `CustomerPortalPage.tsx` |
| Auto-suspend expired services (job every 30 min) | [V] | `suspension.service.js`, `backend/index.js` |

There is **no payment gateway**. Approval is a human action, so never say "instant activation".

### Portal features

| Feature | Status | Notes |
|---|---|---|
| Node.js app manager: create, start, stop, restart, logs, env vars, health check, `npm install`, ZIP deploy (50 MB), version list | [V] | Free plan limited to 1 app. `nodejs.routes.js`, `NodeJsAppsTab.tsx` |
| Laravel manager: create, ZIP deploy (100 MB), artisan console, Composer install, env editor, logs | [V] | PHP versions 8.1 to 8.3 hard-coded. `laravel.routes.js` |
| Python manager: create, start, stop, restart, pip install, logs, env | [V] but **unsafe** | Download route lacks auth and ownership check. Fix before featuring. `python.routes.js` |
| File manager: list, edit in code modal, create, rename, delete, drag-and-drop upload with queue, extract archive, download, path-traversal checks | [V] | `FileManagerTab.tsx`, `filemanager.routes.js` |
| Database manager: create and delete DB, table browser, SQL console, export, import (50 MB), manual and daily backups with restore, plan quota | [V] | `DatabaseManagementTab.tsx`. README says phpMyAdmin SSO, which is [X] |
| FTP accounts: list, create, change password, delete | [V] | `FtpManagementTab.tsx` |
| Per-site analytics (first-party tracker, pageviews, uniques, clicks, top pages, install snippet) | [V] | `AnalyticsTab.tsx`, `analytics.routes.js` |
| Domains: add custom domain, renew, A-record check, DNS guide | [V] | `DomainsTab.tsx` |
| SSL (cPanel AutoSSL) | [P] | Admin side can trigger and read. Customer badge may never leave "pending". Verify in staging before showing a green padlock state |
| Free Plan claim | [V] | see P4 |
| Invoices with LUNAS watermark, print stylesheet | [V] | `InvoicePage.tsx` |

### Plans and prices

Plans are dynamic (DB table `hosting_plans`, editable in admin). Three different price sets exist in source:

| Plan | `deploy/update_plans.sql` (not present in this checkout, reported by audit) | `Hosting.tsx` fallback | Landing page copy |
|---|---|---|---|
| Starter (30 GB, 10 DBs) | Rp850.000/yr | Rp750.000 | Rp850rb |
| Business (60 GB, 25 DBs, recommended) | Rp1.000.000 | Rp970.000 | Rp1jt |
| Professional (unlimited storage and DBs) | Rp1.200.000 | Rp1.120.000 | Rp1,2jt |

**No price may appear in a video until the owner confirms the live number.** The `deploy/` folder in this checkout is empty, so the SQL file could not be re-checked by Phase 1.

### Do not show or say

Live-looking resource donuts in the customer portal are hard-coded (storage 12%, "Server Normal & Optimal", "99.9% uptime", "1 Gbps", "Anti-DDoS", "phpMyAdmin: Terhubung"). `DomainCheckoutPage` progress steps run on fixed timers. All customers share one cPanel account.

### UI and visual character

Inter typography, monochrome zinc and white with light and dark modes, rounded `3xl` cards, black pill buttons, emerald for active states. Sidebar with grouped menu. Payment page with the QRIS image and numbered steps. File manager with drag-and-drop overlay and floating upload queue. Good capture subjects.

### Marketing angles

1. "From ZIP to running app": Node.js deploy without SSH.
2. "Bayar pakai QRIS": a local payment rail.
3. "One panel": app manager, files, database, FTP, analytics in tabs.

---

## P4. Free Plan Developer Program

**Users.** Students and beginner developers in Indonesia.
**Status.** [V] one claim per account: a `*.1slabs.my.id` subdomain with free hosting and a Node.js app slot.
**Conflicts, must be resolved by the owner before any video mentions duration:**

| Source | What it says |
|---|---|
| `llms.txt` | 1 GB NVMe, 30 days, renewable at no charge |
| `freePlan.service.js` | 14 days hosting, domain expires after 1 month |
| `claimFreePlan` response and `OverviewTab.tsx` | "1 tahun" (365 days) |
| README | "CSR developer" program. Not found in code [X] |

Marketing angle: "Belajar deploy tanpa biaya awal" (learn to deploy with no upfront cost). Wording stays duration-free until clarified.

---

## P6. Adaptive Resource Management (CloudLinux LVE)

**Purpose.** Keep a shared CloudLinux account under its limits by watching usage and pruning idle processes safely.
**Users.** 1sLabs admins. Customers benefit indirectly. [I]

| Capability | Status | Evidence |
|---|---|---|
| Five levels by dominant resource %: 0-69 Optimal, 70-79 Warning, 80-89 High, 90-94 Critical, 95-100 Emergency, with recovery thresholds | [V] | `resourceOptimizer.service.js` lines ~17-31 |
| Metrics: CPU, physical memory, entry processes, NPROC, IO, IOPS, inodes via cPanel UAPI | [V] | `cpanel.service.js`, `ServerMonitoringView.tsx` |
| Hysteresis cooldown 180 s | [P] | In-memory timer, so a fresh cron process skips it. Recovery thresholds still apply |
| Graceful pruning: SIGTERM, then SIGHUP if still alive | [V] | Not `kill -9`. A `kill -9` helper exists in `cpanel.service.js` but nothing calls it |
| Protected whitelist: master backend, SSH, MySQL, UAPI, Passenger, lsnode workers | [V] | optimizer service |
| Dry-run mode and manual override toggles | [V] | `ServerMonitoringView.tsx` |
| Optimization log history modal, MySQL audit modal | [V] | same |
| Log rotation (`stderr.log` over 20 MB cut to 2 MB), temp file cleanup older than 24 h | [V] | optimizer service |
| Level 5 emails the admin | [V] | optimizer service |
| "Freeze background queue" (L4) and "Lockdown mode" (L5) from README and UI banner text | [X] | Levels 4 and 5 only prune prunable processes. The banner copy overstates it |
| Autonomous cron runner | [P] | `run_resource_optimizer.js` exists, nothing in the repo schedules it. Production wiring [U] |
| "Prediction / trend" card | [P] | Shows `Stable / Low Risk` defaults when data is absent |

Visual character: coloured status banner per level (emerald, amber, orange, red, rose), LVE gauges, mono-font KPI cards, purple accent, pulsing "Active" dot. Highly cinematic and easy to animate.
Safe wording: "Lima level perlindungan, simulasi dry-run, proses penting dilindungi, penghentian lewat SIGTERM". Unsafe: "otomatis 24/7", "tidak pernah down", "lockdown".

---

## P5. Admin Operations Dashboard

Sidebar groups verified in `AdminSidebar.tsx`: Overview, Growth & Intelligence, Human Resources, Customers, Hosting Management, Domain & Security, Finance, Communication, System. Contains about 35 views.

| Area | Status | Notes |
|---|---|---|
| Dashboard, analytics, customer management, orders, transactions, revenue, invoices (multi-item), financial reports, service reports, proof vault | [V] views exist | `docs/ADMIN_DASHBOARD_AUDIT.md` (dated 30 Oct 2026) describes a 7-phase plan, many items there are now built. Treat that document as a plan, not proof |
| Payment verification with audit trail | [V] | `admin.routes.js` |
| Email management, 12 transactional templates, template editor | [V] | `email.service.js`, `EmailTemplateEditorView.tsx` |
| Role-based access (admin, super_admin, marketing, hr) | [V] | middleware and sidebar filtering |
| Domain management and SSL views | [P] | `SslCertificatesView.tsx` calls two admin API functions the audit could not find in `api.ts`. May be broken |
| Server Configuration view | [P] | Static text, shows an el8 kernel and Apache which contradict the README |

Angle: "The business runs on one dashboard." Internal tool. Use as B-roll, not as a sold product, unless the owner decides to offer it.

---

## P7. Lead Acquisition (B2B marketing engine)

Internal sales tool. Gated to admin or marketing roles.

| Capability | Status |
|---|---|
| Lead Dashboard: about ten KPI cards, daily quota bar (100/day), breakdown bars by province, category, source, job table | [V] |
| Discovery from OpenStreetMap (Nominatim), West Java open data portal, ISEF site scrape, official-site crawl | [V] live |
| Discovery adapters named Google Business, KADIN, International | [X] they return **fixed hard-coded lists** (6, 20 and 13 entries) |
| De-duplication by name, domain, phone | [V] |
| Gemini enrichment, contact recovery, email drafting (4 angles), reply classification | [V] but no web-search grounding |
| Website audit (SSL, load time, viewport, catalog, contact page, tech guess) with hot/cold grade | [V] |
| Email discovery with DNS MX check | [V], means "domain can receive mail", **not** a verified mailbox |
| Lead Review queue, suppression list, unsubscribe link and header, click tracking | [V] |
| Campaigns: manual batch of up to 50 per click, capped 100/day | [V]. Not scheduled, despite an API message |
| Inbox with threaded replies | [V], manual sync |
| Settings for daily limit, schedule, score weights | [X] saved but ignored. Cap and schedule are hard-coded |
| Pause/Resume discovery | [X] cosmetic |
| "Production Ready", "38 provinces" labels | static text |

Data risk: three adapter files hold named individuals with phones and emails. No screenshot of discovery results may be used without replacing the data.
Angle: "How 1sLabs finds and qualifies prospects". Only valid as a "how we work" story, and the outreach topic needs the owner's judgement.

---

## P8. HR and Recruitment

Seven tabs: Dashboard, Candidates, Pipeline, Positions, Interviews, Email Campaigns, Inbox.

| Capability | Status |
|---|---|
| 9-column Kanban pipeline | [V], cards move by a dropdown, **not drag and drop** |
| Candidate CRUD, timeline, status change, email compose, interview invite | [V], resume as URL only |
| Interview queue with public self-scheduling page, token link, Meet link unlocks on turn, 15 s polling | [V] |
| Google Meet link | manual paste, no Calendar API [X for integration] |
| AI screening or CV parsing | [X] none |
| Dashboard with 8 KPI cards and 14-day bar chart (div-based) | [V]; failed-email stat is always 0 due to a filter bug |

Angle: internal. Lowest marketing value for external audiences. Possible employer-branding material later.

---

## P1, P9. Public site and support functions

| Item | Status |
|---|---|
| Home page: parallax hero with WebGL GradientWaves, rotating word "a website / an App / an AI / a System", SpecularButton pill, Pay Once card, services grid, hosting section, portfolio carousel, partner marquee, FAQ, contact form | [V] |
| Language toggle ID/EN, light and dark theme | [V] |
| Public meeting scheduler with confirmation email and Add to Google Calendar link | [V] |
| Documentation center with deploy guides (React/Vite, Express, DNS, maintenance) | [V] routes exist, content in DB [U] |
| Inquiry form with rate limit and email notification | [V] |
| Visitor analytics tracker `tracker.js` | [V] |
| Stats strip "200+ / 500+ / 10+ / 25+" | **[U] forbidden** |

---

## Cross-cutting security findings (not marketing, but they affect video timing)

Found incidentally while verifying claims. They are listed so the owner can decide before promoting anything.

1. Python manager: `GET /api/python/files/download` has no `requireAuth`, path scoping is a prefix check, and ownership verification passes when the app merely exists. **Fix before promoting Python.**
2. A hard-coded fallback database password sits in `backend/scripts/run_daily_db_backups.js`, and a hard-coded fallback JWT secret in `marketingEmail.service.js`. Rotate if they were ever real.
3. CORS is `origin: '*'` and email TLS uses `rejectUnauthorized: false`.
4. Admin and server IP details are embedded in several files and in the README.
5. Any production DB access in Phase 2 would risk exposing customer rows, so capture must use mocked data.

Phase 1 reported these without exploiting them.
