"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function Footer() {
  const pathname = usePathname();
  const { cms, paymentChannels, notify } = useStore();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (pathname === "/checkout" || pathname?.startsWith("/orders/")) {
    return null;
  }

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/v1/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "newsletter", email }),
      });
      setEmail("");
      notify("DISPATCH REGISTERED", "YOU ARE ON THE PRIVATE DROP LIST.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-ink text-surface border-t border-charcoal">
      <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8">
          {/* Cols 1-4: Brand Identity & Newsletter */}
          <div className="md:col-span-4 space-y-5">
            <Link
              href="/"
              className="inline-block font-display font-extrabold text-xl tracking-[-0.03em] uppercase text-surface"
            >
              {cms.brandName}
            </Link>
            <p className="text-sm text-[#A1A19A] leading-relaxed max-w-[340px]">
              Independent streetwear label and garment research studio. Heavyweight
              small-batch releases engineered in Indonesia with uncompromising material
              specifications.
            </p>

            <form onSubmit={handleNewsletter} className="pt-2 max-w-[340px]">
              <label
                htmlFor="footer-newsletter"
                className="block text-[11px] font-semibold tracking-[0.10em] uppercase text-surface mb-2"
              >
                PRIVATE DROP DISPATCH
              </label>
              <div className="flex items-center border-b border-surface pb-1.5">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL ADDRESS"
                  className="w-full bg-transparent text-xs text-surface placeholder:text-[#6E6E6A] focus:outline-none uppercase tracking-[0.05em]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-[11px] font-semibold tracking-[0.08em] uppercase text-surface hover:text-campaign-red transition-colors shrink-0 pl-3"
                >
                  {submitting ? "..." : "SUBSCRIBE →"}
                </button>
              </div>
            </form>
          </div>

          {/* Cols 5-6: SHOP */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-surface">
              SHOP ARCHIVE
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A1A19A]">
              <li>
                <Link href="/catalog" className="hover:text-surface transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?type=Featured+Release"
                  className="hover:text-surface transition-colors"
                >
                  Featured Releases
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=Outerwear"
                  className="hover:text-surface transition-colors"
                >
                  Outerwear & Workwear
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=Hoodies+%26+Knits"
                  className="hover:text-surface transition-colors"
                >
                  Heavyweight Hoodies
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=Tees"
                  className="hover:text-surface transition-colors"
                >
                  235gsm Box Tees
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=Bottoms"
                  className="hover:text-surface transition-colors"
                >
                  Denim & Cargo Pants
                </Link>
              </li>
            </ul>
          </div>

          {/* Cols 7-8: INFORMATION */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-surface">
              BRAND & CULTURE
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A1A19A]">
              <li>
                <Link href="/about" className="hover:text-surface transition-colors">
                  About the Atelier
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-surface transition-colors">
                  Community Lookbook
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?collection=silent-riot-aw26"
                  className="hover:text-surface transition-colors"
                >
                  Collection 04: Silent Riot
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?collection=concrete-liturgy"
                  className="hover:text-surface transition-colors"
                >
                  Collection 03: Concrete Liturgy
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-surface transition-colors">
                  Admin & CMS Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Cols 9-10: CLIENT SERVICES */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-surface">
              CLIENT SERVICES
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A1A19A]">
              <li>
                <Link
                  href="/account?tab=orders"
                  className="hover:text-surface transition-colors"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-surface transition-colors">
                  Member Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account?tab=wishlist"
                  className="hover:text-surface transition-colors"
                >
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/about#policies" className="hover:text-surface transition-colors">
                  Shipping & Dispatch SLA
                </Link>
              </li>
              <li>
                <Link href="/about#policies" className="hover:text-surface transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/about#policies" className="hover:text-surface transition-colors">
                  Terms & Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Cols 11-12: CONNECT */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.10em] uppercase text-surface">
              CONNECT & ATELIER
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A1A19A]">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-surface transition-colors"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-surface transition-colors"
                >
                  <span>TikTok</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
              <li className="pt-2 text-[11px] text-[#6E6E6A] leading-relaxed">
                ATELIER DISPATCH DESK
                <br />
                MON – SAT // 10:00 – 19:00 WIB
                <br />
                SENOPATI, JAKARTA SELATAN
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Dynamic Xendit Enabled Payment Methods Bar */}
      <div className="border-t border-charcoal">
        <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] text-[#6E6E6A]">
            <span>© {new Date().getFullYear()} {cms.brandName}. ALL RIGHTS RESERVED.</span>
            <Link href="/about#policies" className="hover:text-surface transition-colors">
              TERMS & CONDITIONS
            </Link>
            <Link href="/about#policies" className="hover:text-surface transition-colors">
              PRIVACY POLICY
            </Link>
            <Link href="/about#policies" className="hover:text-surface transition-colors">
              SHIPPING & RETURN POLICY
            </Link>
          </div>

          {/* Dynamically Rendered Enabled Xendit Payment Channels Only */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.10em] uppercase text-[#6E6E6A] mr-1">
              SECURED BY XENDIT:
            </span>
            {paymentChannels.map((ch) => (
              <span
                key={ch.code}
                title={ch.name}
                className="px-2 py-0.5 border border-charcoal bg-[#141414] text-[10px] font-semibold tracking-[0.08em] uppercase text-[#A1A19A]"
              >
                {ch.shortLabel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

