# NOCTURNE // ATELIER — Exclusive Independent Streetwear E-Commerce Platform

Implemented from [design.md](./design.md) and [prompt.md](./prompt.md).

## Quick Start

```bash
cd product_1slabs/clothes-catalog
npm install
npm run dev
```

Open **http://localhost:3005** in your browser.

---

## Implemented Storefront, Transactional & CMS Routes

| Route | Description |
| :--- | :--- |
| `/` | **Editorial Homepage:** 3 switchable Hero Campaign layout modes (`Mode A`, `Mode B`, `Mode C`), Featured Collections, 4-column Featured Products with `220ms` front-to-back hover swap, Brand Story Manifesto (`#F5F4F0`), Drop Spotlight with live countdown, Community Preview, and Newsletter capture. |
| `/catalog` | **Product Catalog:** Sticky `260px` left filter rail on desktop + mobile Filter Drawer across 6 filter groups (`Category`, `Product Type`, `Availability`, `Price Range`, `Color`, `Size`), live search, sorting (`Featured`, `Newest`, `Price: Low-High`, `Price: High-Low`, `Best Selling`), and clean empty state. |
| `/products/[slug]` | **Product Detail Page (PDP):** `58% / 42%` two-column desktop split with 5-shot gallery, hover zoom & fullscreen lightbox, dynamic SKU variant stock (`IN STOCK`, `LIMITED STOCK`, `SOLD OUT`), inline Size Guide modal (`CM`/`IN` toggle), Quantity stepper, Wishlist toggle, `ADD TO CART` (Outline) + `BUY IT NOW` (Solid) hierarchy, configurable Delivery calculator (`Deliver to`, dynamic `weight_grams`, dispatch SLA), Description & Terms accordions, Related & Recently Viewed products, and mobile sticky purchase bar. |
| `/cart` | **Shopping Cart:** Full-page cart table with variant metadata, weight calculation, pre-checkout live inventory validation (`POST /api/v1/cart/validate`), and free domestic shipping threshold bar. |
| `/checkout` | **Xendit Checkout:** Distraction-free checkout header, customer & shipping form, dynamic courier calculation by weight, promo voucher support (`ARCHIVE10`, `WELCOME15`, `NOCTURNE100`), dynamic Xendit payment channel selector (`QRIS`, `Virtual Account: BCA / Mandiri / BNI / BRI`, `E-Wallet: OVO / GoPay / ShopeePay / DANA`, `Alfamart`), and `Idempotency-Key` protection. |
| `/orders/[orderNumber]/payment` | **Xendit Payment Instruction & Webhook Status Page:** Displays QRIS matrix / Virtual Account number with copy actions, live expiration timer, and an **Interactive Xendit Webhook Verification Sandbox** to test signed `PAID`, `EXPIRED` (restoring reserved stock), and `FAILED` webhook callbacks. |
| `/account` | **Customer Account Portal:** Unauthenticated editorial login/register screen (`"Enjoy Special Discounts and Stay Connected"`, demo account `member@nocturne-atelier.com`) and authenticated 5-tab portal (`Profile`, `Orders`, `Wishlist`, `Addresses`, `Settings`). |
| `/community` | **Community Lookbook:** Asymmetric 12-column editorial lookbook grid with lightbox garment links and a `Submit Your Fit` modal requiring explicit photography publication consent. |
| `/about` | **About Monograph:** Brand introduction, philosophy, textile & manufacturing specifications (`375 GSM Fleece`, `14oz Duck Canvas`, `235 GSM 16s Jersey`), release chronology, and shipping/return policies. |
| `/admin` | **Admin Panel & Visual CMS:** Back-office console for managing Products & SKU Variant Stock, Homepage Hero & Campaign CMS, Orders & Verified Xendit Webhook Logs, Customers, Community Moderation, and Delivery SLA / Enabled Payment Channels. |

