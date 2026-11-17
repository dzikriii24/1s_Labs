# DESIGN SYSTEM & ARCHITECTURAL SPECIFICATION (`design.md`)

**Platform:** Exclusive Independent Streetwear & Editorial Apparel E-Commerce
**Design Direction:** Premium Independent Streetwear × Editorial Fashion E-Commerce
**Primary UX Benchmark:** [Calle de Larache](https://www.calledelarache.com/) (structural composition, catalog filtering, product detail hierarchy, community lookbook)
**Target Stack:** Next.js (App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide React) + Laravel REST API (Sanctum, Filament CMS, MySQL, Redis, Xendit Payment Gateway)

---

## 1. Project Design Direction

### 1.1 Core Philosophy

This platform is an independent fashion house flagship store, not a generic multi-vendor marketplace or a SaaS-styled template. Every screen operates on a strict duality:

1. **Editorial Brutalism in Storytelling:** Campaign heroes, seasonal lookbooks, promotional drops, and community galleries draw from raw streetwear print culture—oversized grotesk headlines, stark monochrome contrast, selective crimson accents (`#E52323`), subtle halftone/film-grain overlays on campaign art, and unconventional typographic framing.
2. **Surgical Minimalism in Commerce:** Catalog grids, filter sidebars, product detail purchase modules, cart drawers/pages, and Xendit checkout flows strip away all visual noise. Zero decorative clutter stands between the garment photography and the transaction.

### 1.2 Reference Adaptation Strategy (`calledelarache.com`)

Extract proven behavioral and structural patterns from `calledelarache.com` while elevating the visual execution into an original identity:

- **Retain & Refine:** Left-anchored persistent catalog filter rail on desktop; instant front-to-back image swap on product card hover; 2-column sticky Product Detail Page (PDP) split with inline Size Guide modal, dynamic destination shipping calculator (`Deliver to: Pick Area`, configurable weight in grams, dynamic dispatch SLA), collapsible policy accordions, and dual purchase CTAs (`ADD TO CART` / `BUY IT NOW`); dense asymmetric `/community` lookbook; clean member portal (`Profile`, `Orders`, `Wishlist`, `Addresses`, `Settings`).
- **Differentiate:** Replace generic web-store typography with a disciplined pairing of **Archivo** (heavy, tight-tracked display headlines and condensed campaign callouts) and **Inter** (crisp UI controls, body copy, and tabular numerals). Enforce zero border-radius (`0px`) across all structural containers, cards, inputs, and buttons to mimic physical print zines and woven garment labels.

---

## 2. Brand Visual Identity

### 2.1 Visual Pillars

| Pillar                            | Execution Rule                                                                                                                                                                                                                                      |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Garment-First Hierarchy** | Photography occupies 70–85% of the viewport on discovery pages. UI chrome recedes into `#0A0A0A` hairlines and `#FFFFFF` / `#F5F4F0` planes.                                                                                                 |
| **Print & Label Tactility** | Hairline `1px solid` borders, exposed structural grids, uppercase micro-labels (`11px`, `0.08em` tracking), and tabular pricing resemble woven care tags and archival lookbooks.                                                              |
| **Controlled Tension**      | Expansive whitespace (`#FFFFFF`) frames dense photographic blocks and heavy `#0A0A0A` display type. Campaign Red (`#E52323`) appears strictly as a deliberate punctuation mark (drop timers, campaign poster accents, critical stock alerts). |
| **Zero Ornamental Chrome**  | No drop shadows on cards, no rounded corners (`border-radius: 0px`), no glassmorphism, no background blurs (except subtle modal scrims), and no decorative vector blobs.                                                                          |

### 2.2 Graphic & Texture Treatments (Campaign Contexts Only)

- **Halftone & Film Grain:** Allowed **exclusively** inside Hero Campaign banners, Mid-Page Editorial Drops, and Collection Headers. Never apply grain or halftone overlays over product catalog cards or PDP studio galleries where fabric color and weave accuracy are critical.
- **Poster Typography Overlays:** Hero and promotional banners may use edge-hugging typography, stamped release dates (`DROP 04 // 2026.11`), and editorial index numbers (`[01/06]`).

---

## 3. Color System

### 3.1 Core & Semantic Palette

Red (`#E52323`) is restricted to **less than 5% of any viewport**. It signals active campaign drops, urgent low-stock states, or destructive/error feedback—never primary transactional buttons or standard navigation bars.

| Token Name                 | CSS Variable               | Hex         | RGB               | Usage Specification                                                                       |
| :------------------------- | :------------------------- | :---------- | :---------------- | :---------------------------------------------------------------------------------------- |
| **Ink Black**        | `--color-ink`            | `#0A0A0A` | `10, 10, 10`    | Primary typography, primary CTA background, active borders, header icons                  |
| **Pure White**       | `--color-surface`        | `#FFFFFF` | `255, 255, 255` | Primary page background, input backgrounds, card base, inverse text on `#0A0A0A`        |
| **Bone / Off-White** | `--color-surface-alt`    | `#F5F4F0` | `245, 244, 240` | Default studio backdrop for product cards, editorial section contrast, table header fill  |
| **Charcoal**         | `--color-text-secondary` | `#292929` | `41, 41, 41`    | Body paragraphs, garment descriptions, secondary navigation links                         |
| **Muted Stone**      | `--color-text-muted`     | `#6E6E6A` | `110, 110, 106` | Placeholders, disabled size labels, breadcrumbs, timestamps, SKU metadata                 |
| **Hairline Grey**    | `--color-border`         | `#E2E1DC` | `226, 225, 220` | `1px` structural dividers, accordion borders, unselected size boxes, table rules        |
| **Strong Border**    | `--color-border-strong`  | `#0A0A0A` | `10, 10, 10`    | Active input focus border, selected size tile border, high-contrast editorial grid lines  |
| **Campaign Red**     | `--color-accent-red`     | `#E52323` | `229, 35, 35`   | Campaign poster accents, `LIMITED STOCK` indicator, drop countdowns, form error borders |
| **Archive Green**    | `--color-status-success` | `#166534` | `22, 101, 52`   | `IN STOCK` dot/text, Xendit `PAID` badge, verified webhook status                     |
| **Amber Warning**    | `--color-status-warning` | `#B45309` | `180, 83, 9`    | Xendit `PENDING` payment waiting state, low inventory warning                           |

### 3.2 CSS Custom Properties (`:root`)

```css
:root {
  --color-ink: #0A0A0A;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F5F4F0;
  --color-text-secondary: #292929;
  --color-text-muted: #6E6E6A;
  --color-border: #E2E1DC;
  --color-border-strong: #0A0A0A;
  --color-accent-red: #E52323;
  --color-status-success: #166534;
  --color-status-warning: #B45309;
}
```

---

## 4. Typography System

### 4.1 Font Families (Strict Two-Family Limit)

Do not load more than two font families. Variable fonts via `next/font/google` are mandatory to support condensed campaign widths without extra HTTP requests.

1. **Display & Headlines (`--font-display`):** **Archivo** (Variable: Weights `600` to `900`; Width axis `wdth` `75` for condensed campaign posters, `100` for standard headlines).
   - *Role:* Hero campaign titles, page headers, section titles, collection names, promotional banners.
2. **Body, UI & Metadata (`--font-sans`):** **Inter** (Variable: Weights `400`, `500`, `600`).
   - *Role:* Product titles, prices, body copy, size tables, filter labels, buttons, checkout inputs.
   - *OpenType Features:* Enforce `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) on all prices, quantities, order totals, weights, and countdown timers so digits align vertically.

### 4.2 Type Scale & Hierarchy

| Token                  | Element / Role                               | Font Family                | Weight              | Desktop Size                      | Mobile Size              | Line Height | Letter Spacing | Transform     |
| :--------------------- | :------------------------------------------- | :------------------------- | :------------------ | :-------------------------------- | :----------------------- | :---------- | :------------- | :------------ |
| `display-hero`       | Hero Campaign Poster Title                   | Archivo (`wdth 85–100`) | `800` (ExtraBold) | `clamp(3.25rem, 6.5vw, 6.5rem)` | `2.75rem` (`44px`)   | `0.92`    | `-0.03em`    | `UPPERCASE` |
| `display-promo`      | Condensed Campaign Callout                   | Archivo (`wdth 75`)      | `900` (Black)     | `clamp(2.5rem, 4.5vw, 4.5rem)`  | `2.25rem` (`36px`)   | `0.94`    | `-0.02em`    | `UPPERCASE` |
| `h1`                 | Page Title (Catalog, About, Cart)            | Archivo                    | `700` (Bold)      | `2.25rem` (`36px`)            | `1.75rem` (`28px`)   | `1.08`    | `-0.02em`    | `UPPERCASE` |
| `h2`                 | Section Header (`FEATURED`, `COMMUNITY`) | Archivo                    | `700` (Bold)      | `1.5rem` (`24px`)             | `1.25rem` (`20px`)   | `1.15`    | `-0.015em`   | `UPPERCASE` |
| `h3`                 | PDP Product Title / Collection Card Title    | Archivo                    | `600` (SemiBold)  | `1.25rem` (`20px`)            | `1.125rem` (`18px`)  | `1.25`    | `-0.01em`    | `UPPERCASE` |
| `product-card-title` | Catalog Grid Product Name                    | Inter                      | `500` (Medium)    | `0.875rem` (`14px`)           | `0.8125rem` (`13px`) | `1.35`    | `0.01em`     | `UPPERCASE` |
| `price-lg`           | PDP Primary Price                            | Inter (`tabular-nums`)   | `600` (SemiBold)  | `1.125rem` (`18px`)           | `1rem` (`16px`)      | `1.2`     | `0em`        | None          |
| `price-sm`           | Catalog Card & Cart Item Price               | Inter (`tabular-nums`)   | `400` (Regular)   | `0.875rem` (`14px`)           | `0.8125rem` (`13px`) | `1.35`    | `0em`        | None          |
| `body-lg`            | Brand Story / Editorial Lead Copy            | Inter                      | `400` (Regular)   | `1.0625rem` (`17px`)          | `0.9375rem` (`15px`) | `1.65`    | `-0.005em`   | None          |
| `body-base`          | PDP Description, Policy Text, Forms          | Inter                      | `400` (Regular)   | `0.875rem` (`14px`)           | `0.875rem` (`14px`)  | `1.6`     | `0em`        | None          |
| `label-ui`           | Nav Links, Buttons, Filter Headers           | Inter                      | `600` (SemiBold)  | `0.75rem` (`12px`)            | `0.75rem` (`12px`)   | `1.2`     | `0.08em`     | `UPPERCASE` |
| `meta-caps`          | Badges, SKU, Breadcrumbs, Specs              | Inter (`tabular-nums`)   | `500` (Medium)    | `0.6875rem` (`11px`)          | `0.6875rem` (`11px`) | `1.2`     | `0.10em`     | `UPPERCASE` |

---

## 5. Spacing System

Use an **8px base spatial grid** with `4px` micro-steps reserved for tight typographic pairings (e.g., gap between product title and price on a catalog card).

### 5.1 Spacing Tokens

| Token        | Value (`rem` / `px`) | Application                                                    |
| :----------- | :----------------------- | :------------------------------------------------------------- |
| `space-1`  | `0.25rem` (`4px`)    | Gap between product card title and price; status dot to label  |
| `space-2`  | `0.5rem` (`8px`)     | Gap between color swatches; icon to button label               |
| `space-3`  | `0.75rem` (`12px`)   | Product image to card metadata; filter item vertical padding   |
| `space-4`  | `1rem` (`16px`)      | Mobile container horizontal padding; catalog grid gap (mobile) |
| `space-5`  | `1.25rem` (`20px`)   | Catalog grid horizontal gap (desktop)                          |
| `space-6`  | `1.5rem` (`24px`)    | Tablet horizontal padding; form field stack spacing            |
| `space-8`  | `2rem` (`32px`)      | Catalog grid vertical row gap; PDP internal module spacing     |
| `space-10` | `2.5rem` (`40px`)    | Desktop container horizontal padding (`px-10`)               |
| `space-12` | `3rem` (`48px`)      | Mobile vertical section padding                                |
| `space-16` | `4rem` (`64px`)      | Tablet vertical section padding; filter sidebar right gap      |
| `space-24` | `6rem` (`96px`)      | Desktop standard vertical section spacing                      |
| `space-32` | `8rem` (`128px`)     | Editorial lookbook / Brand Story vertical breathing room       |

---

## 6. Layout and Grid Rules

### 6.1 Containers & Max-Widths

- **Primary Storefront Container:** `max-width: 1600px`, centered (`margin: 0 auto`), horizontal padding `16px` (`<768px`), `24px` (`768px–1023px`), `40px` (`≥1024px`).
- **Full-Bleed Sections:** Hero banner, split 50/50 collection banners, and campaign dividers span `100vw` edge-to-edge.
- **Transactional Container (Cart & Checkout):** `max-width: 1200px` centered to keep eye movement tight during form completion and payment review.
- **Editorial Reading Container (About & Policy Pages):** Text blocks constrained to `max-width: 68ch` (`~640px`) within a 12-column editorial grid.

### 6.2 Structural Grid Specifications

| Context                              | Desktop (`≥1280px`)                                          | Small Desktop (`1024–1279px`)                                | Tablet (`768–1023px`)            | Mobile (`<768px`)                               |
| :----------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------------------- | :---------------------------------- | :------------------------------------------------ |
| **Global Macro Grid**          | 12 columns, `24px` gap                                        | 12 columns, `20px` gap                                        | 8 columns, `16px` gap             | 4 columns, `12px` gap                           |
| **Homepage Featured Products** | 4 columns, `20px` col / `36px` row gap                      | 4 columns, `16px` col / `32px` row gap                      | 3 columns, `16px` gap             | 2 columns, `12px` col / `24px` row gap        |
| **Product Catalog Layout**     | `260px` sticky sidebar + `1fr` (4-col product grid)         | `240px` sticky sidebar + `1fr` (3-col product grid)         | Drawer filter + 3-col product grid  | Drawer filter + 2-col product grid (`12px` gap) |
| **Product Detail Page (PDP)**  | `7 cols` (`58%`) Gallery + `5 cols` (`42%`) Sticky Info | `6 cols` (`50%`) Gallery + `6 cols` (`50%`) Sticky Info | Single column stack                 | Single column stack (edge-to-edge swipe gallery)  |
| **Community Lookbook**         | 12-col asymmetric editorial masonry (`8px` gap)               | 12-col asymmetric grid (`8px` gap)                            | 6-col asymmetric grid (`8px` gap) | 2-col dense grid (`4px` gap)                    |

---

## 7. Component Design Guidelines

### 7.1 Zero-Radius Structural Rule

Every UI component—buttons, inputs, dropdowns, modals, drawers, product cards, size tiles, badges, and accordions—must use **`border-radius: 0px` (`rounded-none`)**. The only exception is a `6px × 6px` status indicator dot (`rounded-full`) next to stock status text.

### 7.2 Modals & Drawers

- **Backdrop Scrim:** `rgba(10, 10, 10, 0.55)` with zero blur (`backdrop-filter: none`) for high performance and crisp contrast.
- **Size Guide Modal (PDP):** Centered overlay (`max-width: 680px`, `width: 92vw`, `#FFFFFF` background, `1px solid #0A0A0A` border, `32px` padding on desktop / `20px` on mobile). Includes a garment silhouette diagram, tabular measurement matrix (`Chest`, `Body Length`, `Shoulder`, `Sleeve Length` in `cm` and `inches` toggle), and fit notes (e.g., *"Boxy dropped-shoulder silhouette. Model is 181cm / 68kg wearing size L"*).
- **Mobile Filter Drawer & Mini-Cart Drawer:** Slide-over panel (`width: min(420px, 100vw)`), anchored right (Mini-Cart) or left (Mobile Filters), full viewport height (`100dvh`), divided into fixed header (`56px`), scrollable body, and sticky action footer (`padding: 16px 20px`, `border-top: 1px solid #E2E1DC`).

### 7.3 Accordions (PDP Description, Delivery, Terms & Conditions)

- Top and bottom `1px solid #E2E1DC` dividers.
- Header: `height: 52px`, flex justify-between, `label-ui` (`12px`, `600`, uppercase, `0.08em` tracking), right-aligned Lucide `Plus` (`16px`) that rotates/swaps to `Minus` when expanded.
- Content wrapper: Smooth height transition (`200ms cubic-bezier(0.22, 1, 0.36, 1)`), bottom padding `20px`, `body-base` (`14px`, `#292929`).

### 7.4 Badges (Strict Scarcity Rule)

Badges are restricted to **inventory reality**, never generic marketing hype (no `"HOT"`, `"BESTSELLER"`, `"SALE🔥"`, or `"NEW ARRIVAL"` stickers cluttering every image).

- **Placement:** Top-left corner of the product image container (`top: 10px; left: 10px`). Maximum **1 badge** per product card.
- **`SOLD OUT` Badge:** Background `#0A0A0A`, Text `#FFFFFF`, padding `4px 8px`, font `meta-caps` (`11px`, `500`, `0.10em` tracking).
- **`LIMITED STOCK` Badge** (triggers automatically when total variant stock `≤ 5` units): Background `#FFFFFF`, Border `1px solid #E52323`, Text `#E52323`, padding `3px 7px`, font `meta-caps`.
- **`DROP SOON` Badge** (scheduled release): Background `#F5F4F0`, Border `1px solid #0A0A0A`, Text `#0A0A0A`, padding `3px 7px`, font `meta-caps`.

---

## 8. Button and Form Specifications

### 8.1 Button Hierarchy & States

All buttons enforce `border-radius: 0px`, `font-size: 12px`, `font-weight: 600`, `letter-spacing: 0.08em`, `text-transform: uppercase`, and `transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease`.

| Variant                                                                             | Default State                                                                | Hover State                                                   | Active / Pressed                 | Disabled / Sold Out                                                              | Dimensions                                            |
| :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------ | :------------------------------- | :------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Primary Solid** (`BUY IT NOW`, `PROCEED TO CHECKOUT`, `PAY NOW`)      | Bg: `#0A0A0A`Text: `#FFFFFF`Border: `1px solid #0A0A0A`                | Bg: `#292929`Text: `#FFFFFF`Border: `1px solid #292929` | Bg: `#000000`                  | Bg: `#E2E1DC`Text: `#6E6E6A`Border: `1px solid #E2E1DCcursor: not-allowed` | Height: `48px` (`52px` on PDP)Padding: `0 28px` |
| **Secondary Outline** (`ADD TO CART`, `CONTINUE SHOPPING`, `CLEAR ALL`) | Bg: `#FFFFFF`Text: `#0A0A0A`Border: `1px solid #0A0A0A`                | Bg: `#0A0A0A`Text: `#FFFFFF`Border: `1px solid #0A0A0A` | Bg: `#292929`Text: `#FFFFFF` | Bg: `#F5F4F0`Text: `#6E6E6A`Border: `1px solid #E2E1DC`                    | Height: `48px` (`52px` on PDP)Padding: `0 28px` |
| **Campaign Inverse** (Hero CTA on dark photo)                                 | Bg: `#FFFFFF`Text: `#0A0A0A`Border: `1px solid #FFFFFF`                | Bg: `#E52323`Text: `#FFFFFF`Border: `1px solid #E52323` | Bg: `#C41919`                  | N/A                                                                              | Height: `48px`Padding: `0 32px`                   |
| **Editorial Text Link** (`EXPLORE COLLECTION`, `SIZE GUIDE`)              | Text: `#0A0A0A`Bottom border: `1px solid #0A0A0A`Padding-bottom: `2px` | Text: `#6E6E6A`Bottom border: `1px solid #6E6E6A`         | Text: `#0A0A0A`                | Text: `#E2E1DC`                                                                | Inline                                                |

### 8.2 Purchase Button Visual Hierarchy (PDP Rule)

On the Product Detail Page, `ADD TO CART` and `BUY IT NOW` must not visually clash:

- **`ADD TO CART`:** Uses **Secondary Outline** (`#FFFFFF` fill, `1px solid #0A0A0A` border, `#0A0A0A` text).
- **`BUY IT NOW`:** Uses **Primary Solid** (`#0A0A0A` fill, `#FFFFFF` text).
- Layout: Stacked vertically (`gap: 10px`) or side-by-side 50/50 (`gap: 12px`) spanning `100%` of the purchase column width. When a variant is out of stock, both buttons collapse into a single full-width disabled button labeled `SOLD OUT` (`#E2E1DC` fill, `#6E6E6A` text).

### 8.3 Form Controls & Inputs

- **Text / Email / Phone Inputs & Select Dropdowns:**
  - Height: `46px` (`padding: 0 14px`), Background: `#FFFFFF`, Border: `1px solid #E2E1DC`, Border-radius: `0px`.
  - Typography: `14px` Inter Regular (`#0A0A0A`), placeholder `#6E6E6A`. Note: On mobile (`<768px`), enforce `font-size: 16px` on `<input>` and `<select>` elements to prevent iOS Safari auto-zoom on focus.
  - **Focus State:** `border-color: #0A0A0A`, `outline: none`. No glowing blue or blurred box-shadows.
  - **Error State:** `border-color: #E52323`, accompanied by a `12px` `#E52323` message `6px` below the input.
- **Labels:** Always visible above the input (`margin-bottom: 6px`), styled in `meta-caps` (`11px`, `600`, `0.08em` tracking, `#0A0A0A`). Never rely on placeholder-only forms.
- **Size Selector Tiles (PDP & Catalog Filter):**
  - Minimum dimensions: `48px × 44px` (`padding: 0 12px`), `border: 1px solid #E2E1DC`, centered `12px` Inter Medium.
  - **Selected:** `background: #0A0A0A`, `color: #FFFFFF`, `border-color: #0A0A0A`.
  - **Unavailable / Out of Stock:** `background: #F5F4F0`, `color: #6E6E6A`, `border-color: #E2E1DC`, diagonal `1px` SVG line from bottom-left to top-right (`stroke: #E2E1DC`), `cursor: not-allowed`.
- **Quantity Stepper:**
  - Unified rectangular box (`height: 44px`, `width: 124px`, `border: 1px solid #E2E1DC`), split into three cells: `[ - ]` (`38px`), `[ qty ]` (`48px`, `tabular-nums`, centered), `[ + ]` (`38px`).
  - `[ + ]` button disables automatically when `quantity === variant.stock_quantity` or `variant.max_per_order`.

---

## 9. Icon Guidelines

### 9.1 Library & Stroke Consistency

- **Library:** **Lucide Icons** (`lucide-react`) exclusively. Never mix FontAwesome, Heroicons, Feather, or custom multi-tone SVGs.
- **Emoji Prohibition:** **Never use emojis** (`🔥`, `🛒`, `✨`, `✅`, `📦`, `❤️`) anywhere in the UI, transactional emails, empty states, or toast notifications.
- **Stroke Width:** `1.5px` across all standard `20px` and `24px` icons; `1.75px` for `14px–16px` micro-icons so strokes stay crisp on `1x` and `2x` displays.
- **Sizes:**
  - `14px`: Breadcrumb chevrons, external link arrows (`ArrowUpRight`), sort indicators.
  - `16px`: Accordion `Plus` / `Minus`, filter checkboxes (`Check`), quantity `Minus` / `Plus`.
  - `20px`: Header action icons (`Search`, `User`, `Heart`, `ShoppingBag`), drawer close (`X`), filter trigger (`SlidersHorizontal`).

### 9.2 Authorized Icon Mapping

| Function            | Lucide Icon Name      | Usage Notes                                                 |
| :------------------ | :-------------------- | :---------------------------------------------------------- |
| Search              | `Search`            | Header search trigger & catalog search bar                  |
| Wishlist            | `Heart`             | Outline `#0A0A0A` default; filled `#0A0A0A` when saved  |
| Cart / Bag          | `ShoppingBag`       | Paired with plain tabular count e.g. `BAG (2)` or `[2]` |
| Account             | `User`              | Header profile link                                         |
| Mobile Menu / Close | `Menu` / `X`      | Mobile navigation drawer toggle                             |
| Filter Trigger      | `SlidersHorizontal` | Mobile filter bar button                                    |
| Accordion Toggle    | `Plus` / `Minus`  | PDP collapsible sections                                    |
| Remove Item         | `Trash2` or `X`   | Cart line item removal                                      |

---

## 10. Product Card Specifications

The Product Card is the core unit of the storefront. It must remain austere, letting the garment cut, wash, and graphic speak.

### 10.1 Anatomy & Visual Rules

```text
+-----------------------------------+
| [LIMITED STOCK]                   |  <- Optional single badge (top-left, 10px inset)
|                                   |
|                                   |
|           4:5 PORTRAIT            |  <- Primary Image (Front View)
|          PRODUCT IMAGE            |     Crossfades to Secondary Image (Back View)
|        (Bg: #F5F4F0 base)         |     on hover (220ms ease-out)
|                                   |
|                                   |
+-----------------------------------+
  HEAVYWEIGHT BOX HOODIE - WASHED      <- 14px Inter Medium, UPPERCASE, #0A0A0A, 1-line truncate
  Rp 749.000                           <- 14px Inter Regular, tabular-nums, #292929
  [■] [□]                              <- Optional 10x10px square color swatches (max 4 + "+N")
```

1. **Image Container:**
   - **Aspect Ratio:** Strict `4:5` portrait (`aspect-[4/5]`), `overflow: hidden`, `background-color: #F5F4F0`, `position: relative`, `border-radius: 0px`.
   - **Primary Image (`z-10`):** Front studio garment shot or primary lookbook frame.
   - **Secondary Image (`z-20`):** Back view of the garment (or close-up print detail if back is plain). Positioned `absolute inset-0`, `opacity: 0` by default.
   - **Hover Interaction (Desktop `@media (hover: hover)`):** On card hover, the secondary image transitions to `opacity: 1` over `220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`. **No image zoom/scale (`scale(1.05)` is prohibited)** unless a product lacks a secondary image, in which case a subtle `scale(1.02)` over `400ms` is used as fallback.
2. **Metadata Block (`padding-top: 12px`):**
   - **Product Name:** `14px` (`13px` mobile), Inter `500`, uppercase, `#0A0A0A`, single-line ellipsis (`truncate`) or max 2 lines (`line-clamp-2`).
   - **Price Row (`margin-top: 4px`):** Formatted in IDR (`Rp 749.000` with dot thousands separator, no `.00` decimals) or USD (`$52.00`) based on active currency selector. If discounted during an archive sale, display original price struck through in `#6E6E6A` followed by final price in `#E52323`.
   - **Color Swatches (`margin-top: 8px`, optional):** Rendered only when a product has `> 1` color variant. Square `10px × 10px` tiles (`border: 1px solid #E2E1DC`, `gap: 6px`).
3. **Sold-Out Card State:**
   - Displays `SOLD OUT` badge at `top: 10px; left: 10px`.
   - Image remains full color at `opacity: 0.75` (do not desaturate into grayscale, as customers still inspect colorways of archival/sold-out drops).
   - Price text changes to `#6E6E6A`.
4. **Prohibited on Product Cards:**
   - No star ratings or review counts.
   - No quick-add `"ADD TO CART"` buttons overlaying the image.
   - No category subtitle or verbose description paragraphs.

---

## 11. Navigation and Footer Specifications

### 11.1 Global Header & Navigation (`calledelarache.com` Adapted)

- **Announcement / Drop Bar (Optional, CMS-toggled):**
  - Height: `32px`, Background: `#0A0A0A`, Text: `#FFFFFF`, centered `meta-caps` (`11px`, `0.10em` tracking). Example: `COLLECTION 04: "SILENT RIOT" NOW LIVE — FREE DOMESTIC SHIPPING OVER RP 1.500.000`.
- **Main Header Bar:**
  - Height: `68px` (Desktop) / `56px` (Mobile).
  - Position: `sticky top-0 z-40`, Background: `rgba(255, 255, 255, 0.96)` (solid `#FFFFFF` when scrolled or menu open), bottom border `1px solid #E2E1DC`.
  - **3-Zone Desktop Layout (`px-10`):**
    - **Left Zone (Primary Navigation):** Horizontal links (`gap: 32px`), `label-ui` (`12px`, `600`, uppercase, `0.08em` tracking):
      - `SHOP` (hovering opens a full-width clean architectural dropdown with columns: `CATEGORIES`, `COLLECTIONS`, and 1 featured editorial campaign card)
      - `COLLECTIONS`
      - `COMMUNITY`
      - `ABOUT`
    - **Center Zone (Brand Wordmark):** Centered SVG wordmark (`height: 22px` desktop / `18px` mobile), high-contrast `#0A0A0A`.
    - **Right Zone (Utility Controls, `gap: 24px`):**
      - Currency / Region Indicator (`IDR / ID` or `USD / INTL` in `meta-caps`)
      - `SEARCH` (triggers a full-width `72px` slide-down search bar directly beneath the header with instant live product suggestions)
      - `WISHLIST` (`Heart` icon + count if `> 0`)
      - `ACCOUNT` (`User` icon or `LOGIN`)
      - `BAG (N)` (`ShoppingBag` icon + tabular item count)
- **Mobile Navigation Drawer (`<1024px`):**
  - Left-side hamburger (`Menu`, `20px`), center wordmark, right-side `Search` + `ShoppingBag` icons.
  - Opening `Menu` slides a full-screen `#FFFFFF` drawer from the left containing large `24px` Archivo Bold uppercase links (`SHOP ALL`, expandable `CATEGORIES`, `COLLECTIONS`, `COMMUNITY`, `ABOUT`), followed by a `1px solid #E2E1DC` divider and utility links (`MY ACCOUNT`, `WISHLIST`, `TRACK ORDER`, `CURRENCY: IDR`).

### 11.2 Global Footer

- **Background:** `#0A0A0A` (Ink Black) with `#FFFFFF` primary headings and `#A1A19A` secondary links, creating a heavy editorial anchor at the bottom of every page.
- **Top Grid (`padding: 72px 40px 56px`, 12-column grid):**
  - **Cols 1–4 (Brand Identity & Newsletter):** Brand SVG wordmark in `#FFFFFF`, concise 2-sentence brand manifesto (`14px`, `#A1A19A`, `max-width: 340px`), and an inline Newsletter form (`border-bottom: 1px solid #FFFFFF` input + `SUBSCRIBE →` button).
  - **Cols 5–6 (`SHOP`):** `All Products`, `New Releases`, `Tops & Tees`, `Outerwear`, `Bottoms`, `Accessories`, `Archives`.
  - **Cols 7–8 (`INFORMATION`):** `About the Brand`, `Community Lookbook`, `Size Guide`, `Store Locator / Stockists`.
  - **Cols 9–10 (`CLIENT SERVICES`):** `Shipping & Delivery`, `Returns & Exchanges`, `Track Your Order`, `Terms & Conditions`, `Privacy Policy`, `Contact Us`.
  - **Cols 11–12 (`CONNECT`):** `Instagram`, `TikTok`, `YouTube`, operational hours, and customer support email/WhatsApp dispatch link.
- **Bottom Legal & Payment Bar (`border-top: 1px solid #292929`, `padding: 24px 40px`):**
  - **Left:** `© 2026 [BRAND NAME]. ALL RIGHTS RESERVED.` in `11px` uppercase `#6E6E6A`.
  - **Right (Dynamic Enabled Payment Methods):** Monochrome white/grey SVG logos (`height: 20px`, `opacity: 0.8`) dynamically rendered from active Xendit payment channels configured in the backend (e.g., `QRIS`, `BCA`, `Mandiri`, `BNI`, `BRI`, `OVO`, `GoPay`, `ShopeePay`, `Dana`, `Visa/Mastercard`). **Strict Rule:** Only render logos for channels actively enabled in the merchant's Xendit configuration.

---

## 12. Page-by-Page Layout Specifications

### 12.A Homepage (`/`)

Designed as an editorial issue that transitions naturally from campaign art direction into high-conversion product browsing.

1. **Section 1: Editorial Hero Banner (`min-height: calc(100dvh - 68px)`)**
   - Full-bleed campaign photograph (`100vw`) with subtle halftone/film-grain art direction and a bottom/left directional gradient scrim (`linear-gradient(to top, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0) 60%)`) only when required for text legibility.
   - **CMS Layout Modes:** Supports 3 admin-selectable compositions depending on photography:
     - *Mode A (Bottom-Left Editorial Anchor):* Oversized `display-hero` title, release metadata tag (`COLLECTION 04 // AUTUMN-WINTER`), 2-line description (`max-width: 440px`), and `EXPLORE COLLECTION` CTA at bottom-left (`40px` inset).
     - *Mode B (Split 50/50 Diptych):* Two full-height portrait campaign shots side-by-side with centered typographic lockup bridging the center seam.
     - *Mode C (Poster Frame):* `#0A0A0A` outer frame (`24px` padding) wrapping a high-contrast monochrome photograph with `#E52323` condensed campaign stamp.
2. **Section 2: Featured Collections (`padding: 96px 40px`)**
   - Asymmetric 2-column or 3-column architectural showcase (`gap: 20px`).
   - Primary Collection takes `7 columns` (`aspect-[16/10]`); Secondary Collection takes `5 columns` (`aspect-[4/5]`).
   - Below each image: Collection index (`[01]`), Collection Title (`h3` Archivo `20px` uppercase), 1-sentence curatorial note (`14px` `#292929`), and underlined `EXPLORE COLLECTION` link.
3. **Section 3: Featured Products Grid (`padding: 0 40px 96px`)**
   - Header bar: Left-aligned `FEATURED RELEASES` (`h2`), right-aligned `VIEW ALL PRODUCTS (42) →` link.
   - Grid: 4 columns on desktop (`2 columns` on mobile), displaying 8 curated products using the standard `4:5` Product Card with front-to-back hover transition.
4. **Section 4: Brand Story / Editorial Manifesto (`background: #F5F4F0`, `padding: 96px 40px`)**
   - 12-column layout: Columns `1–5` feature a portrait studio/workshop photograph (e.g., screen-printing detail, heavy 375gsm fabric close-up, woven label stitching); Columns `7–12` present a bold typographic statement (`32px` Archivo Bold uppercase), 2 concise paragraphs on construction quality and independent ethos, and a `READ OUR STORY` link to `/about`.
5. **Section 5: Limited Campaign / Drop Spotlight (`full-bleed`, `background: #0A0A0A`, `color: #FFFFFF`)**
   - Dedicated promotional module for limited capsule drops.
   - Features poster-style condensed typography (`display-promo`), `#E52323` release timestamp or live drop countdown timer (`DD : HH : MM : SS` in `tabular-nums`), and direct link to the capsule collection. Zero cheesy promo badges.
6. **Section 6: Community Lookbook Preview (`padding: 96px 40px`)**
   - Header: `WORN BY THE COMMUNITY` (`h2`) + `VIEW FULL ARCHIVE →` link to `/community`.
   - 5-image asymmetric horizontal strip (`gap: 8px`) showing real customers styling the garments. Hovering an image reveals a minimal bottom bar with `@username` and the linked product name.
7. **Section 7: Minimal Newsletter Capture (`border-top: 1px solid #E2E1DC`, `padding: 72px 40px`)**
   - Centered or 2-column split: `"EARLY ACCESS TO LIMITED DROPS & ARCHIVE RELEASES."` paired with a single-line email input (`height: 48px`, `width: 360px`) and `JOIN` solid button.

---

### 12.B Product Catalog Page (`/catalog` or `/collections/[slug]`)

Prioritizes fast filtering, clear inventory visibility, and zero visual fatigue.

```text
+-----------------------------------------------------------------------------------+
| HOME / CATALOG / ALL PRODUCTS                                                     |
| ALL PRODUCTS (48)                            [SEARCH INPUT...]   SORT: FEATURED v |
+----------------------+------------------------------------------------------------+
| FILTERS      [CLEAR] |  +------------+  +------------+  +------------+  +-------+ |
|                      |  |            |  | [SOLD OUT] |  |            |  |       | |
| CATEGORY           - |  |   4:5 IMG  |  |   4:5 IMG  |  |   4:5 IMG  |  |  4:5  | |
| [x] Tees & Polos (18)|  |  (Hover->  |  |  (Hover->  |  |  (Hover->  |  |  IMG  | |
| [ ] Outerwear    (10)|  |   Back)    |  |   Back)    |  |   Back)    |  |       | |
| [ ] Bottoms      (12)|  +------------+  +------------+  +------------+  +-------+ |
| [ ] Accessories   (8)|  BOX TEE BLACK   WORK JACKET     HEAVY HOODIE    CARGO PNT |
|                      |  Rp 399.000      Rp 958.000      Rp 749.000      Rp 680.000|
| AVAILABILITY       - |                                                            |
| [x] In Stock     (39)|  +------------+  +------------+  +------------+  +-------+ |
| [ ] Sold Out      (9)|  |   4:5 IMG  |  |   4:5 IMG  |  |   4:5 IMG  |  |  4:5  | |
|                      |  ...                                                       |
| SIZE               - |                                                            |
| [S] [M] [L] [XL]     |                                                            |
+----------------------+------------------------------------------------------------+
```

1. **Catalog Top Utility Bar:**
   - Breadcrumb (`HOME / SHOP / OUTERWEAR` in `11px` uppercase `#6E6E6A`).
   - Title & Live Count: `ALL PRODUCTS (48)` (`h1`).
   - Right-aligned Controls:
     - Inline Search input (`width: 260px`, `height: 40px`, icon `Search`, queries product name, collection, category, and product type with `300ms` debounce).
     - Sort Dropdown (`height: 40px`, `border: 1px solid #E2E1DC`): `Featured` (default), `Newest`, `Price: Low to High`, `Price: High to Low`, `Best Selling`.
2. **Left Filter Sidebar (Desktop `260px` width, `sticky top-[88px]`, scrollable `max-height: calc(100dvh - 108px)`):**
   - Header: `FILTERS` (`12px` bold uppercase) + inline underlined `CLEAR ALL (N)` action (visible only when `≥1` filter is active). Do **not** render rows of pill badges for active filters; instead, highlight active checkboxes/tiles directly inside their filter groups and show the total active count in `CLEAR ALL (2)`.
   - **6 Collapsible Filter Groups** (all open by default on desktop):
     1. **Category:** Multi-select checkboxes (`Tees`, `Tops & Shirts`, `Outerwear`, `Hoodies & Knits`, `Bottoms`, `Headwear`, `Accessories`) with item counts `(14)`.
     2. **Product Type:** `All Products`, `Featured Release`, `Core Collection`, `Collaboration`, `Archive`.
     3. **Availability:** `In Stock`, `Out of Stock`.
     4. **Price Range:** Predefined brackets (inspired by `calledelarache.com`, e.g., `Under Rp 450.000`, `Rp 450.000 – Rp 750.000`, `Above Rp 750.000`) plus custom Min/Max numeric inputs (`Rp`).
     5. **Color:** `16px × 16px` square color swatch + color name (`Pitch Black`, `Bone White`, `Washed Charcoal`, `Crimson Red`, `Olive Drab`).
     6. **Size:** 4-column compact grid of rectangular size tiles (`S`, `M`, `L`, `XL`, `XXL` and numeric `28–36` / `39–45`).
3. **Mobile Catalog Adaptation (`<1024px`):**
   - Sticky 2-button bar directly below header (`height: 44px`, `border-bottom: 1px solid #E2E1DC`): Left half `FILTER (N)` (`SlidersHorizontal` icon), Right half `SORT BY: FEATURED`.
   - Tapping `FILTER` opens the left Filter Drawer with a sticky bottom `APPLY FILTERS (24 PRODUCTS)` primary button.
4. **Empty Filter State:**
   - Centered within the right product column (`padding: 80px 20px`): `"NO PRODUCTS MATCH YOUR SELECTED FILTERS."` in `16px` Archivo SemiBold uppercase, subtext `"Try removing one or more filters to broaden your search."`, and a `RESET ALL FILTERS` outline button.

---

### 12.C Product Detail Page (`/products/[slug]`)

Engineered for visual authority, material transparency, and frictionless conversion.

1. **Desktop Two-Column Architecture (`max-width: 1600px`, `padding: 32px 40px 96px`, `gap: 48px`):**
   - **Left Column (`58%` width): Product Image Gallery**
     - **Required 5-Shot Standard per Product:** (1) Front Studio View, (2) Back Studio View, (3) Side / Silhouette Angle, (4) Macro Fabric / Embroidery / Print Texture Close-up, (5) Editorial Lifestyle On-Body Shot.
     - **Desktop Gallery Layout:** Vertical thumbnail strip (`width: 76px`, `gap: 12px`, `4:5` thumbnails with `1px solid #0A0A0A` border on active frame) on the far left + Large Main Image Viewer (`aspect-[4/5]`, `width: 100%`, `#F5F4F0` background) with click-to-zoom (`2x` high-res pan or fullscreen lightbox).
     - **Mobile Gallery Layout (`<1024px`):** Full-bleed horizontal touch carousel (`100vw`, `aspect-[4/5]`) with a crisp numeric counter badge `1 / 5` at bottom-right (`meta-caps`) and horizontal thumbnail strip below.
   - **Right Column (`42%` width, `max-width: 520px`, `sticky top-[92px]`): Information & Purchase Module**
     1. **Breadcrumbs & Availability Status:**

        - Top row: `SHOP / OUTERWEAR` on left; Dynamic Inventory Status on right:
          - `● IN STOCK` (`#166534` dot + `meta-caps` text)
          - `● LIMITED STOCK — ONLY 3 LEFT` (`#E52323` dot + text when variant stock `≤ 5`)
          - `● SOLD OUT` (`#6E6E6A` dot + text)
     2. **Product Title & Price (`margin-top: 12px`):**

        - Product Name in `h3` (`20px–24px` Archivo SemiBold uppercase, `#0A0A0A`).
        - Price in `price-lg` (`18px` Inter SemiBold `tabular-nums`, `#0A0A0A`), e.g., `Rp 958.000`.
     3. **Short Editorial Summary (`margin-top: 16px`):**

        - 2–3 concise sentences highlighting fabric weight and silhouette (e.g., *"Constructed from custom-milled 375gsm heavyweight cotton fleece with pigment garment-wash finish and plastisol back print."*).
     4. **Color Selector (`margin-top: 24px`):**

        - Label: `COLOR: PITCH BLACK` (`meta-caps`).
        - Swatches: `32px × 32px` square color tiles (`border: 1px solid #E2E1DC`; active swatch has `2px` `#FFFFFF` inner ring and `1px solid #0A0A0A` outer border).
     5. **Size Selector & Inline Size Guide (`margin-top: 24px`):**

        - Header row: `SELECT SIZE` (`meta-caps`) on left; underlined `SIZE GUIDE` button (`Ruler` `14px` icon) on right.
        - Size Grid: Horizontal row of rectangular size tiles (`S`, `M`, `L`, `XL`, `XXL`). Out-of-stock sizes show the diagonal cross-out line and cannot be added to cart.
        - Clicking `SIZE GUIDE` opens the **Size Guide Modal** without navigating away from the PDP.
     6. **Quantity Selector & Wishlist Row (`margin-top: 24px`):**

        - Label: `QUANTITY` (`meta-caps`, with dynamic sub-note `Max 2 per customer` if drop-limited).
        - Flex row: Quantity Stepper (`[ - ] [ 1 ] [ + ]`, validated against `variant.stock_quantity`) + Wishlist toggle button (`44px × 44px`, `border: 1px solid #E2E1DC`, `Heart` icon; prompts unauthenticated users with a lightweight login modal/redirect with return URL).
     7. **Primary Purchase Actions (`margin-top: 24px`):**

        - `ADD TO CART`: Full-width Secondary Outline Button (`height: 52px`, `#FFFFFF` bg, `#0A0A0A` border/text; hovers to `#0A0A0A`). Opens the slide-over Mini-Cart confirmation or updates header bag count.
        - `BUY IT NOW`: Full-width Primary Solid Button (`height: 52px`, `#0A0A0A` bg, `#FFFFFF` text) placed `10px` below `ADD TO CART`. Bypasses the cart page and routes directly to `/checkout`.
     8. **Delivery Information Block (`margin-top: 28px`, `padding: 16px`, `background: #F5F4F0`, `border: 1px solid #E2E1DC`):**

        - Inspired by `calledelarache.com`'s structured shipping transparency block, connected to dynamic admin/product data:

        ```text
        DELIVER TO:   [ Pick Area / Select City v ]
        WEIGHT:       1000g (Dynamic from product.weight_grams)
        DISPATCH:     Shipped within 1–2 business days (Upon confirmation of payment)
        ESTIMATED:    Rp 18.000 — Regular (2–3 Days)  [Updated when area selected]
        ```

        - **Strict Implementation Rule:** `product.weight_grams` and dispatch SLA text are configured per product/store in the Laravel Filament Admin Panel—never hardcode unrealistic static strings like `"48 days"`.
     9. **Collapsible Accordions (`margin-top: 24px`):**

        - **Accordion 1 — `DESCRIPTION & SPECIFICATIONS` (Expanded by default):** Bullet list of material composition (e.g., `100% Cotton Combed 16s / 235 GSM`), print/embroidery technique, fit profile, country of manufacture (`Made in Indonesia`), and care instructions (`Cold machine wash inside out, do not iron directly on print`).
        - **Accordion 2 — `TERMS & CONDITIONS` (Collapsed by default):** Product policy, return/exchange eligibility (e.g., *Unwashed, unworn with tags attached within 7 days of receipt; mandatory unboxing video required for defect claims*), order cancellation timer rules, and limited release purchase conditions.
2. **Below-the-Fold Related Sections (`padding-top: 80px`, `border-top: 1px solid #E2E1DC`):**
   - **Section A: `YOU MIGHT ALSO LIKE`:** 4-column product card grid pulling items from the same collection or complementary category.
   - **Section B: `RECENTLY VIEWED`:** 4-column product card grid persisted in `localStorage` (hydrated client-side, hidden if user has viewed `< 2` products).

---

### 12.D Shopping Cart Page (`/cart`)

Dedicated full-page review experience (supported by an optional quick slide-over drawer when clicking `ADD TO CART`).

1. **Desktop Layout (`max-width: 1200px`, 12-column grid, `padding: 56px 40px 96px`):**
   - **Left Column (`8 columns`): Cart Items Table**
     - Table Header (`border-bottom: 1px solid #0A0A0A`, `padding-bottom: 12px`, `meta-caps`): `PRODUCT`, `PRICE`, `QUANTITY`, `SUBTOTAL`.
     - Each Row (`padding: 24px 0`, `border-bottom: 1px solid #E2E1DC`):
       - `80px × 100px` (`4:5`) product thumbnail (`#F5F4F0` bg).
       - Product Name (`14px` Inter SemiBold uppercase, clickable to PDP), Selected Color & Size (`COLOR: BLACK / SIZE: L` in `12px` `#6E6E6A`), and low-stock warning if live inventory dropped below requested quantity.
       - Unit Price (`tabular-nums`).
       - Compact Quantity Stepper (`[ - ] [ 1 ] [ + ]`) with optimistic update and stock cap check.
       - Line Subtotal (`tabular-nums`, `600` weight) + `Remove` icon button (`X` or underlined `REMOVE` in `11px` `#6E6E6A`).
     - Below Table: `← CONTINUE SHOPPING` link returning to `/catalog`.
   - **Right Column (`4 columns`, `sticky top-[92px]`): Order Summary Box**
     - Container: `background: #F5F4F0`, `border: 1px solid #E2E1DC`, `padding: 28px`.
     - Rows: `SUBTOTAL`, `ESTIMATED WEIGHT` (`e.g., 1.800g`), `SHIPPING` (`Calculated at checkout`), `TOTAL` (`18px` Archivo Bold `tabular-nums`).
     - Inventory Validation Gate: Before navigating to `/checkout`, trigger an API stock verification check (`POST /api/v1/cart/validate`). If any item's stock was depleted by another buyer, highlight the affected row in `#E52323` and prompt adjustment.
     - CTA: Full-width `PROCEED TO CHECKOUT` Primary Solid button (`height: 52px`).
2. **Empty Cart State:**
   - Centered block (`padding: 120px 20px`): `"YOUR SHOPPING BAG IS EMPTY."` (`h2`), subtext `"Explore our latest collections and limited releases."`, and a `SHOP ALL PRODUCTS` Primary Solid button.

---

### 12.E Checkout and Xendit Payment Gateway (`/checkout` & `/orders/[orderNumber]/payment`)

Clean, distraction-free, security-focused transactional flow. Uses a **minimal Checkout Header** (Brand Wordmark on left, `RETURN TO CART` on right; main navigation links hidden to prevent drop-off).

1. **Two-Column Checkout Layout (`max-width: 1200px`, `padding: 48px 40px 96px`):**
   - **Left Column (`7 columns`): Customer, Shipping & Payment Selection**
     - **Step 1: Contact & Customer Information**
       - Full Name, Email Address (for order & Xendit receipt), Phone / WhatsApp Number (`+62` formatted). If logged in, pre-populated from user profile.
     - **Step 2: Shipping Address**
       - Saved Address selector (for authenticated users) or structured address form: Province, City/Regency, District (`Kecamatan`), Postal Code, Full Street Address, Optional Delivery Notes.
     - **Step 3: Shipping Method**
       - Dynamically calculated from destination + total cart weight (`grams`): Radio cards (`border: 1px solid #E2E1DC`, active `border: 1px solid #0A0A0A`) showing Courier Name (`JNE Regular`, `J&T Express`, `SiCepat BEST`, `Instant Courier`), Estimated Delivery Window (`1–2 Days`), and exact shipping fee (`Rp 18.000`).
     - **Step 4: Payment Method Selection (Dynamic from Backend Xendit Integration)**
       - Grouped radio list populated via `GET /api/v1/payments/channels` (returning only channels enabled in the merchant's Xendit account):
         - **QRIS:** Instant scan across all banking & e-wallet apps.
         - **Virtual Account (Bank Transfer):** `BCA`, `Mandiri`, `BNI`, `BRI`, `Permata`, `BSI`.
         - **E-Wallet:** `OVO`, `GoPay`, `ShopeePay`, `DANA`, `LinkAja`.
         - **Retail Outlets (if enabled):** `Alfamart`, `Indomaret`.
         - **Cards (if enabled):** `Visa / Mastercard / JCB`.
   - **Right Column (`5 columns`, `sticky top-[32px]`): Locked Order Summary**
     - Bordered container (`#F5F4F0` bg, `1px solid #E2E1DC`, `padding: 28px`).
     - Scrollable item list (`64px × 80px` thumbnail, title, variant `BLACK / L × 1`, subtotal).
     - **Discount / Voucher Input:** Single-line `PROMO / VOUCHER CODE` input + `APPLY` outline button. Displays applied discount code and `- Rp XX.XXX` deduction.
     - **Cost Breakdown (`tabular-nums`):**
       - `Subtotal`
       - `Shipping (JNE Regular — 1.000g)`
       - `Discount (if applied)`
       - **Divider (`1px solid #0A0A0A`)**
       - `TOTAL PAYMENT` (`20px` Archivo Bold)
     - Primary CTA: `PLACE ORDER & PAY` (`height: 54px`, `#0A0A0A` solid button).
2. **End-to-End Xendit Payment & Webhook Architecture:**
   - **Flow:**
     1. Customer submits checkout → Frontend sends `POST /api/v1/checkout` with an `Idempotency-Key` header (UUIDv4).
     2. Laravel backend validates live variant stock inside a database transaction (`SELECT ... FOR UPDATE`), reserves stock, creates the `Order` (`status: PENDING_PAYMENT`), and calls Xendit's official API/SDK to generate the payment request/invoice with an expiration timestamp (e.g., `24 hours` for Virtual Account, `15–30 minutes` for QRIS/E-Wallet).
     3. Customer is directed to `/orders/[orderNumber]/payment` (or Xendit's payment instruction view) displaying the dynamic QRIS code / Virtual Account number with a one-click `COPY` button, exact amount, step-by-step payment instructions accordion, and a live countdown timer (`PAY WITHIN 23:59:12`).
     4. Xendit dispatches a webhook event (`POST /api/v1/webhooks/xendit`) upon payment completion or expiration.
     5. Laravel backend verifies the `x-callback-token` header against Xendit's webhook verification token, checks the `external_id` and `payment_id` in an idempotent `payment_logs` table to prevent double-processing, updates `order.payment_status` (`PAID`, `EXPIRED`, or `FAILED`), commits or releases reserved inventory, and dispatches confirmation emails via Laravel Queue.
   - **Payment Status UI States (`/orders/[orderNumber]/payment`):**
     - **`PENDING`:** Amber indicator (`#B45309`), countdown timer, QRIS image or VA number, `"Waiting for payment confirmation. Page updates automatically."` (polls lightweight status endpoint or listens via WebSocket/SSE—never trusts client-side URL query params alone).
     - **`PAID` (Success):** Archive Green indicator (`#166534`), order confirmation number, itemized receipt, shipping tracking placeholder, and `VIEW ORDER IN ACCOUNT` button.
     - **`EXPIRED` / `FAILED`:** Campaign Red indicator (`#E52323`), clear explanation (`"Payment window expired. Reserved stock has been released."`), and `REORDER ITEMS` button if stock remains available.

---

### 12.F User Profile / Account Page (`/account`)

Minimalist member portal for tracking orders, managing wishlists, and storing shipping addresses.

1. **Unauthenticated View (`/account/login` & `/account/register`):**
   - Split 2-column editorial layout on desktop (`max-width: 1100px`):
     - **Left Column (`5 columns`):** High-contrast black-and-white campaign photograph with overlaid headline: `"ENJOY SPECIAL DISCOUNTS AND STAY CONNECTED."` (`h1` Archivo Bold uppercase) and bulleted member benefits (early drop access, saved wishlist, real-time order tracking).
     - **Right Column (`7 columns`, `padding: 48px`):** Tabbed switcher (`SIGN IN` | `CREATE ACCOUNT`) with clean `46px` inputs, password visibility toggle (`Eye` / `EyeOff`), `FORGOT PASSWORD?` link, and full-width `#0A0A0A` submit button.
2. **Authenticated Member Portal (`/account/*`):**
   - **Desktop Layout (`max-width: 1400px`, `padding: 56px 40px 96px`):**
     - **Left Navigation Rail (`240px` width):** Vertical list of 5 sections (`label-ui`, active item has `2px solid #0A0A0A` left indicator and `600` weight) + `SIGN OUT` link at bottom:
       1. `PROFILE INFORMATION` (`/account/profile`)
       2. `ORDERS` (`/account/orders`)
       3. `WISHLIST` (`/account/wishlist`)
       4. `ADDRESSES` (`/account/addresses`)
       5. `ACCOUNT SETTINGS` (`/account/settings`)
     - **Right Content Area (`1fr`):**
       - **Orders View (`/account/orders`):** Filter tabs (`All`, `Unpaid`, `Processing`, `Shipped`, `Completed`, `Cancelled`). Each order card (`border: 1px solid #E2E1DC`, `padding: 20px`, `margin-bottom: 16px`) displays:
         - Top bar: `ORDER #1SL-20261112-084` (`tabular-nums` bold), Order Date (`12 NOV 2026`), Payment Status badge (`PAID` / `PENDING` / `EXPIRED`), Fulfillment Status (`PROCESSING` / `SHIPPED` + courier airwaybill number).
         - Middle row: Product thumbnails + summary (`Heavyweight Box Hoodie — Size L (+1 more item)`), Total Price (`Rp 1.348.000`).
         - Right/Bottom action: `VIEW ORDER DETAILS` outline button (or `COMPLETE PAYMENT` solid button if `PENDING`).
         - **Empty Orders State:** `"You haven't placed any orders yet."` in `15px` `#292929` + `START SHOPPING` button.
       - **Wishlist View (`/account/wishlist`):** 3-column or 4-column grid using the standard Product Card with a top-right `X` remove button and direct link to PDP to select size.

---

### 12.G Community Page (`/community`)

An independent streetwear lookbook and cultural archive showcasing real customers wearing the brand.

1. **Page Header (`padding: 56px 40px 32px`):**
   - Title: `COMMUNITY ARCHIVE` (`display-promo` or `h1`), subtitle: `"Real individuals styling our releases worldwide. Tag @brandname or submit your fit through your account."` + `SUBMIT YOUR PHOTO` outline button (opens submission modal with explicit consent checkbox: *"I grant permission to publish this photograph on the website and editorial channels"*).
2. **Asymmetric Editorial Grid (`padding: 0 40px 96px`, `gap: 8px` desktop / `4px` mobile):**
   - Avoid uniform 3×3 Instagram clones. Use a repeating **12-column editorial rhythm pattern** where every 6 photos form an asymmetric block:
     - **Item 1:** Spans `6 columns × 2 rows` (`aspect-[4/5]`, large feature look)
     - **Item 2 & Item 3:** Span `3 columns × 1 row` each (`aspect-[4/5]`)
     - **Item 4:** Spans `6 columns × 1 row` (`aspect-[16/10]` or `aspect-[3/4]`)
     - **Item 5:** Spans `4 columns` (`aspect-[4/5]`)
     - **Item 6:** Spans `8 columns` (`aspect-[16/9]` wide street shot)
3. **Minimal Card Overlay / Lightbox Interaction:**
   - Default state: Pure edge-to-edge photography with **zero badges, zero likes/hearts, and zero clutter**.
   - On Hover (or tap to open Lightbox): Subtle bottom gradient reveals `@username` on the left and the tagged garment link (`WORN: WORK JACKET CAMO →`) on the right, clicking directly to the product's PDP.

---

### 12.H About Page (`/about`)

Reads like a printed brand monograph or exhibition catalog.

1. **Section 1 — Editorial Cover (`padding: 72px 40px`):** Large typographic manifesto statement (`clamp(2rem, 4vw, 3.75rem)`, Archivo Bold uppercase, line-height `1.02`) paired with a wide documentary studio photograph.
2. **Section 2 — Brand Philosophy & Creative Direction (`12-column grid`, `padding: 80px 40px`):** Asymmetric 2-column layout (`Cols 1–4` sticky section index `[01 — PHILOSOPHY]`, `Cols 6–11` editorial prose in `17px` Inter Regular `#292929`). Explains the brand's roots, cultural influences, and refusal to mass-produce.
3. **Section 3 — Garment Construction & Manufacturing (`background: #F5F4F0`, `padding: 96px 40px`):** 3-column documentary breakdown with close-up photography of fabrics (`Heavyweight Cotton Combed & Fleece`), techniques (`High-Density Plastisol, Discharge Printing & Chainstitch Embroidery`), and small-batch quality control.
4. **Section 4 — Archive Timeline / Milestones:** Clean horizontal or vertical chronological table (`YEAR`, `COLLECTION`, `CONCEPT`) highlighting key releases since inception.

---

### 12.I Admin Panel and CMS Specification (Laravel Filament)

While the customer storefront uses Next.js, administrators manage all commerce and editorial operations through a structured **Laravel Filament** backend (`/admin`) without touching source code:

- **Catalog & Variant Matrix Manager:** Create/edit products, upload and reorder the 5 required product photographs (`front`, `back`, `detail`, `fabric`, `lifestyle`), assign Categories & Product Types, configure `weight_grams` (for shipping calculation), set `max_per_order` limits, and manage SKU-level inventory per `Color × Size` combination.
- **Campaign & Homepage Visual CMS:** Manage Homepage Hero Banners (image upload, layout mode `A/B/C`, headline, subtitle, CTA text/URL, active schedule), toggle the Top Announcement Bar, curate Featured Collections and Featured Products, and schedule Limited Drops (`release_at` timestamp).
- **Order & Xendit Transaction Console:** View real-time orders, inspect verified Xendit webhook payloads (`payment_id`, `channel_code`, `paid_at`), print packing slips, input courier tracking numbers (`resi`), and update fulfillment statuses (`Paid → Processing → Shipped → Completed`).
- **Community Moderation Queue:** Review customer-submitted lookbook photos, verify consent flag, link the worn Product IDs, and click `Approve & Publish` or `Reject`.

---

## 13. Responsive Breakpoints

Do not merely scale down desktop columns; re-architect navigation, filter ergonomics, and purchase controls at each breakpoint.

| Breakpoint Token          | Viewport Range       | Target Device                   | Key Structural Adaptations                                                                                                                                                          |
| :------------------------ | :------------------- | :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sm` (Mobile)           | `< 640px`          | Smartphones (Portrait)          | `16px` outer padding; 2-column product grid (`12px` gap); Filter Drawer; full-bleed swipeable PDP gallery; sticky bottom purchase bar on PDP when main CTA scrolls out of view. |
| `md` (Tablet Portrait)  | `640px – 1023px`  | Smartphones (Landscape) & iPads | `24px` outer padding; 3-column product grid (`16px` gap); Filter Drawer retained; single-column stacked PDP (`max-width: 680px` centered).                                    |
| `lg` (Small Desktop)    | `1024px – 1279px` | Laptops & iPad Pro Landscape    | `40px` outer padding; desktop header active; persistent `240px` left filter sidebar + 3-column catalog grid; 2-column `50/50` PDP split.                                      |
| `xl` (Standard Desktop) | `1280px – 1599px` | Desktop Monitors (`1440p`)    | `40px` outer padding; `260px` left filter sidebar + 4-column catalog grid; `58/42` PDP split.                                                                                 |
| `2xl` (Wide Editorial)  | `≥ 1600px`        | Large Displays                  | Content locked at `1600px` max-width (`margin: 0 auto`); full-bleed heroes span `100vw`.                                                                                      |

### 13.1 Mobile-Specific Ergonomic Rules

- **Minimum Touch Target:** `44px × 44px` on all interactive buttons, size tiles, header icons, and filter checkboxes.
- **Sticky Mobile PDP Action Bar:** On viewports `< 768px`, once the user scrolls past the inline `ADD TO CART` button to read descriptions or policies, a compact `64px` bar docks to the bottom of the screen (`background: #FFFFFF`, `border-top: 1px solid #0A0A0A`, `padding: 8px 16px`) showing the selected Size + `ADD TO CART` (`#0A0A0A` button).
- **Vertical Rhythm Restraint:** Cap section vertical padding at `48px` on mobile (`96px` on desktop) to eliminate dead white scrolling zones.

---

## 14. Interaction and Animation Guidelines

Motion must feel deliberate, mechanical, and fast—never bouncy, elastic, or theatrical.

### 14.1 Timing & Easing Tokens

- **Micro-UI (Buttons, Borders, Swatches):** `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- **Product Card Front-to-Back Crossfade:** `220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Drawers, Modals & Accordions:** `260ms cubic-bezier(0.22, 1, 0.36, 1)` (crisp deceleration, zero overshoot/spring bounce)
- **Page / Route Transitions:** `180ms` opacity fade only (`opacity: 0 → 1`).

### 14.2 Strictly Prohibited Animations

- **No spring physics** (`type: "spring"` with bounce/stiffness overshoot) anywhere in the interface.
- **No scroll-hijacking** or smooth-scroll libraries that override native trackpad/touch inertia.
- **No parallax scrolling** on catalog cards or text blocks.
- **No continuous infinite animations** (except a subtle `1px` loading bar or spinner during async Xendit checkout requests).
- Respect `@media (prefers-reduced-motion: reduce)` globally by collapsing all transition durations to `0.01ms`.

---

## 15. Accessibility and Performance Requirements

### 15.1 Accessibility (WCAG 2.1 AA Compliance)

- **Color Contrast:**
  - `#0A0A0A` on `#FFFFFF` → `19.8:1` (AAA)
  - `#292929` on `#FFFFFF` → `14.4:1` (AAA)
  - `#6E6E6A` on `#FFFFFF` → `5.1:1` (AA compliant for metadata/captions)
  - `#E52323` on `#FFFFFF` → `4.7:1` (AA compliant for error messages and campaign callouts)
- **Keyboard & Focus Management:**
  - Visible focus ring on `:focus-visible`: `2px solid #0A0A0A` with `outline-offset: 2px` (`2px solid #FFFFFF` on dark `#0A0A0A` backgrounds).
  - Size Guide Modal, Mobile Filter Drawer, and Mini-Cart Drawer must trap keyboard focus (`Tab` / `Shift+Tab`) when open and close immediately on `Escape`, returning focus to the trigger button.
- **Semantic Markup & ARIA:**
  - Strict heading hierarchy (`<h1>` once per page → `<h2>` sections → `<h3>` product/collection titles).
  - Size selector uses `role="radiogroup"` with `aria-checked` and `aria-disabled="true"` (plus visually hidden `"Out of stock"` text) on unavailable sizes.
  - Descriptive `alt` attributes on all product images: `"[Product Name] - [Color] - Front View"` (never `"image1.jpg"` or `"product"`).

### 15.2 Core Web Vitals & Image Performance

- **LCP (`< 2.0s`):** Homepage Hero image and PDP main image must use Next.js `<Image priority fetchPriority="high" sizes="..." />` with modern `AVIF`/`WebP` formats served from CDN.
- **CLS (`< 0.05`):** Every image container must declare an explicit aspect ratio (`aspect-[4/5]`, `aspect-[16/10]`) and reserve space before hydration. Fonts must load with `display: swap` and metric-adjusted fallback.
- **Catalog Hover Preloading:** Secondary (back-view) product card images use `loading="lazy"` in the DOM and decode asynchronously (`decoding="async"`) so initial catalog load remains lightweight.

---

## 16. E-Commerce UX & Technical Data Requirements

1. **SKU-Level Variant Inventory:** Stock is tracked at the `product_variants` table level (`product_id`, `color_id`, `size_id`, `sku`, `stock_quantity`, `price_override`), never as a single flat number on the parent product. Selecting a Color updates which Sizes are enabled/disabled in real time.
2. **Limited Drop & Release Gate:** Products or Collections can have an optional `release_at` timestamp. Before `release_at`, the PDP displays a live countdown (`DROP IN 02D : 14H : 22M : 10S`) in place of `ADD TO CART` and blocks API cart additions on the backend.
3. **Cart Persistence & Merge:** Guest carts persist in `localStorage` + signed HTTP-only cookie session; upon login, guest cart items merge into the user's database cart with automatic stock re-validation.
4. **Xendit Security Contract:**
   - Frontend never marks an order as paid based on redirect URLs.
   - All Xendit webhook requests (`POST /api/v1/webhooks/xendit`) must verify the `x-callback-token` header, log the raw payload, enforce database-level idempotency via unique `xendit_invoice_id` / `external_id`, and run stock deduction inside an atomic SQL transaction.
5. **Loading Skeletons:** Use flat `#F5F4F0` rectangular blocks (`border-radius: 0px`) with a subtle opacity pulse (`0.6 → 1.0`) for loading states—never spinning rainbow wheels or rounded card skeletons.

---

## 17. Anti-AI-Slop Design Rules (Strict Enforcement Checklist)

Any code or UI component exhibiting the following traits must be rejected during code review:

| Prohibited "AI-Slop" Pattern                                                                             | Mandatory Replacement in This Project                                                                                             |
| :------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Rounded cards (`rounded-lg`, `rounded-xl`, `rounded-2xl`) and pill buttons (`rounded-full`)      | **Strict `0px` (`rounded-none`)** across all containers, cards, buttons, inputs, and badges.                            |
| Glassmorphism (`backdrop-blur-md bg-white/30 border-white/20`) on cards or headers                     | Solid opaque `#FFFFFF`, `#F5F4F0`, or `#0A0A0A` surfaces separated by `1px solid #E2E1DC` or `#0A0A0A` hairlines.       |
| Soft multi-layered drop shadows (`shadow-lg`, `shadow-xl`, colored glows)                            | **`box-shadow: none`** across all cards, buttons, and inputs. Depth is achieved via `1px` borders and surface contrast. |
| Purple/blue/indigo/neon gradients or mesh blobs                                                          | Strictly monochrome (`#0A0A0A`, `#FFFFFF`, `#F5F4F0`, `#292929`) with selective `#E52323` campaign accents.             |
| Emojis in UI (`🔥 Hot Drop`, `🛒 Cart`, `✨ New`, `✅ In Stock`)                                 | Clean uppercase typography (`meta-caps`) or `1.5px` stroke **Lucide Icons** only when functionally required.            |
| Badge clutter (`NEW`, `SALE -20%`, `TOP RATED`, `5.0 ★` stacked on one card)                    | Maximum **1 functional inventory badge** (`SOLD OUT` or `LIMITED STOCK`) per card. Zero star ratings.                   |
| Generic SaaS 3-column "Why Choose Us" icon cards (`Fast Shipping`, `24/7 Support`, `High Quality`) | Convey brand credibility through editorial garment photography, exact fabric GSM specs, and the `/about` monograph.             |
| Fake urgency widgets (`"14 people are viewing this right now!"`, pop-up fake purchase toasts)          | Authentic inventory states (`LIMITED STOCK — ONLY 3 LEFT`) driven directly by real database stock counts.                      |
| Unsolicited stock photos of generic smiling models or corporate offices                                  | High-contrast studio garment photography (`front`/`back`) and authentic streetwear campaign/community lookbooks.              |

---

## 18. Photography and Asset Guidelines

### 18.1 Aspect Ratio & Resolution Standards

| Asset Placement                       | Required Aspect Ratio                      | Recommended Resolution                    | Background & Art Direction                                                                                           |
| :------------------------------------ | :----------------------------------------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Catalog & PDP Studio Images** | `4:5` Portrait (`1:1.25`)              | `1600 × 2000 px` (`2x` retina)       | Consistent `#F5F4F0` (Bone) or neutral light concrete studio backdrop; uniform garment lighting; centered framing. |
| **Homepage Hero Banner**        | `16:9` (Desktop) / `4:5` (Mobile crop) | `2560 × 1440 px` / `1200 × 1500 px` | Editorial street/studio campaign photography; high contrast; optional halftone/grain treatment.                      |
| **Featured Collection Banners** | `16:10` (Wide) & `4:5` (Portrait)      | `1920 × 1200 px` / `1600 × 2000 px` | Styled lookbook photography with negative space for clean composition.                                               |
| **Community Lookbook Grid**     | Mixed `4:5`, `3:4`, and `16:9`       | Min `1200 px` on shortest edge          | Customer/community street styling; natural grain and real-world lighting preserved.                                  |

### 18.2 Mandatory 5-Image PDP Sequence

Every published product in the catalog must adhere to the 5-image sequence to ensure the catalog hover interaction and PDP gallery operate seamlessly:

1. **`image_01_front` (Primary):** Full garment front view, studio neutral background (`#F5F4F0`).
2. **`image_02_back` (Hover Alternate):** Full garment back view, identical camera distance and studio lighting as `image_01_front` so the `220ms` catalog hover crossfade registers with zero jump.
3. **`image_03_angle`:** Side profile or 3/4 draped silhouette showing garment cut and sleeve/hem drop.
4. **`image_04_detail`:** Macro close-up of screen print texture, embroidery stitch density, custom hardware, or woven neck label.
5. **`image_05_lifestyle`:** On-body editorial lookbook shot demonstrating real-world fit and proportions.

---

## 19. Reference Tailwind CSS Theme Configuration (`tailwind.config.ts`)

Use the following configuration as the single source of truth when bootstrapping the Next.js frontend:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0px",
      DEFAULT: "0px",
      full: "9999px", // Reserved strictly for 6x6px status dots
    },
    extend: {
      colors: {
        ink: "#0A0A0A",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F4F0",
        },
        charcoal: "#292929",
        muted: "#6E6E6A",
        border: {
          DEFAULT: "#E2E1DC",
          strong: "#0A0A0A",
        },
        campaign: {
          red: "#E52323",
        },
        status: {
          success: "#166534",
          warning: "#B45309",
          danger: "#E52323",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: {
        storefront: "1600px",
        checkout: "1200px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        card: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
```
