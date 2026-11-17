"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  Minus,
  Plus,
  Ruler,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import {
  cmToInches,
  formatPrice,
  formatWeight,
  getProductTotalStock,
} from "@/lib/format";
import { SizeCode } from "@/types/store";

export default function ProductDetailClient() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    cms,
    products,
    sizeGuideMasters,
    shippingAreas,
    currency,
    addToCart,
    wishlistIds,
    toggleWishlist,
    recentlyViewedIds,
    recordRecentlyViewed,
    currentUser,
    login,
    notify,
  } = useStore();

  const [liveSlug, setLiveSlug] = useState<string>(params?.slug || "");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("products");
      if (idx !== -1 && parts[idx + 1]) {
        setLiveSlug(decodeURIComponent(parts[idx + 1]));
        return;
      }
    }
    if (params?.slug) {
      setLiveSlug(params.slug);
    }
  }, [params?.slug]);

  const product = useMemo(
    () =>
      products.find((p) => p.slug === (liveSlug || params?.slug)) || products[0],
    [products, liveSlug, params?.slug]
  );

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [isHoverZoomed, setIsHoverZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  // Variant selection state
  const [selectedColorId, setSelectedColorId] = useState<string>(
    product?.colors[0]?.id || ""
  );
  const [selectedSize, setSelectedSize] = useState<SizeCode>(
    product?.sizes[0] || "L"
  );
  const [quantity, setQuantity] = useState(1);

  // Modals & Accordions state
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<"CM" | "IN">("CM");
  const [guestWishlistModalOpen, setGuestWishlistModalOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    shippingAreas[0]?.id || "area-jkt"
  );
  const [openAccordion, setOpenAccordion] = useState<{
    description: boolean;
    terms: boolean;
  }>({
    description: true,
    terms: false,
  });

  // Reset state when switching products
  useEffect(() => {
    if (!product) return;
    setActiveImageIndex(0);
    const defaultColor = product.colors[0]?.id || "";
    setSelectedColorId(defaultColor);

    // Pick first in-stock size for that color if available
    const firstAvailableVariant = product.variants.find(
      (v) => v.colorId === defaultColor && v.stock > 0
    );
    setSelectedSize(firstAvailableVariant?.size || product.sizes[0]);
    setQuantity(1);
    recordRecentlyViewed(product.id);
  }, [product, recordRecentlyViewed]);

  if (!product) {
    return (
      <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center">
        <h1 className="font-display font-bold text-2xl uppercase">
          PRODUCT NOT FOUND
        </h1>
        <Link
          href="/catalog"
          className="mt-6 inline-flex h-12 px-8 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] items-center"
        >
          RETURN TO CATALOG
        </Link>
      </div>
    );
  }

  // Active Variant Lookup
  const activeVariant =
    product.variants.find(
      (v) => v.colorId === selectedColorId && v.size === selectedSize
    ) ||
    product.variants.find((v) => v.size === selectedSize) ||
    product.variants[0];

  const variantStock = activeVariant ? activeVariant.stock : 0;
  const totalProductStock = getProductTotalStock(product.variants);
  const maxAllowedQty = Math.min(
    variantStock,
    product.maxPerOrder || 4
  );

  const isWishlisted = wishlistIds.includes(product.id);

  // Shipping estimate calculation for Delivery Information block
  const selectedArea =
    shippingAreas.find((a) => a.id === selectedAreaId) || shippingAreas[0];
  const primaryCourier = selectedArea?.couriers[0];
  const totalWeightGrams = product.weightGrams * quantity;
  const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  const estimatedShippingCost = primaryCourier
    ? primaryCourier.ratePerKgIdr * weightKg
    : 15000;

  const handleSelectColor = (colorId: string) => {
    setSelectedColorId(colorId);
    const matchingVariant = product.variants.find(
      (v) => v.colorId === colorId && v.size === selectedSize
    );
    if (!matchingVariant || matchingVariant.stock <= 0) {
      const firstInStock = product.variants.find(
        (v) => v.colorId === colorId && v.stock > 0
      );
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      }
    }
    setQuantity(1);
  };

  const handleSelectSize = (sz: SizeCode) => {
    setSelectedSize(sz);
    setQuantity(1);
  };

  const handleWishlistClick = () => {
    if (!currentUser) {
      setGuestWishlistModalOpen(true);
      return;
    }
    toggleWishlist(product.id);
  };

  const handleAddToCart = () => {
    if (!activeVariant || variantStock <= 0) {
      notify("OUT OF STOCK", "SELECTED VARIANT IS CURRENTLY UNAVAILABLE", "error");
      return;
    }
    addToCart(
      {
        variantId: activeVariant.id,
        productId: product.id,
        slug: product.slug,
        productName: product.name,
        image: product.images[0]?.url || "/images/prod-hoodie-front.png",
        colorName: activeVariant.colorName,
        colorHex: activeVariant.colorHex,
        size: activeVariant.size,
        unitPriceIdr: activeVariant.priceOverride ?? product.priceIdr,
        weightGrams: product.weightGrams,
        quantity,
        maxAllowed: maxAllowedQty,
      },
      true
    );
  };

  const handleBuyItNow = () => {
    if (!activeVariant || variantStock <= 0) {
      notify("OUT OF STOCK", "SELECTED VARIANT IS CURRENTLY UNAVAILABLE", "error");
      return;
    }
    addToCart(
      {
        variantId: activeVariant.id,
        productId: product.id,
        slug: product.slug,
        productName: product.name,
        image: product.images[0]?.url || "/images/prod-hoodie-front.png",
        colorName: activeVariant.colorName,
        colorHex: activeVariant.colorHex,
        size: activeVariant.size,
        unitPriceIdr: activeVariant.priceOverride ?? product.priceIdr,
        weightGrams: product.weightGrams,
        quantity,
        maxAllowed: maxAllowedQty,
      },
      false
    );
    router.push("/checkout");
  };

  const handleMouseMoveZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  // Related & Recently Viewed Products
  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.collectionSlug === product.collectionSlug ||
          p.category === product.category)
    )
    .slice(0, 4);

  const recentlyViewedProducts = recentlyViewedIds
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const activeImage = product.images[activeImageIndex] || product.images[0];
  const selectedColorObj =
    product.colors.find((c) => c.id === selectedColorId) || product.colors[0];

  // Dynamic Size Guide Master Resolution (Defaults to "Default Garment Master")
  const defaultGarmentMaster =
    sizeGuideMasters.find((m) => m.isDefault) || sizeGuideMasters[0];
  const activeSizeGuideMaster =
    sizeGuideMasters.find((m) => m.id === product.sizeGuideMasterId) ||
    defaultGarmentMaster;

  const sizeGuideColumns: [string, string, string, string] =
    product.customSizeGuideColumns && product.customSizeGuideColumns.length === 4
      ? product.customSizeGuideColumns
      : activeSizeGuideMaster?.columns || [
          "CHEST / HALF-WIDTH",
          "BODY LENGTH",
          "SHOULDER",
          "SLEEVE / HEM",
        ];

  const sizeGuideRows =
    product.sizeChart && product.sizeChart.length > 0
      ? product.sizeChart
      : activeSizeGuideMaster?.defaultRows || [];

  const sizeGuideMeasureTitle =
    activeSizeGuideMaster?.howToMeasureTitle ||
    "HOW WE MEASURE (FLAT STUDIO METHOD):";
  const sizeGuideMeasureText =
    product.customHowToMeasureText ||
    activeSizeGuideMaster?.howToMeasureText ||
    "All garments are measured flat on a studio table. Chest width is measured 2.5cm below the armhole from seam to seam (double for full chest circumference). Tolerance is ±1.5cm due to enzyme garment washing.";

  return (
    <div className="pb-20 lg:pb-0">
      <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-16 lg:pb-24">
        {/* Two-Column Desktop Split: Left Gallery (58%) + Right Sticky Purchase Module (42%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* =================================================================
              LEFT COLUMN (7 Cols / 58%): 5-SHOT PRODUCT GALLERY
          ================================================================= */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3.5">
            {/* Thumbnail Navigation Strip */}
            <div
              className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible sm:w-[78px] shrink-0"
              aria-label="Product image thumbnails"
            >
              {product.images.map((img, index) => {
                const isActive = index === activeImageIndex;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`View ${img.role} image (${index + 1} of ${product.images.length})`}
                    className={`relative w-16 sm:w-full aspect-[4/5] bg-surface-alt border overflow-hidden shrink-0 transition-all ${
                      isActive
                        ? "border-ink ring-1 ring-ink"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono uppercase text-charcoal/80 bg-surface/80 px-1">
                      0{index + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main Image Viewer with Interactive 2x Hover Zoom & Lightbox Trigger */}
            <div className="flex-1 relative aspect-[4/5] bg-surface-alt border border-border overflow-hidden group">
              <div
                className="w-full h-full cursor-zoom-in overflow-hidden"
                onMouseEnter={() => setIsHoverZoomed(true)}
                onMouseLeave={() => setIsHoverZoomed(false)}
                onMouseMove={handleMouseMoveZoom}
                onClick={() => setZoomModalOpen(true)}
              >
                <img
                  src={activeImage.url}
                  alt={activeImage.alt}
                  fetchPriority="high"
                  style={
                    isHoverZoomed
                      ? {
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                          transform: "scale(1.85)",
                        }
                      : undefined
                  }
                  className="w-full h-full object-cover object-center transition-transform duration-150 ease-out"
                />
              </div>

              {/* Shot Role & Counter Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="bg-surface/90 border border-border px-2.5 py-1 text-[10px] font-medium tracking-[0.10em] uppercase text-ink">
                  SHOT 0{activeImageIndex + 1} // {activeImage.role.toUpperCase()} VIEW
                </span>
                <button
                  type="button"
                  onClick={() => setZoomModalOpen(true)}
                  aria-label="Open fullscreen image zoom"
                  className="pointer-events-auto bg-surface/90 border border-border p-2 text-ink hover:bg-ink hover:text-surface transition-colors"
                >
                  <ZoomIn className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Prev/Next Mobile Carousel Arrows */}
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }
                aria-label="Previous image"
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-surface/90 border border-border p-2 text-ink"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }
                aria-label="Next image"
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-surface/90 border border-border p-2 text-ink"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN (5 Cols / 42%): STICKY INFORMATION & PURCHASE MODULE
          ================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-[88px] space-y-6">
            {/* 1. Breadcrumbs & Dynamic SKU Stock Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
              <nav
                aria-label="Breadcrumb"
                className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted"
              >
                <Link href="/catalog" className="hover:text-ink">
                  SHOP
                </Link>
                <span className="mx-1.5">/</span>
                <Link
                  href={`/catalog?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-ink"
                >
                  {product.category}
                </Link>
              </nav>

              {/* Dynamic Availability Connected to Real Variant Stock */}
              <div className="flex items-center gap-1.5 tabular-nums">
                {variantStock <= 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                    <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
                      SOLD OUT
                    </span>
                  </>
                ) : variantStock <= 5 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-campaign-red" />
                    <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-campaign-red">
                      LIMITED STOCK — ONLY {variantStock} LEFT
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-status-success">
                      IN STOCK ({variantStock} AVAILABLE)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 2. Product Title, Price & Short Description */}
            <div>
              <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted mb-1">
                {product.collectionName} — SKU: {activeVariant?.sku}
              </p>
              <h1 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3 tabular-nums">
                <span className="text-lg sm:text-xl font-semibold text-ink">
                  {formatPrice(
                    activeVariant?.priceOverride ?? product.priceIdr,
                    currency
                  )}
                </span>
                {product.compareAtPriceIdr &&
                  product.compareAtPriceIdr > product.priceIdr && (
                    <span className="text-sm text-muted line-through">
                      {formatPrice(product.compareAtPriceIdr, currency)}
                    </span>
                  )}
              </div>

              <p className="mt-4 text-sm text-charcoal leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* 3. Color Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink">
                  COLOR:{" "}
                  <span className="text-charcoal font-normal">
                    {selectedColorObj?.name}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {product.colors.map((clr) => {
                  const isSelected = clr.id === selectedColorId;
                  return (
                    <button
                      key={clr.id}
                      type="button"
                      onClick={() => handleSelectColor(clr.id)}
                      title={clr.name}
                      aria-label={`Select color ${clr.name}`}
                      className={`w-8 h-8 border transition-all ${
                        isSelected
                          ? "border-ink ring-2 ring-ink ring-offset-2"
                          : "border-border hover:border-ink"
                      }`}
                      style={{ backgroundColor: clr.hex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 4. Size Selection & Inline Size Guide Trigger */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink">
                  SELECT SIZE:{" "}
                  <span className="text-charcoal font-normal">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 hover:text-muted hover:border-muted transition-colors"
                >
                  <Ruler className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>SIZE GUIDE</span>
                </button>
              </div>

              <div
                role="radiogroup"
                aria-label="Select garment size"
                className="grid grid-cols-5 gap-2"
              >
                {product.sizes.map((sz) => {
                  const variantForSize =
                    product.variants.find(
                      (v) => v.colorId === selectedColorId && v.size === sz
                    ) || product.variants.find((v) => v.size === sz);

                  const isAvailable = (variantForSize?.stock ?? 0) > 0;
                  const isSelected = selectedSize === sz;

                  return (
                    <button
                      key={sz}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={!isAvailable}
                      onClick={() => handleSelectSize(sz)}
                      className={`relative h-11 border text-xs font-semibold uppercase tracking-[0.06em] transition-colors overflow-hidden ${
                        isSelected
                          ? "bg-ink text-surface border-ink"
                          : isAvailable
                          ? "bg-surface text-ink border-border hover:border-ink"
                          : "bg-surface-alt text-muted border-border cursor-not-allowed"
                      }`}
                    >
                      <span>{sz}</span>
                      {!isAvailable && (
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <line
                            x1="0"
                            y1="100"
                            x2="100"
                            y2="0"
                            stroke={isSelected ? "#FFFFFF" : "#E2E1DC"}
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              {product.modelNotes && (
                <p className="mt-2 text-[11px] text-muted">{product.modelNotes}</p>
              )}
            </div>

            {/* 5. Quantity Selector & Wishlist Row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink">
                  QUANTITY
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-muted tabular-nums">
                  MAX {product.maxPerOrder} PER ORDER
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Rectangular Quantity Stepper */}
                <div className="inline-flex items-center border border-border h-11 w-[132px]">
                  <button
                    type="button"
                    disabled={quantity <= 1 || variantStock <= 0}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-full flex items-center justify-center text-ink hover:bg-surface-alt disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                  <span className="flex-1 text-center text-xs font-semibold tabular-nums">
                    {variantStock <= 0 ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAllowedQty || variantStock <= 0}
                    onClick={() =>
                      setQuantity((q) => Math.min(maxAllowedQty, q + 1))
                    }
                    aria-label="Increase quantity"
                    className="w-10 h-full flex items-center justify-center text-ink hover:bg-surface-alt disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                </div>

                {/* Wishlist Save Button */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Save to wishlist"
                  }
                  className={`h-11 px-4 border flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                    isWishlisted
                      ? "border-ink bg-surface-alt text-ink"
                      : "border-border bg-surface text-ink hover:border-ink"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 stroke-[1.5] ${
                      isWishlisted ? "fill-ink text-ink" : ""
                    }`}
                  />
                  <span>{isWishlisted ? "SAVED" : "WISHLIST"}</span>
                </button>
              </div>
            </div>

            {/* 6. Primary Purchase Actions */}
            {totalProductStock <= 0 || variantStock <= 0 ? (
              <button
                type="button"
                disabled
                className="w-full h-[52px] bg-border text-muted border border-border text-[12px] font-semibold tracking-[0.08em] uppercase cursor-not-allowed"
              >
                SOLD OUT — ARCHIVED RELEASE
              </button>
            ) : (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full h-[52px] bg-surface text-ink border border-ink text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-ink hover:text-surface transition-colors"
                >
                  ADD TO CART —{" "}
                  {formatPrice(
                    (activeVariant?.priceOverride ?? product.priceIdr) * quantity,
                    currency
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyItNow}
                  className="w-full h-[52px] bg-ink text-surface border border-ink text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-charcoal transition-colors"
                >
                  BUY IT NOW
                </button>
              </div>
            )}

            {/* 7. Configurable Delivery Information Block */}
            <div className="bg-surface-alt border border-border p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-ink">
                  <Truck className="w-4 h-4 stroke-[1.5]" />
                  <span>DELIVERY & DISPATCH INFORMATION</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                <label
                  htmlFor="pdp-deliver-to"
                  className="sm:col-span-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                >
                  Deliver to:
                </label>
                <div className="sm:col-span-8">
                  <select
                    id="pdp-deliver-to"
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full h-9 px-2.5 bg-surface border border-border text-base sm:text-xs font-medium text-ink focus:border-ink focus:outline-none"
                  >
                    {shippingAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.areaName} ({area.province})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs tabular-nums">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-muted block">
                    Weight:
                  </span>
                  <span className="font-semibold text-ink">
                    {formatWeight(totalWeightGrams)}{" "}
                    <span className="text-muted font-normal">
                      ({formatWeight(product.weightGrams)} / unit)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-muted block">
                    Est. Shipping ({primaryCourier?.name}):
                  </span>
                  <span className="font-semibold text-ink">
                    {formatPrice(estimatedShippingCost, currency)}{" "}
                    <span className="text-muted font-normal">
                      ({primaryCourier?.etd})
                    </span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-charcoal pt-1 border-t border-border leading-relaxed">
                {cms.deliveryDefaults.dispatchSlaText}
              </p>
            </div>

            {/* 8. Collapsible Accordions: DESCRIPTION & TERMS & CONDITIONS */}
            <div className="border-t border-border divide-y divide-border">
              {/* DESCRIPTION Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordion((prev) => ({
                      ...prev,
                      description: !prev.description,
                    }))
                  }
                  aria-expanded={openAccordion.description}
                  className="w-full h-[52px] flex items-center justify-between text-left"
                >
                  <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink">
                    DESCRIPTION & SPECIFICATIONS
                  </span>
                  {openAccordion.description ? (
                    <Minus className="w-4 h-4 stroke-[1.5] text-ink" />
                  ) : (
                    <Plus className="w-4 h-4 stroke-[1.5] text-ink" />
                  )}
                </button>

                {openAccordion.description && (
                  <div className="pb-5 space-y-4 text-sm text-charcoal">
                    <div className="grid grid-cols-2 gap-3 bg-surface-alt p-3 border border-border text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted block">
                          FABRIC & MATERIAL
                        </span>
                        <span className="font-medium text-ink mt-0.5 block">
                          {product.fabricSpec}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted block">
                          FIT PROFILE
                        </span>
                        <span className="font-medium text-ink mt-0.5 block">
                          {product.fitProfile}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted block">
                          ORIGIN / ATELIER
                        </span>
                        <span className="font-medium text-ink mt-0.5 block">
                          {product.madeIn}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted block">
                          GARMENT WEIGHT
                        </span>
                        <span className="font-medium text-ink mt-0.5 block tabular-nums">
                          {formatWeight(product.weightGrams)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-2">
                        CONSTRUCTION DETAILS:
                      </p>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs leading-relaxed">
                        {product.descriptionSpecs.map((spec, i) => (
                          <li key={i}>{spec}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                        CARE INSTRUCTIONS:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted">
                        {product.careInstructions.map((ci, i) => (
                          <li key={i}>{ci}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* TERMS & CONDITIONS Accordion */}
              <div className="border-b border-border">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordion((prev) => ({
                      ...prev,
                      terms: !prev.terms,
                    }))
                  }
                  aria-expanded={openAccordion.terms}
                  className="w-full h-[52px] flex items-center justify-between text-left"
                >
                  <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink">
                    TERMS & CONDITIONS
                  </span>
                  {openAccordion.terms ? (
                    <Minus className="w-4 h-4 stroke-[1.5] text-ink" />
                  ) : (
                    <Plus className="w-4 h-4 stroke-[1.5] text-ink" />
                  )}
                </button>

                {openAccordion.terms && (
                  <div className="pb-5 space-y-3 text-xs text-charcoal leading-relaxed">
                    <p className="font-medium text-ink">
                      {cms.deliveryDefaults.returnPolicySummary}
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      {cms.deliveryDefaults.termsConditionsBullets.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    <div className="pt-2 flex items-center gap-2 text-[11px] text-muted">
                      <ShieldCheck className="w-4 h-4 stroke-[1.5] text-ink shrink-0" />
                      <span>
                        100% Authentic Independent Release — Verified Xendit Payment
                        Protection.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            9. RELATED PRODUCTS: YOU MIGHT ALSO LIKE & RECENTLY VIEWED
        =================================================================== */}
        <section className="mt-20 pt-14 border-t border-border">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
                COMPLEMENTARY ARCHIVE PIECES
              </p>
              <h2 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
                YOU MIGHT ALSO LIKE
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-ink border-b border-ink pb-0.5"
            >
              VIEW CATALOG →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        {recentlyViewedProducts.length > 0 && (
          <section className="mt-16 pt-14 border-t border-border">
            <div className="mb-8">
              <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
                YOUR BROWSING HISTORY
              </p>
              <h2 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase tracking-[-0.015em] text-ink">
                RECENTLY VIEWED
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8">
              {recentlyViewedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* =====================================================================
          MOBILE STICKY BOTTOM PURCHASE BAR (<768px)
      ===================================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-ink px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-ink truncate">
            {product.name}
          </p>
          <p className="text-xs font-semibold text-charcoal tabular-nums">
            {formatPrice(product.priceIdr, currency)} — SIZE {selectedSize}
          </p>
        </div>
        <button
          type="button"
          disabled={variantStock <= 0}
          onClick={handleAddToCart}
          className="h-10 px-5 bg-ink text-surface text-[11px] font-semibold tracking-[0.08em] uppercase shrink-0 disabled:bg-border disabled:text-muted"
        >
          {variantStock <= 0 ? "SOLD OUT" : "ADD TO CART"}
        </button>
      </div>

      {/* =====================================================================
          INLINE SIZE GUIDE MODAL (Dynamic Size Guide Master + Product Override)
      ===================================================================== */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Size Guide and Garment Measurements"
        >
          <div
            className="fixed inset-0 bg-ink/55"
            onClick={() => setSizeGuideOpen(false)}
          />
          <div className="relative z-10 w-full max-w-[700px] bg-surface border border-ink p-5 sm:p-8 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted">
                    GARMENT SPECIFICATION MATRIX
                  </span>
                  {activeSizeGuideMaster && (
                    <span className="px-2 py-0.5 bg-surface-alt border border-border text-[9px] font-mono uppercase tracking-[0.08em] text-ink">
                      MASTER: {activeSizeGuideMaster.name}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-display font-bold text-lg sm:text-xl uppercase text-ink">
                  SIZE GUIDE — {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
                className="p-1 text-ink hover:text-muted"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-charcoal">
                Fit Profile:{" "}
                <strong className="font-semibold text-ink">
                  {product.fitProfile}
                </strong>
              </p>
              <div className="inline-flex border border-ink">
                {(["CM", "IN"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setSizeUnit(u)}
                    className={`px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                      sizeUnit === u
                        ? "bg-ink text-surface"
                        : "bg-surface text-ink"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs tabular-nums">
                <thead>
                  <tr className="bg-surface-alt border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
                    <th className="p-3 border-r border-border">SIZE</th>
                    <th className="p-3 border-r border-border">
                      {sizeGuideColumns[0]} ({sizeUnit})
                    </th>
                    <th className="p-3 border-r border-border">
                      {sizeGuideColumns[1]} ({sizeUnit})
                    </th>
                    <th className="p-3 border-r border-border">
                      {sizeGuideColumns[2]} ({sizeUnit})
                    </th>
                    <th className="p-3">
                      {sizeGuideColumns[3]} ({sizeUnit})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sizeGuideRows.map((row) => (
                    <tr
                      key={row.size}
                      className={
                        row.size === selectedSize ? "bg-surface-alt/70 font-semibold" : ""
                      }
                    >
                      <td className="p-3 border-r border-border font-semibold text-ink">
                        {row.size}
                      </td>
                      <td className="p-3 border-r border-border">
                        {sizeUnit === "CM" ? row.chestCm : cmToInches(row.chestCm)}
                      </td>
                      <td className="p-3 border-r border-border">
                        {sizeUnit === "CM" ? row.lengthCm : cmToInches(row.lengthCm)}
                      </td>
                      <td className="p-3 border-r border-border">
                        {sizeUnit === "CM"
                          ? row.shoulderCm
                          : cmToInches(row.shoulderCm)}
                      </td>
                      <td className="p-3">
                        {sizeUnit === "CM" ? row.sleeveCm : cmToInches(row.sleeveCm)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-4 bg-surface-alt border border-border text-xs text-charcoal space-y-1.5">
              <p className="font-semibold uppercase tracking-[0.06em] text-ink text-[11px]">
                {sizeGuideMeasureTitle}
              </p>
              <p>{sizeGuideMeasureText}</p>
              {product.modelNotes && (
                <p className="text-ink font-medium pt-1">{product.modelNotes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FULLSCREEN IMAGE ZOOM LIGHTBOX MODAL
      ===================================================================== */}
      {zoomModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex flex-col justify-between p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="High resolution product image viewer"
        >
          <div className="flex items-center justify-between text-surface">
            <span className="text-xs font-mono uppercase tracking-[0.10em]">
              {product.name} — [0{activeImageIndex + 1} / 0{product.images.length}]
            </span>
            <button
              type="button"
              onClick={() => setZoomModalOpen(false)}
              className="p-2 border border-charcoal text-surface hover:bg-surface hover:text-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              className="max-h-[80dvh] max-w-full object-contain border border-charcoal"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIndex(i)}
                className={`w-12 h-14 border overflow-hidden ${
                  i === activeImageIndex ? "border-surface" : "border-charcoal opacity-50"
                }`}
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          GUEST WISHLIST SIGN-IN PROMPT MODAL
      ===================================================================== */}
      {guestWishlistModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/55"
            onClick={() => setGuestWishlistModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-ink p-6 sm:p-8">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.10em] uppercase text-campaign-red">
                  MEMBER ARCHIVE ACCESS
                </span>
                <h3 className="mt-1 font-display font-bold text-lg uppercase text-ink">
                  SIGN IN TO SAVE WISHLIST ITEMS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuestWishlistModalOpen(false)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-4 text-xs text-charcoal leading-relaxed">
              Enjoy special discounts, early drop notifications, and synced wishlists
              across your devices.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                login(guestEmail || "member@nocturne-atelier.com");
                toggleWishlist(product.id);
                setGuestWishlistModalOpen(false);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="member@nocturne-atelier.com"
                  className="w-full h-11 px-3.5 border border-border text-base sm:text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] hover:bg-charcoal transition-colors"
              >
                SIGN IN & SAVE TO WISHLIST
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

