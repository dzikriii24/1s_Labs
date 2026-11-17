"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Trash2,
  Plus,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/format";
import { OrderFulfillmentStatus } from "@/types/store";

type AccountTab = "profile" | "orders" | "wishlist" | "addresses" | "settings";

function AccountContent() {
  const searchParams = useSearchParams();
  const {
    products,
    orders,
    shippingAreas,
    currency,
    setCurrency,
    wishlistIds,
    toggleWishlist,
    currentUser,
    login,
    logout,
    updateProfile,
    addAddress,
    removeAddress,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("member@nocturne-atelier.com");
  const [authPassword, setAuthPassword] = useState("••••••••••••");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Order filter state
  const [orderFilter, setOrderFilter] = useState<"ALL" | OrderFulfillmentStatus>(
    "ALL"
  );

  // Profile form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // New Address form state
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState("HOME / RESIDENCE");
  const [addrAreaId, setAddrAreaId] = useState(
    shippingAreas[0]?.id || "area-jkt"
  );
  const [addrPostal, setAddrPostal] = useState("12160");
  const [addrStreet, setAddrStreet] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as AccountTab | null;
    if (
      tabParam &&
      ["profile", "orders", "wishlist", "addresses", "settings"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.fullName);
      setEditPhone(currentUser.phone);
    }
  }, [currentUser]);

  // =========================================================================
  // UNAUTHENTICATED VIEW: "Enjoy Special Discounts and Stay Connected"
  // =========================================================================
  if (!currentUser) {
    const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      login(
        authEmail || "member@nocturne-atelier.com",
        authMode === "register" ? authName : undefined
      );
    };

    return (
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-ink bg-surface">
          {/* Left Editorial Campaign Panel (5 Cols) */}
          <div className="lg:col-span-5 relative bg-ink text-surface p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[380px]">
            <img
              src="/images/hero-campaign.png"
              alt="Member Archive Access"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 campaign-halftone opacity-30 pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block bg-campaign-red text-surface px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                ATELIER MEMBERSHIP
              </span>
              <h1 className="mt-5 font-display font-extrabold text-2xl sm:text-4xl uppercase leading-[0.98] tracking-[-0.02em] text-surface">
                ENJOY SPECIAL DISCOUNTS AND STAY CONNECTED
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-surface/80 leading-relaxed">
                Register or sign in to unlock private archive allocations, track
                real-time Xendit orders, and sync your curated wishlist.
              </p>
            </div>

            <ul className="relative z-10 mt-8 pt-6 border-t border-surface/20 space-y-2 text-[11px] uppercase tracking-[0.08em] text-surface/90">
              <li>● EARLY ACCESS TO NUMBERED CAPSULE RELEASES</li>
              <li>● REAL-TIME ORDER & AIRWAYBILL TRACKING</li>
              <li>● SAVED WISHLIST & EXPRESS CHECKOUT ADDRESSES</li>
            </ul>
          </div>

          {/* Right Auth Form Panel (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-12 flex flex-col justify-center">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 border-b border-border mb-8">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`pb-3 text-xs font-semibold uppercase tracking-[0.08em] border-b-2 transition-colors ${
                  authMode === "login"
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`pb-3 text-xs font-semibold uppercase tracking-[0.08em] border-b-2 transition-colors ${
                  authMode === "register"
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {authMode === "register" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="E.G. RAKA PRADIPTA"
                    className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="member@nocturne-atelier.com"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
                    PASSWORD *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-[46px] pl-3.5 pr-10 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] hover:bg-charcoal transition-colors"
              >
                {authMode === "login"
                  ? "SIGN IN TO MEMBER PORTAL"
                  : "CREATE ATELIER ACCOUNT"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted">
              <span>
                Demo credentials pre-filled:{" "}
                <strong className="text-ink">member@nocturne-atelier.com</strong>
              </span>
              <button
                type="button"
                onClick={() => login("member@nocturne-atelier.com", "Raka Pradipta")}
                className="font-semibold uppercase text-ink underline self-start sm:self-auto"
              >
                INSTANT DEMO LOGIN →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED MEMBER PORTAL
  // =========================================================================
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const customerOrders = orders.filter(
    (o) =>
      o.customer.email.toLowerCase() === currentUser.email.toLowerCase() ||
      o.customer.userId === currentUser.id
  );
  const displayedOrders =
    orderFilter === "ALL"
      ? customerOrders
      : customerOrders.filter((o) => o.fulfillmentStatus === orderFilter);

  const NAV_ITEMS: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: "PROFILE INFORMATION",
      icon: <User className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: "orders",
      label: `MY ORDERS (${customerOrders.length})`,
      icon: <Package className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: "wishlist",
      label: `WISHLIST (${wishlistedProducts.length})`,
      icon: <Heart className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: "addresses",
      label: `ADDRESSES (${currentUser.addresses.length})`,
      icon: <MapPin className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: "settings",
      label: "ACCOUNT SETTINGS",
      icon: <Settings className="w-4 h-4 stroke-[1.5]" />,
    },
  ];

  return (
    <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      {/* Member Header */}
      <div className="pb-6 border-b border-ink flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
            ATELIER MEMBER ARCHIVE // SINCE {currentUser.memberSince}
          </p>
          <h1 className="mt-1 font-display font-bold text-2xl sm:text-4xl uppercase tracking-[-0.02em] text-ink">
            {currentUser.fullName}
          </h1>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal hover:text-campaign-red transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 stroke-[1.5]" />
          <span>SIGN OUT</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Navigation Rail (3 Cols) */}
        <aside className="lg:col-span-3 border border-border bg-surface divide-y divide-border">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-4 py-3.5 flex items-center gap-3 text-left text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "bg-ink text-surface"
                    : "text-charcoal hover:bg-surface-alt hover:text-ink"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Area (9 Cols) */}
        <div className="lg:col-span-9 min-w-0">
          {/* TAB 1: PROFILE INFORMATION */}
          {activeTab === "profile" && (
            <div className="border border-border p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-border">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  PROFILE INFORMATION
                </h2>
                <p className="text-xs text-muted mt-1">
                  Manage your personal identity and dispatch contact coordinates.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfile({ fullName: editName, phone: editPhone });
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl"
              >
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-11 px-3.5 border border-border text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full h-11 px-3.5 border border-border bg-surface-alt text-sm text-muted cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
                    WHATSAPP / PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-11 px-3.5 border border-border text-sm text-ink focus:border-ink focus:outline-none tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="h-11 px-8 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] hover:bg-charcoal transition-colors"
                  >
                    SAVE PROFILE CHANGES
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  ORDER HISTORY
                </h2>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "ALL",
                      "UNPAID",
                      "PROCESSING",
                      "SHIPPED",
                      "COMPLETED",
                      "CANCELLED",
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] border transition-colors ${
                        orderFilter === st
                          ? "bg-ink text-surface border-ink"
                          : "bg-surface text-charcoal border-border hover:border-ink"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {displayedOrders.length === 0 ? (
                <div className="border border-border bg-surface-alt/40 py-20 px-6 text-center">
                  <p className="font-display font-bold text-base uppercase text-ink">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    When you purchase a release, your Xendit transaction record and
                    courier tracking will appear here.
                  </p>
                  <Link
                    href="/catalog"
                    className="mt-6 inline-flex h-11 px-7 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] items-center"
                  >
                    EXPLORE CATALOG
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="border border-border bg-surface p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                        <div className="space-y-0.5 tabular-nums">
                          <span className="text-xs font-bold uppercase text-ink">
                            ORDER #{ord.orderNumber}
                          </span>
                          <span className="block text-[11px] text-muted">
                            PLACED ON{" "}
                            {new Date(ord.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] border ${
                              ord.payment.status === "PAID"
                                ? "border-status-success text-status-success bg-status-success/5"
                                : ord.payment.status === "PENDING"
                                ? "border-status-warning text-status-warning bg-status-warning/5"
                                : "border-campaign-red text-campaign-red bg-campaign-red/5"
                            }`}
                          >
                            PAYMENT: {ord.payment.status}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] bg-surface-alt border border-border text-ink">
                            STATUS: {ord.fulfillmentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={ord.items[0]?.image}
                            alt={ord.items[0]?.productName}
                            className="w-14 aspect-[4/5] object-cover bg-surface-alt border border-border shrink-0"
                          />
                          <div>
                            <p className="text-xs font-semibold uppercase text-ink">
                              {ord.items[0]?.productName}
                            </p>
                            <p className="text-[11px] text-muted uppercase mt-0.5">
                              SIZE {ord.items[0]?.size} × {ord.items[0]?.quantity}
                              {ord.items.length > 1 &&
                                ` (+${ord.items.length - 1} MORE ITEM)`}
                            </p>
                            {ord.trackingNumber && (
                              <p className="text-[11px] font-medium text-ink mt-1 tabular-nums">
                                RESI / AWB: {ord.trackingNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                          <div className="sm:text-right tabular-nums">
                            <span className="text-[10px] uppercase tracking-[0.08em] text-muted block">
                              TOTAL PAYMENT ({ord.payment.channelCode})
                            </span>
                            <span className="text-sm font-bold text-ink">
                              {formatPrice(ord.totalPaymentIdr, currency)}
                            </span>
                          </div>

                          <Link
                            href={`/orders/${ord.orderNumber}/payment`}
                            className="inline-flex items-center gap-1.5 h-9 px-4 border border-ink bg-surface text-ink text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-ink hover:text-surface transition-colors"
                          >
                            <span>
                              {ord.payment.status === "PENDING"
                                ? "COMPLETE PAYMENT"
                                : "VIEW ORDER DETAILS"}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  SAVED WISHLIST ({wishlistedProducts.length})
                </h2>
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="border border-border bg-surface-alt/40 py-20 px-6 text-center">
                  <p className="font-display font-bold text-base uppercase text-ink">
                    YOUR WISHLIST IS CURRENTLY EMPTY.
                  </p>
                  <Link
                    href="/catalog"
                    className="mt-5 inline-flex h-11 px-7 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] items-center"
                  >
                    BROWSE RELEASES
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {wishlistedProducts.map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Remove from wishlist"
                        className="absolute top-2.5 right-2.5 z-30 bg-surface/90 border border-border p-1.5 text-ink hover:bg-ink hover:text-surface transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  SHIPPING ADDRESSES
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="h-9 px-4 bg-ink text-surface text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD NEW ADDRESS</span>
                </button>
              </div>

              {showNewAddressForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const area =
                      shippingAreas.find((a) => a.id === addrAreaId) ||
                      shippingAreas[0];
                    addAddress({
                      label: addrLabel,
                      recipientName: currentUser.fullName,
                      phone: currentUser.phone,
                      areaId: area.id,
                      areaName: area.areaName,
                      province: area.province,
                      postalCode: addrPostal,
                      streetAddress: addrStreet,
                      isDefault: currentUser.addresses.length === 0,
                    });
                    setAddrStreet("");
                    setShowNewAddressForm(false);
                  }}
                  className="p-6 border border-ink bg-surface-alt space-y-4"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                    NEW DISPATCH DESTINATION
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        ADDRESS LABEL
                      </label>
                      <input
                        type="text"
                        required
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        className="w-full h-10 px-3 bg-surface border border-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        CITY / REGION
                      </label>
                      <select
                        value={addrAreaId}
                        onChange={(e) => setAddrAreaId(e.target.value)}
                        className="w-full h-10 px-3 bg-surface border border-border text-xs"
                      >
                        {shippingAreas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.areaName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        POSTAL CODE
                      </label>
                      <input
                        type="text"
                        required
                        value={addrPostal}
                        onChange={(e) => setAddrPostal(e.target.value)}
                        className="w-full h-10 px-3 bg-surface border border-border text-xs tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        STREET ADDRESS
                      </label>
                      <input
                        type="text"
                        required
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="Jl. Senopati Dalam No. 42, Kebayoran Baru"
                        className="w-full h-10 px-3 bg-surface border border-border text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em]"
                    >
                      SAVE ADDRESS
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="h-10 px-4 border border-border bg-surface text-xs font-semibold uppercase"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUser.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 border border-border bg-surface flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-ink text-surface text-[9px] font-semibold uppercase tracking-[0.08em]">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium text-ink">
                        {addr.recipientName} ({addr.phone})
                      </p>
                      <p className="mt-1 text-xs text-charcoal leading-relaxed">
                        {addr.streetAddress}
                        <br />
                        {addr.areaName}, {addr.province} {addr.postalCode}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeAddress(addr.id)}
                        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-campaign-red"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNT SETTINGS */}
          {activeTab === "settings" && (
            <div className="border border-border p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-border">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  ACCOUNT SETTINGS & PREFERENCES
                </h2>
              </div>

              <div className="space-y-4 max-w-lg text-xs">
                <div className="flex items-center justify-between p-4 border border-border bg-surface-alt">
                  <div>
                    <p className="font-semibold uppercase text-ink">
                      DISPLAY CURRENCY
                    </p>
                    <p className="text-muted mt-0.5">
                      Toggle catalog pricing between IDR (Rupiah) and USD.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrency(currency === "IDR" ? "USD" : "IDR")}
                    className="h-9 px-4 bg-ink text-surface text-[11px] font-semibold uppercase tracking-[0.08em]"
                  >
                    ACTIVE: {currency}
                  </button>
                </div>

                <div className="p-4 border border-border bg-surface flex items-center justify-between">
                  <div>
                    <p className="font-semibold uppercase text-ink">
                      TERMINATE SESSION
                    </p>
                    <p className="text-muted mt-0.5">
                      Sign out of your member account on this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="h-9 px-4 border border-campaign-red text-campaign-red text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-campaign-red hover:text-surface transition-colors"
                  >
                    SIGN OUT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-16">
          <div className="h-10 w-64 bg-surface-alt" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

