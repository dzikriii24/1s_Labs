export type ProductCategory =
  | "Tees"
  | "Tops & Shirts"
  | "Outerwear"
  | "Hoodies & Knits"
  | "Bottoms"
  | "Headwear"
  | "Accessories";

export type ProductType =
  | "Featured Release"
  | "Core Collection"
  | "Collaboration"
  | "Archive";

export type SizeCode = "S" | "M" | "L" | "XL" | "XXL" | "OS" | "30" | "32" | "34";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  role: "front" | "back" | "angle" | "detail" | "lifestyle";
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  size: SizeCode;
  stock: number;
  priceOverride?: number;
}

export interface SizeMeasurement {
  size: SizeCode;
  chestCm: number; // Column 1 value (e.g. Chest / Waist / Crown)
  lengthCm: number; // Column 2 value (e.g. Body Length / Outseam / Depth)
  shoulderCm: number; // Column 3 value (e.g. Shoulder / Thigh / Brim)
  sleeveCm: number; // Column 4 value (e.g. Sleeve / Leg Opening)
}

export interface SizeGuideMaster {
  id: string;
  name: string;
  categoryHint: string;
  isDefault: boolean;
  columns: [string, string, string, string];
  howToMeasureTitle: string;
  howToMeasureText: string;
  defaultRows: SizeMeasurement[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  collectionSlug: string;
  collectionName: string;
  category: ProductCategory;
  productType: ProductType;
  priceIdr: number;
  compareAtPriceIdr?: number;
  shortDescription: string;
  descriptionSpecs: string[];
  fabricSpec: string;
  fitProfile: string;
  careInstructions: string[];
  madeIn: string;
  weightGrams: number;
  maxPerOrder: number;
  featured: boolean;
  bestSellingRank: number;
  createdAt: string;
  releaseAt?: string;
  images: ProductImage[];
  colors: ProductColor[];
  sizes: SizeCode[];
  variants: ProductVariant[];
  sizeGuideMasterId?: string; // References a SizeGuideMaster.id, or "custom"
  customSizeGuideColumns?: [string, string, string, string];
  customHowToMeasureText?: string;
  sizeChart: SizeMeasurement[];
  modelNotes: string;
}

export interface Collection {
  id: string;
  slug: string;
  indexCode: string;
  name: string;
  seasonTag: string;
  shortDescription: string;
  editorialCopy: string;
  heroImage: string;
  secondaryImage: string;
  featured: boolean;
}

export interface HeroCampaignConfig {
  mode: "A";
  seasonCode: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  primaryImage: string;
  secondaryImage: string;
  redAccentStamp: string;
}

export interface BrandStoryCMSConfig {
  tag: string;
  headline: string;
  bodyCopy: string;
  imagePrimary: string;
  imageSecondary: string;
  stats: {
    value: string;
    label: string;
  }[];
  ctaText: string;
  ctaHref: string;
}

export interface AboutPageCMSConfig {
  coverTag: string;
  coverHeadline: string;
  coverImage: string;
  coverCaption: string;
  coverIntro: string;
  philosophyTag: string;
  philosophyTitle: string;
  philosophyParagraph1: string;
  philosophyParagraph2: string;
  specs: {
    code: string;
    title: string;
    description: string;
    image: string;
  }[];
  timeline: {
    year: string;
    collection: string;
    concept: string;
  }[];
}

export interface DropSpotlightConfig {
  active: boolean;
  code: string;
  title: string;
  description: string;
  releaseDateIso: string;
  ctaText: string;
  ctaHref: string;
  bannerImage: string;
  featuredLabel?: string;
}

export interface ShippingAreaRate {
  id: string;
  areaName: string;
  province: string;
  couriers: {
    code: string;
    name: string;
    service: string;
    etd: string;
    ratePerKgIdr: number;
  }[];
}

export interface StoreCMSConfig {
  brandName: string;
  brandTagline: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkHref?: string;
  };
  hero: HeroCampaignConfig;
  brandStory: BrandStoryCMSConfig;
  dropSpotlight: DropSpotlightConfig;
  aboutPage: AboutPageCMSConfig;
  deliveryDefaults: {
    dispatchSlaText: string;
    freeShippingThresholdIdr: number;
    returnPolicySummary: string;
    termsConditionsBullets: string[];
  };
  enabledPaymentChannels: string[];
}

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  image: string;
  colorName: string;
  colorHex: string;
  size: SizeCode;
  unitPriceIdr: number;
  weightGrams: number;
  quantity: number;
  maxAllowed: number;
}

export type XenditChannelCategory =
  | "QRIS"
  | "VIRTUAL_ACCOUNT"
  | "EWALLET"
  | "RETAIL_OUTLET";

export interface XenditPaymentChannel {
  code: string;
  name: string;
  category: XenditChannelCategory;
  shortLabel: string;
  instructions: string[];
  expirationMinutes: number;
  enabled: boolean;
}

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";
export type OrderFulfillmentStatus =
  | "UNPAID"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  image: string;
  colorName: string;
  size: SizeCode;
  unitPriceIdr: number;
  quantity: number;
  weightGrams: number;
  subtotalIdr: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  idempotencyKey: string;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  customer: {
    userId?: string;
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    areaId: string;
    areaName: string;
    province: string;
    postalCode: string;
    streetAddress: string;
    notes?: string;
  };
  shippingMethod: {
    courierCode: string;
    courierName: string;
    service: string;
    etd: string;
    totalWeightGrams: number;
    costIdr: number;
  };
  items: OrderItem[];
  subtotalIdr: number;
  discountCode?: string;
  discountAmountIdr: number;
  totalPaymentIdr: number;
  payment: {
    provider: "XENDIT";
    xenditInvoiceId: string;
    xenditExternalId: string;
    channelCode: string;
    channelName: string;
    channelCategory: XenditChannelCategory;
    virtualAccountNumber?: string;
    qrisPayload?: string;
    paymentUrl?: string;
    status: PaymentStatus;
  };
  fulfillmentStatus: OrderFulfillmentStatus;
  trackingNumber?: string;
}

export interface XenditWebhookLog {
  id: string;
  eventId: string;
  xenditInvoiceId: string;
  externalId: string;
  status: PaymentStatus;
  channelCode: string;
  amount: number;
  receivedAt: string;
  signatureVerified: boolean;
}

export interface CommunityPost {
  id: string;
  username: string;
  customerName: string;
  location?: string;
  imageUrl: string;
  caption: string;
  productSlug: string;
  productName: string;
  aspectRatio: "4:5" | "16:10" | "16:9" | "3:4";
  gridSpan: "feature" | "standard" | "wide" | "tall";
  consentGranted: boolean;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  areaId: string;
  areaName: string;
  province: string;
  postalCode: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface CustomerAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  wishlistProductIds: string[];
  addresses: SavedAddress[];
}

export interface DatabaseSchema {
  cms: StoreCMSConfig;
  sizeGuideMasters: SizeGuideMaster[];
  collections: Collection[];
  products: Product[];
  shippingAreas: ShippingAreaRate[];
  paymentChannels: XenditPaymentChannel[];
  orders: Order[];
  webhookLogs: XenditWebhookLog[];
  communityPosts: CommunityPost[];
  customers: CustomerAccount[];
  newsletterSubscribers: { email: string; subscribedAt: string }[];
}
