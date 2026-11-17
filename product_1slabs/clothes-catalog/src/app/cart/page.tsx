"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, AlertCircle, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatWeight } from "@/lib/format";

export default function CartPage() {
  const router = useRouter();
  const {
    cms,
    currency,
    cart,
    cartSubtotalIdr,
    cartTotalWeightGrams,
    updateCartQty,
    removeFromCart,
    notify,
  } = useStore();

  const [validating, setValidating] = useState(false);
  const [stockIssues, setStockIssues] = useState<
    { variantId: string; message: string; available: number }[]
  >([]);

  const freeShippingThreshold = cms.deliveryDefaults.freeShippingThresholdIdr;
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - cartSubtotalIdr
  );

  const handleProceedToCheckout = async () => {
    setValidating(true);
    setStockIssues([]);
    try {
      const res = await fetch("/api/v1/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!data.valid && Array.isArray(data.issues) && data.issues.length > 0) {
        setStockIssues(data.issues);
        notify(
          "INVENTORY ADJUSTMENT REQUIRED",
          data.issues[0].message,
          "error"
        );
        return;
      }
      router.push("/checkout");
    } catch {
      router.push("/checkout");
    } finally {
      setValidating(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-24 sm:py-32 text-center">
        <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
          SHOPPING BAG // 0 ITEMS
        </p>
        <h1 className="mt-2 font-display font-bold text-2xl sm:text-4xl uppercase tracking-[-0.02em] text-ink">
          YOUR SHOPPING BAG IS EMPTY.
        </h1>
        <p className="mt-3 text-sm text-charcoal max-w-md mx-auto">
          Explore our latest independent streetwear collections and limited archival
          releases.
        </p>
        <Link
          href="/catalog"
          className="mt-8 inline-flex items-center justify-center h-12 px-8 bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-charcoal transition-colors"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      <div className="pb-6 border-b border-ink flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted">
            REVIEW SELECTION & LIVE INVENTORY
          </p>
          <h1 className="mt-1 font-display font-bold text-2xl sm:text-4xl uppercase tracking-[-0.02em] text-ink">
            SHOPPING BAG
          </h1>
        </div>
        <Link
          href="/catalog"
          className="text-xs font-semibold uppercase tracking-[0.08em] text-ink border-b border-ink pb-0.5 self-start sm:self-auto hover:text-muted"
        >
          ← CONTINUE SHOPPING
        </Link>
      </div>

      {stockIssues.length > 0 && (
        <div className="mt-6 p-4 border border-campaign-red bg-surface flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-campaign-red shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold uppercase tracking-[0.08em] text-campaign-red">
              LIVE INVENTORY VALIDATION NOTICE
            </p>
            {stockIssues.map((iss) => (
              <p key={iss.variantId} className="text-charcoal">
                {iss.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (8 Cols): Cart Line Items Table */}
        <div className="lg:col-span-8">
          <div className="hidden sm:grid grid-cols-12 pb-3 border-b border-border text-[11px] font-semibold tracking-[0.10em] uppercase text-muted">
            <div className="col-span-6">PRODUCT</div>
            <div className="col-span-2 text-right">UNIT PRICE</div>
            <div className="col-span-2 text-center">QUANTITY</div>
            <div className="col-span-2 text-right">SUBTOTAL</div>
          </div>

          <div className="divide-y divide-border border-b border-border">
            {cart.map((item) => {
              const issue = stockIssues.find(
                (i) => i.variantId === item.variantId
              );
              return (
                <div
                  key={item.variantId}
                  className={`py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center ${
                    issue ? "bg-campaign-red/5 px-3" : ""
                  }`}
                >
                  {/* Product Thumbnail & Info */}
                  <div className="sm:col-span-6 flex gap-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="w-20 sm:w-24 aspect-[4/5] bg-surface-alt border border-border shrink-0 overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-xs sm:text-sm font-semibold uppercase text-ink hover:text-muted leading-snug block"
                        >
                          {item.productName}
                        </Link>
                        <div className="mt-1.5 space-y-0.5 text-[11px] uppercase tracking-[0.08em] text-muted">
                          <p>COLOR: {item.colorName}</p>
                          <p>SIZE: {item.size}</p>
                          <p className="tabular-nums">
                            WEIGHT: {formatWeight(item.weightGrams * item.quantity)}
                          </p>
                        </div>
                        {issue && (
                          <p className="mt-1.5 text-[11px] font-semibold text-campaign-red">
                            {issue.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted hover:text-campaign-red transition-colors self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>REMOVE</span>
                      </button>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2 flex sm:block justify-between items-center text-xs sm:text-right tabular-nums text-charcoal">
                    <span className="sm:hidden text-[11px] uppercase text-muted">
                      UNIT PRICE:
                    </span>
                    <span>{formatPrice(item.unitPriceIdr, currency)}</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                    <span className="sm:hidden text-[11px] uppercase text-muted">
                      QUANTITY:
                    </span>
                    <div className="inline-flex items-center border border-border h-9 bg-surface">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(item.variantId, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="w-8 h-full flex items-center justify-center text-ink hover:bg-surface-alt"
                      >
                        <Minus className="w-3 h-3 stroke-[1.75]" />
                      </button>
                      <span className="w-9 text-center text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.maxAllowed}
                        onClick={() =>
                          updateCartQty(item.variantId, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="w-8 h-full flex items-center justify-center text-ink hover:bg-surface-alt disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 stroke-[1.75]" />
                      </button>
                    </div>
                  </div>

                  {/* Line Subtotal */}
                  <div className="sm:col-span-2 flex sm:block justify-between items-center text-xs sm:text-sm font-semibold text-ink sm:text-right tabular-nums">
                    <span className="sm:hidden text-[11px] font-normal uppercase text-muted">
                      SUBTOTAL:
                    </span>
                    <span>
                      {formatPrice(item.unitPriceIdr * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 Cols): Sticky Order Summary Box */}
        <div className="lg:col-span-4 lg:sticky lg:top-[88px] bg-surface-alt border border-border p-6 sm:p-7 space-y-6">
          <div className="pb-4 border-b border-border">
            <h2 className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
              ORDER SUMMARY
            </h2>
          </div>

          <div className="space-y-3 text-xs tabular-nums">
            <div className="flex items-center justify-between text-charcoal">
              <span className="uppercase tracking-[0.06em]">SUBTOTAL</span>
              <span className="font-medium text-ink">
                {formatPrice(cartSubtotalIdr, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-charcoal">
              <span className="uppercase tracking-[0.06em]">TOTAL WEIGHT</span>
              <span>{formatWeight(cartTotalWeightGrams)}</span>
            </div>

            <div className="flex items-center justify-between text-charcoal">
              <span className="uppercase tracking-[0.06em]">SHIPPING</span>
              <span className="text-muted">
                {remainingForFreeShipping === 0
                  ? "COMPLIMENTARY (DOMESTIC)"
                  : "CALCULATED AT CHECKOUT"}
              </span>
            </div>

            <div className="pt-3 border-t border-ink flex items-baseline justify-between text-ink">
              <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                ESTIMATED TOTAL
              </span>
              <span className="font-display font-bold text-lg">
                {formatPrice(cartSubtotalIdr, currency)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border text-[11px] text-charcoal leading-relaxed">
            {remainingForFreeShipping === 0 ? (
              <span className="text-status-success font-medium">
                ● Your order qualifies for free domestic shipping.
              </span>
            ) : (
              <span>
                Add{" "}
                <strong className="text-ink tabular-nums">
                  {formatPrice(remainingForFreeShipping, currency)}
                </strong>{" "}
                more to unlock complimentary domestic shipping.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={validating}
            onClick={handleProceedToCheckout}
            className="w-full h-[52px] bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase flex items-center justify-center gap-2 hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            <span>
              {validating ? "VALIDATING INVENTORY..." : "PROCEED TO CHECKOUT"}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[1.75]" />
          </button>

          <p className="text-[11px] text-muted leading-relaxed">
            {cms.deliveryDefaults.dispatchSlaText} Payments processed securely via
            Xendit (QRIS, Virtual Account, E-Wallet).
          </p>
        </div>
      </div>
    </div>
  );
}

