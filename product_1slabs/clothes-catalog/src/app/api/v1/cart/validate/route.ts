import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ValidateRequestItem {
  variantId: string;
  productId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: ValidateRequestItem[] };
    const db = readDb();

    const issues: {
      variantId: string;
      productName: string;
      requested: number;
      available: number;
      message: string;
    }[] = [];

    for (const item of items || []) {
      const product = db.products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);

      if (!product || !variant) {
        issues.push({
          variantId: item.variantId,
          productName: "Unknown Product",
          requested: item.quantity,
          available: 0,
          message: "Product variant is no longer available.",
        });
        continue;
      }

      if (variant.stock < item.quantity) {
        issues.push({
          variantId: item.variantId,
          productName: `${product.name} (${variant.colorName} / ${variant.size})`,
          requested: item.quantity,
          available: variant.stock,
          message:
            variant.stock === 0
              ? `${product.name} (${variant.size}) is now SOLD OUT.`
              : `Only ${variant.stock} unit(s) remaining for ${product.name} (${variant.size}).`,
        });
      }
    }

    return NextResponse.json({
      valid: issues.length === 0,
      issues,
    });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}

