# 1sLabs Visual Identity

Tags: **[V]** read from a file, **[I]** interpretation, **[U]** not verified. Colour values marked "approx" were read by eye from
the logo image and must be pixel-sampled in Phase 2 before use.

## 1. Logos (real, do not redraw)

| File | What it is | Notes |
|---|---|---|
| `public/logo-1slabs.png` (copied to `shared-assets/logos/`) | Square stacked wordmark. A huge high-contrast serif "1" and "S", with "LABS" in widely spaced serif capitals set between them. Solid black on white | [V] viewed. Didone style, thin hairlines. Needs a transparent version for dark backgrounds (the PNG has a white background) |
| `public/logo-mark.png` | Three-piece geometric mark (an angular arrow or check shape with a triangle), flat teal, approx `#17B5C9` | [V] viewed. Transparent or white background [U] |
| `public/favicon.svg` and PNG favicons | Icon set | [V] |
| `src/assets/logo/LOGO.svg` | Horizontal 163 by 48 logo, but built as an embedded raster inside an SVG pattern | [V]. Not a true vector, do not scale up |
| `public/logo-1slabs-original.png` | Original upload, not inspected | [U] |

**Phase 2 asset tasks:** vectorise or knock out the white of the wordmark (on a copy), and confirm with the owner whether the teal mark is
still current, because the web UI uses blue (below), not teal. The two do not match. [I]

## 2. Colour in the real product

Source: `src/index.css`, `tailwind.config.js`, component classes.

| Role | Light | Dark | Source |
|---|---|---|---|
| Page background | `#EAEAEA` (CSS var) / white cards | `#111111` | `index.css` :root and .dark |
| Text primary | `#111111` | `#FFFFFF` | same |
| Text secondary | `#666666` | `#A1A1A1` | same |
| Border | `#D1D1D1` | `#2D2D2D` | same |
| Accent (links, focus, selection) | `#007AFF` | `#0A84FF` | same, Apple-style blue |
| Gradient text | `#007AFF` to `#5856D6` | | `.gradient-text` |
| Tailwind `primary` scale | blue 50 to 900, 600 is `#2563EB` | | `tailwind.config.js` |
| Neutrals | Tailwind gray and zinc | | most components |
| Hero shader (light theme) | horizon `#0F172A`, wave `#1E293B`, crest `#475569` | inverted to near-white in dark | `hero-paralax.tsx` |
| Status | emerald active or paid, amber warning, orange high, red critical, rose emergency | | `ServerMonitoringView.tsx`, invoice |
| Admin accent | purple 600 for monitoring | | `ServerMonitoringView.tsx` |
| Logo mark teal | approx `#17B5C9` | | `logo-mark.png` |
| Meta theme colour | `#0F172A` dark, `#FFFFFF` light | | `index.html` |

**Interpretation [I]:** the identity in use is *monochrome and restrained*, ink on paper, with one accent blue for interaction. Colour in the admin
is semantic (status), not decorative. The audit document also describes the admin as "monochrome Swiss typography, black solid buttons,
zinc card borders". [V] `docs/ADMIN_DASHBOARD_AUDIT.md` section 5.

## 3. Typography

| Use | Face | Status |
|---|---|---|
| UI and body | **Inter** 300 to 900, loaded from Google Fonts | [V] |
| Headings in class names | `font-['Mori', sans-serif]` | [V] referenced, **never loaded** (no `@font-face`, no import). It falls back to the browser sans-serif. Do not treat Mori as a brand font |
| Display fonts preloaded in `index.html` and `index.css` | Bodoni Moda, Cormorant Garamond, Pinyon Script, Plus Jakarta Sans | [V] loaded, **no usage found** in `src/**/*.tsx` |
| Logo lettering | didone serif, close to Bodoni | [I] by eye |
| Code and metrics | system monospace (`font-mono` in admin KPI cards) | [V] |

**Recommended video type system [I], to confirm with the owner:**
Bodoni Moda (OFL, optical size axis) for hero statements, echoing the logo's didone letterforms; Inter for UI, captions and body; JetBrains Mono or the
system monospace only inside terminal and metric elements. This ties the video to the logo while keeping the real UI true to Inter.

## 4. Layout and shape language

- Large rounded containers: `rounded-[2rem]` section cards on the home page, `rounded-3xl` cards in portal and admin. [V]
- Pill buttons (`SpecularButton` radius 9999, black base with a specular edge highlight). [V]
- Thin 1px zinc borders, soft shadows (`soft`, `medium`, `hard` in Tailwind config). [V]
- Glass effect utility (`.glass`, blur 10px). [V]
- Section rhythm on the home page: stacked rounded cards on a light gray page, max width 1400 px. [V]
- Icons: Lucide, stroke style. [V]
- Print/invoice: A4, black buttons removed, green LUNAS badge and diagonal watermark. [V]

## 5. Motion language in the product

| Element | Behaviour | Source |
|---|---|---|
| Hero background | WebGL gradient waves, mouse parallax, film grain 0.05 | `GradientWaves.tsx`, `ogl` dependency |
| Hero headline | "Grow Your Business With ..." with a rotating word every 2.5 s, 0.4 s ease-out slide | `hero-paralax.tsx` |
| Section entrances | Framer Motion fade and 20 to 30 px rise, stagger 0.1 to 0.2 s | `Stats.tsx`, `About.tsx` |
| Portfolio | circular carousel | `CircularCarousel.tsx` |
| Button | specular light follow | `SpecularButton.tsx` |
| Status | pulsing dots, spinning refresh icons | admin views |

The product's own motion is *calm*: ease-out, short travel, no bounce. The video should match that restraint and add cinematic camera and sound, not
a different personality. [I]

## 6. Capturable screens (Phase 2 shot list seeds)

| Screen | Route or component | Best for |
|---|---|---|
| Home hero with waves | `/` | Opening, brand |
| Pay Once card | `/` About | Brand film |
| Hosting plan cards, subdomain checker | `/` Hosting | Product |
| Plan detail, checkout with PPN | `/hosting/plan/:slug`, `/checkout/:slug` | Product |
| QRIS payment and proof upload | `/payment/:order` | Product |
| Portal overview and service detail | `/portal` | Product |
| Node.js apps tab and edit config modal | portal | Hero demo |
| File manager with drag overlay | portal | Hero demo |
| Database manager with SQL console | portal | Detail |
| Invoice with LUNAS watermark | `/invoice/:no` | Detail |
| Server Monitoring level banner and gauges | admin | Separate video |

All must come from a mocked or seeded environment (see the report's capture plan).

## 7. Accessibility and legibility

UI text in the product is small (`text-xs` is common). In a 1080 px wide video the real UI will need 2x to 3x zoom for any text to be readable. Plan
crops at the storyboard stage, do not shrink whole screens into a corner. [I]
