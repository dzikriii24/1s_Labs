"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatWeight } from "@/lib/format";

export function MiniCartDrawer() {
  const {
    cms,
    currency,
    cart,
    cartCount,
    cartSubtotalIdr,
    cartTotalWeightGrams,
    updateCartQty,
    removeFromCart,
    isMiniCartOpen,
    setIsMiniCartOpen,
  } = useStore();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMiniCartOpen) {
        setIsMiniCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMiniCartOpen, setIsMiniCartOpen]);

  if (!isMiniCartOpen) return null;

  const freeShippingThreshold = cms.deliveryDefaults.freeShippingThresholdIdr;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotalIdr);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      {/* Opaque Scrim without Glassmorphism Blur */}
      <div
        className="fixed inset-0 bg-ink/55"
        onClick={() => setIsMiniCartOpen(false)}
      />

      <div className="relative z-10 w-[min(420px,100vw)] h-[100dvh] bg-surface border-l border-ink flex flex-col justify-between">
        {/* Drawer Header */}
        <div>
          <div className="h-[56px] px-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-ink tabular-nums">
                SHOPPING BAG ({cartCount})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMiniCartOpen(false)}
              aria-label="Close shopping bag"
              className="p-1.5 text-ink hover:text-muted transition-colors"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Domestic Free Shipping Threshold Bar */}
          <div className="px-5 py-2.5 bg-surface-alt border-b border-border">
            {remainingForFreeShipping === 0 && cart.length > 0 ? (
              <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-status-success">
                ● QUALIFIES FOR COMPLIMENTARY DOMESTIC SHIPPING
              </p>
            ) : (
              <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-charcoal tabular-nums">
                ADD {formatPrice(remainingForFreeShipping, currency)} FOR FREE DOMESTIC SHIPPING
              </p>
            )}
          </div>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto px-5 divide-y divide-border">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="font-display font-bold text-base uppercase tracking-[-0.01em] text-ink">
                YOUR SHOPPING BAG IS EMPTY
              </p>
              <p className="mt-2 text-xs text-muted max-w-[240px]">
                Explore our current seasonal collections and limited small-batch releases.
              </p>
              <Link
                href="/catalog"
                onClick={() => setIsMiniCartOpen(false)}
                className="mt-6 inline-flex items-center justify-center h-11 px-7 bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-charcoal transition-colors"
              >
                EXPLORE CATALOG
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} className="py-5 flex gap-4">
                <Link
                  href={`/products/${item.slug}`}
                  onClick={() => setIsMiniCartOpen(false)}
                  className="w-20 aspect-[4/5] bg-surface-alt shrink-0 border border-border overflow-hidden"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setIsMiniCartOpen(false)}
                        className="text-xs font-semibold uppercase text-ink hover:text-muted line-clamp-2 leading-snug"
                      >
                        {item.productName}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        aria-label={`Remove ${item.productName}`}
                        className="text-muted hover:text-ink p-0.5 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>

                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted">
                      {item.colorName} / SIZE: {item.size}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {/* Rectangular Quantity Stepper */}
                    <div className="inline-flex items-center border border-border h-8">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-full flex items-center justify-center text-ink hover:bg-surface-alt"
                      >
                        <Minus className="w-3 h-3 stroke-[1.75]" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.maxAllowed}
                        onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-full flex items-center justify-center text-ink hover:bg-surface-alt disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 stroke-[1.75]" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-ink tabular-nums">
                      {formatPrice(item.unitPriceIdr * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-border bg-surface space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="uppercase tracking-[0.08em] text-[11px]">
                  ESTIMATED WEIGHT
                </span>
                <span className="tabular-nums">{formatWeight(cartTotalWeightGrams)}</span>
              </div>
              <div className="flex items-center justify-between text-ink font-semibold text-sm">
                <span className="uppercase tracking-[0.08em] text-xs">SUBTOTAL</span>
                <span className="tabular-nums">
                  {formatPrice(cartSubtotalIdr, currency)}
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Shipping rates and Xendit payment methods calculated at checkout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setIsMiniCartOpen(false)}
                className="h-12 border border-ink bg-surface text-ink text-[12px] font-semibold tracking-[0.08em] uppercase flex items-center justify-center hover:bg-ink hover:text-surface transition-colors"
              >
                VIEW BAG
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsMiniCartOpen(false)}
                className="h-12 border border-ink bg-ink text-surface text-[12px] font-semibold tracking-[0.08em] uppercase flex items-center justify-center hover:bg-charcoal transition-colors"
              >
                CHECKOUT
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

