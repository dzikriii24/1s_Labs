"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Tag, Check, AlertCircle } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatWeight } from "@/lib/format";
import { XenditChannelCategory } from "@/types/store";

const VOUCHER_PREVIEW: Record<string, { label: string; type: "PERCENT" | "FIXED"; value: number }> = {
  ARCHIVE10: { label: "10% OFF ARCHIVE PRIVILEGE", type: "PERCENT", value: 10 },
  WELCOME15: { label: "15% OFF NEW MEMBER DISPATCH", type: "PERCENT", value: 15 },
  NOCTURNE100: { label: "RP 100.000 DEDUCTION", type: "FIXED", value: 100000 },
};

const CATEGORY_LABELS: Record<XenditChannelCategory, string> = {
  QRIS: "QRIS INSTANT SCAN",
  VIRTUAL_ACCOUNT: "VIRTUAL ACCOUNT (BANK TRANSFER)",
  EWALLET: "E-WALLET / DIGITAL WALLET",
  RETAIL_OUTLET: "OVER-THE-COUNTER RETAIL OUTLET",
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cms,
    currency,
    cart,
    cartSubtotalIdr,
    cartTotalWeightGrams,
    shippingAreas,
    paymentChannels,
    currentUser,
    clearCart,
    refreshStore,
    notify,
  } = useStore();

  // Customer & Shipping Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "+62");
  const [selectedAreaId, setSelectedAreaId] = useState(
    currentUser?.addresses[0]?.areaId || shippingAreas[0]?.id || "area-jkt"
  );
  const [postalCode, setPostalCode] = useState(
    currentUser?.addresses[0]?.postalCode || "12160"
  );
  const [streetAddress, setStreetAddress] = useState(
    currentUser?.addresses[0]?.streetAddress || ""
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedCourierCode, setSelectedCourierCode] = useState("");
  const [selectedPaymentCode, setSelectedPaymentCode] = useState(
    paymentChannels[0]?.code || "QRIS"
  );

  // Voucher State
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState("");

  // Submission & Idempotency State
  const [idempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Pre-fill when user changes
  useEffect(() => {
    if (currentUser) {
      setFullName((prev) => prev || currentUser.fullName);
      setEmail((prev) => prev || currentUser.email);
      setPhone((prev) => (prev === "+62" ? currentUser.phone : prev));
      const defAddr =
        currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      if (defAddr) {
        setSelectedAreaId(defAddr.areaId);
        setPostalCode(defAddr.postalCode);
        setStreetAddress((prev) => prev || defAddr.streetAddress);
      }
    }
  }, [currentUser]);

  const activeArea = useMemo(
    () =>
      shippingAreas.find((a) => a.id === selectedAreaId) || shippingAreas[0],
    [shippingAreas, selectedAreaId]
  );

  useEffect(() => {
    if (activeArea && activeArea.couriers.length > 0) {
      const exists = activeArea.couriers.some(
        (c) => c.code === selectedCourierCode
      );
      if (!exists) {
        setSelectedCourierCode(activeArea.couriers[0].code);
      }
    }
  }, [activeArea, selectedCourierCode]);

  const activeCourier =
    activeArea?.couriers.find((c) => c.code === selectedCourierCode) ||
    activeArea?.couriers[0];

  const weightKg = Math.max(1, Math.ceil(cartTotalWeightGrams / 1000));
  const qualifiesFreeDomestic =
    cartSubtotalIdr >= cms.deliveryDefaults.freeShippingThresholdIdr &&
    activeArea?.province !== "International";

  const shippingCostIdr = qualifiesFreeDomestic
    ? 0
    : (activeCourier?.ratePerKgIdr || 15000) * weightKg;

  const discountAmountIdr = useMemo(() => {
    if (!appliedVoucher || !VOUCHER_PREVIEW[appliedVoucher]) return 0;
    const rule = VOUCHER_PREVIEW[appliedVoucher];
    return rule.type === "PERCENT"
      ? Math.round((cartSubtotalIdr * rule.value) / 100)
      : Math.min(cartSubtotalIdr, rule.value);
  }, [appliedVoucher, cartSubtotalIdr]);

  const totalPaymentIdr = Math.max(
    0,
    cartSubtotalIdr + shippingCostIdr - discountAmountIdr
  );

  const handleApplyVoucher = () => {
    setVoucherError("");
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (VOUCHER_PREVIEW[code]) {
      setAppliedVoucher(code);
      notify("VOUCHER APPLIED", VOUCHER_PREVIEW[code].label);
    } else {
      setVoucherError("Invalid voucher code. Try ARCHIVE10 or WELCOME15.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!fullName.trim() || !email.trim() || !phone.trim() || !streetAddress.trim()) {
      setCheckoutError("Please complete all required customer and shipping fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          customer: {
            userId: currentUser?.id,
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
          shippingAddress: {
            areaId: selectedAreaId,
            postalCode: postalCode.trim(),
            streetAddress: streetAddress.trim(),
            notes: deliveryNotes.trim(),
          },
          courierCode: selectedCourierCode,
          paymentChannelCode: selectedPaymentCode,
          discountCode: appliedVoucher,
          items: cart.map((item) => ({
            variantId: item.variantId,
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.order) {
        setCheckoutError(
          data.error || "Unable to create Xendit payment session. Please verify stock."
        );
        return;
      }

      clearCart();
      await refreshStore();
      router.push(`/orders/${data.order.orderNumber}/payment`);
    } catch {
      setCheckoutError("Network error while connecting to Xendit gateway.");
    } finally {
      setSubmitting(false);
    }
  };

  // Group enabled Xendit channels by category
  const groupedChannels = useMemo(() => {
    const groups: Partial<Record<XenditChannelCategory, typeof paymentChannels>> = {};
    for (const ch of paymentChannels) {
      if (!groups[ch.category]) groups[ch.category] = [];
      groups[ch.category]!.push(ch);
    }
    return groups;
  }, [paymentChannels]);

  if (cart.length === 0) {
    return (
      <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center">
        <h1 className="font-display font-bold text-2xl uppercase">
          YOUR BAG IS EMPTY
        </h1>
        <p className="mt-2 text-xs text-muted">
          Add garments to your shopping bag before proceeding to checkout.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex h-12 px-8 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] items-center"
        >
          RETURN TO CATALOG
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      {checkoutError && (
        <div className="mb-8 p-4 border border-campaign-red bg-surface flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-campaign-red shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold uppercase tracking-[0.08em] text-campaign-red">
              CHECKOUT VALIDATION ERROR
            </p>
            <p className="text-charcoal mt-0.5">{checkoutError}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start"
      >
        {/* ===================================================================
            LEFT COLUMN (7 Cols): CUSTOMER, SHIPPING & XENDIT PAYMENT SELECTION
        =================================================================== */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Customer Information */}
          <section className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-ink">
              <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
                01 // CUSTOMER INFORMATION
              </h2>
              {!currentUser && (
                <Link
                  href="/account"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink border-b border-ink pb-0.5"
                >
                  HAVE AN ACCOUNT? SIGN IN
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="chk-fullname"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  FULL NAME *
                </label>
                <input
                  id="chk-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="E.G. RAKA PRADIPTA"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="chk-email"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  EMAIL ADDRESS (FOR XENDIT RECEIPT) *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="chk-phone"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  PHONE / WHATSAPP NUMBER *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62812XXXXXX"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* 2. Shipping Address */}
          <section className="space-y-5">
            <div className="pb-3 border-b border-ink">
              <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
                02 // SHIPPING DESTINATION
              </h2>
            </div>

            {currentUser && currentUser.addresses.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  SAVED MEMBER ADDRESSES:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentUser.addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAreaId(addr.areaId);
                        setPostalCode(addr.postalCode);
                        setStreetAddress(addr.streetAddress);
                      }}
                      className={`p-3 border text-left text-xs transition-colors ${
                        streetAddress === addr.streetAddress
                          ? "border-ink bg-surface-alt"
                          : "border-border hover:border-ink"
                      }`}
                    >
                      <span className="font-semibold uppercase text-[10px] tracking-[0.08em] text-ink block">
                        {addr.label}
                      </span>
                      <span className="text-charcoal mt-1 block truncate">
                        {addr.streetAddress}
                      </span>
                      <span className="text-muted text-[11px]">
                        {addr.areaName} ({addr.postalCode})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="chk-area"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  CITY / DESTINATION REGION *
                </label>
                <select
                  id="chk-area"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {shippingAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.areaName} — {area.province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="chk-postal"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  POSTAL CODE *
                </label>
                <input
                  id="chk-postal"
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12160"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none tabular-nums"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="chk-street"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  FULL STREET ADDRESS, DISTRICT (KECAMATAN) & UNIT NUMBER *
                </label>
                <input
                  id="chk-street"
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Jl. Senopati Dalam No. 42, Kebayoran Baru"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="chk-notes"
                  className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-1.5"
                >
                  DELIVERY NOTES (OPTIONAL)
                </label>
                <input
                  id="chk-notes"
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Building benchmark, gate code, or concierge instructions"
                  className="w-full h-[46px] px-3.5 bg-surface border border-border text-base sm:text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 3. Shipping Method */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink">
              <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
                03 // SHIPPING METHOD
              </h2>
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted tabular-nums">
                TOTAL WEIGHT: {formatWeight(cartTotalWeightGrams)} ({weightKg} KG)
              </span>
            </div>

            <div className="space-y-2.5">
              {activeArea?.couriers.map((courier) => {
                const isSelected = courier.code === selectedCourierCode;
                const calculatedFee = qualifiesFreeDomestic
                  ? 0
                  : courier.ratePerKgIdr * weightKg;
                return (
                  <label
                    key={courier.code}
                    className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-ink bg-surface-alt"
                        : "border-border bg-surface hover:border-ink"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="courier"
                        checked={isSelected}
                        onChange={() => setSelectedCourierCode(courier.code)}
                        className="sr-only"
                      />
                      <span
                        className={`w-4 h-4 border flex items-center justify-center ${
                          isSelected ? "border-ink" : "border-border"
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 bg-ink" />}
                      </span>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.04em] text-ink block">
                          {courier.name} — {courier.service}
                        </span>
                        <span className="text-[11px] text-muted">
                          Estimated Delivery: {courier.etd}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold uppercase text-ink tabular-nums">
                      {calculatedFee === 0
                        ? "FREE"
                        : formatPrice(calculatedFee, currency)}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* 4. Xendit Payment Gateway Method Selection */}
          <section className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-ink">
              <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
                04 // PAYMENT METHOD (XENDIT GATEWAY)
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-status-success">
                <Lock className="w-3.5 h-3.5" />
                WEBHOOK VERIFIED
              </span>
            </div>

            <div className="space-y-6">
              {(
                Object.keys(groupedChannels) as XenditChannelCategory[]
              ).map((cat) => (
                <div key={cat} className="space-y-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {groupedChannels[cat]?.map((channel) => {
                      const isSelected = selectedPaymentCode === channel.code;
                      return (
                        <label
                          key={channel.code}
                          className={`p-3.5 border cursor-pointer flex items-start justify-between gap-3 transition-colors ${
                            isSelected
                              ? "border-ink bg-surface-alt"
                              : "border-border bg-surface hover:border-ink"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="paymentChannel"
                              checked={isSelected}
                              onChange={() => setSelectedPaymentCode(channel.code)}
                              className="sr-only"
                            />
                            <span
                              className={`mt-0.5 w-4 h-4 border shrink-0 flex items-center justify-center ${
                                isSelected ? "border-ink" : "border-border"
                              }`}
                            >
                              {isSelected && <span className="w-2 h-2 bg-ink" />}
                            </span>
                            <div>
                              <span className="text-xs font-semibold uppercase text-ink block">
                                {channel.shortLabel}
                              </span>
                              <span className="text-[11px] text-charcoal block mt-0.5">
                                {channel.name}
                              </span>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 border border-border bg-surface text-[9px] font-semibold uppercase tracking-[0.08em] text-muted shrink-0">
                            XENDIT
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===================================================================
            RIGHT COLUMN (5 Cols): LOCKED ORDER SUMMARY & VOUCHER BOX
        =================================================================== */}
        <div className="lg:col-span-5 lg:sticky lg:top-[84px] bg-surface-alt border border-ink p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
              ORDER SUMMARY ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <Link
              href="/cart"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink underline"
            >
              EDIT BAG
            </Link>
          </div>

          {/* Itemized List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border pr-1">
            {cart.map((item) => (
              <div key={item.variantId} className="py-3.5 flex gap-3.5 items-center">
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-14 aspect-[4/5] object-cover bg-surface border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase text-ink truncate">
                    {item.productName}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-muted mt-0.5">
                    {item.colorName} / SIZE {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-semibold text-ink tabular-nums shrink-0">
                  {formatPrice(item.unitPriceIdr * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Voucher / Discount Code Input */}
          <div className="pt-4 border-t border-border">
            <label
              htmlFor="chk-voucher"
              className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink mb-2"
            >
              PROMO / ARCHIVE VOUCHER CODE
            </label>
            <div className="flex gap-2">
              <input
                id="chk-voucher"
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="TRY: ARCHIVE10 OR WELCOME15"
                className="flex-1 h-10 px-3 bg-surface border border-border text-base sm:text-xs uppercase tracking-[0.06em] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                className="h-10 px-4 border border-ink bg-surface text-ink text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-ink hover:text-surface transition-colors"
              >
                APPLY
              </button>
            </div>
            {voucherError && (
              <p className="mt-1.5 text-[11px] text-campaign-red">{voucherError}</p>
            )}
            {appliedVoucher && (
              <div className="mt-2 flex items-center justify-between bg-surface px-3 py-1.5 border border-border text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-status-success">
                  <Tag className="w-3.5 h-3.5" />
                  {appliedVoucher} ({VOUCHER_PREVIEW[appliedVoucher].label})
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedVoucher(null)}
                  className="text-muted hover:text-ink uppercase font-semibold"
                >
                  REMOVE
                </button>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="pt-4 border-t border-border space-y-2.5 text-xs tabular-nums">
            <div className="flex items-center justify-between text-charcoal">
              <span className="uppercase tracking-[0.06em]">SUBTOTAL</span>
              <span>{formatPrice(cartSubtotalIdr, currency)}</span>
            </div>

            <div className="flex items-center justify-between text-charcoal">
              <span className="uppercase tracking-[0.06em]">
                SHIPPING ({activeCourier?.name} — {formatWeight(cartTotalWeightGrams)})
              </span>
              <span>
                {shippingCostIdr === 0
                  ? "FREE"
                  : formatPrice(shippingCostIdr, currency)}
              </span>
            </div>

            {discountAmountIdr > 0 && (
              <div className="flex items-center justify-between text-status-success font-medium">
                <span className="uppercase tracking-[0.06em]">
                  VOUCHER DISCOUNT ({appliedVoucher})
                </span>
                <span>- {formatPrice(discountAmountIdr, currency)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-ink flex items-baseline justify-between text-ink">
              <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                TOTAL PAYMENT
              </span>
              <span className="font-display font-bold text-xl">
                {formatPrice(totalPaymentIdr, currency)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[54px] bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            {submitting
              ? "CREATING XENDIT PAYMENT SESSION..."
              : `PLACE ORDER & PAY — ${formatPrice(totalPaymentIdr, currency)}`}
          </button>

          <div className="space-y-2 pt-2 border-t border-border text-[11px] text-muted">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-ink shrink-0" />
              <span>
                Idempotent order token & Xendit webhook signature verification active.
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Check className="w-4 h-4 text-ink shrink-0" />
              <span>
                Stock is reserved immediately upon payment instruction generation.
              </span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

