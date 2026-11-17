import React from "react";
import { INITIAL_DATABASE } from "@/data/seed";
import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return INITIAL_DATABASE.products.map((p) => ({
    slug: p.slug,
  }));
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
