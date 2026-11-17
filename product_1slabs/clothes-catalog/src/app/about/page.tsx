"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";

export default function AboutPage() {
  const { cms, currency } = useStore();
  const about = cms.aboutPage;

  return (
    <div>
      {/* =====================================================================
          1. BRAND INTRODUCTION & EDITORIAL COVER
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 pb-16 border-b border-ink">
        <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
          {about?.coverTag || "BRAND MONOGRAPH // INDEPENDENT GARMENT DIVISION"}
        </p>
        <h1 className="mt-3 font-display font-extrabold text-3xl sm:text-5xl lg:text-[62px] uppercase leading-[0.98] tracking-[-0.03em] text-ink max-w-5xl">
          {about?.coverHeadline ||
            "WE BUILD HEAVYWEIGHT ARCHIVAL GARMENTS AT THE INTERSECTION OF UNDERGROUND PRINT CULTURE AND INDUSTRIAL WORKWEAR."}
        </h1>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8 aspect-[16/9] bg-ink border border-border overflow-hidden relative">
            <img
              src={about?.coverImage || "/images/hero-campaign.png"}
              alt={cms.brandName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-ink text-surface px-3 py-1 text-[10px] font-mono uppercase tracking-[0.10em]">
              {about?.coverCaption || "ARCHIVE DOCUMENTARY // JAKARTA — BANDUNG"}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <p className="text-sm text-charcoal leading-relaxed">
              {about?.coverIntro ||
                `Founded as an independent counter-response to disposable synthetic streetwear, ${cms.brandName} operates on a strict seasonal drop cadence. Every pattern is drafted from scratch, every fabric roll is custom-milled to our GSM tolerances, and once an archival colorway sells out, it is never re-pressed.`}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink border-b border-ink pb-0.5"
            >
              <span>INSPECT CURRENT RELEASES</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. BRAND PHILOSOPHY & CREATIVE DIRECTION
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="text-xs font-mono uppercase tracking-[0.10em] text-campaign-red block">
              {about?.philosophyTag || "[01 — PHILOSOPHY & ART DIRECTION]"}
            </span>
            <h2 className="mt-2 font-display font-bold text-2xl uppercase tracking-[-0.015em] text-ink">
              {about?.philosophyTitle ||
                "PRINT TACTILITY OVER DIGITAL ORNAMENTATION."}
            </h2>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 space-y-6 text-base text-charcoal leading-[1.7] max-w-[68ch]">
            <p>
              {about?.philosophyParagraph1 ||
                "Our visual language is rooted in physical artifacts: Xeroxed hardcore punk flyers, industrial shipping stencils, Japanese garment archive catalogs, and woven military specification labels. We treat a hoodie or a work jacket as a structural canvas rather than a billboard for hollow logos."}
            </p>
            <p>
              {about?.philosophyParagraph2 ||
                "That discipline extends to how we release clothing. Rather than flooding a marketplace with hundreds of generic SKUs, each collection is edited down to essential silhouettes—tested on real bodies and documented through high-contrast studio and street photography."}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. PRODUCT & MANUFACTURING APPROACH (#F5F4F0 Bone Surface)
      ===================================================================== */}
      <section className="bg-surface-alt border-b border-border">
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.10em] text-muted block">
              [02 — MATERIAL SPECIFICATION & MILLING]
            </span>
            <h2 className="mt-2 font-display font-bold text-2xl sm:text-3xl uppercase tracking-[-0.015em] text-ink">
              MANUFACTURING & TEXTILE STANDARDS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(about?.specs || []).map((spec, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border p-6 space-y-4"
              >
                <div className="aspect-[4/5] bg-surface-alt border border-border overflow-hidden">
                  <img
                    src={spec.image}
                    alt={spec.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.10em] text-campaign-red block">
                  {spec.code}
                </span>
                <h3 className="font-display font-bold text-lg uppercase text-ink">
                  {spec.title}
                </h3>
                <p className="text-xs text-charcoal leading-relaxed">
                  {spec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. BRAND HISTORY TIMELINE
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 border-b border-border">
        <div className="mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.10em] text-muted block">
            [03 — ARCHIVAL CHRONOLOGY]
          </span>
          <h2 className="mt-2 font-display font-bold text-2xl sm:text-3xl uppercase tracking-[-0.015em] text-ink">
            RELEASE TIMELINE
          </h2>
        </div>

        <div className="border-t border-ink divide-y divide-border">
          {(about?.timeline || []).map((item, idx) => (
            <div
              key={`${item.year}-${idx}`}
              className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline"
            >
              <div className="md:col-span-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                {item.year}
              </div>
              <div className="md:col-span-3 font-display font-bold text-base uppercase text-ink">
                {item.collection}
              </div>
              <div className="md:col-span-6 text-sm text-charcoal leading-relaxed">
                {item.concept}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          5. SHIPPING, RETURNS & LEGAL POLICIES ANCHOR (#policies)
      ===================================================================== */}
      <section
        id="policies"
        className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24"
      >
        <div className="mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.10em] text-muted block">
            [04 — CLIENT SERVICE & STORE POLICIES]
          </span>
          <h2 className="mt-2 font-display font-bold text-2xl sm:text-3xl uppercase tracking-[-0.015em] text-ink">
            SHIPPING, RETURNS & TERMS OF SERVICE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border border-border bg-surface space-y-3">
            <h3 className="font-display font-bold text-base uppercase text-ink">
              DISPATCH & SHIPPING POLICY
            </h3>
            <p className="text-xs text-charcoal leading-relaxed">
              {cms.deliveryDefaults.dispatchSlaText}
            </p>
            <p className="text-xs text-charcoal leading-relaxed">
              Domestic orders above{" "}
              <strong className="text-ink tabular-nums">
                {formatPrice(cms.deliveryDefaults.freeShippingThresholdIdr, currency)}
              </strong>{" "}
              automatically receive complimentary shipping. Exact parcel weight is
              calculated dynamically in grams per garment.
            </p>
          </div>

          <div className="p-6 border border-border bg-surface space-y-3">
            <h3 className="font-display font-bold text-base uppercase text-ink">
              RETURNS, EXCHANGES & LIMITED RELEASES
            </h3>
            <p className="text-xs text-charcoal leading-relaxed">
              {cms.deliveryDefaults.returnPolicySummary}
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs text-muted">
              {cms.deliveryDefaults.termsConditionsBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
