import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { OrderFulfillmentStatus } from "@/types/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email");
  const db = readDb();

  if (orderNumber) {
    const order = db.orders.find(
      (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
    );
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  }

  if (email) {
    const orders = db.orders.filter(
      (o) => o.customer.email.toLowerCase() === email.toLowerCase()
    );
    return NextResponse.json({ orders });
  }

  return NextResponse.json({ orders: db.orders, webhookLogs: db.webhookLogs });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, fulfillmentStatus, trackingNumber } = body as {
      orderNumber: string;
      fulfillmentStatus?: OrderFulfillmentStatus;
      trackingNumber?: string;
    };

    if (!orderNumber) {
      return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });
    }

    const db = updateDb((state) => {
      const order = state.orders.find((o) => o.orderNumber === orderNumber);
      if (order) {
        if (fulfillmentStatus) order.fulfillmentStatus = fulfillmentStatus;
        if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
      }
    });

    return NextResponse.json({ ok: true, orders: db.orders });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

