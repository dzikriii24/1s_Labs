import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    cms: db.cms,
    sizeGuideMasters: db.sizeGuideMasters,
    collections: db.collections,
    products: db.products,
    shippingAreas: db.shippingAreas,
    paymentChannels: db.paymentChannels.filter((ch) =>
      db.cms.enabledPaymentChannels.includes(ch.code)
    ),
    allPaymentChannels: db.paymentChannels,
    communityPosts: db.communityPosts,
    orders: db.orders,
    webhookLogs: db.webhookLogs,
    customers: db.customers,
    newsletterSubscribers: db.newsletterSubscribers,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "newsletter" && body.email) {
      updateDb((db) => {
        const exists = db.newsletterSubscribers.some(
          (s) => s.email.toLowerCase() === String(body.email).toLowerCase()
        );
        if (!exists) {
          db.newsletterSubscribers.push({
            email: String(body.email).trim(),
            subscribedAt: new Date().toISOString(),
          });
        }
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
