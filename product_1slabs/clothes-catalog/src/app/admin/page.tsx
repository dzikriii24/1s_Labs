"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Megaphone,
  ShoppingCart,
  Camera,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUpRight,
  ShieldCheck,
  Ruler,
  Layers,
  RefreshCw,
  Star,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatWeight, getProductTotalStock } from "@/lib/format";
import {
  Collection,
  CommunityPost,
  OrderFulfillmentStatus,
  Product,
  ProductCategory,
  ProductType,
  ShippingAreaRate,
  SizeCode,
  SizeGuideMaster,
} from "@/types/store";

type AdminSection =
  | "products"
  | "sizeguides"
  | "collections"
  | "campaigns"
  | "orders"
  | "community"
  | "settings";

const CATEGORIES: ProductCategory[] = [
  "Tees",
  "Tops & Shirts",
  "Outerwear",
  "Hoodies & Knits",
  "Bottoms",
  "Headwear",
  "Accessories",
];

const PRODUCT_TYPES: ProductType[] = [
  "Featured Release",
  "Core Collection",
  "Collaboration",
  "Archive",
];

const ALL_SIZES: SizeCode[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "OS",
  "30",
  "32",
  "34",
];

export default function AdminCmsPage() {
  const {
    cms,
    collections,
    sizeGuideMasters,
    products,
    shippingAreas,
    orders,
    webhookLogs,
    communityPosts,
    allPaymentChannels,
    currency,
    refreshStore,
    notify,
  } = useStore();

  const [activeSection, setActiveSection] = useState<AdminSection>("products");

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productModalTab, setProductModalTab] = useState<
    "general" | "media" | "variants" | "sizeguide"
  >("general");

  // Size Guide Masters State
  const [mastersDraft, setMastersDraft] =
    useState<SizeGuideMaster[]>(sizeGuideMasters);
  const [editingMaster, setEditingMaster] = useState<SizeGuideMaster | null>(
    null
  );
  const [savingMasters, setSavingMasters] = useState(false);

  // Collections State
  const [collectionsDraft, setCollectionsDraft] =
    useState<Collection[]>(collections);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [savingCollections, setSavingCollections] = useState(false);

  // CMS & Shipping Areas State
  const [cmsDraft, setCmsDraft] = useState(cms);
  const [shippingAreasDraft, setShippingAreasDraft] =
    useState<ShippingAreaRate[]>(shippingAreas);
  const [savingCms, setSavingCms] = useState(false);

  // Community Editor Modal State
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Order Tracking Number Drafts
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>(
    {}
  );

  // Sync local drafts when store updates
  useEffect(() => {
    setCmsDraft(cms);
  }, [cms]);

  useEffect(() => {
    setMastersDraft(sizeGuideMasters);
  }, [sizeGuideMasters]);

  useEffect(() => {
    setCollectionsDraft(collections);
  }, [collections]);

  useEffect(() => {
    setShippingAreasDraft(shippingAreas);
  }, [shippingAreas]);

  const defaultGarmentMaster =
    sizeGuideMasters.find((m) => m.isDefault) || sizeGuideMasters[0];

  // =========================================================================
  // 1. HANDLERS: PRODUCTS FULL CRUD (INCLUDING SIZE GUIDE MASTER & OVERRIDES)
  // =========================================================================
  const openCreateProductModal = () => {
    const defMaster = defaultGarmentMaster;
    const template: Product = {
      id: `prod-${Date.now()}`,
      slug: `new-archive-garment-${Date.now().toString().slice(-4)}`,
      name: "NEW ARCHIVAL GARMENT RELEASE — PITCH BLACK",
      collectionSlug: collections[0]?.slug || "silent-riot-aw26",
      collectionName: collections[0]?.name || "SILENT RIOT // AW26",
      category: "Tees",
      productType: "Featured Release",
      priceIdr: 449000,
      shortDescription:
        "Heavyweight small-batch garment engineered in 235gsm combed 16s cotton with custom archival plastisol print.",
      descriptionSpecs: [
        "235 GSM 100% Cotton Combed 16s Heavyweight Jersey",
        "Custom woven neck label and numbered care tag",
      ],
      fabricSpec: "100% Cotton 16s — 235 GSM",
      fitProfile: "Oversized Boxy Fit",
      careInstructions: ["Machine wash cold inside out", "Line dry in shade"],
      madeIn: "Made in Indonesia",
      weightGrams: 450,
      maxPerOrder: 3,
      featured: true,
      bestSellingRank: products.length + 1,
      createdAt: new Date().toISOString(),
      images: [
        {
          id: `img-${Date.now()}-1`,
          url: "/images/prod-tee-front.png",
          alt: "Front Studio View",
          role: "front",
        },
        {
          id: `img-${Date.now()}-2`,
          url: "/images/prod-tee-back.png",
          alt: "Back Studio View",
          role: "back",
        },
        {
          id: `img-${Date.now()}-3`,
          url: "/images/prod-tee-front.png",
          alt: "Angle View",
          role: "angle",
        },
        {
          id: `img-${Date.now()}-4`,
          url: "/images/prod-tee-back.png",
          alt: "Detail View",
          role: "detail",
        },
        {
          id: `img-${Date.now()}-5`,
          url: "/images/hero-campaign.png",
          alt: "Lifestyle View",
          role: "lifestyle",
        },
      ],
      colors: [{ id: "clr-black", name: "Pitch Black", hex: "#0A0A0A" }],
      sizes: ["S", "M", "L", "XL"],
      variants: (["S", "M", "L", "XL"] as SizeCode[]).map((sz) => ({
        id: `var-${Date.now()}-${sz}`,
        sku: `ARC-NEW-${sz}`,
        colorId: "clr-black",
        colorName: "Pitch Black",
        colorHex: "#0A0A0A",
        size: sz,
        stock: 10,
      })),
      sizeGuideMasterId: defMaster?.id || "sg-default-garment",
      sizeChart: defMaster?.defaultRows
        ? structuredClone(defMaster.defaultRows)
        : [
            { size: "S", chestCm: 56, lengthCm: 70, shoulderCm: 53, sleeveCm: 22 },
            { size: "M", chestCm: 59, lengthCm: 72, shoulderCm: 55, sleeveCm: 23 },
            { size: "L", chestCm: 62, lengthCm: 75, shoulderCm: 57, sleeveCm: 24 },
            { size: "XL", chestCm: 65, lengthCm: 77, shoulderCm: 59, sleeveCm: 25 },
          ],
      modelNotes: "True oversized boxy fit.",
    };
    setIsCreatingProduct(true);
    setProductModalTab("general");
    setEditingProduct(template);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Ensure collectionName matches selected collectionSlug
    const matchedCollection = collections.find(
      (c) => c.slug === editingProduct.collectionSlug
    );
    const payload: Product = {
      ...editingProduct,
      collectionName: matchedCollection
        ? matchedCollection.name
        : editingProduct.collectionName,
    };

    const method = isCreatingProduct ? "POST" : "PUT";
    const res = await fetch("/api/v1/products", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await refreshStore();
      setEditingProduct(null);
      setIsCreatingProduct(false);
      notify(
        isCreatingProduct ? "PRODUCT CREATED" : "PRODUCT UPDATED",
        payload.name
      );
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const res = await fetch(`/api/v1/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await refreshStore();
      notify("PRODUCT DELETED", name);
    }
  };

  // =========================================================================
  // 2. HANDLERS: SIZE GUIDE MASTERS SAVE
  // =========================================================================
  const persistSizeGuideMasters = async (nextMasters: SizeGuideMaster[]) => {
    setSavingMasters(true);
    try {
      const res = await fetch("/api/v1/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeGuideMasters: nextMasters }),
      });
      if (res.ok) {
        await refreshStore();
        setEditingMaster(null);
        notify(
          "SIZE GUIDE MASTERS UPDATED",
          "ALL LINKED PRODUCTS NOW USE THE UPDATED MASTER TEMPLATES."
        );
      }
    } finally {
      setSavingMasters(false);
    }
  };

  const handleSetDefaultMaster = async (masterId: string) => {
    const next = mastersDraft.map((m) => ({
      ...m,
      isDefault: m.id === masterId,
    }));
    setMastersDraft(next);
    await persistSizeGuideMasters(next);
  };

  // =========================================================================
  // 3. HANDLERS: COLLECTIONS SAVE
  // =========================================================================
  const persistCollections = async (nextCollections: Collection[]) => {
    setSavingCollections(true);
    try {
      const res = await fetch("/api/v1/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collections: nextCollections }),
      });
      if (res.ok) {
        await refreshStore();
        setEditingCollection(null);
        notify(
          "COLLECTIONS UPDATED",
          "STOREFRONT COLLECTIONS & CATALOG FILTERS SYNCED."
        );
      }
    } finally {
      setSavingCollections(false);
    }
  };

  // =========================================================================
  // 4. HANDLERS: CMS, ABOUT PAGE & SHIPPING TARIFFS SAVE
  // =========================================================================
  const handleSaveCmsAndShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    try {
      const res = await fetch("/api/v1/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cms: cmsDraft,
          shippingAreas: shippingAreasDraft,
        }),
      });
      if (res.ok) {
        await refreshStore();
        notify(
          "CMS CONFIGURATION PUBLISHED",
          "HOMEPAGE, ABOUT PAGE, SHIPPING TARIFFS & XENDIT SETTINGS UPDATED."
        );
      }
    } finally {
      setSavingCms(false);
    }
  };

  // =========================================================================
  // 5. HANDLERS: ORDER FULFILLMENT UPDATE
  // =========================================================================
  const handleUpdateOrderFulfillment = async (
    orderNumber: string,
    fulfillmentStatus: OrderFulfillmentStatus,
    trackingNumber?: string
  ) => {
    const res = await fetch("/api/v1/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, fulfillmentStatus, trackingNumber }),
    });
    if (res.ok) {
      await refreshStore();
      notify(
        "ORDER FULFILLMENT UPDATED",
        `${orderNumber} → ${fulfillmentStatus}`
      );
    }
  };

  // =========================================================================
  // 6. HANDLERS: COMMUNITY LOOKBOOK CRUD & MODERATION
  // =========================================================================
  const handleModerateCommunity = async (
    id: string,
    status?: "APPROVED" | "REJECTED",
    deletePost?: boolean
  ) => {
    const res = await fetch("/api/v1/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, deletePost }),
    });
    if (res.ok) {
      await refreshStore();
      notify(
        "COMMUNITY MODERATION SAVED",
        deletePost ? "SUBMISSION REMOVED" : `STATUS SET TO ${status}`
      );
    }
  };

  const handleSaveCommunityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    const matchedProd =
      products.find((p) => p.slug === editingPost.productSlug) || products[0];
    const postPayload: CommunityPost = {
      ...editingPost,
      productName: matchedProd ? matchedProd.name : editingPost.productName,
    };

    if (isCreatingPost) {
      const res = await fetch("/api/v1/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...postPayload,
          autoApprove: postPayload.status === "APPROVED",
        }),
      });
      if (res.ok) {
        await refreshStore();
        setEditingPost(null);
        setIsCreatingPost(false);
        notify("COMMUNITY LOOK CREATED", postPayload.username);
      }
    } else {
      const res = await fetch("/api/v1/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postPayload.id,
          updatedPost: postPayload,
        }),
      });
      if (res.ok) {
        await refreshStore();
        setEditingPost(null);
        notify("COMMUNITY LOOK UPDATED", postPayload.username);
      }
    }
  };

  const toggleEnabledPaymentChannel = (code: string) => {
    setCmsDraft((prev) => {
      const exists = prev.enabledPaymentChannels.includes(code);
      const next = exists
        ? prev.enabledPaymentChannels.filter((c) => c !== code)
        : [...prev.enabledPaymentChannels, code];
      return {
        ...prev,
        enabledPaymentChannels: next,
      };
    });
  };

  // Resolve active master for the product currently being edited
  const editingProductMaster = editingProduct
    ? sizeGuideMasters.find((m) => m.id === editingProduct.sizeGuideMasterId) ||
      defaultGarmentMaster
    : defaultGarmentMaster;

  const editingProductActiveColumns: [string, string, string, string] =
    editingProduct?.customSizeGuideColumns &&
    editingProduct.customSizeGuideColumns.length === 4
      ? editingProduct.customSizeGuideColumns
      : editingProductMaster?.columns || [
          "CHEST / HALF-WIDTH",
          "BODY LENGTH",
          "SHOULDER",
          "SLEEVE / HEM",
        ];

  return (
    <div className="max-w-storefront mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      {/* Admin Top Header */}
      <div className="pb-6 border-b border-ink flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-block bg-ink text-surface px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
            MASTER BACKOFFICE // FULL STOREFRONT & SIZE GUIDE CMS
          </span>
          <h1 className="mt-2 font-display font-bold text-2xl sm:text-4xl uppercase tracking-[-0.02em] text-ink">
            ATELIER ADMIN & MASTER CMS CONSOLE
          </h1>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink border-b border-ink pb-0.5 self-start sm:self-auto"
        >
          <span>VIEW LIVE STOREFRONT</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Summary Strip */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 tabular-nums">
        <div className="p-4 border border-border bg-surface-alt">
          <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
            TOTAL CATALOG SKUS
          </span>
          <span className="font-display font-bold text-2xl text-ink mt-1 block">
            {products.length} PRODUCTS (
            {products.reduce((s, p) => s + p.variants.length, 0)} SKUS)
          </span>
        </div>
        <div className="p-4 border border-border bg-surface-alt">
          <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
            SIZE GUIDE MASTERS
          </span>
          <span className="font-display font-bold text-2xl text-ink mt-1 block">
            {sizeGuideMasters.length} TEMPLATES
          </span>
        </div>
        <div className="p-4 border border-border bg-surface-alt">
          <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
            ORDERS & WEBHOOKS
          </span>
          <span className="font-display font-bold text-2xl text-status-success mt-1 block">
            {orders.length} ORDERS ({webhookLogs.length} LOGS)
          </span>
        </div>
        <div className="p-4 border border-border bg-surface-alt">
          <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted block">
            COMMUNITY LOOKBOOK
          </span>
          <span className="font-display font-bold text-2xl text-ink mt-1 block">
            {communityPosts.length} ARCHIVE FITS
          </span>
        </div>
      </div>

      {/* Main Admin Layout: Left Module Navigation + Right Workspace */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 border border-ink bg-surface divide-y divide-border">
          {[
            {
              id: "products",
              label: `1. PRODUCTS & SIZE CHARTS (${products.length})`,
              icon: <Package className="w-4 h-4 shrink-0" />,
            },
            {
              id: "sizeguides",
              label: `2. SIZE GUIDE MASTERS (${sizeGuideMasters.length})`,
              icon: <Ruler className="w-4 h-4 shrink-0" />,
            },
            {
              id: "collections",
              label: `3. COLLECTIONS (${collections.length})`,
              icon: <Layers className="w-4 h-4 shrink-0" />,
            },
            {
              id: "campaigns",
              label: "4. HOMEPAGE & ABOUT CMS",
              icon: <Megaphone className="w-4 h-4 shrink-0" />,
            },
            {
              id: "orders",
              label: `5. ORDERS & XENDIT (${orders.length})`,
              icon: <ShoppingCart className="w-4 h-4 shrink-0" />,
            },
            {
              id: "community",
              label: `6. COMMUNITY LOOKBOOK (${communityPosts.length})`,
              icon: <Camera className="w-4 h-4 shrink-0" />,
            },
            {
              id: "settings",
              label: "7. SHIPPING, SLA & PAYMENTS",
              icon: <Sliders className="w-4 h-4 shrink-0" />,
            },
          ].map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as AdminSection)}
                className={`w-full px-4 py-3.5 flex items-center gap-3 text-left text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "bg-ink text-surface"
                    : "text-charcoal hover:bg-surface-alt hover:text-ink"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Workspace (9 Cols) */}
        <div className="lg:col-span-9 min-w-0">
          {/* =================================================================
              SECTION 1: PRODUCTS, VARIANTS, IMAGES & SIZE GUIDE ASSIGNMENT
          ================================================================= */}
          {activeSection === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    PRODUCTS, 5-SHOT GALLERY, VARIANTS & SIZE GUIDE
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Full control over every product: specifications, images, SKU
                    stock, and assigned Size Guide Master / custom measurements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="h-10 px-5 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>CREATE NEW PRODUCT</span>
                </button>
              </div>

              <div className="border border-border divide-y divide-border bg-surface">
                {products.map((prod) => {
                  const totalStock = getProductTotalStock(prod.variants);
                  const assignedMaster =
                    sizeGuideMasters.find(
                      (m) => m.id === prod.sizeGuideMasterId
                    ) || defaultGarmentMaster;

                  return (
                    <div
                      key={prod.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={prod.images[0]?.url}
                          alt={prod.name}
                          className="w-14 aspect-[4/5] object-cover bg-surface-alt border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 bg-surface-alt border border-border text-charcoal">
                              {prod.category}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 bg-surface-alt border border-border text-muted">
                              {prod.collectionName}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-[0.06em] px-2 py-0.5 bg-surface-alt border border-border text-ink">
                              SIZE MASTER: {assignedMaster?.name || "DEFAULT GARMENT"}
                            </span>
                            {prod.featured && (
                              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 bg-ink text-surface">
                                FEATURED
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/products/${prod.slug}`}
                            className="mt-1.5 text-xs sm:text-sm font-bold uppercase text-ink hover:underline block truncate"
                          >
                            {prod.name}
                          </Link>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted tabular-nums">
                            <span>PRICE: {formatPrice(prod.priceIdr, currency)}</span>
                            <span>WEIGHT: {formatWeight(prod.weightGrams)}</span>
                            <span
                              className={
                                totalStock <= 0
                                  ? "text-campaign-red font-semibold"
                                  : totalStock <= 5
                                  ? "text-status-warning font-semibold"
                                  : "text-status-success font-semibold"
                              }
                            >
                              STOCK: {totalStock} UNITS ({prod.variants.length} SKUS)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingProduct(false);
                            setProductModalTab("general");
                            setEditingProduct(structuredClone(prod));
                          }}
                          className="h-9 px-3.5 border border-ink bg-surface text-ink text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 hover:bg-ink hover:text-surface transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>FULL EDIT / SIZE GUIDE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          aria-label={`Delete ${prod.name}`}
                          className="h-9 px-2.5 border border-border text-muted hover:border-campaign-red hover:text-campaign-red transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 2: SIZE GUIDE MASTERS (DEFAULT GARMENT + CATEGORY TEMPLATES)
          ================================================================= */}
          {activeSection === "sizeguides" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    SIZE GUIDE MASTER TEMPLATES
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Manage reusable Size Guide Masters (Default Garment Master for
                    Tops/Outerwear, Bottoms/Trousers, Headwear, Accessories). Any
                    product can inherit a Master or customize its own rows.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingMaster({
                      id: `sg-custom-${Date.now()}`,
                      name: "NEW CUSTOM SIZE GUIDE MASTER",
                      categoryHint: "Custom Category",
                      isDefault: false,
                      columns: [
                        "CHEST / HALF-WIDTH",
                        "BODY LENGTH",
                        "SHOULDER",
                        "SLEEVE / HEM",
                      ],
                      howToMeasureTitle: "HOW WE MEASURE (FLAT STUDIO METHOD):",
                      howToMeasureText:
                        "All garments are measured flat on a studio table. Tolerance is ±1.5cm.",
                      defaultRows: [
                        {
                          size: "S",
                          chestCm: 56,
                          lengthCm: 70,
                          shoulderCm: 53,
                          sleeveCm: 22,
                        },
                        {
                          size: "M",
                          chestCm: 59,
                          lengthCm: 72,
                          shoulderCm: 55,
                          sleeveCm: 23,
                        },
                        {
                          size: "L",
                          chestCm: 62,
                          lengthCm: 75,
                          shoulderCm: 57,
                          sleeveCm: 24,
                        },
                        {
                          size: "XL",
                          chestCm: 65,
                          lengthCm: 77,
                          shoulderCm: 59,
                          sleeveCm: 25,
                        },
                      ],
                    });
                  }}
                  className="h-10 px-5 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW SIZE GUIDE MASTER</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {mastersDraft.map((master) => {
                  const linkedCount = products.filter(
                    (p) =>
                      p.sizeGuideMasterId === master.id ||
                      (!p.sizeGuideMasterId && master.isDefault)
                  ).length;

                  return (
                    <div
                      key={master.id}
                      className="border border-border bg-surface p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {master.isDefault && (
                              <span className="bg-ink text-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] inline-flex items-center gap-1">
                                <Star className="w-3 h-3 fill-surface" />
                                DEFAULT GARMENT MASTER
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-surface-alt border border-border text-[10px] font-mono uppercase text-muted">
                              {master.categoryHint}
                            </span>
                            <span className="text-[11px] font-semibold uppercase text-charcoal">
                              USED BY {linkedCount} PRODUCTS
                            </span>
                          </div>
                          <h3 className="mt-1.5 font-display font-bold text-base uppercase text-ink">
                            {master.name}
                          </h3>
                          <p className="mt-1 text-xs text-muted">
                            COLUMNS:{" "}
                            <span className="text-ink font-mono">
                              SIZE | {master.columns.join(" | ")}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!master.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultMaster(master.id)}
                              className="h-8 px-3 border border-border text-[10px] font-semibold uppercase tracking-[0.08em] text-charcoal hover:border-ink hover:text-ink"
                            >
                              SET AS DEFAULT MASTER
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingMaster(structuredClone(master))
                            }
                            className="h-8 px-3.5 border border-ink bg-surface text-ink text-[10px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 hover:bg-ink hover:text-surface transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>EDIT MASTER</span>
                          </button>
                          {!master.isDefault && (
                            <button
                              type="button"
                              onClick={async () => {
                                const next = mastersDraft.filter(
                                  (m) => m.id !== master.id
                                );
                                setMastersDraft(next);
                                await persistSizeGuideMasters(next);
                              }}
                              className="h-8 px-2.5 border border-border text-muted hover:text-campaign-red hover:border-campaign-red"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Preview Table of Default Rows */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border text-[11px] tabular-nums">
                          <thead>
                            <tr className="bg-surface-alt border-b border-border text-left font-semibold uppercase text-ink">
                              <th className="p-2 border-r border-border">SIZE</th>
                              <th className="p-2 border-r border-border">
                                {master.columns[0]} (CM)
                              </th>
                              <th className="p-2 border-r border-border">
                                {master.columns[1]} (CM)
                              </th>
                              <th className="p-2 border-r border-border">
                                {master.columns[2]} (CM)
                              </th>
                              <th className="p-2">{master.columns[3]} (CM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {master.defaultRows.map((r) => (
                              <tr key={r.size}>
                                <td className="p-2 border-r border-border font-semibold">
                                  {r.size}
                                </td>
                                <td className="p-2 border-r border-border">
                                  {r.chestCm}
                                </td>
                                <td className="p-2 border-r border-border">
                                  {r.lengthCm}
                                </td>
                                <td className="p-2 border-r border-border">
                                  {r.shoulderCm}
                                </td>
                                <td className="p-2">{r.sleeveCm}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 3: COLLECTIONS MANAGER
          ================================================================= */}
          {activeSection === "collections" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    ARCHIVAL COLLECTIONS MANAGER
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Create and edit collections displayed on the Homepage Featured
                    Collections grid and Catalog filters.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCollection({
                      id: `col-${Date.now()}`,
                      slug: `collection-${Date.now().toString().slice(-4)}`,
                      indexCode: `0${collectionsDraft.length + 1}`,
                      name: "NEW SEASONAL COLLECTION",
                      seasonTag: "SEASONAL CAPSULE",
                      shortDescription:
                        "Limited-run seasonal collection crafted in heavyweight textiles.",
                      editorialCopy:
                        "Engineered in our Jakarta & Bandung partner mills.",
                      heroImage: "/images/hero-campaign.png",
                      secondaryImage: "/images/prod-hoodie-back.png",
                      featured: true,
                    });
                  }}
                  className="h-10 px-5 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW COLLECTION</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collectionsDraft.map((col) => (
                  <div
                    key={col.id}
                    className="border border-border bg-surface p-4 flex gap-4"
                  >
                    <img
                      src={col.heroImage}
                      alt={col.name}
                      className="w-24 aspect-[4/5] object-cover bg-surface-alt border border-border shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between text-xs min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase text-muted">
                            [{col.indexCode} // {col.seasonTag}]
                          </span>
                          {col.featured && (
                            <span className="px-2 py-0.5 bg-ink text-surface text-[9px] font-semibold uppercase">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-display font-bold text-sm uppercase text-ink truncate">
                          {col.name}
                        </h3>
                        <p className="mt-1 text-[11px] text-charcoal line-clamp-2">
                          {col.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCollection(structuredClone(col))
                          }
                          className="h-8 px-3 border border-ink text-[10px] font-semibold uppercase inline-flex items-center gap-1.5 hover:bg-ink hover:text-surface transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>EDIT</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = collectionsDraft.filter(
                              (c) => c.id !== col.id
                            );
                            setCollectionsDraft(next);
                            await persistCollections(next);
                          }}
                          className="h-8 px-2.5 border border-border text-muted hover:text-campaign-red ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 4: HOMEPAGE (HERO LAYOUT A, MANIFESTO, DROP) & ABOUT CMS
          ================================================================= */}
          {activeSection === "campaigns" && (
            <form
              onSubmit={handleSaveCmsAndShipping}
              className="border border-border bg-surface p-6 sm:p-8 space-y-10"
            >
              <div className="pb-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    HOMEPAGE (HERO LAYOUT A, BRAND STORY, DROP) & ABOUT PAGE CMS
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Edit every headline, paragraph, image, stat, and timeline across
                    the Homepage and About page.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingCms}
                  className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em]"
                >
                  {savingCms ? "SAVING..." : "PUBLISH ALL PAGE CONTENT"}
                </button>
              </div>

              {/* 4A. Announcement Bar Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                    1. TOP ANNOUNCEMENT / DROP BAR
                  </h3>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cmsDraft.announcementBar.enabled}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          announcementBar: {
                            ...cmsDraft.announcementBar,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>ENABLED</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                      ANNOUNCEMENT TEXT
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.announcementBar.text}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          announcementBar: {
                            ...cmsDraft.announcementBar,
                            text: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                      CTA LINK HREF
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.announcementBar.linkHref || "/catalog"}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          announcementBar: {
                            ...cmsDraft.announcementBar,
                            linkHref: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs text-ink"
                    />
                  </div>
                </div>
              </div>

              {/* 4B. Homepage Hero Layout A Config */}
              <div className="pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                    2. HOMEPAGE HERO BANNER (LAYOUT A: FULL-BLEED EDITORIAL ANCHOR)
                  </h3>
                  <span className="px-2 py-0.5 bg-surface-alt border border-border text-[10px] font-mono uppercase">
                    LOCKED TO LAYOUT A
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      SEASON / COLLECTION CODE
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.hero.seasonCode}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          hero: { ...cmsDraft.hero, seasonCode: e.target.value },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      RED CAMPAIGN STAMP (#E52323)
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.hero.redAccentStamp}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          hero: {
                            ...cmsDraft.hero,
                            redAccentStamp: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      CAMPAIGN HEADLINE
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.hero.title}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          hero: { ...cmsDraft.hero, title: e.target.value },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      CAMPAIGN DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={cmsDraft.hero.subtitle}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          hero: { ...cmsDraft.hero, subtitle: e.target.value },
                        })
                      }
                      className="w-full p-3 border border-border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      HERO PRIMARY IMAGE URL
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.hero.primaryImage}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          hero: {
                            ...cmsDraft.hero,
                            primaryImage: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      PRIMARY CTA LABEL & HREF
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cmsDraft.hero.ctaText}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            hero: {
                              ...cmsDraft.hero,
                              ctaText: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs"
                      />
                      <input
                        type="text"
                        value={cmsDraft.hero.ctaHref}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            hero: {
                              ...cmsDraft.hero,
                              ctaHref: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4C. Brand Story Manifesto Config */}
              {cmsDraft.brandStory && (
                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                    3. HOMEPAGE BRAND STORY / EDITORIAL MANIFESTO
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        MANIFESTO HEADLINE
                      </label>
                      <input
                        type="text"
                        value={cmsDraft.brandStory.headline}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            brandStory: {
                              ...cmsDraft.brandStory,
                              headline: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        MANIFESTO BODY COPY
                      </label>
                      <textarea
                        rows={3}
                        value={cmsDraft.brandStory.bodyCopy}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            brandStory: {
                              ...cmsDraft.brandStory,
                              bodyCopy: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 border border-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        PRIMARY IMAGE URL
                      </label>
                      <input
                        type="text"
                        value={cmsDraft.brandStory.imagePrimary}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            brandStory: {
                              ...cmsDraft.brandStory,
                              imagePrimary: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        SECONDARY IMAGE URL
                      </label>
                      <input
                        type="text"
                        value={cmsDraft.brandStory.imageSecondary}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            brandStory: {
                              ...cmsDraft.brandStory,
                              imageSecondary: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4D. Promotional Drop Spotlight Config */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                  4. LIMITED RELEASE / DROP SPOTLIGHT SECTION
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      CAPSULE CODE
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.dropSpotlight.code}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dropSpotlight: {
                            ...cmsDraft.dropSpotlight,
                            code: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      DROP TITLE
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.dropSpotlight.title}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dropSpotlight: {
                            ...cmsDraft.dropSpotlight,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      DROP DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={cmsDraft.dropSpotlight.description}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dropSpotlight: {
                            ...cmsDraft.dropSpotlight,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      BANNER IMAGE URL
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.dropSpotlight.bannerImage}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dropSpotlight: {
                            ...cmsDraft.dropSpotlight,
                            bannerImage: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1">
                      TARGET COUNTDOWN ISO DATE
                    </label>
                    <input
                      type="text"
                      value={cmsDraft.dropSpotlight.releaseDateIso}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dropSpotlight: {
                            ...cmsDraft.dropSpotlight,
                            releaseDateIso: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 border border-border text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4E. About Page Monograph Config */}
              {cmsDraft.aboutPage && (
                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                    5. ABOUT PAGE MONOGRAPH & ARCHIVE TIMELINE
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        ABOUT COVER HEADLINE
                      </label>
                      <input
                        type="text"
                        value={cmsDraft.aboutPage.coverHeadline}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            aboutPage: {
                              ...cmsDraft.aboutPage,
                              coverHeadline: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        INTRO PARAGRAPH
                      </label>
                      <textarea
                        rows={2}
                        value={cmsDraft.aboutPage.coverIntro}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            aboutPage: {
                              ...cmsDraft.aboutPage,
                              coverIntro: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 border border-border text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        PHILOSOPHY HEADLINE
                      </label>
                      <input
                        type="text"
                        value={cmsDraft.aboutPage.philosophyTitle}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            aboutPage: {
                              ...cmsDraft.aboutPage,
                              philosophyTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-border text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* =================================================================
              SECTION 5: ORDERS & XENDIT TRANSACTION LOGS
          ================================================================= */}
          {activeSection === "orders" && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg uppercase text-ink">
                  CUSTOMER ORDERS, TRACKING RESI & FULFILLMENT MANAGEMENT
                </h2>

                <div className="border border-border divide-y divide-border bg-surface">
                  {orders.map((ord) => {
                    const trackingVal =
                      trackingDrafts[ord.orderNumber] ??
                      ord.trackingNumber ??
                      "";
                    return (
                      <div key={ord.id} className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                          <div>
                            <Link
                              href={`/orders/${ord.orderNumber}/payment`}
                              className="text-xs font-bold uppercase text-ink hover:underline"
                            >
                              {ord.orderNumber} →
                            </Link>
                            <p className="text-[11px] text-muted mt-0.5">
                              {ord.customer.fullName} ({ord.customer.email} /{" "}
                              {ord.customer.phone})
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase border ${
                                ord.payment.status === "PAID"
                                  ? "border-status-success text-status-success"
                                  : ord.payment.status === "PENDING"
                                  ? "border-status-warning text-status-warning"
                                  : "border-campaign-red text-campaign-red"
                              }`}
                            >
                              XENDIT {ord.payment.channelCode}:{" "}
                              {ord.payment.status}
                            </span>

                            <select
                              value={ord.fulfillmentStatus}
                              onChange={(e) =>
                                handleUpdateOrderFulfillment(
                                  ord.orderNumber,
                                  e.target.value as OrderFulfillmentStatus,
                                  trackingVal
                                )
                              }
                              className="h-8 px-2.5 bg-surface-alt border border-ink text-[11px] font-semibold uppercase text-ink"
                            >
                              <option value="UNPAID">UNPAID</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs items-end">
                          <div className="md:col-span-4">
                            <span className="text-[10px] font-semibold uppercase text-muted block">
                              ITEMS ({ord.items.length})
                            </span>
                            {ord.items.map((it) => (
                              <p key={it.variantId} className="text-ink mt-0.5">
                                {it.productName} ({it.size}) × {it.quantity}
                              </p>
                            ))}
                          </div>
                          <div className="md:col-span-4">
                            <span className="text-[10px] font-semibold uppercase text-muted block">
                              SHIPPING ({ord.shippingMethod.courierName})
                            </span>
                            <p className="text-charcoal mt-0.5">
                              {ord.shippingAddress.streetAddress},{" "}
                              {ord.shippingAddress.areaName}
                            </p>
                          </div>
                          <div className="md:col-span-4 flex items-center gap-2">
                            <input
                              type="text"
                              value={trackingVal}
                              onChange={(e) =>
                                setTrackingDrafts((prev) => ({
                                  ...prev,
                                  [ord.orderNumber]: e.target.value,
                                }))
                              }
                              placeholder="Input AWB / Resi..."
                              className="flex-1 h-8 px-2.5 border border-border text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderFulfillment(
                                  ord.orderNumber,
                                  ord.fulfillmentStatus,
                                  trackingVal
                                )
                              }
                              className="h-8 px-3 bg-ink text-surface text-[10px] font-semibold uppercase shrink-0"
                            >
                              SAVE RESI
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Xendit Webhook Audit Log */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-status-success" />
                  <span>XENDIT WEBHOOK AUDIT TRAIL (IDEMPOTENT LOG)</span>
                </h3>
                <div className="border border-border bg-surface overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums border-collapse">
                    <thead>
                      <tr className="bg-surface-alt border-b border-border text-[10px] font-semibold uppercase text-muted">
                        <th className="p-3">EVENT ID</th>
                        <th className="p-3">EXTERNAL ORDER ID</th>
                        <th className="p-3">CHANNEL</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3">SIGNATURE</th>
                        <th className="p-3">RECEIVED AT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {webhookLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="p-3 font-mono text-[11px]">
                            {log.eventId}
                          </td>
                          <td className="p-3 font-semibold">{log.externalId}</td>
                          <td className="p-3">{log.channelCode}</td>
                          <td className="p-3 font-semibold">{log.status}</td>
                          <td className="p-3 text-status-success">
                            {log.signatureVerified ? "VERIFIED" : "INVALID"}
                          </td>
                          <td className="p-3 text-muted">
                            {new Date(log.receivedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 6: COMMUNITY LOOKBOOK CRUD & MODERATION
          ================================================================= */}
          {activeSection === "community" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    COMMUNITY LOOKBOOK ARCHIVE MANAGER
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Create, edit, approve, or remove community lookbook photographs
                    and worn garment links.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPost(true);
                    setEditingPost({
                      id: `com-${Date.now()}`,
                      username: "@newpatron.jkt",
                      customerName: "Patron Archive",
                      location: "JAKARTA, ID",
                      imageUrl: "/images/hero-campaign.png",
                      caption: "Wearing size L in South Jakarta.",
                      productSlug:
                        products[0]?.slug ||
                        "silent-riot-heavy-box-hoodie-black",
                      productName:
                        products[0]?.name ||
                        "SILENT RIOT 375GSM BOXY HOODIE — PITCH BLACK",
                      aspectRatio: "4:5",
                      gridSpan: "standard",
                      consentGranted: true,
                      status: "APPROVED",
                      createdAt: new Date().toISOString(),
                    });
                  }}
                  className="h-10 px-5 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD COMMUNITY LOOK</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communityPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-border bg-surface p-4 flex gap-4"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.username}
                      className="w-24 aspect-[4/5] object-cover bg-surface-alt border border-border shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between text-xs min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold uppercase text-ink truncate">
                            {post.username}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold uppercase border shrink-0 ${
                              post.status === "APPROVED"
                                ? "border-status-success text-status-success"
                                : post.status === "PENDING"
                                ? "border-status-warning text-status-warning"
                                : "border-campaign-red text-campaign-red"
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono uppercase text-muted mt-0.5">
                          {post.location || "JAKARTA, ID"}
                        </p>
                        <p className="text-[11px] text-charcoal mt-1 truncate">
                          Worn: {post.productName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingPost(false);
                            setEditingPost(structuredClone(post));
                          }}
                          className="h-8 px-2.5 border border-ink text-ink text-[10px] font-semibold uppercase inline-flex items-center gap-1 hover:bg-ink hover:text-surface"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>EDIT</span>
                        </button>
                        {post.status !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleModerateCommunity(post.id, "APPROVED")
                            }
                            className="h-8 px-2.5 bg-ink text-surface text-[10px] font-semibold uppercase inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>APPROVE</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateCommunity(post.id, undefined, true)
                          }
                          className="h-8 px-2 border border-border text-muted hover:text-campaign-red ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 7: DELIVERY SLA, SHIPPING TARIFFS & XENDIT CHANNELS
          ================================================================= */}
          {activeSection === "settings" && (
            <form
              onSubmit={handleSaveCmsAndShipping}
              className="border border-border bg-surface p-6 sm:p-8 space-y-8"
            >
              <div className="pb-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase text-ink">
                    BRAND IDENTITY, DELIVERY SLA, SHIPPING TARIFFS & XENDIT
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Configure brand identity, PDP shipping rates, return policies,
                    and active Xendit payment methods.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingCms}
                  className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em]"
                >
                  {savingCms ? "SAVING..." : "SAVE ALL SETTINGS"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    BRAND NAME
                  </label>
                  <input
                    type="text"
                    value={cmsDraft.brandName}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, brandName: e.target.value })
                    }
                    className="w-full h-10 px-3 border border-border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    BRAND TAGLINE
                  </label>
                  <input
                    type="text"
                    value={cmsDraft.brandTagline}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, brandTagline: e.target.value })
                    }
                    className="w-full h-10 px-3 border border-border text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    DYNAMIC PDP DISPATCH SLA DESCRIPTION
                  </label>
                  <input
                    type="text"
                    value={cmsDraft.deliveryDefaults.dispatchSlaText}
                    onChange={(e) =>
                      setCmsDraft({
                        ...cmsDraft,
                        deliveryDefaults: {
                          ...cmsDraft.deliveryDefaults,
                          dispatchSlaText: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 px-3 border border-border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    FREE DOMESTIC SHIPPING THRESHOLD (IDR)
                  </label>
                  <input
                    type="number"
                    value={cmsDraft.deliveryDefaults.freeShippingThresholdIdr}
                    onChange={(e) =>
                      setCmsDraft({
                        ...cmsDraft,
                        deliveryDefaults: {
                          ...cmsDraft.deliveryDefaults,
                          freeShippingThresholdIdr: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full h-10 px-3 border border-border text-xs tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    RETURN POLICY SUMMARY
                  </label>
                  <textarea
                    rows={2}
                    value={cmsDraft.deliveryDefaults.returnPolicySummary}
                    onChange={(e) =>
                      setCmsDraft({
                        ...cmsDraft,
                        deliveryDefaults: {
                          ...cmsDraft.deliveryDefaults,
                          returnPolicySummary: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 border border-border text-xs"
                  />
                </div>
              </div>

              {/* Domestic Shipping Area Tariffs */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                  DOMESTIC SHIPPING AREAS & COURIER TARIFFS (IDR / KG)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingAreasDraft.map((area, areaIdx) => (
                    <div
                      key={area.id}
                      className="p-4 border border-border bg-surface-alt space-y-2.5 text-xs"
                    >
                      <div className="font-bold uppercase text-ink">
                        {area.areaName} ({area.province})
                      </div>
                      {area.couriers.map((c, cIdx) => (
                        <div
                          key={c.code}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <span className="col-span-5 text-[11px] font-medium text-charcoal truncate">
                            {c.name}
                          </span>
                          <div className="col-span-4">
                            <input
                              type="number"
                              value={c.ratePerKgIdr}
                              onChange={(e) => {
                                const next = structuredClone(shippingAreasDraft);
                                next[areaIdx].couriers[cIdx].ratePerKgIdr =
                                  Number(e.target.value);
                                setShippingAreasDraft(next);
                              }}
                              className="w-full h-8 px-2 border border-border bg-surface text-xs tabular-nums"
                            />
                          </div>
                          <span className="col-span-3 text-[10px] text-muted">
                            {c.etd}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Enabled Xendit Payment Channels */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                  ENABLED XENDIT MERCHANT PAYMENT CHANNELS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPaymentChannels.map((ch) => {
                    const enabled = cmsDraft.enabledPaymentChannels.includes(
                      ch.code
                    );
                    return (
                      <label
                        key={ch.code}
                        className={`p-3.5 border flex items-center justify-between cursor-pointer ${
                          enabled
                            ? "border-ink bg-surface-alt"
                            : "border-border bg-surface opacity-60"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-ink block">
                            {ch.shortLabel}
                          </span>
                          <span className="text-[11px] text-muted">
                            {ch.name}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleEnabledPaymentChannel(ch.code)}
                          className="w-4 h-4 accent-ink"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: COMPREHENSIVE PRODUCT & SIZE GUIDE EDITOR
      ===================================================================== */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/60"
            onClick={() => setEditingProduct(null)}
          />
          <form
            onSubmit={handleSaveProduct}
            className="relative z-10 w-full max-w-4xl bg-surface border border-ink p-6 sm:p-8 max-h-[92dvh] overflow-y-auto space-y-6"
          >
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted">
                  {isCreatingProduct
                    ? "CREATE NEW ARCHIVAL RELEASE"
                    : "FULL PRODUCT, GALLERY, SKU & SIZE GUIDE EDITOR"}
                </span>
                <h2 className="mt-1 font-display font-bold text-lg uppercase text-ink">
                  {editingProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation Tabs inside Product Editor */}
            <div className="flex flex-wrap border-b border-border gap-1">
              {[
                { id: "general", label: "1. GENERAL & SPECS" },
                {
                  id: "media",
                  label: `2. 5-SHOT GALLERY (${editingProduct.images.length})`,
                },
                {
                  id: "variants",
                  label: `3. COLORS, SIZES & SKUS (${editingProduct.variants.length})`,
                },
                {
                  id: "sizeguide",
                  label: "4. SIZE GUIDE MASTER & MEASUREMENTS",
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setProductModalTab(
                      t.id as "general" | "media" | "variants" | "sizeguide"
                    )
                  }
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] border-b-2 transition-colors ${
                    productModalTab === t.id
                      ? "border-ink text-ink bg-surface-alt"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: GENERAL & SPECS */}
            {productModalTab === "general" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    PRODUCT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    URL SLUG *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.slug}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        slug: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    COLLECTION
                  </label>
                  <select
                    value={editingProduct.collectionSlug}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        collectionSlug: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border bg-surface"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.slug}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full h-10 px-3 border border-border bg-surface"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    PRODUCT TYPE
                  </label>
                  <select
                    value={editingProduct.productType}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        productType: e.target.value as ProductType,
                      })
                    }
                    className="w-full h-10 px-3 border border-border bg-surface"
                  >
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    PRICE (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.priceIdr}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceIdr: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 border border-border tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    COMPARE-AT PRICE (IDR, OPTIONAL)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.compareAtPriceIdr || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPriceIdr: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full h-10 px-3 border border-border tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    PARCEL WEIGHT (GRAMS)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.weightGrams}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        weightGrams: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 border border-border tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    MAX QUANTITY PER ORDER
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.maxPerOrder}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        maxPerOrder: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 border border-border tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    FABRIC & GSM SPECIFICATION
                  </label>
                  <input
                    type="text"
                    value={editingProduct.fabricSpec}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        fabricSpec: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    FIT PROFILE
                  </label>
                  <input
                    type="text"
                    value={editingProduct.fitProfile}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        fitProfile: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    ORIGIN / ATELIER
                  </label>
                  <input
                    type="text"
                    value={editingProduct.madeIn}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        madeIn: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    MODEL SIZING NOTES
                  </label>
                  <input
                    type="text"
                    value={editingProduct.modelNotes || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        modelNotes: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-border"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    SHORT EDITORIAL DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.shortDescription}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        shortDescription: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-border"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    CONSTRUCTION DETAILS (1 BULLET PER LINE)
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.descriptionSpecs.join("\n")}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        descriptionSpecs: e.target.value
                          .split("\n")
                          .filter((line) => line.trim().length > 0),
                      })
                    }
                    className="w-full p-3 border border-border"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase mb-1">
                    CARE INSTRUCTIONS (1 BULLET PER LINE)
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.careInstructions.join("\n")}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        careInstructions: e.target.value
                          .split("\n")
                          .filter((line) => line.trim().length > 0),
                      })
                    }
                    className="w-full p-3 border border-border"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: 5-SHOT GALLERY IMAGES */}
            {productModalTab === "media" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-muted">
                    Shot #1 (`front`) and Shot #2 (`back`) power the catalog card
                    front-to-back hover reveal.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        images: [
                          ...editingProduct.images,
                          {
                            id: `img-${Date.now()}`,
                            url: "/images/prod-hoodie-front.png",
                            alt: `${editingProduct.name} Detail`,
                            role: "detail",
                          },
                        ],
                      })
                    }
                    className="h-8 px-3 bg-ink text-surface text-[10px] font-semibold uppercase inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>ADD IMAGE SHOT</span>
                  </button>
                </div>

                <div className="border border-border divide-y divide-border">
                  {editingProduct.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-1 flex items-center gap-2">
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="w-10 aspect-[4/5] object-cover border border-border bg-surface-alt"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-semibold uppercase text-muted block">
                          IMAGE URL (SHOT 0{idx + 1})
                        </label>
                        <input
                          type="text"
                          value={img.url}
                          onChange={(e) => {
                            const next = [...editingProduct.images];
                            next[idx] = { ...img, url: e.target.value };
                            setEditingProduct({
                              ...editingProduct,
                              images: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-semibold uppercase text-muted block">
                          ALT CAPTION
                        </label>
                        <input
                          type="text"
                          value={img.alt}
                          onChange={(e) => {
                            const next = [...editingProduct.images];
                            next[idx] = { ...img, alt: e.target.value };
                            setEditingProduct({
                              ...editingProduct,
                              images: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold uppercase text-muted block">
                          ROLE
                        </label>
                        <select
                          value={img.role}
                          onChange={(e) => {
                            const next = [...editingProduct.images];
                            next[idx] = {
                              ...img,
                              role: e.target.value as
                                | "front"
                                | "back"
                                | "angle"
                                | "detail"
                                | "lifestyle",
                            };
                            setEditingProduct({
                              ...editingProduct,
                              images: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border bg-surface text-xs"
                        >
                          <option value="front">front</option>
                          <option value="back">back</option>
                          <option value="angle">angle</option>
                          <option value="detail">detail</option>
                          <option value="lifestyle">lifestyle</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        {editingProduct.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingProduct.images.filter(
                                (_, i) => i !== idx
                              );
                              setEditingProduct({
                                ...editingProduct,
                                images: next,
                              });
                            }}
                            className="p-1.5 text-muted hover:text-campaign-red"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: COLORS, SIZES & SKU VARIANTS */}
            {productModalTab === "variants" && (
              <div className="space-y-6 text-xs">
                {/* Sizes Toggles */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink block mb-2">
                    ACTIVE SIZES FOR THIS PRODUCT
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map((sz) => {
                      const active = editingProduct.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            const nextSizes = active
                              ? editingProduct.sizes.filter((s) => s !== sz)
                              : [...editingProduct.sizes, sz];
                            if (nextSizes.length === 0) return;

                            // Ensure every color × size combination has a variant
                            const nextVariants = [...editingProduct.variants];
                            editingProduct.colors.forEach((clr) => {
                              nextSizes.forEach((sizeCode) => {
                                const exists = nextVariants.some(
                                  (v) =>
                                    v.colorId === clr.id && v.size === sizeCode
                                );
                                if (!exists) {
                                  nextVariants.push({
                                    id: `var-${Date.now()}-${clr.id}-${sizeCode}`,
                                    sku: `SKU-${sizeCode}`,
                                    colorId: clr.id,
                                    colorName: clr.name,
                                    colorHex: clr.hex,
                                    size: sizeCode,
                                    stock: 5,
                                  });
                                }
                              });
                            });

                            setEditingProduct({
                              ...editingProduct,
                              sizes: nextSizes,
                              variants: nextVariants.filter((v) =>
                                nextSizes.includes(v.size)
                              ),
                            });
                          }}
                          className={`h-9 px-3.5 border text-xs font-semibold uppercase ${
                            active
                              ? "bg-ink text-surface border-ink"
                              : "bg-surface text-muted border-border"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SKU Variant Inventory Table */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
                    VARIANT INVENTORY MATRIX (SKU, COLOR, SIZE & LIVE STOCK)
                  </p>
                  <div className="border border-border divide-y divide-border">
                    {editingProduct.variants.map((v, idx) => (
                      <div
                        key={v.id}
                        className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        <div className="sm:col-span-4">
                          <span className="font-semibold uppercase text-ink">
                            {v.colorName} — SIZE {v.size}
                          </span>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] uppercase text-muted block">
                            SKU CODE
                          </label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => {
                              const nextVars = [...editingProduct.variants];
                              nextVars[idx] = { ...v, sku: e.target.value };
                              setEditingProduct({
                                ...editingProduct,
                                variants: nextVars,
                              });
                            }}
                            className="w-full h-8 px-2 border border-border font-mono text-xs"
                          />
                        </div>
                        <div className="sm:col-span-4 flex items-center justify-end gap-2">
                          <label className="text-[10px] uppercase text-muted">
                            STOCK:
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => {
                              const nextVars = [...editingProduct.variants];
                              nextVars[idx] = {
                                ...v,
                                stock: Math.max(0, Number(e.target.value)),
                              };
                              setEditingProduct({
                                ...editingProduct,
                                variants: nextVars,
                              });
                            }}
                            className="w-24 h-8 px-2 border border-border text-center font-semibold tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SIZE GUIDE MASTER & PRODUCT-SPECIFIC MEASUREMENTS */}
            {productModalTab === "sizeguide" && (
              <div className="space-y-6 text-xs">
                <div className="p-4 bg-surface-alt border border-border space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-campaign-red block">
                        SIZE GUIDE MASTER INHERITANCE
                      </span>
                      <h3 className="font-display font-bold text-sm uppercase text-ink">
                        ASSIGNED SIZE GUIDE TEMPLATE
                      </h3>
                      <p className="text-[11px] text-muted mt-0.5">
                        Select which Master Template controls the column headers and
                        default measurements for this product. The default is{" "}
                        <strong className="text-ink">
                          Default Garment Master (Tops / Outerwear)
                        </strong>
                        .
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!editingProductMaster) return;
                        setEditingProduct({
                          ...editingProduct,
                          customSizeGuideColumns: undefined,
                          customHowToMeasureText: undefined,
                          sizeChart: structuredClone(
                            editingProductMaster.defaultRows
                          ),
                        });
                        notify(
                          "SIZE CHART SYNCED FROM MASTER",
                          `LOADED DEFAULT ROWS FROM ${editingProductMaster.name}`
                        );
                      }}
                      className="h-9 px-3.5 border border-ink bg-surface text-ink text-[10px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 hover:bg-ink hover:text-surface shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>RESET ROWS FROM MASTER</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        SIZE GUIDE MASTER TEMPLATE
                      </label>
                      <select
                        value={
                          editingProduct.sizeGuideMasterId ||
                          defaultGarmentMaster?.id ||
                          "sg-default-garment"
                        }
                        onChange={(e) => {
                          const newMasterId = e.target.value;
                          const targetMaster = sizeGuideMasters.find(
                            (m) => m.id === newMasterId
                          );
                          setEditingProduct({
                            ...editingProduct,
                            sizeGuideMasterId: newMasterId,
                            sizeChart: targetMaster
                              ? structuredClone(targetMaster.defaultRows)
                              : editingProduct.sizeChart,
                          });
                        }}
                        className="w-full h-10 px-3 border border-ink bg-surface text-xs font-semibold"
                      >
                        {sizeGuideMasters.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.isDefault ? "(DEFAULT GARMENT)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1">
                        CUSTOM MEASUREMENT NOTE OVERRIDE (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={editingProduct.customHowToMeasureText || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            customHowToMeasureText: e.target.value || undefined,
                          })
                        }
                        placeholder={
                          editingProductMaster?.howToMeasureText ||
                          "Inherits Master measurement instructions..."
                        }
                        className="w-full h-10 px-3 border border-border bg-surface text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Product-Specific Size Chart Rows Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
                        PRODUCT-SPECIFIC MEASUREMENT ROWS (CM — AUTO-CONVERTS TO
                        INCHES ON PDP)
                      </h4>
                      <p className="text-[11px] text-muted">
                        Customize exact measurements for{" "}
                        <strong>{editingProduct.name}</strong> while using the{" "}
                        <strong>{editingProductMaster?.name}</strong> columns.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          sizeChart: [
                            ...editingProduct.sizeChart,
                            {
                              size: "XXL",
                              chestCm: 68,
                              lengthCm: 79,
                              shoulderCm: 61,
                              sleeveCm: 26,
                            },
                          ],
                        })
                      }
                      className="h-8 px-3 bg-ink text-surface text-[10px] font-semibold uppercase inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ADD SIZE ROW</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-border">
                    <table className="w-full border-collapse text-xs tabular-nums">
                      <thead>
                        <tr className="bg-surface-alt border-b border-border text-left text-[10px] font-semibold uppercase text-ink">
                          <th className="p-2.5 border-r border-border">SIZE</th>
                          <th className="p-2.5 border-r border-border">
                            {editingProductActiveColumns[0]} (CM)
                          </th>
                          <th className="p-2.5 border-r border-border">
                            {editingProductActiveColumns[1]} (CM)
                          </th>
                          <th className="p-2.5 border-r border-border">
                            {editingProductActiveColumns[2]} (CM)
                          </th>
                          <th className="p-2.5 border-r border-border">
                            {editingProductActiveColumns[3]} (CM)
                          </th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {editingProduct.sizeChart.map((row, rIdx) => (
                          <tr key={`${row.size}-${rIdx}`}>
                            <td className="p-2 border-r border-border">
                              <select
                                value={row.size}
                                onChange={(e) => {
                                  const next = [...editingProduct.sizeChart];
                                  next[rIdx] = {
                                    ...row,
                                    size: e.target.value as SizeCode,
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeChart: next,
                                  });
                                }}
                                className="h-8 px-2 border border-border bg-surface font-bold"
                              >
                                {ALL_SIZES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 border-r border-border">
                              <input
                                type="number"
                                step="0.5"
                                value={row.chestCm}
                                onChange={(e) => {
                                  const next = [...editingProduct.sizeChart];
                                  next[rIdx] = {
                                    ...row,
                                    chestCm: Number(e.target.value),
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeChart: next,
                                  });
                                }}
                                className="w-full h-8 px-2 border border-border"
                              />
                            </td>
                            <td className="p-2 border-r border-border">
                              <input
                                type="number"
                                step="0.5"
                                value={row.lengthCm}
                                onChange={(e) => {
                                  const next = [...editingProduct.sizeChart];
                                  next[rIdx] = {
                                    ...row,
                                    lengthCm: Number(e.target.value),
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeChart: next,
                                  });
                                }}
                                className="w-full h-8 px-2 border border-border"
                              />
                            </td>
                            <td className="p-2 border-r border-border">
                              <input
                                type="number"
                                step="0.5"
                                value={row.shoulderCm}
                                onChange={(e) => {
                                  const next = [...editingProduct.sizeChart];
                                  next[rIdx] = {
                                    ...row,
                                    shoulderCm: Number(e.target.value),
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeChart: next,
                                  });
                                }}
                                className="w-full h-8 px-2 border border-border"
                              />
                            </td>
                            <td className="p-2 border-r border-border">
                              <input
                                type="number"
                                step="0.5"
                                value={row.sleeveCm}
                                onChange={(e) => {
                                  const next = [...editingProduct.sizeChart];
                                  next[rIdx] = {
                                    ...row,
                                    sleeveCm: Number(e.target.value),
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeChart: next,
                                  });
                                }}
                                className="w-full h-8 px-2 border border-border"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {editingProduct.sizeChart.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next =
                                      editingProduct.sizeChart.filter(
                                        (_, i) => i !== rIdx
                                      );
                                    setEditingProduct({
                                      ...editingProduct,
                                      sizeChart: next,
                                    });
                                  }}
                                  className="text-muted hover:text-campaign-red"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.featured}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      featured: e.target.checked,
                    })
                  }
                />
                <span>FEATURE ON HOMEPAGE</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="h-10 px-5 border border-border text-xs font-semibold uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em]"
                >
                  SAVE PRODUCT & SIZE GUIDE
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SIZE GUIDE MASTER EDITOR
      ===================================================================== */}
      {editingMaster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/60"
            onClick={() => setEditingMaster(null)}
          />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const exists = mastersDraft.some(
                (m) => m.id === editingMaster.id
              );
              const next = exists
                ? mastersDraft.map((m) =>
                    m.id === editingMaster.id ? editingMaster : m
                  )
                : [...mastersDraft, editingMaster];
              setMastersDraft(next);
              await persistSizeGuideMasters(next);
            }}
            className="relative z-10 w-full max-w-3xl bg-surface border border-ink p-6 sm:p-8 max-h-[90dvh] overflow-y-auto space-y-5 text-xs"
          >
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted">
                  MASTER SIZE GUIDE TEMPLATE CONFIGURATION
                </span>
                <h2 className="mt-1 font-display font-bold text-lg uppercase text-ink">
                  {editingMaster.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingMaster(null)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  MASTER TEMPLATE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={editingMaster.name}
                  onChange={(e) =>
                    setEditingMaster({ ...editingMaster, name: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-border font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  CATEGORY GROUP LABEL *
                </label>
                <input
                  type="text"
                  required
                  value={editingMaster.categoryHint}
                  onChange={(e) =>
                    setEditingMaster({
                      ...editingMaster,
                      categoryHint: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase mb-2">
                4 MEASUREMENT COLUMN HEADERS
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((colIdx) => (
                  <input
                    key={colIdx}
                    type="text"
                    required
                    value={editingMaster.columns[colIdx]}
                    onChange={(e) => {
                      const nextCols: [string, string, string, string] = [
                        ...editingMaster.columns,
                      ] as [string, string, string, string];
                      nextCols[colIdx] = e.target.value;
                      setEditingMaster({
                        ...editingMaster,
                        columns: nextCols,
                      });
                    }}
                    className="w-full h-9 px-2.5 border border-border font-mono text-[11px]"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase mb-1">
                HOW WE MEASURE INSTRUCTIONS
              </label>
              <textarea
                rows={2}
                value={editingMaster.howToMeasureText}
                onChange={(e) =>
                  setEditingMaster({
                    ...editingMaster,
                    howToMeasureText: e.target.value,
                  })
                }
                className="w-full p-3 border border-border"
              />
            </div>

            {/* Default Rows Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-ink">
                  DEFAULT MASTER MEASUREMENT ROWS (CM)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingMaster({
                      ...editingMaster,
                      defaultRows: [
                        ...editingMaster.defaultRows,
                        {
                          size: "XXL",
                          chestCm: 68,
                          lengthCm: 79,
                          shoulderCm: 61,
                          sleeveCm: 26,
                        },
                      ],
                    })
                  }
                  className="h-7 px-2.5 bg-ink text-surface text-[10px] font-semibold uppercase"
                >
                  + ADD ROW
                </button>
              </div>

              <table className="w-full border-collapse border border-border text-xs tabular-nums">
                <thead>
                  <tr className="bg-surface-alt border-b border-border text-left text-[10px] font-semibold uppercase">
                    <th className="p-2 border-r border-border">SIZE</th>
                    <th className="p-2 border-r border-border">
                      {editingMaster.columns[0]}
                    </th>
                    <th className="p-2 border-r border-border">
                      {editingMaster.columns[1]}
                    </th>
                    <th className="p-2 border-r border-border">
                      {editingMaster.columns[2]}
                    </th>
                    <th className="p-2 border-r border-border">
                      {editingMaster.columns[3]}
                    </th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {editingMaster.defaultRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-border">
                        <select
                          value={row.size}
                          onChange={(e) => {
                            const next = [...editingMaster.defaultRows];
                            next[idx] = {
                              ...row,
                              size: e.target.value as SizeCode,
                            };
                            setEditingMaster({
                              ...editingMaster,
                              defaultRows: next,
                            });
                          }}
                          className="h-8 px-2 border border-border bg-surface font-bold"
                        >
                          {ALL_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-r border-border">
                        <input
                          type="number"
                          step="0.5"
                          value={row.chestCm}
                          onChange={(e) => {
                            const next = [...editingMaster.defaultRows];
                            next[idx] = {
                              ...row,
                              chestCm: Number(e.target.value),
                            };
                            setEditingMaster({
                              ...editingMaster,
                              defaultRows: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border"
                        />
                      </td>
                      <td className="p-2 border-r border-border">
                        <input
                          type="number"
                          step="0.5"
                          value={row.lengthCm}
                          onChange={(e) => {
                            const next = [...editingMaster.defaultRows];
                            next[idx] = {
                              ...row,
                              lengthCm: Number(e.target.value),
                            };
                            setEditingMaster({
                              ...editingMaster,
                              defaultRows: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border"
                        />
                      </td>
                      <td className="p-2 border-r border-border">
                        <input
                          type="number"
                          step="0.5"
                          value={row.shoulderCm}
                          onChange={(e) => {
                            const next = [...editingMaster.defaultRows];
                            next[idx] = {
                              ...row,
                              shoulderCm: Number(e.target.value),
                            };
                            setEditingMaster({
                              ...editingMaster,
                              defaultRows: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border"
                        />
                      </td>
                      <td className="p-2 border-r border-border">
                        <input
                          type="number"
                          step="0.5"
                          value={row.sleeveCm}
                          onChange={(e) => {
                            const next = [...editingMaster.defaultRows];
                            next[idx] = {
                              ...row,
                              sleeveCm: Number(e.target.value),
                            };
                            setEditingMaster({
                              ...editingMaster,
                              defaultRows: next,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {editingMaster.defaultRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingMaster.defaultRows.filter(
                                (_, i) => i !== idx
                              );
                              setEditingMaster({
                                ...editingMaster,
                                defaultRows: next,
                              });
                            }}
                            className="text-muted hover:text-campaign-red"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingMaster(null)}
                className="h-10 px-5 border border-border text-xs font-semibold uppercase"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={savingMasters}
                className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase tracking-[0.08em]"
              >
                {savingMasters ? "SAVING..." : "SAVE MASTER TEMPLATE"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: COLLECTION EDITOR
      ===================================================================== */}
      {editingCollection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/60"
            onClick={() => setEditingCollection(null)}
          />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const exists = collectionsDraft.some(
                (c) => c.id === editingCollection.id
              );
              const next = exists
                ? collectionsDraft.map((c) =>
                    c.id === editingCollection.id ? editingCollection : c
                  )
                : [...collectionsDraft, editingCollection];
              setCollectionsDraft(next);
              await persistCollections(next);
            }}
            className="relative z-10 w-full max-w-xl bg-surface border border-ink p-6 sm:p-8 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <h2 className="font-display font-bold text-lg uppercase text-ink">
                EDIT COLLECTION: {editingCollection.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  INDEX CODE
                </label>
                <input
                  type="text"
                  value={editingCollection.indexCode}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      indexCode: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  SEASON TAG
                </label>
                <input
                  type="text"
                  value={editingCollection.seasonTag}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      seasonTag: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  COLLECTION NAME
                </label>
                <input
                  type="text"
                  value={editingCollection.name}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      name: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  HERO IMAGE URL
                </label>
                <input
                  type="text"
                  value={editingCollection.heroImage}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      heroImage: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  SHORT DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={editingCollection.shortDescription}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      shortDescription: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-border"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <label className="inline-flex items-center gap-2 font-semibold uppercase">
                <input
                  type="checkbox"
                  checked={editingCollection.featured}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      featured: e.target.checked,
                    })
                  }
                />
                <span>FEATURE ON HOMEPAGE</span>
              </label>
              <button
                type="submit"
                disabled={savingCollections}
                className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase"
              >
                SAVE COLLECTION
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: COMMUNITY LOOKBOOK POST EDITOR
      ===================================================================== */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/60"
            onClick={() => setEditingPost(null)}
          />
          <form
            onSubmit={handleSaveCommunityPost}
            className="relative z-10 w-full max-w-lg bg-surface border border-ink p-6 sm:p-8 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <h2 className="font-display font-bold text-lg uppercase text-ink">
                {isCreatingPost
                  ? "ADD COMMUNITY LOOKBOOK FIT"
                  : `EDIT LOOK: ${editingPost.username}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  HANDLE / USERNAME
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.username}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, username: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-border font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  CITY / LOCATION
                </label>
                <input
                  type="text"
                  value={editingPost.location || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, location: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  LINKED GARMENT WORN
                </label>
                <select
                  value={editingPost.productSlug}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      productSlug: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 border border-border bg-surface"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  IMAGE URL
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.imageUrl}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, imageUrl: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase mb-1">
                  CAPTION / STYLING NOTE
                </label>
                <textarea
                  rows={2}
                  value={editingPost.caption || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, caption: e.target.value })
                  }
                  className="w-full p-3 border border-border"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="h-10 px-5 border border-border text-xs font-semibold uppercase"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="h-10 px-6 bg-ink text-surface text-xs font-semibold uppercase"
              >
                SAVE COMMUNITY LOOK
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
