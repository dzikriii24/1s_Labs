"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types/store";
import { formatPrice, getProductBadge, getProductTotalStock } from "@/lib/format";
import { useStore } from "@/context/StoreContext";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const { currency } = useStore();
  const totalStock = getProductTotalStock(product.variants);
  const isSoldOut = totalStock <= 0;
  const badge = getProductBadge(product);

  const primaryImage =
    product.images.find((img) => img.role === "front") || product.images[0];
  const secondaryImage =
    product.images.find((img) => img.role === "back") ||
    product.images[1] ||
    primaryImage;

  return (
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-surface-alt border border-transparent focus-visible:border-ink"
      >
        {/* Single Inventory Reality Badge (Top-Left, 10px inset) */}
        {badge && (
          <div className="absolute top-[10px] left-[10px] z-30 pointer-events-none">
            {badge.type === "sold-out" && (
              <span className="inline-block bg-ink text-surface px-2 py-1 text-[11px] font-medium tracking-[0.10em] uppercase leading-none">
                SOLD OUT
              </span>
            )}
            {badge.type === "limited" && (
              <span className="inline-block bg-surface text-campaign-red border border-campaign-red px-[7px] py-[3px] text-[11px] font-medium tracking-[0.10em] uppercase leading-none">
                LIMITED STOCK
              </span>
            )}
            {badge.type === "drop" && (
              <span className="inline-block bg-surface-alt text-ink border border-ink px-[7px] py-[3px] text-[11px] font-medium tracking-[0.10em] uppercase leading-none">
                DROP SOON
              </span>
            )}
          </div>
        )}

        {/* Primary Image (Front Studio View) */}
        <img
          src={primaryImage.url}
          alt={primaryImage.alt || `${product.name} - Front View`}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover object-center transition-opacity duration-[220ms] ease-card ${
            isSoldOut ? "opacity-75" : "opacity-100"
          }`}
        />

        {/* Secondary Image (Back View on Hover — 220ms subtle crossfade, zero scale zoom) */}
        {secondaryImage && secondaryImage.url !== primaryImage.url && (
          <img
            src={secondaryImage.url}
            alt={secondaryImage.alt || `${product.name} - Back View`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 z-20 h-full w-full object-cover object-center opacity-0 transition-opacity duration-[220ms] ease-card group-hover:opacity-100"
          />
        )}
      </Link>

      {/* Metadata Block (12px top padding, austere hierarchy) */}
      <div className="pt-3 flex flex-col">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] sm:text-[14px] font-medium uppercase tracking-[0.01em] text-ink truncate hover:text-muted transition-colors duration-150"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2 tabular-nums">
          {product.compareAtPriceIdr && product.compareAtPriceIdr > product.priceIdr ? (
            <>
              <span className="text-[13px] sm:text-[14px] text-muted line-through">
                {formatPrice(product.compareAtPriceIdr, currency)}
              </span>
              <span
                className={`text-[13px] sm:text-[14px] ${
                  isSoldOut ? "text-muted" : "text-campaign-red font-medium"
                }`}
              >
                {formatPrice(product.priceIdr, currency)}
              </span>
            </>
          ) : (
            <span
              className={`text-[13px] sm:text-[14px] ${
                isSoldOut ? "text-muted" : "text-charcoal"
              }`}
            >
              {formatPrice(product.priceIdr, currency)}
            </span>
          )}
        </div>

        {/* Optional Square 10x10px Color Swatches (only if >1 color variant) */}
        {product.colors.length > 1 && (
          <div className="mt-2 flex items-center gap-1.5" aria-label="Available colors">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.id}
                title={color.name}
                className="inline-block w-[10px] h-[10px] border border-border"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-muted tabular-nums">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

