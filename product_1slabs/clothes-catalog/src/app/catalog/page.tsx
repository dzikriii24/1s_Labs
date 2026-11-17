"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Check } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { ProductCategory, ProductType, SizeCode } from "@/types/store";
import { getProductTotalStock } from "@/lib/format";

const CATEGORIES: ProductCategory[] = [
  "Tees",
  "Tops & Shirts",
  "Outerwear",
  "Hoodies & Knits",
  "Bottoms",
  "Headwear",
  "Accessories",
];

const PRODUCT_TYPES: ProductType[] = [
  "Featured Release",
  "Core Collection",
  "Collaboration",
  "Archive",
];

const SIZES: SizeCode[] = ["S", "M", "L", "XL", "XXL", "30", "32", "34", "OS"];

const PRICE_BRACKETS = [
  { id: "all", label: "All Prices", min: 0, max: Infinity },
  { id: "under-450k", label: "Under Rp 450.000", min: 0, max: 450000 },
  { id: "450k-750k", label: "Rp 450.000 – Rp 750.000", min: 450000, max: 750000 },
  { id: "above-750k", label: "Above Rp 750.000", min: 750000, max: Infinity },
];

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "bestselling";

function CatalogContent() {
  const searchParams = useSearchParams();
  const { products, collections } = useStore();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedPriceBracket, setSelectedPriceBracket] = useState<string>("all");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<SizeCode[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "in-stock" | "sold-out"
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync initial URL query params
  useEffect(() => {
    const catParam = searchParams.get("category") as ProductCategory | null;
    const typeParam = searchParams.get("type") as ProductType | null;
    const colParam = searchParams.get("collection");
    const qParam = searchParams.get("q");

    if (catParam && CATEGORIES.includes(catParam)) {
      setSelectedCategories([catParam]);
    }
    if (typeParam && PRODUCT_TYPES.includes(typeParam)) {
      setSelectedTypes([typeParam]);
    }
    if (colParam) {
      setSelectedCollection(colParam);
    } else {
      setSelectedCollection("");
    }
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  // Extract unique colors from catalog
  const availableColors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string }>();
    for (const p of products) {
      for (const c of p.colors) {
        if (!map.has(c.name)) {
          map.set(c.name, { name: c.name, hex: c.hex });
        }
      }
    }
    return Array.from(map.values());
  }, [products]);

  const toggleCategory = (cat: ProductCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleType = (t: ProductType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  const toggleSize = (sz: SizeCode) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedTypes.length +
    (selectedCollection ? 1 : 0) +
    (selectedPriceBracket !== "all" ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (availabilityFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedCollection("");
    setSelectedPriceBracket("all");
    setSelectedColors([]);
    setSelectedSizes([]);
    setAvailabilityFilter("all");
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const bracket =
      PRICE_BRACKETS.find((b) => b.id === selectedPriceBracket) || PRICE_BRACKETS[0];

    const list = products.filter((product) => {
      // 1. Search Query (name, collection, category, product type)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.collectionName.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.productType.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Collection filter
      if (selectedCollection && product.collectionSlug !== selectedCollection) {
        return false;
      }

      // 3. Category filter
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(product.category)
      ) {
        return false;
      }

      // 4. Product Type filter
      if (
        selectedTypes.length > 0 &&
        !selectedTypes.includes(product.productType)
      ) {
        return false;
      }

      // 5. Price Range filter
      if (product.priceIdr < bracket.min || product.priceIdr > bracket.max) {
        return false;
      }

      // 6. Color filter
      if (
        selectedColors.length > 0 &&
        !product.colors.some((c) => selectedColors.includes(c.name))
      ) {
        return false;
      }

      // 7. Size filter (checks if product offers the selected size with stock > 0, or offers size at all)
      if (
        selectedSizes.length > 0 &&
        !product.sizes.some((s) => selectedSizes.includes(s))
      ) {
        return false;
      }

      // 8. Availability filter
      const totalStock = getProductTotalStock(product.variants);
      if (availabilityFilter === "in-stock" && totalStock <= 0) return false;
      if (availabilityFilter === "sold-out" && totalStock > 0) return false;

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "price-asc") return a.priceIdr - b.priceIdr;
      if (sortBy === "price-desc") return b.priceIdr - a.priceIdr;
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "bestselling") {
        return a.bestSellingRank - b.bestSellingRank;
      }
      // Default: Featured first, then bestSellingRank
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.bestSellingRank - b.bestSellingRank;
    });
  }, [
    products,
    searchQuery,
    selectedCollection,
    selectedCategories,
    selectedTypes,
    selectedPriceBracket,
    selectedColors,
    selectedSizes,
    availabilityFilter,
    sortBy,
  ]);

  const activeCollectionObj = collections.find(
    (c) => c.slug === selectedCollection
  );

  // Reusable Filter Controls Block (Rendered in Desktop Sidebar & Mobile Drawer)
  const renderFilterSections = () => (
    <div className="space-y-7">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-ink">
        <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink">
          FILTERS {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 hover:text-campaign-red hover:border-campaign-red transition-colors"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Collection Selector */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          COLLECTION
        </h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedCollection("")}
            className={`w-full text-left text-xs uppercase tracking-[0.04em] flex items-center justify-between py-1 ${
              selectedCollection === ""
                ? "font-semibold text-ink"
                : "text-charcoal hover:text-ink"
            }`}
          >
            <span>All Collections</span>
            <span className="text-[11px] text-muted tabular-nums">
              ({products.length})
            </span>
          </button>
          {collections.map((col) => {
            const count = products.filter((p) => p.collectionSlug === col.slug).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() =>
                  setSelectedCollection(
                    selectedCollection === col.slug ? "" : col.slug
                  )
                }
                className={`w-full text-left text-xs uppercase tracking-[0.04em] flex items-center justify-between py-1 ${
                  selectedCollection === col.slug
                    ? "font-semibold text-ink"
                    : "text-charcoal hover:text-ink"
                }`}
              >
                <span className="truncate pr-2">{col.name}</span>
                <span className="text-[11px] text-muted tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Category Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          1. CATEGORY
        </h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const checked = selectedCategories.includes(cat);
            const count = products.filter((p) => p.category === cat).length;
            return (
              <label
                key={cat}
                className="flex items-center justify-between cursor-pointer group py-0.5"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-ink border-ink text-surface"
                        : "border-border group-hover:border-ink bg-surface"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </span>
                  <span
                    className={`text-xs uppercase tracking-[0.03em] ${
                      checked ? "font-semibold text-ink" : "text-charcoal"
                    }`}
                  >
                    {cat}
                  </span>
                </span>
                <span className="text-[11px] text-muted tabular-nums">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Product Type Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          2. PRODUCT TYPE
        </h3>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((pt) => {
            const checked = selectedTypes.includes(pt);
            const count = products.filter((p) => p.productType === pt).length;
            return (
              <label
                key={pt}
                className="flex items-center justify-between cursor-pointer group py-0.5"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(pt)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-ink border-ink text-surface"
                        : "border-border group-hover:border-ink bg-surface"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </span>
                  <span
                    className={`text-xs uppercase tracking-[0.03em] ${
                      checked ? "font-semibold text-ink" : "text-charcoal"
                    }`}
                  >
                    {pt}
                  </span>
                </span>
                <span className="text-[11px] text-muted tabular-nums">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Availability Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          3. AVAILABILITY
        </h3>
        <div className="space-y-2">
          {[
            { id: "all", label: "All Products" },
            { id: "in-stock", label: "In Stock Only" },
            { id: "sold-out", label: "Archived / Sold Out" },
          ].map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2.5 cursor-pointer py-0.5"
            >
              <input
                type="radio"
                name="availability"
                checked={availabilityFilter === opt.id}
                onChange={() =>
                  setAvailabilityFilter(opt.id as "all" | "in-stock" | "sold-out")
                }
                className="sr-only"
              />
              <span
                className={`w-4 h-4 border flex items-center justify-center ${
                  availabilityFilter === opt.id ? "border-ink" : "border-border"
                }`}
              >
                {availabilityFilter === opt.id && (
                  <span className="w-2 h-2 bg-ink" />
                )}
              </span>
              <span
                className={`text-xs uppercase tracking-[0.03em] ${
                  availabilityFilter === opt.id
                    ? "font-semibold text-ink"
                    : "text-charcoal"
                }`}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Price Range Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          4. PRICE RANGE
        </h3>
        <div className="space-y-2">
          {PRICE_BRACKETS.map((bracket) => (
            <label
              key={bracket.id}
              className="flex items-center gap-2.5 cursor-pointer py-0.5"
            >
              <input
                type="radio"
                name="priceBracket"
                checked={selectedPriceBracket === bracket.id}
                onChange={() => setSelectedPriceBracket(bracket.id)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 border flex items-center justify-center ${
                  selectedPriceBracket === bracket.id
                    ? "border-ink"
                    : "border-border"
                }`}
              >
                {selectedPriceBracket === bracket.id && (
                  <span className="w-2 h-2 bg-ink" />
                )}
              </span>
              <span
                className={`text-xs tabular-nums ${
                  selectedPriceBracket === bracket.id
                    ? "font-semibold text-ink"
                    : "text-charcoal"
                }`}
              >
                {bracket.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Color Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          5. COLOR
        </h3>
        <div className="space-y-2">
          {availableColors.map((c) => {
            const active = selectedColors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleColor(c.name)}
                className="w-full flex items-center gap-2.5 py-0.5 text-left"
              >
                <span
                  className={`w-4 h-4 border ${
                    active ? "ring-1 ring-ink ring-offset-1 border-ink" : "border-border"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
                <span
                  className={`text-xs uppercase tracking-[0.03em] ${
                    active ? "font-semibold text-ink" : "text-charcoal"
                  }`}
                >
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Size Filter */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
          6. SIZE
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES.map((sz) => {
            const active = selectedSizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`h-9 border text-xs font-medium uppercase transition-colors ${
                  active
                    ? "bg-ink text-surface border-ink"
                    : "bg-surface text-ink border-border hover:border-ink"
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
      {/* Breadcrumb & Collection Banner Header */}
      <div className="pb-6 border-b border-border">
        <nav
          aria-label="Breadcrumb"
          className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted mb-3"
        >
          <Link href="/" className="hover:text-ink">
            HOME
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">
            {activeCollectionObj ? activeCollectionObj.name : "CATALOG"}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-[-0.02em] text-ink tabular-nums">
              {activeCollectionObj ? activeCollectionObj.name : "ALL PRODUCTS"}{" "}
              <span className="text-muted font-normal text-lg sm:text-2xl">
                ({filteredProducts.length})
              </span>
            </h1>
            {activeCollectionObj && (
              <p className="mt-2 text-sm text-charcoal max-w-2xl">
                {activeCollectionObj.editorialCopy}
              </p>
            )}
          </div>

          {/* Search & Sort Controls (Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH NAME, COLLECTION, TYPE..."
                aria-label="Search catalog"
                className="w-full h-10 pl-9 pr-8 bg-surface border border-border text-base sm:text-xs uppercase tracking-[0.05em] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="catalog-sort"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted shrink-0 hidden sm:inline"
              >
                SORT BY:
              </label>
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3 bg-surface border border-border text-base sm:text-xs font-semibold uppercase tracking-[0.06em] text-ink focus:border-ink focus:outline-none"
              >
                <option value="featured">FEATURED</option>
                <option value="newest">NEWEST RELEASES</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
                <option value="bestselling">BEST SELLING</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter & Sort Sticky Trigger Bar (<1024px) */}
      <div className="lg:hidden sticky top-[56px] z-30 bg-surface border-b border-border py-2.5 my-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="flex-1 h-10 border border-ink bg-surface text-ink text-xs font-semibold tracking-[0.08em] uppercase flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[1.5]" />
          <span>
            FILTERS {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </span>
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="h-10 px-4 border border-border text-xs font-semibold tracking-[0.08em] uppercase text-charcoal"
          >
            RESET
          </button>
        )}
      </div>

      {/* Main Catalog Split: Left Sidebar (Desktop) + Right Product Grid */}
      <div className="mt-8 flex items-start gap-10">
        {/* Desktop Left Filter Sidebar (260px sticky) */}
        <aside
          aria-label="Product filters"
          className="hidden lg:block w-[260px] shrink-0 sticky top-[88px] max-h-[calc(100dvh-108px)] overflow-y-auto pr-2"
        >
          {renderFilterSections()}
        </aside>

        {/* Right Product Listing Grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="border border-border bg-surface-alt/40 py-24 px-6 text-center">
              <p className="font-display font-bold text-lg uppercase tracking-[-0.01em] text-ink">
                NO PRODUCTS MATCH YOUR SELECTED FILTERS.
              </p>
              <p className="mt-2 text-xs text-muted max-w-md mx-auto">
                Try removing one or more filter constraints or clearing your search
                query to inspect the full seasonal catalog.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 h-11 px-7 border border-ink bg-surface text-ink text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-ink hover:text-surface transition-colors"
              >
                RESET ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8 sm:gap-y-10">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer (<1024px) */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Catalog filters"
        >
          <div
            className="fixed inset-0 bg-ink/55"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative z-10 w-[min(380px,100vw)] h-[100dvh] bg-surface border-r border-ink flex flex-col justify-between">
            <div className="h-[56px] px-5 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.08em] uppercase text-ink">
                FILTER ARCHIVE ({filteredProducts.length} RESULTS)
              </span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
                className="p-1.5 text-ink"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterSections()}
            </div>

            <div className="p-4 border-t border-border bg-surface grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-12 border border-ink bg-surface text-ink text-xs font-semibold tracking-[0.08em] uppercase"
              >
                CLEAR ALL
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="h-12 bg-ink text-surface text-xs font-semibold tracking-[0.08em] uppercase"
              >
                APPLY ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16">
          <div className="h-8 w-64 bg-surface-alt mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="aspect-[4/5] bg-surface-alt" />
            ))}
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}

