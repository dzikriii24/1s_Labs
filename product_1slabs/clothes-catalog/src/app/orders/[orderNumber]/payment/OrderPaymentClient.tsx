"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatWeight } from "@/lib/format";
import { Order, PaymentStatus } from "@/types/store";

export default function OrderPaymentClient() {
  const params = useParams<{ orderNumber: string }>();
  const { currency, paymentChannels, refreshStore, notify } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [simulatingStatus, setSimulatingStatus] = useState<PaymentStatus | null>(
    null
  );
  const [timeLeftStr, setTimeLeftStr] = useState("29:59");

  const getActiveOrderNumber = useCallback(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("orders");
      if (idx !== -1 && parts[idx + 1]) {
        return decodeURIComponent(parts[idx + 1]);
      }
    }
    return params?.orderNumber || "";
  }, [params?.orderNumber]);

  const fetchOrder = useCallback(async () => {
    const activeOrderNo = getActiveOrderNumber();
    if (!activeOrderNo) return;
    try {
      const res = await fetch(
        `/api/v1/orders?orderNumber=${encodeURIComponent(activeOrderNo)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } finally {
      setLoading(false);
    }
  }, [getActiveOrderNumber]);

  useEffect(() => {
    fetchOrder();
    const poll = setInterval(fetchOrder, 5000);
    return () => clearInterval(poll);
  }, [fetchOrder]);

  // Countdown timer for PENDING payment window
  useEffect(() => {
    if (!order || order.payment.status !== "PENDING") return;
    const expiresMs = new Date(order.expiresAt).getTime();
    const tick = () => {
      const diff = Math.max(0, expiresMs - Date.now());
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeftStr(
        hrs > 0
          ? `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
              2,
              "0"
            )}:${String(secs).padStart(2, "0")}`
          : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    notify("COPIED TO CLIPBOARD", `${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Dispatches a real signed POST request to /api/v1/webhooks/xendit
  const triggerXenditWebhook = async (targetStatus: PaymentStatus) => {
    if (!order) return;
    setSimulatingStatus(targetStatus);
    try {
      const res = await fetch("/api/v1/webhooks/xendit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-callback-token": "xnd_webhook_secret_nocturne_2026",
        },
        body: JSON.stringify({
          event_id: `evt_${Date.now()}`,
          id: order.payment.xenditInvoiceId,
          external_id: order.orderNumber,
          status: targetStatus,
          payment_channel: order.payment.channelCode,
          paid_amount: order.totalPaymentIdr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        await refreshStore();
        notify(
          `XENDIT WEBHOOK VERIFIED: ${targetStatus}`,
          `Order ${order.orderNumber} updated via signed webhook.`
        );
      }
    } finally {
      setSimulatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.10em] text-muted">
          LOADING XENDIT PAYMENT SESSION...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center">
        <h1 className="font-display font-bold text-2xl uppercase">
          ORDER NOT FOUND
        </h1>
        <Link
          href="/catalog"
          className="mt-6 inline-flex h-12 px-8 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] items-center"
        >
          RETURN TO STORE
        </Link>
      </div>
    );
  }

  const channelSpec = paymentChannels.find(
    (c) => c.code === order.payment.channelCode
  );
  const status = order.payment.status;

  return (
    <div className="max-w-checkout mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-8">
      {/* =====================================================================
          XENDIT WEBHOOK SANDBOX SIMULATOR BAR (For Testing Webhook States)
      ===================================================================== */}
      <div className="bg-ink text-surface border border-ink p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Terminal className="w-5 h-5 text-campaign-red shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-surface">
              XENDIT WEBHOOK VERIFICATION SANDBOX (TEST CALLBACK DISPATCH)
            </p>
            <p className="text-xs text-[#A1A19A] mt-0.5">
              Frontend never trusts client-side state alone. Click below to dispatch a
              signed <code className="text-surface">POST /api/v1/webhooks/xendit</code>{" "}
              with <code className="text-surface">x-callback-token</code> verification:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={simulatingStatus !== null || status === "PAID"}
            onClick={() => triggerXenditWebhook("PAID")}
            className="h-9 px-3.5 bg-status-success text-surface text-[11px] font-semibold tracking-[0.08em] uppercase hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {simulatingStatus === "PAID" ? "VERIFYING..." : "SIMULATE WEBHOOK: PAID"}
          </button>
          <button
            type="button"
            disabled={simulatingStatus !== null || status === "EXPIRED"}
            onClick={() => triggerXenditWebhook("EXPIRED")}
            className="h-9 px-3.5 bg-status-warning text-surface text-[11px] font-semibold tracking-[0.08em] uppercase hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            SIMULATE: EXPIRED
          </button>
          <button
            type="button"
            disabled={simulatingStatus !== null || status === "FAILED"}
            onClick={() => triggerXenditWebhook("FAILED")}
            className="h-9 px-3.5 bg-campaign-red text-surface text-[11px] font-semibold tracking-[0.08em] uppercase hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            SIMULATE: FAILED
          </button>
        </div>
      </div>

      {/* =====================================================================
          MAIN PAYMENT STATUS & INSTRUCTION GRID
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (7 Cols): Dynamic Status Banner & Xendit Instructions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Banner Card */}
          <div className="border border-ink bg-surface p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <p className="text-[11px] font-medium tracking-[0.10em] uppercase text-muted tabular-nums">
                  ORDER #{order.orderNumber} // INVOICE: {order.payment.xenditInvoiceId}
                </p>
                <h1 className="mt-1 font-display font-bold text-xl sm:text-2xl uppercase text-ink">
                  {status === "PAID" && "PAYMENT CONFIRMED — ORDER PROCESSING"}
                  {status === "PENDING" && "AWAITING XENDIT PAYMENT COMPLETION"}
                  {status === "EXPIRED" && "PAYMENT WINDOW EXPIRED"}
                  {status === "FAILED" && "PAYMENT TRANSACTION FAILED"}
                </h1>
              </div>

              {/* Status Pill */}
              {status === "PENDING" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-status-warning/10 border border-status-warning text-status-warning text-[11px] font-semibold tracking-[0.10em] uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  PENDING
                </span>
              )}
              {status === "PAID" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-status-success/10 border border-status-success text-status-success text-[11px] font-semibold tracking-[0.10em] uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PAID (VERIFIED)
                </span>
              )}
              {(status === "EXPIRED" || status === "FAILED") && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-campaign-red/10 border border-campaign-red text-campaign-red text-[11px] font-semibold tracking-[0.10em] uppercase">
                  <XCircle className="w-3.5 h-3.5" />
                  {status}
                </span>
              )}
            </div>

            {/* PENDING STATE: Show QRIS / Virtual Account Number & Countdown */}
            {status === "PENDING" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-alt p-4 border border-border">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
                      PAYMENT METHOD
                    </span>
                    <span className="text-sm font-semibold uppercase text-ink">
                      {order.payment.channelName}
                    </span>
                  </div>
                  <div className="sm:text-right tabular-nums">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
                      COMPLETE PAYMENT WITHIN
                    </span>
                    <span className="font-display font-bold text-lg text-campaign-red">
                      {timeLeftStr}
                    </span>
                  </div>
                </div>

                {/* Virtual Account / Retail Payment Code Box */}
                {order.payment.virtualAccountNumber && (
                  <div className="p-5 border border-ink bg-surface space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.10em] text-muted block">
                      {order.payment.channelCategory === "RETAIL_OUTLET"
                        ? "XENDIT RETAIL PAYMENT CODE"
                        : "XENDIT VIRTUAL ACCOUNT NUMBER"}
                    </span>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-display font-extrabold text-xl sm:text-2xl tracking-[0.06em] text-ink tabular-nums">
                        {order.payment.virtualAccountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            order.payment.virtualAccountNumber!,
                            "VIRTUAL ACCOUNT"
                          )
                        }
                        className="h-9 px-3.5 border border-ink bg-surface text-ink text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 hover:bg-ink hover:text-surface transition-colors"
                      >
                        {copiedField === "VIRTUAL ACCOUNT" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedField === "VIRTUAL ACCOUNT" ? "COPIED" : "COPY"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* QRIS / E-Wallet Visual QR Block */}
                {order.payment.qrisPayload && (
                  <div className="p-6 border border-ink bg-surface-alt flex flex-col sm:flex-row items-center gap-6">
                    {/* Deterministic Architectural QR Matrix SVG */}
                    <div className="w-44 h-44 bg-surface border border-ink p-3 shrink-0 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9px] font-bold tracking-[0.08em] text-ink border-b border-border pb-1">
                        <span>QRIS</span>
                        <span>XENDIT</span>
                      </div>
                      <svg
                        viewBox="0 0 21 21"
                        className="w-full h-full my-1"
                        shapeRendering="crispEdges"
                      >
                        {/* Finder Patterns */}
                        <path
                          fill="#0A0A0A"
                          d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z M14,0 h7 v7 h-7 z M15,1 v5 h5 v-5 z M16,2 h3 v3 h-3 z M0,14 h7 v7 h-7 z M1,15 v5 h5 v-5 z M2,16 h3 v3 h-3 z"
                        />
                        {/* Data Modules */}
                        <path
                          fill="#0A0A0A"
                          d="M8,1 h2 v2 h-2 z M11,0 h2 v3 h-2 z M8,4 h5 v1 h-5 z M9,6 h3 v2 h-3 z M1,8 h4 v2 h-4 z M6,9 h3 v3 h-3 z M10,8 h4 v2 h-4 z M15,9 h5 v1 h-5 z M13,11 h3 v3 h-3 z M17,12 h3 v2 h-3 z M8,13 h4 v2 h-4 z M9,16 h3 v4 h-3 z M13,15 h2 v5 h-2 z M16,16 h4 v2 h-4 z M18,19 h3 v2 h-3 z"
                        />
                        <rect x="9" y="9" width="3" height="3" fill="#E52323" />
                      </svg>
                      <div className="text-[8px] font-mono text-center text-muted truncate">
                        NMID: ID102604918294
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <span className="inline-block bg-ink text-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
                        DYNAMIC QRIS // ALL APPS SUPPORTED
                      </span>
                      <p className="font-semibold uppercase text-ink">
                        NOCTURNE ATELIER (XENDIT MERCHANT)
                      </p>
                      <p className="text-charcoal leading-relaxed">
                        Scan using BCA Mobile, Livin&apos; by Mandiri, BRImo, BNI
                        Mobile, GoPay, OVO, DANA, or ShopeePay.
                      </p>
                      <p className="text-[11px] text-muted inline-flex items-center gap-1.5 pt-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Listening for Xendit webhook confirmation...</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Exact Amount Copy Block */}
                <div className="p-4 border border-border bg-surface flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
                      EXACT AMOUNT TO PAY
                    </span>
                    <span className="font-display font-bold text-lg text-ink tabular-nums">
                      {formatPrice(order.totalPaymentIdr, currency)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(String(order.totalPaymentIdr), "AMOUNT")
                    }
                    className="h-9 px-3 border border-border text-ink text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-ink"
                  >
                    {copiedField === "AMOUNT" ? "COPIED" : "COPY AMOUNT"}
                  </button>
                </div>

                {/* Step-by-step Payment Instructions */}
                {channelSpec && (
                  <div className="pt-2">
                    <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-ink mb-3">
                      PAYMENT INSTRUCTIONS ({channelSpec.shortLabel}):
                    </h3>
                    <ol className="list-decimal pl-4 space-y-2 text-xs text-charcoal leading-relaxed">
                      {channelSpec.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* PAID STATE */}
            {status === "PAID" && (
              <div className="space-y-5">
                <div className="p-5 bg-status-success/5 border border-status-success text-xs space-y-2">
                  <p className="font-semibold uppercase tracking-[0.08em] text-status-success">
                    ● XENDIT WEBHOOK VERIFIED — PAYMENT RECEIVED
                  </p>
                  <p className="text-charcoal leading-relaxed">
                    Your payment of{" "}
                    <strong className="text-ink tabular-nums">
                      {formatPrice(order.totalPaymentIdr, currency)}
                    </strong>{" "}
                    via <strong>{order.payment.channelName}</strong> has been
                    cryptographically verified. Your garments are now queued for
                    atelier quality inspection and dispatch.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/account?tab=orders"
                    className="h-12 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] flex items-center justify-center hover:bg-charcoal transition-colors"
                  >
                    TRACK ORDER IN ACCOUNT
                  </Link>
                  <Link
                    href="/catalog"
                    className="h-12 border border-ink bg-surface text-ink text-xs font-semibold uppercase tracking-[0.08em] flex items-center justify-center hover:bg-ink hover:text-surface transition-colors"
                  >
                    CONTINUE SHOPPING
                  </Link>
                </div>
              </div>
            )}

            {/* EXPIRED / FAILED STATE */}
            {(status === "EXPIRED" || status === "FAILED") && (
              <div className="space-y-5">
                <div className="p-5 bg-campaign-red/5 border border-campaign-red text-xs space-y-2">
                  <p className="font-semibold uppercase tracking-[0.08em] text-campaign-red flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {status === "EXPIRED"
                        ? "PAYMENT SESSION EXPIRED — RESERVED STOCK RELEASED"
                        : "PAYMENT TRANSACTION FAILED"}
                    </span>
                  </p>
                  <p className="text-charcoal leading-relaxed">
                    The Xendit payment request for Order{" "}
                    <strong className="text-ink">{order.orderNumber}</strong> is no
                    longer active, and reserved SKU inventory has been returned to the
                    catalog.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/catalog"
                    className="h-12 px-8 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center"
                  >
                    REORDER FROM CATALOG
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Order Receipt & Shipping Details */}
        <div className="lg:col-span-5 bg-surface-alt border border-border p-6 sm:p-7 space-y-6">
          <div className="pb-4 border-b border-border">
            <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted">
              OFFICIAL TRANSACTION RECORD
            </span>
            <h2 className="mt-1 font-display font-bold text-base uppercase text-ink">
              ORDER SUMMARY — {order.orderNumber}
            </h2>
          </div>

          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.variantId} className="py-3.5 flex gap-3.5 items-center">
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-12 aspect-[4/5] object-cover bg-surface border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase text-ink truncate">
                    {item.productName}
                  </p>
                  <p className="text-[11px] uppercase text-muted">
                    {item.colorName} / SIZE {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-semibold text-ink tabular-nums">
                  {formatPrice(item.subtotalIdr, currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs tabular-nums">
            <div className="flex justify-between text-charcoal">
              <span>SUBTOTAL</span>
              <span>{formatPrice(order.subtotalIdr, currency)}</span>
            </div>
            <div className="flex justify-between text-charcoal">
              <span>
                SHIPPING ({order.shippingMethod.courierName} —{" "}
                {formatWeight(order.shippingMethod.totalWeightGrams)})
              </span>
              <span>
                {order.shippingMethod.costIdr === 0
                  ? "FREE"
                  : formatPrice(order.shippingMethod.costIdr, currency)}
              </span>
            </div>
            {order.discountAmountIdr > 0 && (
              <div className="flex justify-between text-status-success">
                <span>DISCOUNT ({order.discountCode})</span>
                <span>- {formatPrice(order.discountAmountIdr, currency)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-ink flex justify-between text-sm font-bold text-ink">
              <span>TOTAL</span>
              <span>{formatPrice(order.totalPaymentIdr, currency)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted">
              RECIPIENT & DISPATCH DESTINATION
            </p>
            <p className="font-semibold text-ink uppercase">
              {order.customer.fullName} ({order.customer.phone})
            </p>
            <p className="text-charcoal leading-relaxed">
              {order.shippingAddress.streetAddress},{" "}
              {order.shippingAddress.areaName}, {order.shippingAddress.province}{" "}
              {order.shippingAddress.postalCode}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted pt-2">
            <ShieldCheck className="w-4 h-4 text-ink shrink-0" />
            <span>Idempotency Key: {order.idempotencyKey}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
