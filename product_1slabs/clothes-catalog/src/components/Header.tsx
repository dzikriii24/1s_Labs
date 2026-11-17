"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";

const CATEGORIES = [
  "Tees",
  "Tops & Shirts",
  "Outerwear",
  "Hoodies & Knits",
  "Bottoms",
  "Headwear",
  "Accessories",
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cms,
    collections,
    products,
    currency,
    setCurrency,
    cartCount,
    setIsMiniCartOpen,
    isSearchOpen,
    setIsSearchOpen,
    wishlistIds,
    currentUser,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMegaOpen, setShopMegaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMinimalCheckoutHeader =
    pathname === "/checkout" || pathname?.startsWith("/orders/");

  useEffect(() => {
    setMobileMenuOpen(false);
    setShopMegaOpen(false);
    setIsSearchOpen(false);
  }, [pathname, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setMobileMenuOpen(false);
        setShopMegaOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsSearchOpen]);

  const liveSearchResults =
    searchQuery.trim().length > 0
      ? products
          .filter((p) => {
            const q = searchQuery.toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.collectionName.toLowerCase().includes(q) ||
              p.productType.toLowerCase().includes(q)
            );
          })
          .slice(0, 5)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  if (isMinimalCheckoutHeader) {
    return (
      <header className="sticky top-0 z-40 h-[64px] bg-surface border-b border-border">
        <div className="max-w-checkout mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          <Link
            href="/"
            className="font-display font-extrabold text-base sm:text-lg tracking-[-0.03em] uppercase text-ink"
          >
            {cms.brandName}
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
              <Lock className="w-3.5 h-3.5 stroke-[1.75]" />
              XENDIT SECURE CHECKOUT
            </span>
            <Link
              href="/cart"
              className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 hover:text-muted hover:border-muted transition-colors"
            >
              ← RETURN TO BAG
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Optional Top Announcement / Drop Bar */}
      {cms.announcementBar.enabled && (
        <div className="bg-ink text-surface min-h-[32px] px-4 py-1.5 flex items-center justify-center text-center border-b border-charcoal">
          <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.10em] uppercase leading-tight">
            {cms.announcementBar.text}
            {cms.announcementBar.linkText && cms.announcementBar.linkHref && (
              <Link
                href={cms.announcementBar.linkHref}
                className="ml-3 underline underline-offset-2 text-surface hover:text-campaign-red transition-colors font-semibold"
              >
                {cms.announcementBar.linkText} →
              </Link>
            )}
          </p>
        </div>
      )}

      {/* Main Sticky Header */}
      <header
        className="sticky top-0 z-40 h-[56px] lg:h-[68px] bg-surface/95 border-b border-border"
        onMouseLeave={() => setShopMegaOpen(false)}
      >
        <div className="max-w-storefront mx-auto h-full px-4 sm:px-6 lg:px-10 grid grid-cols-3 items-center">
          {/* Left Zone: Desktop Navigation / Mobile Menu Trigger */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-ink hover:text-muted transition-colors"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>

            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-7"
            >
              <div
                className="h-[68px] flex items-center"
                onMouseEnter={() => setShopMegaOpen(true)}
              >
                <Link
                  href="/catalog"
                  className={`text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                    pathname === "/catalog"
                      ? "text-ink border-b border-ink pb-0.5"
                      : "text-ink hover:text-muted"
                  }`}
                >
                  SHOP
                </Link>
              </div>

              <Link
                href="/catalog?type=Featured+Release"
                className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink hover:text-muted transition-colors"
              >
                DROPS
              </Link>

              <Link
                href="/community"
                className={`text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                  pathname === "/community"
                    ? "text-ink border-b border-ink pb-0.5"
                    : "text-ink hover:text-muted"
                }`}
              >
                COMMUNITY
              </Link>

              <Link
                href="/about"
                className={`text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                  pathname === "/about"
                    ? "text-ink border-b border-ink pb-0.5"
                    : "text-ink hover:text-muted"
                }`}
              >
                ABOUT
              </Link>

              <Link
                href="/admin"
                className={`text-[11px] font-semibold tracking-[0.08em] uppercase px-2 py-1 border transition-colors ${
                  pathname?.startsWith("/admin")
                    ? "bg-ink text-surface border-ink"
                    : "border-border text-charcoal hover:border-ink hover:text-ink"
                }`}
              >
                CMS / ADMIN
              </Link>
            </nav>
          </div>

          {/* Center Zone: Brand Wordmark */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="font-display font-extrabold text-[15px] sm:text-[18px] lg:text-[20px] tracking-[-0.03em] uppercase text-ink whitespace-nowrap"
            >
              {cms.brandName}
            </Link>
          </div>

          {/* Right Zone: Utility Controls */}
          <div className="flex items-center justify-end gap-3 sm:gap-5">
            {/* Currency Switcher */}
            <button
              type="button"
              onClick={() => setCurrency(currency === "IDR" ? "USD" : "IDR")}
              aria-label="Toggle currency between IDR and USD"
              className="hidden sm:inline-flex items-center text-[11px] font-medium tracking-[0.10em] uppercase text-charcoal hover:text-ink border border-border px-2 py-1 transition-colors tabular-nums"
            >
              {currency === "IDR" ? "IDR / ID" : "USD / INTL"}
            </button>

            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle product search"
              className="p-1.5 text-ink hover:text-muted transition-colors flex items-center gap-1.5"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
              <span className="hidden xl:inline text-[12px] font-semibold tracking-[0.08em] uppercase">
                SEARCH
              </span>
            </button>

            {/* Wishlist Link */}
            <Link
              href="/account?tab=wishlist"
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              className="hidden sm:inline-flex p-1.5 text-ink hover:text-muted transition-colors items-center gap-1"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlistIds.length > 0 && (
                <span className="text-[11px] font-medium tracking-[0.08em] tabular-nums">
                  ({wishlistIds.length})
                </span>
              )}
            </Link>

            {/* Account Link */}
            <Link
              href="/account"
              aria-label="Customer account"
              className="hidden sm:inline-flex p-1.5 text-ink hover:text-muted transition-colors items-center gap-1.5"
            >
              <User className="w-5 h-5 stroke-[1.5]" />
              <span className="hidden xl:inline text-[12px] font-semibold tracking-[0.08em] uppercase">
                {currentUser ? currentUser.fullName.split(" ")[0] : "ACCOUNT"}
              </span>
            </Link>

            {/* Shopping Bag Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMiniCartOpen(true)}
              aria-label={`Shopping bag with ${cartCount} items`}
              className="p-1.5 -mr-1.5 text-ink hover:text-muted transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase tabular-nums">
                <span className="hidden sm:inline">BAG </span>({cartCount})
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Architectural Mega-Dropdown for SHOP */}
        {shopMegaOpen && (
          <div
            onMouseEnter={() => setShopMegaOpen(true)}
            onMouseLeave={() => setShopMegaOpen(false)}
            className="hidden lg:block absolute top-full left-0 w-full bg-surface border-b border-ink z-50"
          >
            <div className="max-w-storefront mx-auto px-10 py-10 grid grid-cols-12 gap-8">
              <div className="col-span-3 border-r border-border pr-6">
                <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted mb-4">
                  GARMENT CATEGORIES
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/catalog"
                      className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink hover:text-muted flex items-center justify-between"
                    >
                      <span>ALL ARCHIVE & RELEASES</span>
                      <span className="text-[11px] text-muted tabular-nums">
                        ({products.length})
                      </span>
                    </Link>
                  </li>
                  {CATEGORIES.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <li key={cat}>
                        <Link
                          href={`/catalog?category=${encodeURIComponent(cat)}`}
                          className="text-[13px] uppercase tracking-[0.04em] text-charcoal hover:text-ink flex items-center justify-between transition-colors"
                        >
                          <span>{cat}</span>
                          <span className="text-[11px] text-muted tabular-nums">
                            ({count})
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="col-span-4 border-r border-border pr-6">
                <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted mb-4">
                  SEASONAL COLLECTIONS
                </p>
                <ul className="space-y-4">
                  {collections.map((col) => (
                    <li key={col.id}>
                      <Link
                        href={`/catalog?collection=${col.slug}`}
                        className="group block"
                      >
                        <span className="text-[11px] font-medium tracking-[0.10em] text-muted block">
                          {col.indexCode} — {col.seasonTag}
                        </span>
                        <span className="text-[14px] font-display font-bold uppercase text-ink group-hover:underline">
                          {col.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-5 flex gap-6 items-center bg-surface-alt p-4 border border-border">
                <img
                  src={cms.hero.primaryImage}
                  alt={cms.hero.title}
                  className="w-36 aspect-[4/5] object-cover bg-ink shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="inline-block text-[10px] font-semibold tracking-[0.10em] uppercase text-campaign-red">
                      {cms.hero.redAccentStamp}
                    </span>
                    <h4 className="mt-1 font-display font-bold text-lg uppercase leading-tight text-ink">
                      {cms.hero.title}
                    </h4>
                    <p className="mt-2 text-xs text-charcoal line-clamp-2">
                      {cms.hero.subtitle}
                    </p>
                  </div>
                  <Link
                    href={cms.hero.ctaHref}
                    className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5 self-start hover:text-muted"
                  >
                    <span>{cms.hero.ctaText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide-Down Instant Search Bar */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-surface border-b border-ink z-50">
            <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-5">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 border-b border-ink pb-3"
              >
                <Search className="w-5 h-5 text-ink stroke-[1.5] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BY PRODUCT NAME, COLLECTION, CATEGORY, OR TYPE..."
                  className="w-full bg-transparent text-base sm:text-sm uppercase tracking-[0.04em] text-ink placeholder:text-muted focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink"
                  >
                    CLEAR
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-ink text-surface px-5 h-9 text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-charcoal transition-colors shrink-0"
                >
                  SEARCH
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Close search bar"
                  className="p-1.5 text-ink hover:text-muted"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </form>

              {/* Instant Live Results */}
              {searchQuery.trim().length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
                      INSTANT MATCHES ({liveSearchResults.length})
                    </span>
                    <Link
                      href={`/catalog?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink border-b border-ink pb-0.5"
                    >
                      VIEW ALL RESULTS →
                    </Link>
                  </div>

                  {liveSearchResults.length === 0 ? (
                    <p className="text-xs text-muted py-4 uppercase tracking-[0.05em]">
                      NO ARCHIVE RELEASES MATCH &ldquo;{searchQuery}&rdquo;.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {liveSearchResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 p-2 border border-border hover:border-ink transition-colors bg-surface-alt/50"
                        >
                          <img
                            src={item.images[0]?.url}
                            alt={item.name}
                            className="w-12 h-14 object-cover bg-surface-alt shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase text-ink truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-charcoal tabular-nums mt-0.5">
                              {formatPrice(item.priceIdr, currency)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Full-Screen Navigation Drawer (<1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-ink/55"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[min(380px,100vw)] h-[100dvh] bg-surface flex flex-col justify-between overflow-y-auto border-r border-ink">
            <div>
              <div className="h-[56px] px-4 flex items-center justify-between border-b border-border">
                <span className="font-display font-extrabold text-sm tracking-[-0.03em] uppercase text-ink">
                  {cms.brandName}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 -mr-2 text-ink"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <nav className="p-6 space-y-5">
                <Link
                  href="/catalog"
                  className="block font-display font-bold text-2xl uppercase tracking-[-0.02em] text-ink"
                >
                  SHOP ALL ARCHIVE
                </Link>

                <div className="pl-3 border-l border-border space-y-2.5">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      href={`/catalog?category=${encodeURIComponent(cat)}`}
                      className="block text-xs font-semibold uppercase tracking-[0.08em] text-charcoal hover:text-ink"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>

                <Link
                  href="/catalog?type=Featured+Release"
                  className="block font-display font-bold text-2xl uppercase tracking-[-0.02em] text-ink"
                >
                  FEATURED DROPS
                </Link>

                <Link
                  href="/community"
                  className="block font-display font-bold text-2xl uppercase tracking-[-0.02em] text-ink"
                >
                  COMMUNITY LOOKBOOK
                </Link>

                <Link
                  href="/about"
                  className="block font-display font-bold text-2xl uppercase tracking-[-0.02em] text-ink"
                >
                  ABOUT THE BRAND
                </Link>

                <Link
                  href="/admin"
                  className="inline-block font-display font-bold text-sm uppercase tracking-[0.08em] bg-ink text-surface px-3 py-2"
                >
                  ADMIN CMS PANEL →
                </Link>
              </nav>
            </div>

            <div className="p-6 border-t border-border bg-surface-alt space-y-3">
              <div className="flex items-center justify-between">
                <Link
                  href="/account"
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-ink flex items-center gap-2"
                >
                  <User className="w-4 h-4 stroke-[1.5]" />
                  <span>
                    {currentUser ? `ACCOUNT (${currentUser.fullName})` : "SIGN IN / REGISTER"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setCurrency(currency === "IDR" ? "USD" : "IDR")}
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] border border-ink px-2.5 py-1 bg-surface"
                >
                  CURRENCY: {currency}
                </button>
              </div>
              <Link
                href="/account?tab=wishlist"
                className="block text-xs font-semibold uppercase tracking-[0.08em] text-charcoal"
              >
                SAVED WISHLIST ({wishlistIds.length})
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

