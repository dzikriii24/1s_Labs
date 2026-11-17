# 1sLabs Video Marketing Strategy

Built on `brand-context.md`, `product-catalog.md` and `brand-guidelines.md`. All scores are the Creative Director's judgement from the
Phase 1 evidence, not measured data. No performance numbers are promised anywhere in this document.

## 1. What the evidence says

1. 1sLabs has **one genuine software product** (the hosting platform with its portal, admin and optimizer) and a **services business**
   that pays the bills. [V]
2. The most demonstrable, least-fabricated story is the hosting portal: real routes, real tabs, a real local payment flow. [V]
3. The most *visual* feature is the adaptive resource monitor (five colour states, gauges). [V]
4. The portfolio has no product screenshots, only stock photos. Service marketing therefore has to lean on the 1sLabs site itself and on
   process, not on client work. [V]
5. Several public claims are weak or false (stats strip, uptime, isolation). A video that repeats them would damage credibility. [V]

## 2. Scoring method

Scale 1 to 5. Weights: Visual appeal 20%, Business value 20%, Problem-solving impact 15%, Uniqueness 15%, Ease of demonstration 15%, Marketing potential 15%.
"Ease of demonstration" is penalised when the product needs fabricated data, has verified-claim gaps or has unresolved security issues.

| Rank | Candidate | Visual | Business | Impact | Unique | Demo ease | Marketing | **Score** | Main reason |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Hosting platform: Node.js and Laravel app panel, QRIS checkout** (P2, P3) | 4 | 5 | 4 | 3 | 4 | 4 | **4.05** | Direct revenue, real flow, many capturable screens |
| 2 | **"Pay Once" services brand film** (S1, S2, home site) | 4 | 5 | 3 | 3 | 4 | 4 | **3.90** | Services generate the revenue. The site is its own demo |
| 3 | **Adaptive Resource Management** (P6) | 5 | 3 | 4 | 5 | 3 | 3 | **3.85** | Most cinematic UI, rare feature, but narrower audience |
| 4 | Free Plan for learners (P4) | 3 | 3 | 3 | 4 | 4 | 4 | 3.45 | Good hook, blocked by conflicting terms |
| 5 | Lead Acquisition (P7) | 4 | 3 | 4 | 3 | 3 | 2 | 3.20 | Internal tool, data and ethics risk, several false labels |
| 6 | Invoice and finance flow (P5) | 3 | 3 | 3 | 2 | 4 | 2 | 2.85 | Supporting B-roll |
| 7 | Portfolio showcase (S9) | 2 | 4 | 3 | 2 | 2 | 3 | 2.70 | Only stock images, cannot show real work |
| 8 | Documentation center / analytics tracker (P9) | 2 | 2 | 3 | 2 | 4 | 2 | 2.45 | Support feature |
| 9 | HR and Recruitment (P8) | 3 | 2 | 3 | 2 | 3 | 1 | 2.35 | Internal, no external audience |

### Top three for the first campaigns

1. **Hosting platform ("Dari ZIP ke Live")**, first video.
2. **Pay Once brand film**, for LinkedIn and the website hero, second.
3. **Adaptive Resource Management**, third, as a shorter product-depth piece. Shows engineering seriousness.

Lead Acquisition and HR stay as *behind the scenes* material. Whether 1sLabs wants to publicise its own outreach tooling is the owner's call,
and several of its labels would need correcting first.

## 3. Audience and channel map

| Audience | Pain | Message | Channel | Format |
|---|---|---|---|---|
| Indonesian developers, students, freelancers | Getting a Node.js or Laravel app online | Deploy from the browser, pay by QRIS | Instagram Reels, TikTok, YouTube Shorts, X | 9:16, 20 to 30 s |
| Same, researching | Evaluating hosts | Full walkthrough | YouTube, website hosting page | 16:9, 45 to 60 s |
| SME owners | Needing a site or system without monthly rent | Pay Once, you own it | LinkedIn, Instagram, website hero | 16:9 and 1:1, 30 to 45 s |
| Technical peers and recruiters | Judging engineering quality | The platform protects itself | LinkedIn, YouTube | 16:9, 30 to 40 s |

## 4. Campaign sequence

| # | Video | Format | Why this order |
|---|---|---|---|
| 1 | Dari ZIP ke Live (hosting) master 45 s | 16:9, then 9:16 cut-down | Strongest proof of real capability |
| 2 | 9:16 cut-down, 20 to 25 s | 9:16 | Reuses captured UI. Social distribution |
| 3 | Pay Once (services) 30 to 40 s | 16:9, 1:1 | Serves the main revenue line |
| 4 | Resource protection 30 s | 16:9, 9:16 | Credibility and engineering story |
| 5 | Free Plan teaser 15 s | 9:16 | Only after terms are fixed |

Each video lives in its own folder under `projects/` and reuses the captured asset library, so capture cost is paid once.

## 5. Capture strategy (applies to every video)

Because the real database contains customers, payment proofs and a production server, all UI capture follows this order of preference:

1. **Local frontend plus mocked API.** Run the Vite dev server read-only from the source repo and intercept `/api/*` requests with fixture JSON in a capture script
   (Playwright with the installed Chrome). Zero production contact, deterministic, fictional data. Needs API response shapes from `src/services/api.ts`.
2. **Isolated staging** with seeded data, if the owner has one. [U]
3. **Production with a dedicated test account.** Last resort. Requires explicit approval, read-only navigation, no destructive actions.

Expected capture outputs: 2x device-pixel-ratio PNG textures per screen, element-level crops, a `layout.json` with element coordinates for camera moves, and
short screen recordings for interactions (drag-and-drop upload, status flips).

Fictional demo identity: "Kopi Senja" with an `app` called `kopisenja-api`. (placeholder, subject to owner approval)

## 6. Measurement (no invented targets)

- Primary: clicks to `1slabs.my.id/hosting`. The site already carries a first-party tracker, so UTM-tagged links per platform can be compared. [V that the tracker exists]
- Secondary: registrations and Free Plan claims, from admin data the owner already has.
- Do not state benchmark view counts. None are known.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Showing a feature that fails in practice | Capture only flows confirmed in code and re-test in the local build |
| Price or plan changes after publishing | Keep prices out, point to the page |
| Security issue in Python manager | Hold Python content until fixed |
| Third-party logo permission | Exclude the partner marquee |
| Payment instrument exposure | Replace QR with a generic sample |
| Overclaiming performance | Claims register in `brand-guidelines.md` section 4 |
| Remotion licence for a company | Owner to confirm, see report |
