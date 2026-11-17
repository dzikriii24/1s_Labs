"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  CartItem,
  Collection,
  CommunityPost,
  CustomerAccount,
  Order,
  Product,
  SavedAddress,
  ShippingAreaRate,
  SizeGuideMaster,
  StoreCMSConfig,
  XenditPaymentChannel,
  XenditWebhookLog,
} from "@/types/store";
import { INITIAL_DATABASE } from "@/data/seed";
import { CurrencyCode } from "@/lib/format";

interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  variant?: "default" | "error" | "success";
}

interface StoreContextValue {
  cms: StoreCMSConfig;
  sizeGuideMasters: SizeGuideMaster[];
  collections: Collection[];
  products: Product[];
  shippingAreas: ShippingAreaRate[];
  paymentChannels: XenditPaymentChannel[];
  allPaymentChannels: XenditPaymentChannel[];
  communityPosts: CommunityPost[];
  orders: Order[];
  webhookLogs: XenditWebhookLog[];
  newsletterSubscribers: { email: string; subscribedAt: string }[];
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotalIdr: number;
  cartTotalWeightGrams: number;
  addToCart: (item: CartItem, openDrawer?: boolean) => void;
  updateCartQty: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  isMiniCartOpen: boolean;
  setIsMiniCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  wishlistIds: string[];
  toggleWishlist: (productId: string) => boolean;
  recentlyViewedIds: string[];
  recordRecentlyViewed: (productId: string) => void;
  currentUser: CustomerAccount | null;
  login: (email: string, fullName?: string) => void;
  logout: () => void;
  updateProfile: (patch: Partial<CustomerAccount>) => void;
  addAddress: (addr: Omit<SavedAddress, "id">) => void;
  removeAddress: (id: string) => void;
  refreshStore: () => Promise<void>;
  notify: (title: string, detail?: string, variant?: "default" | "error" | "success") => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "nocturne_cart_v1";
const WISHLIST_STORAGE_KEY = "nocturne_wishlist_v1";
const RECENT_STORAGE_KEY = "nocturne_recent_v1";
const USER_STORAGE_KEY = "nocturne_user_v1";
const CURRENCY_STORAGE_KEY = "nocturne_currency_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cms, setCms] = useState<StoreCMSConfig>(INITIAL_DATABASE.cms);
  const [sizeGuideMasters, setSizeGuideMasters] = useState<SizeGuideMaster[]>(
    INITIAL_DATABASE.sizeGuideMasters
  );
  const [collections, setCollections] = useState<Collection[]>(INITIAL_DATABASE.collections);
  const [products, setProducts] = useState<Product[]>(INITIAL_DATABASE.products);
  const [shippingAreas, setShippingAreas] = useState<ShippingAreaRate[]>(
    INITIAL_DATABASE.shippingAreas
  );
  const [paymentChannels, setPaymentChannels] = useState<XenditPaymentChannel[]>(
    INITIAL_DATABASE.paymentChannels
  );
  const [allPaymentChannels, setAllPaymentChannels] = useState<XenditPaymentChannel[]>(
    INITIAL_DATABASE.paymentChannels
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(
    INITIAL_DATABASE.communityPosts
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_DATABASE.orders);
  const [webhookLogs, setWebhookLogs] = useState<XenditWebhookLog[]>(
    INITIAL_DATABASE.webhookLogs
  );
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<
    { email: string; subscribedAt: string }[]
  >(INITIAL_DATABASE.newsletterSubscribers);

  const [currency, setCurrencyState] = useState<CurrencyCode>("IDR");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(["prod-01", "prod-02"]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<CustomerAccount | null>(null);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (title: string, detail?: string, variant: "default" | "error" | "success" = "default") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, detail, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const refreshStore = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/store", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.cms) setCms(data.cms);
      if (data.sizeGuideMasters) setSizeGuideMasters(data.sizeGuideMasters);
      if (data.collections) setCollections(data.collections);
      if (data.products) setProducts(data.products);
      if (data.shippingAreas) setShippingAreas(data.shippingAreas);
      if (data.paymentChannels) setPaymentChannels(data.paymentChannels);
      if (data.allPaymentChannels) setAllPaymentChannels(data.allPaymentChannels);
      if (data.communityPosts) setCommunityPosts(data.communityPosts);
      if (data.orders) setOrders(data.orders);
      if (data.webhookLogs) setWebhookLogs(data.webhookLogs);
      if (data.newsletterSubscribers) {
        setNewsletterSubscribers(data.newsletterSubscribers);
      }
    } catch {
      // Fallback to seeded state if offline
    }
  }, []);

  useEffect(() => {
    refreshStore();
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWish = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWish) setWishlistIds(JSON.parse(savedWish));

      const savedRecent = localStorage.getItem(RECENT_STORAGE_KEY);
      if (savedRecent) setRecentlyViewedIds(JSON.parse(savedRecent));

      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedCur = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
      if (savedCur === "IDR" || savedCur === "USD") setCurrencyState(savedCur);
    } catch {
      // ignore storage errors
    }
  }, [refreshStore]);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {}
  };

  const persistCart = (next: CartItem[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addToCart = (newItem: CartItem, openDrawer = true) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.variantId === newItem.variantId);
      let next: CartItem[];
      if (existingIdx > -1) {
        const current = prev[existingIdx];
        const cappedQty = Math.min(current.maxAllowed, current.quantity + newItem.quantity);
        next = [...prev];
        next[existingIdx] = { ...current, quantity: cappedQty };
      } else {
        next = [
          ...prev,
          {
            ...newItem,
            quantity: Math.min(newItem.maxAllowed, newItem.quantity),
          },
        ];
      }
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (openDrawer) {
      setIsMiniCartOpen(true);
    } else {
      notify("ADDED TO BAG", `${newItem.productName} — SIZE ${newItem.size}`);
    }
  };

  const updateCartQty = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    const next = cart.map((item) =>
      item.variantId === variantId
        ? { ...item, quantity: Math.min(item.maxAllowed, quantity) }
        : item
    );
    persistCart(next);
  };

  const removeFromCart = (variantId: string) => {
    const next = cart.filter((item) => item.variantId !== variantId);
    persistCart(next);
  };

  const clearCart = () => {
    persistCart([]);
  };

  const toggleWishlist = (productId: string): boolean => {
    let added = false;
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      added = !exists;
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    const prod = products.find((p) => p.id === productId);
    notify(
      added ? "SAVED TO WISHLIST" : "REMOVED FROM WISHLIST",
      prod?.name || undefined
    );
    return added;
  };

  const recordRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const next = [productId, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const login = (email: string, fullName?: string) => {
    const existing = INITIAL_DATABASE.customers.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    const account: CustomerAccount = existing || {
      id: `cust-${Date.now()}`,
      fullName: fullName || email.split("@")[0].toUpperCase(),
      email: email.trim(),
      phone: "+6281294820192",
      memberSince: new Date().toISOString().slice(0, 10),
      wishlistProductIds: wishlistIds,
      addresses: [
        {
          id: "addr-default",
          label: "PRIMARY RESIDENCE",
          recipientName: fullName || "Member",
          phone: "+6281294820192",
          areaId: "area-jkt",
          areaName: "Jakarta Selatan / Jabodetabek",
          province: "DKI Jakarta",
          postalCode: "12160",
          streetAddress: "Jl. Senopati Dalam No. 42, Kebayoran Baru",
          isDefault: true,
        },
      ],
    };
    setCurrentUser(account);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(account));
    } catch {}
    notify("SIGNED IN", `WELCOME BACK, ${account.fullName.toUpperCase()}`);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    notify("SIGNED OUT", "SESSION TERMINATED");
  };

  const updateProfile = (patch: Partial<CustomerAccount>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...patch };
    setCurrentUser(next);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    notify("PROFILE UPDATED", "CHANGES SAVED TO YOUR ACCOUNT");
  };

  const addAddress = (addr: Omit<SavedAddress, "id">) => {
    if (!currentUser) return;
    const newAddr: SavedAddress = {
      ...addr,
      id: `addr-${Date.now()}`,
    };
    const updatedAddresses = addr.isDefault
      ? currentUser.addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
      : [...currentUser.addresses, newAddr];
    updateProfile({ addresses: updatedAddresses });
  };

  const removeAddress = (id: string) => {
    if (!currentUser) return;
    updateProfile({
      addresses: currentUser.addresses.filter((a) => a.id !== id),
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalIdr = cart.reduce(
    (sum, item) => sum + item.unitPriceIdr * item.quantity,
    0
  );
  const cartTotalWeightGrams = cart.reduce(
    (sum, item) => sum + item.weightGrams * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        cms,
        sizeGuideMasters,
        collections,
        products,
        shippingAreas,
        paymentChannels,
        allPaymentChannels,
        communityPosts,
        orders,
        webhookLogs,
        newsletterSubscribers,
        currency,
        setCurrency,
        cart,
        cartCount,
        cartSubtotalIdr,
        cartTotalWeightGrams,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        isMiniCartOpen,
        setIsMiniCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        wishlistIds,
        toggleWishlist,
        recentlyViewedIds,
        recordRecentlyViewed,
        currentUser,
        login,
        logout,
        updateProfile,
        addAddress,
        removeAddress,
        refreshStore,
        notify,
      }}
    >
      {children}

      {/* Minimalist Architectural Toast Notification Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto border px-4 py-3.5 transition-all duration-150 ${
              t.variant === "error"
                ? "bg-surface border-campaign-red text-ink"
                : "bg-ink border-ink text-surface"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span
                className={`text-[11px] font-semibold tracking-[0.10em] uppercase ${
                  t.variant === "error" ? "text-campaign-red" : "text-surface"
                }`}
              >
                {t.title}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-campaign-red shrink-0" />
            </div>
            {t.detail && (
              <p
                className={`mt-1 text-xs truncate ${
                  t.variant === "error" ? "text-charcoal" : "text-surface/80"
                }`}
              >
                {t.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
