import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { Order, OrderItem } from "@/types/store";

export const dynamic = "force-dynamic";

const VOUCHER_CODES: Record<string, { type: "PERCENT" | "FIXED"; value: number }> = {
  ARCHIVE10: { type: "PERCENT", value: 10 },
  WELCOME15: { type: "PERCENT", value: 15 },
  NOCTURNE100: { type: "FIXED", value: 100000 },
};

export async function POST(request: Request) {
  try {
    const idempotencyKey =
      request.headers.get("Idempotency-Key") || `idem-${Date.now()}-${Math.random()}`;
    const body = await request.json();

    const dbSnapshot = readDb();

    // 1. Check Idempotency Key to prevent duplicate order creation
    const existingOrder = dbSnapshot.orders.find(
      (o) => o.idempotencyKey === idempotencyKey
    );
    if (existingOrder) {
      return NextResponse.json({ ok: true, order: existingOrder, duplicate: true });
    }

    // 2. Validate payment channel is enabled
    const channel = dbSnapshot.paymentChannels.find(
      (c) => c.code === body.paymentChannelCode && dbSnapshot.cms.enabledPaymentChannels.includes(c.code)
    );
    if (!channel) {
      return NextResponse.json(
        { error: "Selected Xendit payment method is currently unavailable." },
        { status: 400 }
      );
    }

    // 3. Validate live variant inventory & build OrderItems
    const orderItems: OrderItem[] = [];
    let subtotalIdr = 0;
    let totalWeightGrams = 0;

    for (const reqItem of body.items || []) {
      const product = dbSnapshot.products.find((p) => p.id === reqItem.productId);
      const variant = product?.variants.find((v) => v.id === reqItem.variantId);

      if (!product || !variant) {
        return NextResponse.json(
          { error: "One or more items in your bag are no longer available." },
          { status: 400 }
        );
      }

      if (variant.stock < reqItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} (${variant.size}). Available: ${variant.stock}.`,
          },
          { status: 409 }
        );
      }

      const unitPrice = variant.priceOverride ?? product.priceIdr;
      const lineSubtotal = unitPrice * reqItem.quantity;
      subtotalIdr += lineSubtotal;
      totalWeightGrams += product.weightGrams * reqItem.quantity;

      orderItems.push({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        productName: product.name,
        image: product.images[0]?.url || "/images/prod-hoodie-front.png",
        colorName: variant.colorName,
        size: variant.size,
        unitPriceIdr: unitPrice,
        quantity: reqItem.quantity,
        weightGrams: product.weightGrams,
        subtotalIdr: lineSubtotal,
      });
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ error: "Cannot checkout with an empty bag." }, { status: 400 });
    }

    // 4. Calculate shipping cost
    const area =
      dbSnapshot.shippingAreas.find((a) => a.id === body.shippingAddress?.areaId) ||
      dbSnapshot.shippingAreas[0];
    const courier =
      area.couriers.find((c) => c.code === body.courierCode) || area.couriers[0];

    const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
    const qualifiesFreeShipping =
      subtotalIdr >= dbSnapshot.cms.deliveryDefaults.freeShippingThresholdIdr &&
      area.province !== "International";
    const shippingCostIdr = qualifiesFreeShipping ? 0 : courier.ratePerKgIdr * weightKg;

    // 5. Calculate voucher discount
    let discountAmountIdr = 0;
    const rawCode = String(body.discountCode || "").trim().toUpperCase();
    if (rawCode && VOUCHER_CODES[rawCode]) {
      const rule = VOUCHER_CODES[rawCode];
      discountAmountIdr =
        rule.type === "PERCENT"
          ? Math.round((subtotalIdr * rule.value) / 100)
          : Math.min(subtotalIdr, rule.value);
    }

    const totalPaymentIdr = Math.max(0, subtotalIdr + shippingCostIdr - discountAmountIdr);

    // 6. Generate Order Number & Xendit Payment Request
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const orderNumber = `NOC-${datePart}-${randomSuffix}`;
    const xenditInvoiceId = `xnd_inv_${Date.now().toString(36)}_${randomSuffix}`;
    const expiresAt = new Date(
      Date.now() + channel.expirationMinutes * 60 * 1000
    ).toISOString();

    const bankPrefixMap: Record<string, string> = {
      BCA_VA: "39010",
      MANDIRI_VA: "88908",
      BNI_VA: "8808",
      BRI_VA: "26215",
      ALFAMART: "8810",
    };

    const prefix = bankPrefixMap[channel.code] || "8800";
    const virtualAccountNumber =
      channel.category === "VIRTUAL_ACCOUNT" || channel.category === "RETAIL_OUTLET"
        ? `${prefix}${String(Math.floor(1000000000 + Math.random() * 8999999999))}`
        : undefined;

    const qrisPayload =
      channel.category === "QRIS" || channel.category === "EWALLET"
        ? `00020101021226660014ID.CO.XENDIT.WWW011893600899${randomSuffix}520456915303360540${totalPaymentIdr}5802ID5916NOCTURNE ATELIER6007JAKARTA6304${orderNumber}`
        : undefined;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      expiresAt,
      customer: {
        userId: body.customer?.userId,
        fullName: body.customer?.fullName || "Guest Customer",
        email: body.customer?.email || "guest@example.com",
        phone: body.customer?.phone || "+628120000000",
      },
      shippingAddress: {
        areaId: area.id,
        areaName: area.areaName,
        province: area.province,
        postalCode: body.shippingAddress?.postalCode || "12160",
        streetAddress: body.shippingAddress?.streetAddress || "",
        notes: body.shippingAddress?.notes || "",
      },
      shippingMethod: {
        courierCode: courier.code,
        courierName: courier.name,
        service: courier.service,
        etd: courier.etd,
        totalWeightGrams,
        costIdr: shippingCostIdr,
      },
      items: orderItems,
      subtotalIdr,
      discountCode: discountAmountIdr > 0 ? rawCode : undefined,
      discountAmountIdr,
      totalPaymentIdr,
      payment: {
        provider: "XENDIT",
        xenditInvoiceId,
        xenditExternalId: orderNumber,
        channelCode: channel.code,
        channelName: channel.name,
        channelCategory: channel.category,
        virtualAccountNumber,
        qrisPayload,
        status: "PENDING",
      },
      fulfillmentStatus: "UNPAID",
    };

    // 7. Atomically reserve inventory and persist order
    updateDb((db) => {
      for (const item of orderItems) {
        const prod = db.products.find((p) => p.id === item.productId);
        const variant = prod?.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - item.quantity);
        }
      }
      db.orders.unshift(newOrder);
    });

    return NextResponse.json({ ok: true, order: newOrder });
  } catch {
    return NextResponse.json(
      { error: "Failed to initialize Xendit payment session." },
      { status: 500 }
    );
  }
}

