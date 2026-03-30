export type AdminSection =
  | "login"
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "home"
  | "home-content"
  | "promotions"
  | "navigation"
  | "reviews"
  | "settings"
  | "analytics"
  | "upload-csv";

export type ProductCategory =
  | "garage"
  | "car"
  | "garage remote"
  | "garage and gate"
  | "automotive"
  | "other";

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  image: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  sku?: string;
  condition?: string;
  imageIndex?: number;
  returns?: string;
  seller?: string;
  skuKey?: string | null;
}

export interface OrderCustomer {
  fullName?: string;
  email?: string;
}

export interface OrderShipping {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface OrderPricing {
  currency?: string;
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  hasMemberDiscount?: boolean;
  memberDiscountRate?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  status?: "processing" | "shipped" | "delivered" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
  customer?: OrderCustomer;
  shipping?: OrderShipping;
  pricing?: OrderPricing;
  items?: OrderItem[];
}

export interface HomeHero {
  title: string;
  subtitle: string;
  description: string;
  primaryCta: string;
  primaryCtaPath: string;
  secondaryCta: string;
  secondaryCtaPath: string;
  backgroundColors: string[];
}

export interface HomeFeature {
  icon: string;
  title: string;
  description: string;
  path: string;
  linkText: string;
}

export interface HomeWhyBuyItem {
  icon: string;
  title: string;
  description: string;
}

export interface HomeCtaSection {
  title: string;
  description: string;
  buttonText: string;
  buttonPath: string;
}

export interface HomeFooterContent {
  companyName: string;
  tagline: string;
  email: string;
}

export interface HomeContent {
  heroImages: string[];
  hero: HomeHero;
  featuresTitle: string;
  features: HomeFeature[];
  whyBuy: HomeWhyBuyItem[];
  ctaSection: HomeCtaSection;
  footer: HomeFooterContent;
}

export interface NavigationItem {
  name: string;
  path: string;
  iconIndex?: number;
  isShopAll?: boolean;
  hidden?: boolean;
}

export interface NavigationColumn {
  title: string;
  items: NavigationItem[];
}

export interface NavigationSectionEntry {
  title: string;
  path: string;
  columns?: NavigationColumn[];
  hasDropdown?: boolean;
  hidden?: boolean;
}

export type NavigationTree = Record<string, NavigationSectionEntry>;

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  verified: boolean;
  date: string;
}

export interface PromotionCategory {
  id: string;
  name: string;
}

export interface PromotionOffer {
  id: string;
  categoryId: string;
  name: string;
  enabled: boolean;
  appliesTo: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

export interface PromotionsData {
  topInfoBar: {
    enabled: boolean;
    items: string[];
  };
  offers: {
    categories: PromotionCategory[];
    offers: PromotionOffer[];
    stackWithMemberDiscount: boolean;
  };
}

export interface SiteSettings {
  siteName: string;
  siteEmail: string;
  maintenanceMode: boolean;
  enableRegistration: boolean;
  enableReviews: boolean;
  itemsPerPage: number;
  currency: string;
  timezone: string;
  contactEmail?: string;
  showOutOfStock?: boolean;
  footerBrandTitle?: string;
  footerBrandSubtitle?: string;
  footerTagline?: string;
  footerCategoriesTitle?: string;
  footerPrivacyTitle?: string;
  footerPrivacyLabel?: string;
  footerPrivacyPath?: string;
  footerSupportTitle?: string;
  footerSupportLinkLabel?: string;
  footerSupportLinkPath?: string;
  footerContactLinkLabel?: string;
  footerContactLinkPath?: string;
  supportPhone?: string;
  supportHoursWeekdays?: string;
  supportHoursSaturday?: string;
  footerCopyright?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "customer";
  status: "active" | "inactive";
  createdAt?: string;
  joined?: string;
}

export interface UserApiRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  status: "active" | "inactive";
  createdAt?: string;
  password?: string;
}

export interface UploadCsvRowResult {
  row: number;
  status: "created" | "updated" | "failed";
  sku?: string;
  name?: string;
  error?: string;
}

export interface UploadCsvResult {
  rowsProcessed: number;
  created: number;
  updated: number;
  failed: number;
  details: UploadCsvRowResult[];
}

export interface ApiEnvelope<T> {
  key?: string;
  data?: T;
  updatedAt?: string;
  error?: string;
}

export interface ApiErrorShape {
  error?: string;
  message?: string;
}

export const ADMIN_EMAIL = "admin@allremotes.com";
export const ADMIN_PASSWORD = "Admin123!";

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroImages: ["/images/hero.jpg"],
  hero: {
    title: "Garage Door & Gate Remotes",
    subtitle: "Quality is Guaranteed",
    description:
      "Your trusted source for premium car and garage remotes. Browse our extensive collection of high-quality remote controls designed to meet all your automation needs.",
    primaryCta: "Shop Car Remotes",
    primaryCtaPath: "/products/car",
    secondaryCta: "Shop Garage Remotes",
    secondaryCtaPath: "/products/garage",
    backgroundColors: ["#2e6b6f", "#2e6b6f", "#a0312d"],
  },
  featuresTitle: "Our Product Categories",
  features: [
    {
      icon: "🚗",
      title: "Car Remotes",
      description:
        "Universal and brand-specific car remotes with advanced security features",
      path: "/products/car",
      linkText: "Explore →",
    },
    {
      icon: "🚪",
      title: "Garage Remotes",
      description:
        "Reliable garage door and gate remotes for all your home automation needs",
      path: "/products/garage",
      linkText: "Explore →",
    },
  ],
  whyBuy: [
    {
      icon: "✓",
      title: "Quality Guaranteed",
      description:
        "All our products are genuine and come with quality assurance. We stand behind every product we sell.",
    },
    {
      icon: "🚚",
      title: "Free Shipping Australia Wide",
      description:
        "We offer free shipping on all non-bulky items across Australia. Fast and reliable delivery.",
    },
  ],
  ctaSection: {
    title: "Ready to Find Your Perfect Remote?",
    description:
      "Browse our collection and find the perfect remote for your needs",
    buttonText: "View All Products",
    buttonPath: "/products/all",
  },
  footer: {
    companyName: "ALLREMOTES",
    tagline: "Your trusted source for car and garage remotes",
    email: "contact@allremotes.com",
  },
};

export const DEFAULT_PROMOTIONS: PromotionsData = {
  topInfoBar: {
    enabled: true,
    items: ["12 MONTH WARRANTY", "30 DAY RETURNS", "SAFE & SECURE", "TRADE PRICING"],
  },
  offers: {
    categories: [
      { id: "black-friday", name: "Black Friday" },
      { id: "boxing-day", name: "Boxing Day" },
    ],
    offers: [],
    stackWithMemberDiscount: false,
  },
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "AllRemotes",
  siteEmail: "contact@allremotes.com",
  maintenanceMode: false,
  enableRegistration: true,
  enableReviews: true,
  itemsPerPage: 12,
  currency: "AUD",
  timezone: "Australia/Melbourne",
  footerBrandTitle: "ALLREMOTES",
  footerBrandSubtitle: "Quality is Guaranteed",
  footerTagline: "Your trusted source for car and garage remotes",
  footerCategoriesTitle: "Categories",
  footerPrivacyTitle: "Privacy Policy",
  footerPrivacyLabel: "Our policy",
  footerPrivacyPath: "/privacy",
  footerSupportTitle: "Support",
  footerSupportLinkLabel: "Support Center",
  footerSupportLinkPath: "/support",
  footerContactLinkLabel: "Contact Us",
  footerContactLinkPath: "/contact",
  supportPhone: "1-800-REMOTES",
  supportHoursWeekdays: "Monday - Friday: 9:00 AM - 5:00 PM",
  supportHoursSaturday: "Saturday: 10:00 AM - 2:00 PM",
  footerCopyright: "© 2026 ALLREMOTES. All rights reserved.",
};
