"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  ArrowUpRight,
  Check,
  LayoutGrid,
  Columns,
  MapPin,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { CommunityPost } from "@/types/store";

export default function CommunityPage() {
  const { communityPosts, products, refreshStore, notify } = useStore();

  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"editorial" | "uniform">("editorial");
  const [selectedFilterProduct, setSelectedFilterProduct] = useState<string>("ALL");

  // Submission Form State
  const [username, setUsername] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("JAKARTA, ID");
  const [selectedProductSlug, setSelectedProductSlug] = useState(
    products[0]?.slug || "silent-riot-heavy-box-hoodie-black"
  );
  const [imageUrl, setImageUrl] = useState("/images/hero-campaign.png");
  const [caption, setCaption] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const approvedPosts = useMemo(
    () => communityPosts.filter((p) => p.status === "APPROVED"),
    [communityPosts]
  );

  const filteredPosts = useMemo(() => {
    if (selectedFilterProduct === "ALL") return approvedPosts;
    return approvedPosts.filter((p) => p.productSlug === selectedFilterProduct);
  }, [approvedPosts, selectedFilterProduct]);

  // Unique worn products for filter bar
  const wornProductOptions = useMemo(() => {
    const map = new Map<string, string>();
    approvedPosts.forEach((p) => {
      if (!map.has(p.productSlug)) {
        map.set(p.productSlug, p.productName);
      }
    });
    return Array.from(map.entries());
  }, [approvedPosts]);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGranted) {
      notify(
        "CONSENT REQUIRED",
        "PLEASE CONFIRM PHOTOGRAPHY PUBLICATION CONSENT.",
        "error"
      );
      return;
    }

    const wornProd =
      products.find((p) => p.slug === selectedProductSlug) || products[0];

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          customerName,
          location: location || "JAKARTA, ID",
          imageUrl,
          caption,
          productSlug: wornProd.slug,
          productName: wornProd.name,
          aspectRatio: "4:5",
          gridSpan: "standard",
          consentGranted: true,
          autoApprove: true,
        }),
      });
      if (res.ok) {
        await refreshStore();
        setSubmitModalOpen(false);
        setUsername("");
        setCustomerName("");
        setLocation("JAKARTA, ID");
        setCaption("");
        setConsentGranted(false);
        notify(
          "LOOKBOOK FIT PUBLISHED",
          "YOUR SUBMISSION IS NOW LIVE IN THE COMMUNITY ARCHIVE."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* =====================================================================
          1. EDITORIAL HEADER & ARCHIVE STATS
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-8 border-b border-ink">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-ink text-surface px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
                ARCHIVE LOOKBOOK // VOL. 04
              </span>
              <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
                STYLED BY PATRONS — JAKARTA / BANDUNG / TOKYO / SINGAPORE
              </span>
            </div>
            <h1 className="mt-2 font-display-condensed font-black text-4xl sm:text-6xl uppercase tracking-[-0.02em] leading-[0.94] text-ink">
              COMMUNITY LOOKBOOK
            </h1>
            <p className="mt-3 text-sm text-charcoal max-w-xl leading-relaxed">
              An ongoing visual index of patrons wearing our archival releases in the
              field. Every photograph is linked directly to the garment worn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="h-12 px-7 bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase inline-flex items-center gap-2 hover:bg-charcoal transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[1.75]" />
              <span>SUBMIT YOUR FIT</span>
            </button>
          </div>
        </div>

        {/* Filter & Layout Switcher Bar */}
        <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedFilterProduct("ALL")}
              className={`h-8 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] border shrink-0 transition-colors ${
                selectedFilterProduct === "ALL"
                  ? "bg-ink text-surface border-ink"
                  : "bg-surface text-charcoal border-border hover:border-ink"
              }`}
            >
              ALL ARCHIVE LOOKS ({approvedPosts.length})
            </button>
            {wornProductOptions.map(([slug, name]) => (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedFilterProduct(slug)}
                className={`h-8 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] border shrink-0 transition-colors ${
                  selectedFilterProduct === slug
                    ? "bg-ink text-surface border-ink"
                    : "bg-surface text-charcoal border-border hover:border-ink"
                }`}
              >
                {name.split("—")[0].trim()}
              </button>
            ))}
          </div>

          {/* Layout Mode Toggle: Editorial Bento vs 4-Column Uniform Grid */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              GRID VIEW:
            </span>
            <div className="inline-flex border border-ink bg-surface">
              <button
                type="button"
                onClick={() => setViewMode("editorial")}
                className={`h-8 px-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  viewMode === "editorial"
                    ? "bg-ink text-surface"
                    : "bg-surface text-ink hover:bg-surface-alt"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>EDITORIAL BENTO</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("uniform")}
                className={`h-8 px-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] border-l border-ink transition-colors ${
                  viewMode === "uniform"
                    ? "bg-ink text-surface"
                    : "bg-surface text-ink hover:bg-surface-alt"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>4-COL ARCHIVE</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. COMMUNITY LOOKBOOK GRID (Flush Mathematical Bento OR 4-Col Grid)
      ===================================================================== */}
      <section className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {viewMode === "editorial" && selectedFilterProduct === "ALL" ? (
          /* MATHEMATICALLY ALIGNED 12-COLUMN EDITORIAL BENTO SPREAD
             Pattern per 8 items:
             - Item 0: 6 cols × 2 rows (Feature Editorial Portrait Left)
             - Item 1: 3 cols × 1 row  (Top Right 1)
             - Item 2: 3 cols × 1 row  (Top Right 2) -> Row 1 = 6 + 3 + 3 = 12 cols
             - Item 3: 6 cols × 1 row  (Bottom Right Panorama) -> Row 2 = 6 + 6 = 12 cols
             - Items 4, 5, 6, 7: 3 cols × 1 row each -> Row 3 = 3 + 3 + 3 + 3 = 12 cols
             Every row sums to 12 columns with locked desktop row height (420px) so zero uneven gaps occur. */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:auto-rows-[420px]">
            {filteredPosts.map((post, index) => {
              const patternIdx = index % 8;
              let spanClasses = "lg:col-span-3 lg:row-span-1";
              if (patternIdx === 0) {
                spanClasses = "sm:col-span-2 lg:col-span-6 lg:row-span-2";
              } else if (patternIdx === 1 || patternIdx === 2) {
                spanClasses = "lg:col-span-3 lg:row-span-1";
              } else if (patternIdx === 3) {
                spanClasses = "sm:col-span-2 lg:col-span-6 lg:row-span-1";
              } else {
                spanClasses = "lg:col-span-3 lg:row-span-1";
              }

              const lookNumber = String(index + 1).padStart(2, "0");

              return (
                <article
                  key={post.id}
                  className={`group bg-surface border border-border hover:border-ink transition-colors flex flex-col overflow-hidden ${spanClasses}`}
                >
                  {/* Image Container */}
                  <div
                    onClick={() => setSelectedPost(post)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPost(post);
                      }
                    }}
                    className="relative flex-1 min-h-[300px] lg:min-h-0 bg-surface-alt overflow-hidden cursor-pointer"
                  >
                    <img
                      src={post.imageUrl}
                      alt={`${post.username} wearing ${post.productName}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                    />

                    {/* Top-Left Index Stamp */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-ink text-surface px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.10em]">
                        LOOK #{lookNumber}
                      </span>
                      {post.location && (
                        <span className="bg-surface/90 border border-border text-ink px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] inline-flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {post.location}
                        </span>
                      )}
                    </div>

                    {/* Subtle Hover Inspect Button */}
                    <div className="absolute inset-0 bg-ink/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="px-4 py-2 bg-surface text-ink border border-ink text-[11px] font-semibold uppercase tracking-[0.08em]">
                        INSPECT LOOK →
                      </span>
                    </div>
                  </div>

                  {/* Structured Bottom Editorial Metadata Footer */}
                  <div className="p-3.5 bg-surface border-t border-border flex items-center justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink truncate">
                          {post.username}
                        </span>
                      </div>
                      <Link
                        href={`/products/${post.productSlug}`}
                        className="text-[11px] text-muted hover:text-ink truncate block mt-0.5 transition-colors"
                      >
                        WORN: {post.productName}
                      </Link>
                    </div>

                    <Link
                      href={`/products/${post.productSlug}`}
                      aria-label={`View ${post.productName}`}
                      className="w-8 h-8 border border-border flex items-center justify-center text-ink hover:bg-ink hover:text-surface hover:border-ink transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* UNIFORM 4-COLUMN ARCHIVE LOOKBOOK GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPosts.map((post, index) => {
              const lookNumber = String(index + 1).padStart(2, "0");
              return (
                <article
                  key={post.id}
                  className="group bg-surface border border-border hover:border-ink transition-colors flex flex-col overflow-hidden"
                >
                  <div
                    onClick={() => setSelectedPost(post)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPost(post);
                      }
                    }}
                    className="relative aspect-[4/5] bg-surface-alt overflow-hidden cursor-pointer"
                  >
                    <img
                      src={post.imageUrl}
                      alt={`${post.username} wearing ${post.productName}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-ink text-surface px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.10em]">
                        LOOK #{lookNumber}
                      </span>
                      {post.location && (
                        <span className="bg-surface/90 border border-border text-ink px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em]">
                          {post.location}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-ink/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="px-4 py-2 bg-surface text-ink border border-ink text-[11px] font-semibold uppercase tracking-[0.08em]">
                        INSPECT LOOK →
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-surface border-t border-border flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink block truncate">
                        {post.username}
                      </span>
                      <Link
                        href={`/products/${post.productSlug}`}
                        className="text-[11px] text-muted hover:text-ink truncate block mt-0.5"
                      >
                        WORN: {post.productName}
                      </Link>
                    </div>
                    <Link
                      href={`/products/${post.productSlug}`}
                      className="w-8 h-8 border border-border flex items-center justify-center text-ink hover:bg-ink hover:text-surface transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          LIGHTBOX DETAIL MODAL (Links directly to worn product)
      ===================================================================== */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/80"
            onClick={() => setSelectedPost(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-surface border border-ink grid grid-cols-1 md:grid-cols-12 overflow-hidden max-h-[90dvh]">
            <div className="md:col-span-7 bg-ink aspect-[4/5] md:aspect-auto overflow-hidden">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.username}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink block">
                      {selectedPost.username}
                    </span>
                    {selectedPost.location && (
                      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted block mt-0.5">
                        {selectedPost.location}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    aria-label="Close lookbook detail"
                    className="p-1 text-ink hover:text-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedPost.caption && (
                  <p className="mt-4 text-sm text-charcoal leading-relaxed">
                    &ldquo;{selectedPost.caption}&rdquo;
                  </p>
                )}

                <div className="mt-6 pt-5 border-t border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
                    FEATURED GARMENT IN FRAME
                  </span>
                  <p className="mt-1 font-display font-bold text-base uppercase text-ink">
                    {selectedPost.productName}
                  </p>
                  <Link
                    href={`/products/${selectedPost.productSlug}`}
                    onClick={() => setSelectedPost(null)}
                    className="mt-4 w-full h-11 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-2 hover:bg-charcoal transition-colors"
                  >
                    <span>VIEW PRODUCT PAGE</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.08em] text-muted pt-6">
                PUBLISHED WITH VERIFIED PATRON CONSENT
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMIT COMMUNITY PHOTOGRAPH MODAL (With Mandatory User Consent)
      ===================================================================== */}
      {submitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/55"
            onClick={() => setSubmitModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-surface border border-ink p-6 sm:p-8 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted">
                  COMMUNITY LOOKBOOK CONTRIBUTION
                </span>
                <h2 className="mt-1 font-display font-bold text-lg uppercase text-ink">
                  SUBMIT YOUR ARCHIVE PHOTOGRAPH
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmission} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                    INSTAGRAM / HANDLE *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full h-11 px-3 border border-border text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full h-11 px-3 border border-border text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                    CITY / LOCATION *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="JAKARTA, ID"
                    className="w-full h-11 px-3 border border-border text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                    GARMENT WORN *
                  </label>
                  <select
                    value={selectedProductSlug}
                    onChange={(e) => setSelectedProductSlug(e.target.value)}
                    className="w-full h-11 px-3 border border-border bg-surface text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                  SELECT PRESET STUDIO / STREET PHOTO OR PASTE IMAGE URL *
                </label>
                <select
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full h-11 px-3 border border-border bg-surface text-base sm:text-xs text-ink focus:border-ink focus:outline-none mb-2"
                >
                  <option value="/images/hero-campaign.png">
                    Industrial Concrete Lookbook Shot
                  </option>
                  <option value="/images/prod-hoodie-back.png">
                    Silent Riot Heavy Hoodie Back Shot
                  </option>
                  <option value="/images/prod-jacket-front.png">
                    14oz Mechanic Work Jacket Shot
                  </option>
                  <option value="/images/prod-jersey-front.png">
                    Archive 04 Mesh Moto Jersey Shot
                  </option>
                  <option value="/images/prod-denim-front.png">
                    13.5oz Carpenter Denim Shot
                  </option>
                </select>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/hero-campaign.png or https://..."
                  className="w-full h-10 px-3 border border-border text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1">
                  STYLING NOTE / CAPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Melawai night walk, wearing size L"
                  className="w-full h-11 px-3 border border-border text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Mandatory User Consent Checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-surface-alt border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 w-4 h-4 border shrink-0 flex items-center justify-center ${
                    consentGranted
                      ? "bg-ink border-ink text-surface"
                      : "bg-surface border-border"
                  }`}
                >
                  {consentGranted && <Check className="w-3 h-3 stroke-[2.5]" />}
                </span>
                <span className="text-xs text-charcoal leading-relaxed">
                  I confirm that I am the rightful owner/subject of this photograph
                  and grant explicit consent for its publication on the Community
                  Lookbook.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] hover:bg-charcoal transition-colors"
              >
                {submitting ? "PUBLISHING..." : "SUBMIT TO COMMUNITY LOOKBOOK"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
