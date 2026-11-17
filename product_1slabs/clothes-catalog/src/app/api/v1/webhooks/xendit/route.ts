import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { PaymentStatus } from "@/types/store";

export const dynamic = "force-dynamic";

const EXPECTED_CALLBACK_TOKEN =
  process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || "xnd_webhook_secret_nocturne_2026";

export async function POST(request: Request) {
  try {
    // 1. Verify Xendit Webhook Signature Token (x-callback-token)
    const callbackToken = request.headers.get("x-callback-token");
    if (!callbackToken || callbackToken !== EXPECTED_CALLBACK_TOKEN) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid Xendit x-callback-token signature" },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const externalId = String(payload.external_id || "");
    const xenditInvoiceId = String(payload.id || payload.payment_id || "");
    const incomingStatus = String(payload.status || "PAID").toUpperCase() as PaymentStatus;
    const eventId = String(
      payload.event_id || `${xenditInvoiceId}_${incomingStatus}`
    );

    if (!externalId) {
      return NextResponse.json({ error: "Missing external_id" }, { status: 400 });
    }

    const dbSnapshot = readDb();

    // 2. Idempotency Guard: Check if this exact webhook event was already processed
    const alreadyProcessed = dbSnapshot.webhookLogs.some(
      (log) =>
        log.eventId === eventId ||
        (log.externalId === externalId && log.status === incomingStatus)
    );

    if (alreadyProcessed) {
      const existingOrder = dbSnapshot.orders.find(
        (o) => o.orderNumber === externalId
      );
      return NextResponse.json({
        ok: true,
        idempotentSkip: true,
        order: existingOrder,
      });
    }

    const targetOrder = dbSnapshot.orders.find((o) => o.orderNumber === externalId);
    if (!targetOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. Apply state transition & inventory release on EXPIRED/FAILED
    let updatedOrder = targetOrder;
    updateDb((db) => {
      const order = db.orders.find((o) => o.orderNumber === externalId);
      if (!order) return;

      const previousStatus = order.payment.status;
      order.payment.status = incomingStatus;

      if (incomingStatus === "PAID") {
        order.paidAt = new Date().toISOString();
        if (order.fulfillmentStatus === "UNPAID" || order.fulfillmentStatus === "CANCELLED") {
          order.fulfillmentStatus = "PROCESSING";
        }
      } else if (
        (incomingStatus === "EXPIRED" || incomingStatus === "FAILED") &&
        previousStatus === "PENDING"
      ) {
        order.fulfillmentStatus = "CANCELLED";
        // Restore reserved variant stock back to catalog
        for (const item of order.items) {
          const prod = db.products.find((p) => p.id === item.productId);
          const variant = prod?.variants.find((v) => v.id === item.variantId);
          if (variant) {
            variant.stock += item.quantity;
          }
        }
      }

      db.webhookLogs.unshift({
        id: `wh-${Date.now()}`,
        eventId,
        xenditInvoiceId: order.payment.xenditInvoiceId,
        externalId,
        status: incomingStatus,
        channelCode: order.payment.channelCode,
        amount: order.totalPaymentIdr,
        receivedAt: new Date().toISOString(),
        signatureVerified: true,
      });

      updatedOrder = order;
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      order: updatedOrder,
    });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failure" },
      { status: 500 }
    );
  }
}

