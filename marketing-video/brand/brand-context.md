# 1sLabs Brand Context

Evidence tags used in every brand file:

- **[V]** Verified in source code or a file in the repo (path given).
- **[I]** Reasonable interpretation, drawn from verified material.
- **[U]** Unverified. Do not put it on screen or in a voice-over.

## 1. Who 1sLabs is

| Fact | Status | Source |
|---|---|---|
| Name is written "1sLabs" (site copy also uses "1s Labs") | [V] | `README.md`, `index.html`, `About.tsx` |
| Website `1slabs.my.id` | [V] | `index.html` canonical, `public/llms.txt` |
| Sells website development, custom software, IT consulting, annual website maintenance, managed hosting, a free student hosting plan | [V] | `public/llms.txt`, `Services.tsx`, `ServiceLandingPage.tsx` |
| Operates its own hosting platform (customer portal, checkout, admin) | [V] | `src/pages/CustomerPortalPage.tsx`, `backend/src/routes/*` |
| Company form: llms.txt says "PT / Engineering Team 1sLabs", README says "Tim Engineer 1sLabs" | [V] but ambiguous | Do not say "PT". Say "tim engineer 1sLabs" |
| Location: schema.org says Bandung, Jawa Barat; invoice header says Bandung; README says the datacenter is "Tier-3 Jakarta" | [V] Bandung office, [U] datacenter tier | `index.html` JSON-LD, `InvoicePage.tsx`, `README.md` |
| Hours Mon to Sat 08:00 to 21:00 | [V] in JSON-LD only | `index.html` |
| Contact: WhatsApp +62 851-5629-6580, info@1slabs.my.id | [V] company contact, safe to show | `README.md`, `llms.txt` |
| Social: Instagram `1slabs.id`, GitHub `dzikriii24`, LinkedIn `dzikrirabbani` | [V] in JSON-LD | `index.html` |
| Founder and principal engineer is Dzikri Rabbani | [I] from repo owner, the portfolio roles and the CV file in the repo root | Not stated on the public site. Ask before naming him in a video |

## 2. Positioning, as the site itself words it

- Hero: "Grow Your Business With a website / an App / an AI / a System, built for life." [V] `hero-paralax.tsx`
- Sub-hero: "Jasa Pembuatan Website, Custom Software & IT Consulting berkualitas tinggi. Solusi digital tepat guna untuk akselerasi bisnis Anda tanpa langganan berulang." [V]
- Core promise: **"Pay Once. Own & Use Forever."** Full source code, database and assets belong to the client, no recurring platform fees for the custom build. [V] `About.tsx`, `llms.txt` FAQ
- Values: Quality First, Long-Term Trust, Affordable & Transparent. [V] `About.tsx`
- Free IT consultation and free migration help from other hosting. [V] `llms.txt` (a claim made by the company, not something the code can prove)

**Interpretation [I]:** 1sLabs is a small, engineer-led Indonesian technology partner that does two jobs
at once: it builds software for clients (Pay Once ownership) and it runs its own hosting platform
that it built itself. The second job is the rarer and more provable one.

## 3. Audience

| Segment | Evidence | Notes |
|---|---|---|
| Indonesian small and medium business owners needing a website or internal system | [V] services copy in Indonesian, QRIS payment, PPN 11% | Primary buyer of services |
| Indonesian developers, students and beginners | [V] Free Plan program, Node.js Selector, docs on deploying React/Vite and Express | Primary user of hosting |
| Institutions (university library, organisations, government office) | [V] portfolio entries | Social proof only |
| International customers | [U] no English-first funnel, QRIS is Indonesia-only | Not a target for video 1 |

Default language for video: **Indonesian**. The site toggles ID and EN (`LanguageContext.tsx`), so an English cut is possible later.

## 4. Claims in the repo that must NOT be used

These appear in source or docs but are unsupported, contradictory or generic:

| Claim | Where | Problem |
|---|---|---|
| "200+ Active Clients, 500+ Projects Delivered, 10+ Years, 25+ Team Experts" | `Stats.tsx` | Hard-coded. The same site lists 15 portfolio items and calls itself an engineering team. No evidence. **Forbidden** |
| "Trusted by Businesses & Enterprises" | `Stats.tsx` | Same |
| "99.9% uptime", "SLA 99.9%", "1 Gbps", "Anti-DDoS Layer 3/4/7", "LiteSpeed Enterprise" | `CustomerPortalPage.tsx` static labels | Static strings, not measured |
| "Core Web Vitals LCP < 2.5s" as a guarantee | `llms.txt` | Marketing text, not a verifiable guarantee |
| "Dicoding x DBS Foundation Top 15 Capstone" | `ExperiencePartners.tsx` | Company-made claim, no proof file. Use only with the owner's confirmation |
| "Tier-3 Datacenter Jakarta" | `README.md` | Only in README |
| "CageFS isolation per customer" | `README.md`, `llms.txt` | Code shows all customers share one cPanel account, isolation is path checks in the app |
| "phpMyAdmin SSO and remote MySQL access" | `README.md` | Not found in code |

## 5. Competitive angle

No competitor research was done (no network research on rivals in Phase 1). Differentiators below
come only from what 1sLabs itself ships:

1. **Runtime management in the panel** for Node.js, Laravel and Python apps (create, start, restart, logs, env, ZIP deploy). [V]
2. **Local payment rail:** QRIS with manual proof upload and admin approval. [V]
3. **Pay Once ownership** for custom builds. [V as company promise]
4. **Free Plan for learners.** [V, but terms conflict, see product catalog]
5. **Built in-house:** the same team that sells it wrote the portal, admin and optimizer. [I]
6. **Adaptive resource protection** with five levels, dry-run and protected process list. [V, narrower than README, see product catalog]

Do not write "cheaper than", "faster than" or "better than" any named provider.
