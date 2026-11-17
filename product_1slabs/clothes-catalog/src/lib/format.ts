export type CurrencyCode = "IDR" | "USD";

const IDR_TO_USD_RATE = 15800;

export function formatPrice(amountIdr: number, currency: CurrencyCode = "IDR"): string {
  if (currency === "USD") {
    const usd = amountIdr / IDR_TO_USD_RATE;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amountIdr);

  return `Rp ${formatted}`;
}

export function formatWeight(grams: number): string {
  return `${new Intl.NumberFormat("id-ID").format(grams)}g`;
}

export function cmToInches(cm: number): string {
  return (cm / 2.54).toFixed(1);
}

export function getProductTotalStock(variants: { stock: number }[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function getProductBadge(product: {
  variants: { stock: number }[];
  releaseAt?: string;
}): { label: "SOLD OUT" | "LIMITED STOCK" | "DROP SOON"; type: "sold-out" | "limited" | "drop" } | null {
  if (product.releaseAt && new Date(product.releaseAt).getTime() > Date.now()) {
    return { label: "DROP SOON", type: "drop" };
  }
  const totalStock = getProductTotalStock(product.variants);
  if (totalStock <= 0) {
    return { label: "SOLD OUT", type: "sold-out" };
  }
  if (totalStock <= 5) {
    return { label: "LIMITED STOCK", type: "limited" };
  }
  return null;
}

