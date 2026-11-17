"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

export default function HomePage() {
  const { cms, collections, products, communityPosts, notify } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  // Live Drop Countdown State
  const [countdown, setCountdown] = useState({
    days: "04",
    hours: "11",
    minutes: "42",
    seconds: "19",
  });

  useEffect(() => {
    const target = new Date(cms.dropSpotlight.releaseDateIso).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cms.dropSpotlight.releaseDateIso]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 8);
  const featuredCollections = collections.filter((c) => c.featured);
  const displayCollections =
    featuredCollections.length > 0 ? featuredCollections : collections;
  const approvedCommunity = communityPosts
    .filter((post) => post.status === "APPROVED")
    .slice(0, 5);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    try {
      await fetch("/api/v1/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "newsletter", email: newsletterEmail }),
      });
      setNewsletterEmail("");
      notify(
        "SUBSCRIPTION CONFIRMED",
        "EARLY ACCESS LINK WILL BE SENT PRIOR TO DROP."
      );
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <div>
      {/* =====================================================================
          1. EDITORIAL HERO BANNER (Dedicated Layout A: Bottom-Left Anchor)
      ===================================================================== */}
      <section className="relative w-full border-b border-ink overflow-hidden bg-ink">
        <div className="relative min-h-[calc(100dvh-88px)] w-full flex items-end">
          <img
            src={cms.hero.primaryImage}
            alt={cms.hero.title}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Directional Scrim & Halftone Texture Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
          <div className="absolute inset-0 campaign-halftone opacity-35 pointer-events-none" />

          <div className="relative z-20 max-w-storefront w-full mx-auto px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16 lg:pb-20 pt-32">
            <div className="max-w-3xl">
              {cms.hero.redAccentStamp && (
                <div className="inline-flex items-center gap-2.5 bg-campaign-red text-surface px-3 py-1 mb-5">
                  <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {cms.hero.redAccentStamp}
                  </span>
                </div>
              )}

              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-surface/80 mb-2">
                {cms.hero.seasonCode}
              </p>

              <h1 className="font-display font-extrabold text-[44px] sm:text-[64px] lg:text-[88px] leading-[0.92] tracking-[-0.03em] uppercase text-surface">
                {cms.hero.title}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-surface/85 max-w-[520px] leading-relaxed">
                {cms.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={cms.hero.ctaHref || "/catalog"}
                  className="h-12 px-8 bg-surface text-ink border border-surface text-[12px] font-semibold tracking-[0.08em] uppercase inline-flex items-center gap-2 hover:bg-campaign-red hover:border-campaign-red hover:text-surface transition-colors"
                >
                  <span>{cms.hero.ctaText || "EXPLORE COLLECTION"}</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[1.75]" />
                </Link>
                <Link
                  href={cms.hero.secondaryCtaHref || "/community"}
                  className="h-12 px-7 bg-transparent text-surface border border-surface/60 text-[12px] font-semibold tracking-[0.08em] uppercase inline-flex items-center hover:border-surface hover:bg-surface/10 transition-colors"
                >
                  {cms.hero.secondaryCtaText || "VIEW LOOKBOOK ARCHIVE"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. FEATURED COLLECTIONS (Asymmetric Architectural Showcase)
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div>
            <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
              CURATED ARCHIVES // SEASONAL INDEX
            </p>
            <h2 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
              FEATURED COLLECTIONS
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 self-start sm:self-auto hover:text-muted hover:border-muted transition-colors"
          >
            BROWSE FULL CATALOG →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5">
          {/* Primary Collection (7 Cols) */}
          {displayCollections[0] && (
            <div className="lg:col-span-7 group flex flex-col justify-between">
              <Link
                href={`/catalog?collection=${displayCollections[0].slug}`}
                className="relative block aspect-[16/10] w-full overflow-hidden bg-ink border border-border"
              >
                <img
                  src={displayCollections[0].heroImage}
                  alt={displayCollections[0].name}
                  className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity duration-200"
                />
                <div className="absolute top-3 left-3 bg-ink text-surface px-2.5 py-1 text-[11px] font-medium tracking-[0.10em] uppercase">
                  {displayCollections[0].indexCode} —{" "}
                  {displayCollections[0].seasonTag}
                </div>
              </Link>
              <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="font-display font-semibold text-lg sm:text-xl uppercase tracking-[-0.01em] text-ink">
                    {displayCollections[0].name}
                  </h3>
                  <p className="mt-1.5 text-sm text-charcoal leading-relaxed">
                    {displayCollections[0].shortDescription}
                  </p>
                </div>
                <Link
                  href={`/catalog?collection=${displayCollections[0].slug}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 shrink-0 hover:text-muted"
                >
                  <span>EXPLORE COLLECTION</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Secondary Collection (5 Cols) */}
          {displayCollections[1] && (
            <div className="lg:col-span-5 group flex flex-col justify-between">
              <Link
                href={`/catalog?collection=${displayCollections[1].slug}`}
                className="relative block aspect-[4/5] lg:aspect-[16/11.7] w-full overflow-hidden bg-surface-alt border border-border"
              >
                <img
                  src={displayCollections[1].heroImage}
                  alt={displayCollections[1].name}
                  className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity duration-200"
                />
                <div className="absolute top-3 left-3 bg-ink text-surface px-2.5 py-1 text-[11px] font-medium tracking-[0.10em] uppercase">
                  {displayCollections[1].indexCode} —{" "}
                  {displayCollections[1].seasonTag}
                </div>
              </Link>
              <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h3 className="font-display font-semibold text-lg sm:text-xl uppercase tracking-[-0.01em] text-ink">
                    {displayCollections[1].name}
                  </h3>
                  <p className="mt-1.5 text-sm text-charcoal leading-relaxed">
                    {displayCollections[1].shortDescription}
                  </p>
                </div>
                <Link
                  href={`/catalog?collection=${displayCollections[1].slug}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 shrink-0 hover:text-muted"
                >
                  <span>EXPLORE</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          3. FEATURED PRODUCTS GRID (4-Col Desktop / 2-Col Mobile, Hover Back View)
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div>
            <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
              HOVER GARMENTS TO INSPECT BACK GRAPHIC & CUT
            </p>
            <h2 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
              FEATURED RELEASES
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 self-start sm:self-auto hover:text-muted hover:border-muted transition-colors tabular-nums"
          >
            VIEW ALL PRODUCTS ({products.length}) →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8 sm:gap-y-10">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. BRAND STORY / EDITORIAL MANIFESTO SECTION (#F5F4F0 Bone Surface)
      ===================================================================== */}
      <section className="bg-surface-alt border-y border-border">
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] bg-surface border border-border overflow-hidden">
                <img
                  src={cms.brandStory.imagePrimary}
                  alt="Halftone Screenprint Craft"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/5] bg-surface border border-border overflow-hidden mt-8">
                <img
                  src={cms.brandStory.imageSecondary}
                  alt="14oz Duck Canvas Chainstitch"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.10em] uppercase text-ink">
                <span>{cms.brandStory.tag}</span>
              </div>

              <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[42px] uppercase leading-[1.04] tracking-[-0.025em] text-ink">
                {cms.brandStory.headline}
              </h2>

              <p className="text-[15px] sm:text-[17px] text-charcoal leading-[1.65] max-w-[62ch]">
                {cms.brandStory.bodyCopy}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border max-w-lg tabular-nums">
                {cms.brandStory.stats.map((st, idx) => (
                  <div key={idx}>
                    <p className="font-display font-bold text-xl sm:text-2xl text-ink">
                      {st.value}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted mt-0.5">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href={cms.brandStory.ctaHref || "/about"}
                  className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-1 hover:text-muted hover:border-muted transition-colors"
                >
                  <span>{cms.brandStory.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. CAMPAIGN / PROMOTIONAL DROP SPOTLIGHT (Full-Bleed #0A0A0A)
      ===================================================================== */}
      {cms.dropSpotlight.active && (
        <section className="bg-ink text-surface border-b border-charcoal relative overflow-hidden">
          <div className="absolute inset-0 campaign-halftone-light opacity-20 pointer-events-none" />
          <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 bg-campaign-red text-surface px-3 py-1">
                  <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {cms.dropSpotlight.code}
                  </span>
                </div>

                <h2 className="font-display-condensed font-black text-[38px] sm:text-[56px] lg:text-[68px] uppercase leading-[0.92] tracking-[-0.02em] text-surface">
                  {cms.dropSpotlight.title}
                </h2>

                <p className="text-sm sm:text-base text-[#A1A19A] max-w-xl leading-relaxed">
                  {cms.dropSpotlight.description}
                </p>

                {/* Tabular Drop Countdown */}
                <div className="pt-3">
                  <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-[#A1A19A] mb-2.5">
                    NEXT ARCHIVE ALLOCATION CLOSES IN:
                  </p>
                  <div className="inline-grid grid-cols-4 border border-charcoal bg-[#141414] divide-x divide-charcoal tabular-nums">
                    {[
                      { label: "DAYS", val: countdown.days },
                      { label: "HOURS", val: countdown.hours },
                      { label: "MIN", val: countdown.minutes },
                      { label: "SEC", val: countdown.seconds },
                    ].map((unit) => (
                      <div key={unit.label} className="px-4 sm:px-6 py-3 text-center">
                        <span className="block font-display font-extrabold text-xl sm:text-3xl text-surface">
                          {unit.val}
                        </span>
                        <span className="block text-[10px] tracking-[0.10em] text-[#6E6E6A] mt-0.5">
                          {unit.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href={cms.dropSpotlight.ctaHref}
                    className="inline-flex items-center gap-2 h-12 px-8 bg-surface text-ink text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-campaign-red hover:text-surface transition-colors"
                  >
                    <span>{cms.dropSpotlight.ctaText}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="aspect-[4/5] border border-charcoal overflow-hidden bg-[#141414] relative">
                  <img
                    src={cms.dropSpotlight.bannerImage}
                    alt={cms.dropSpotlight.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-ink/90 border border-charcoal px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-surface">
                      {cms.dropSpotlight.featuredLabel ||
                        "ARCHIVE 04 MESH MOTO JERSEY"}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-campaign-red">
                      LIMITED EDITION
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          6. COMMUNITY LOOKBOOK PREVIEW
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div>
            <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
              STYLED BY PATRONS WORLDWIDE
            </p>
            <h2 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
              WORN BY THE COMMUNITY
            </h2>
          </div>
          <Link
            href="/community"
            className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 self-start sm:self-auto hover:text-muted"
          >
            VIEW FULL COMMUNITY ARCHIVE →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {approvedCommunity.map((post, idx) => (
            <Link
              key={post.id}
              href={`/products/${post.productSlug}`}
              className="group flex flex-col border border-border bg-surface hover:border-ink transition-colors"
            >
              <div className="relative aspect-[4/5] bg-surface-alt overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={`${post.username} wearing ${post.productName}`}
                  className="w-full h-full object-cover object-center"
                />
                <span className="absolute top-2.5 left-2.5 bg-ink/85 text-surface px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em]">
                  LOOK 0{idx + 1}
                </span>
              </div>
              <div className="p-3 flex flex-col justify-between flex-1 bg-surface">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-[0.06em] uppercase text-ink truncate">
                    {post.username}
                  </span>
                  {post.location && (
                    <span className="text-[10px] font-mono uppercase text-muted shrink-0">
                      {post.location}
                    </span>
                  )}
                </div>
                <span className="mt-1.5 text-[11px] tracking-[0.04em] uppercase text-charcoal group-hover:text-ink truncate">
                  {post.productName} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
          7. MINIMAL NEWSLETTER SUBSCRIPTION SECTION
      ===================================================================== */}
      <section className="border-t border-border bg-surface">
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
                DIRECT DISPATCH // ZERO SPAM
              </p>
              <h2 className="mt-1.5 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
                EARLY ACCESS TO LIMITED DROPS & ARCHIVE RELEASES.
              </h2>
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <label htmlFor="home-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="home-newsletter-email"
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL ADDRESS"
                  className="flex-1 h-12 px-4 bg-surface border border-ink text-base sm:text-xs uppercase tracking-[0.06em] text-ink placeholder:text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  className="h-12 px-8 bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-charcoal transition-colors shrink-0"
                >
                  {submittingNewsletter ? "JOINING..." : "SUBSCRIBE"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
