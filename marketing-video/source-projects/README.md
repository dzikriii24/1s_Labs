# 1sLabs Source Projects (verified map)

The requested `source-projects/README.md` did not exist, so Phase 1 created this file from
`marketing-video/setup-project.md` plus what the inspection found. All paths below are
relative to `C:\Users\dzikri\Downloads\1sLabs-website` (the "source repo"). Nothing in the
source repo was modified. All research output lives under `marketing-video/`.

## What `setup-project.md` listed versus what exists

| Listed in setup-project.md | Reality |
|---|---|
| Main Website: repo root | Exists. One monorepo: React frontend (`src/`), Express backend (`backend/`). |
| Digital Products: `marketing-video/` | Not a product. It only held the three skill and setup markdown files. It is now the studio root. |
| Business Applications: `src/` | Exists, but it is the same codebase as the main website (public site, customer portal and admin dashboard are all in `src/`). |
| Other Projects | `demo/` (older template copy of the site), `docs/`, `deploy/` (empty), `scratch/` (maintenance scripts). |

So 1sLabs has **one real software product**, a hosting and business-operations platform, plus a
public marketing site and a service business. The "business applications" in `portfolio` are
client projects whose source is not in this repo.

## Inspected sub-projects

| ID | Sub-project | Where | Role |
|---|---|---|---|
| P1 | Public marketing website | `src/components/sections/*`, `src/pages/ServiceLandingPage.tsx`, `index.html` | Lead generation for services and hosting |
| P2 | Customer hosting platform | `src/pages/{Hosting*,Checkout,Payment,Invoice,CustomerPortal,SetupDomain}*.tsx`, `src/components/portal/*`, `src/components/hosting/*`, `backend/src/routes/*` | Sell and manage hosting |
| P3 | Runtime app managers (Node.js, Python, Laravel) | `src/components/portal/{NodeJs,Python,Laravel}AppsTab.tsx`, `backend/src/routes/{nodejs,python,laravel}.routes.js` | Deploy apps from a web panel |
| P4 | Free Plan Developer Program | `src/components/portal/FreePlanTab.tsx`, `backend/src/services/freePlan.service.js` | Free starter hosting |
| P5 | Admin Operations Dashboard | `src/components/admin/**`, `backend/src/routes/admin.routes.js` | Run the business (orders, payments, finance, customers) |
| P6 | Adaptive Resource Management (CloudLinux LVE) | `src/components/admin/views/ServerMonitoringView.tsx`, `backend/src/services/resourceOptimizer.service.js`, `backend/scripts/run_resource_optimizer.js` | Keep shared hosting stable |
| P7 | Lead Acquisition (B2B marketing engine) | `src/components/admin/views/marketing/*`, `backend/src/routes/marketing.routes.js`, `backend/src/services/marketing/**` | Internal sales tooling |
| P8 | HR and Recruitment | `src/components/admin/views/hr/*`, `backend/src/routes/hr.routes.js`, `src/pages/CandidateInterviewSchedulePage.tsx` | Internal recruiting |
| P9 | Meetings, inquiries, documentation center, analytics tracker | `src/pages/MeetingSchedulePage.tsx`, `InquiriesManagementView.tsx`, `DocumentationPage.tsx`, `backend/src/routes/analytics.routes.js` | Support functions |
| P10 | Portfolio (15 client and personal projects) | `src/components/sections/Portfolio.tsx` | Social proof, metadata only |
| P11 | `demo/` | `demo/src/*` | Older template of the site, includes a "Mobile Development" service the live site no longer lists |

Everything is classified in `brand/product-catalog.md` and `brand/services-catalog.md`.

## Standing rules for every later phase

- Read only. Capture from a local or mocked environment, never from production with real data.
- Never open `backend/.env`. Never print keys, JWT secrets, DB passwords, server IPs or customer emails.
- Every on-screen claim must appear in `brand/brand-guidelines.md` under "Allowed claims".
