import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { Product } from "@/types/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  return NextResponse.json({ products: db.products });
}

export async function POST(request: Request) {
  try {
    const newProduct = (await request.json()) as Product;
    if (!newProduct.name || !newProduct.slug) {
      return NextResponse.json({ error: "Product name and slug are required" }, { status: 400 });
    }
    const db = updateDb((state) => {
      state.products.unshift({
        ...newProduct,
        id: newProduct.id || `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ ok: true, products: db.products });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedProduct = (await request.json()) as Product;
    if (!updatedProduct.id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    const db = updateDb((state) => {
      const idx = state.products.findIndex((p) => p.id === updatedProduct.id);
      if (idx !== -1) {
        state.products[idx] = updatedProduct;
      }
    });
    return NextResponse.json({ ok: true, products: db.products });
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }
    const db = updateDb((state) => {
      state.products = state.products.filter((p) => p.id !== id);
    });
    return NextResponse.json({ ok: true, products: db.products });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

