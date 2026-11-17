# 1sLabs Services Catalog

Tags: **[V]** verified in source, **[I]** interpretation, **[U]** unverified.
Primary sources: `public/llms.txt`, `src/components/sections/Services.tsx`, `src/pages/ServiceLandingPage.tsx`, `index.html` JSON-LD.

Services are what 1sLabs does for a client. Products (the software 1sLabs itself operates) are in `product-catalog.md`.

## S1. Jasa pembuatan website profesional [V]

- Route: `/jasa-pembuatan-website`
- Scope: company profile, landing page, news portal, online store, interactive dashboard.
- Promise: modern responsive design, on-page SEO, full source code ownership, "Pay Once, No Monthly Lock-in".
- Price text on landing page: "from Rp1.500.000" (hard-coded copy). [V as text, price accuracy [U]]
- Video angle: the site is its own demo (GradientWaves hero, parallax, portfolio carousel).

## S2. Custom software and web application development [V]

- Route: `/software-development`
- Scope: business information systems, POS, ERP, CRM, library and academic systems (SLiMS), payment gateway integration.
- Stack named on site: React, Vue, Vite, Node.js Express, TypeScript, Python, Tailwind, PostgreSQL, MySQL.
- Feature list on home page: operational dashboards, warehouse and stock control, role-based access, PDF and Excel reports. [V as copy]
- Price text: "from Rp3.000.000" (copy). [V as text]
- Evidence it has been done: portfolio items 2, 3, 4, 11, 12, 15 (see S9). [V as listed, not independently proven]

## S3. API and system integration [V as copy]

REST API development, payment integrations, data bridging between legacy and modern systems, SLiMS and legacy data sync, webhooks.
Portfolio evidence: "Automasi API Perpustakaan UIN" (OpenBiblio to SLiMS bridge). The "up to 80% transfer efficiency" figure on that card is a self-reported number, **do not use it** [U].

## S4. AI integration and workflow automation [V as copy]

Chatbots and assistants, computer vision, NLP and voice processing, scrapers and scheduled jobs.
Portfolio evidence: Vocallet (voice-command finance), Autism Smart Assistant, Yareunsnap. Treat as research or prototype style projects unless the owner says otherwise. [I]

## S5. Cloud, VPS and server deployment [V as copy]

VPS setup, Vercel and Render deployments, DNS, automated SSL.

## S6. Database architecture and management [V as copy]

PostgreSQL and MySQL modelling, query tuning, backups. The platform itself runs a daily MySQL backup job keeping the last 14 automatic backups. [V] `backend/scripts/run_daily_db_backups.js`

## S7. Annual website maintenance [V]

- Scope: bug fixes, security and dependency patches, database tuning, off-site backup, uptime monitoring. Accepts sites built by others after a technical assessment. [V as copy in `llms.txt`]
- Claim "24/7 uptime monitoring" is company text. The platform has no uptime-monitor feature in the code. Phrase as a service the team performs, never as a built-in dashboard. [U for tooling]

## S8. Managed cloud hosting and Free Plan [V]

Described in detail in `product-catalog.md` (P2, P3, P4). Plans in source: Starter, Business, Professional, plus a Subdomain Pro add-on.

## S9. IT consulting and architecture advisory [V]

- Route: `/it-consulting`
- Free initial consultation: tech stack choice, cost estimate, audit of an existing system. A public booking page exists (`/schedule`, `/meeting`). [V]
- Per-session price text "Rp750.000" appears as copy on the landing page. [V as text]

## S10. UI/UX design and prototyping [V as copy]

Listed on the home page only. Not on `llms.txt`. Low evidence of delivery as a standalone service. [I]

## Service portfolio (social proof, metadata only)

15 entries in `Portfolio.tsx`. The images are stock photos from Pexels or a logo from Pinterest, **not screenshots of the products**. They cannot be used as product visuals.

| # | Project | Type | Link in source |
|---|---|---|---|
| 1 | Vocallet | AI, finance inclusion | none |
| 2 | DPD RI Enterprise Systems | Inventory and field monitoring | none |
| 3 | Saffix.id | Fullstack platform | `saffix.id` (partner list) |
| 4 | Yuk-Mari Platform | Backend and admin | yuk-mari.com |
| 5 | Sportify.id | Venue booking | none |
| 6 | Autism Smart Assistant | AI assistive | none |
| 7 | Yareunsnap | AI image | none |
| 8 | KampEase / Unicamp | Campus POI | GitHub |
| 9 | Tanduria | IoT agriculture | GitHub |
| 10 | Sea Salon | Booking | GitHub |
| 11 | Smart POS System | Java desktop POS | GitHub |
| 12 | Smart Laundry App | Spring Boot | GitHub |
| 13 | Digital Wedding (1sUndangan) | Invitation | live URL |
| 14 | Canteen Go | Campus UMKM | GitHub |
| 15 | Automasi API Perpustakaan UIN | API bridge | none |

Client logos in `ExperiencePartners.tsx` (Inpartner, DPD RI Jawa Barat, Saffix, Yuk-Mari, Dicoding x DBS, UIN Bandung library, HIMATIF, LAZISMU, Menu1s) are displayed on the public site. Using a third-party logo in a paid-style ad implies endorsement, so **get written permission per logo** before any video shows them. [policy]

## Service gaps and cautions

- Mobile development appears only in the older `demo/` copy, not the live site. Do not claim it.
- No testimonials exist anywhere in the repo. Do not invent any.
- Hosting and domain services are real but "domain registrar" is not: there is no registrar API. Customers bring a domain or use a `*.1slabs.my.id` subdomain. [V]
