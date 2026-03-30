/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Headset,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tags,
  Truck,
  User,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  deleteReview,
  getHomeContent,
  getNavigation,
  getProducts,
  getPromotions,
  getReviews,
  getSettings,
  saveHomeContent,
  saveNavigation,
  saveProducts,
  savePromotions,
  saveReviews,
} from "@/lib/admin/api";
import {
  DEFAULT_SETTINGS,
  type HomeContent,
  type NavigationColumn,
  type NavigationItem,
  type NavigationSectionEntry,
  type NavigationTree,
  type Product,
  type PromotionsData,
  type Review,
  type SiteSettings,
} from "@/lib/admin/types";
import {
  clearAdminSession,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";

const LIVE_SITE_ORIGIN = "https://allremotes.vercel.app";
const DEFAULT_TRUST_ITEMS = [
  { icon: "🛡️", label: "12 Month Warranty" },
  { icon: "🔄", label: "30 Day Returns" },
  { icon: "🚚", label: "Free Shipping AU" },
  { icon: "🔒", label: "Secure Payments" },
  { icon: "⭐", label: "1,500+ Reviews" },
  { icon: "✓", label: "Australian Owned" },
  { icon: "💯", label: "100% Genuine" },
  { icon: "📦", label: "Fast Dispatch" },
  { icon: "🛒", label: "No Minimum Order" },
];
const FEATURE_ICON_FALLBACKS = [
  "/remotes/010_s-l500.webp",
  "/remotes/002_s-l500.webp",
];
const PUBLIC_REVIEW_FALLBACKS: Review[] = [
  {
    id: "public-john",
    rating: 5,
    text: "Fast dispatch and clear compatibility notes. The remote paired in minutes.",
    author: "John M.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-sarah",
    rating: 5,
    text: "Exactly what we needed for workshop reorders. Product quality is consistent.",
    author: "Sarah K.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-michael",
    rating: 4,
    text: "Good pricing and support replied quickly with programming guidance.",
    author: "Michael T.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-emma",
    rating: 5,
    text: "Ordered two gate remotes and both worked perfectly. Packaging was secure.",
    author: "Emma L.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-david",
    rating: 5,
    text: "Trade account workflow is smooth and reordering is much faster now.",
    author: "David R.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-lisa",
    rating: 5,
    text: "Reliable stock levels and straightforward checkout. Will buy again.",
    author: "Lisa W.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-daniel",
    rating: 5,
    text: "Fast dispatch and clear compatibility notes. The remote paired in minutes.",
    author: "Daniel S.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-mia",
    rating: 5,
    text: "Exactly what we needed for workshop reorders. Product quality is consistent.",
    author: "Mia L.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "public-cooper",
    rating: 4,
    text: "Good pricing and support replied quickly with programming guidance.",
    author: "Cooper R.",
    verified: true,
    date: "2026-03-23",
  },
];
const REMOTE_ICON_PATHS = [
  "/remotes/001_s-l140.webp",
  "/remotes/002_s-l500.webp",
  "/remotes/003_s-l140.webp",
  "/remotes/004_s-l140.webp",
  "/remotes/005_s-l140.webp",
  "/remotes/006_s-l500.webp",
  "/remotes/007_s-l500.webp",
  "/remotes/008_s-l500.webp",
  "/remotes/009_s-l500.webp",
  "/remotes/010_s-l500.webp",
  "/remotes/011_s-l500.webp",
  "/remotes/012_s-l500.webp",
  "/remotes/013_s-l500.webp",
  "/remotes/014_sprds3_18.png",
  "/remotes/015_s-l140.webp",
  "/remotes/016_s-l500.webp",
  "/remotes/017_s-l500.webp",
  "/remotes/018_s-l140.webp",
  "/remotes/019_s-l500.webp",
  "/remotes/020_s-l500.webp",
  "/remotes/021_s-l500.webp",
  "/remotes/022_s-l500.webp",
  "/remotes/023_s-l500.webp",
  "/remotes/024_s-l500.webp",
  "/remotes/025_s-l140.webp",
  "/remotes/026_s-l500.webp",
  "/remotes/027_s-l500.webp",
  "/remotes/028_s-l500.webp",
  "/remotes/029_s-l500.webp",
  "/remotes/030_s-l500.webp",
];
const FALLBACK_REVIEWS: Review[] = [
  {
    id: "fallback-john",
    rating: 5,
    text: "Excellent service and fast delivery! The remote I ordered worked perfectly with my garage door. Highly recommend ALLREMOTES!",
    author: "John M.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "fallback-sarah",
    rating: 5,
    text: "Great quality products at competitive prices. The customer support team was very helpful in finding the right remote for my car.",
    author: "Sarah K.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "fallback-michael",
    rating: 5,
    text: "Quick shipping and the product was exactly as described. Easy to program and works great. Will definitely shop here again!",
    author: "Michael T.",
    verified: true,
    date: "2026-03-23",
  },
  {
    id: "fallback-emma",
    rating: 5,
    text: "Best place to buy remotes online! Wide selection, genuine products, and excellent customer service. 5 stars!",
    author: "Emma L.",
    verified: true,
    date: "2026-03-23",
  },
];
const CATEGORY_SUBTITLES: Record<string, string> = {
  "garage-gate": "Explore our wide range of garage and gate automation products",
  automotive: "Explore automotive keys, remotes, blades, and specialist tools",
  "for-the-home": "Discover remotes and hardware for everyday home automation",
  locksmithing: "Browse locksmith tools, keys, remotes, and access equipment",
  "shop-by-brand": "Browse products and accessories by trusted remote brands",
  support: "Get help, find manuals, and access support resources",
};
const PRODUCT_HERO_CONTENT: Record<
  string,
  { title: string; badges: string[] }
> = {
  all: {
    title: "All Products",
    badges: ["Premium Range", "Fast Dispatch", "Australia Wide"],
  },
  car: {
    title: "Car Remotes",
    badges: ["Automotive", "Brand Specific", "Quality Guaranteed"],
  },
  garage: {
    title: "Garage Remotes",
    badges: ["Garage & Gate", "Genuine Parts", "Trade Pricing"],
  },
};
const FOOTER_CATEGORY_KEYS = [
  "garage-gate",
  "automotive",
  "for-the-home",
  "locksmithing",
  "shop-by-brand",
] as const;
const HERO_BACKGROUND_SWATCHES = [
  {
    id: "navy",
    label: "Dark Navy",
    swatch: "#153b50",
    colors: ["#153b50", "#265e73", "#0f2736"],
  },
  {
    id: "teal",
    label: "Teal",
    swatch: "#2e6b6f",
    colors: ["#2e6b6f", "#2e6b6f", "#a0312d"],
  },
  {
    id: "red",
    label: "Red",
    swatch: "#a0312d",
    colors: ["#5a2a27", "#a0312d", "#d16455"],
  },
  {
    id: "black",
    label: "Black",
    swatch: "#111111",
    colors: ["#111111", "#1f2937", "#000000"],
  },
] as const;
const WHY_BUY_ICON_MAP: Record<string, LucideIcon> = {
  qa: ShieldCheck,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  fs: Truck,
  truck: Truck,
  shipping: Truck,
  wr: RotateCcw,
  returns: RotateCcw,
  warranty: RotateCcw,
  cs: Headset,
  support: Headset,
  pm: CreditCard,
  payment: CreditCard,
  securepayments: CreditCard,
  tr: Users,
  trusted: Users,
  reviews: Star,
};
const ACCOUNT_TABS = [
  { id: "basics", label: "Account Basics", icon: User },
  { id: "orders", label: "Orders & Shopping", icon: ShoppingBag },
  { id: "payments", label: "Payments & Billing", icon: CreditCard },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "preferences", label: "Preferences & Saved", icon: Bookmark },
  { id: "reviews", label: "Reviews & Interactions", icon: Star },
  { id: "notifications", label: "Notifications & Settings", icon: Bell },
  { id: "help", label: "Help & Support", icon: LifeBuoy },
] as const;
const SITE_PANEL_CLASS =
  "rounded-2xl border border-neutral-200 bg-white/85 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur";
const SITE_CARD_CLASS =
  "rounded-2xl border border-neutral-200 bg-white/80 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur";
const SITE_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#C0392B] px-6 py-3 text-sm font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23]";
const SITE_OUTLINE_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-[#1A7A6E]/30 hover:bg-[#1A7A6E]/5 hover:text-[#0F4F47]";
const SITE_SUBTLE_CHIP_CLASS =
  "inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold";

type DirtyKey =
  | "home"
  | "navigation"
  | "promotions"
  | "reviews"
  | "products";

type EditorKey =
  | "top-info-bar"
  | "navigation"
  | "hero"
  | "features"
  | "products"
  | "why-buy"
  | "reviews"
  | "cta"
  | "footer";

type ToastState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

interface StorefrontAdminAppProps {
  slug?: string[];
}

interface StorefrontState {
  homeContent: HomeContent;
  navigation: NavigationTree;
  products: Product[];
  promotions: PromotionsData;
  reviews: Review[];
  settings: SiteSettings;
}

interface CartLine extends Product {
  quantity: number;
}

function isImageReference(value: string) {
  return /^(https?:\/\/|\/).+\.(png|jpe?g|gif|webp|svg)$/i.test(value.trim());
}

function assetUrl(pathOrUrl: string) {
  if (!pathOrUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${LIVE_SITE_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function formatCurrency(value: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function titleFromSlug(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeRoutePath(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return "/";
  }

  return `/${slug.join("/")}`;
}

function supportSettings(settings: SiteSettings) {
  return {
    brandTitle: settings.footerBrandTitle || DEFAULT_SETTINGS.footerBrandTitle || "ALLREMOTES",
    brandSubtitle:
      settings.footerBrandSubtitle || DEFAULT_SETTINGS.footerBrandSubtitle || "Quality is Guaranteed",
    footerTagline:
      settings.footerTagline || DEFAULT_SETTINGS.footerTagline || "Your trusted source for car and garage remotes",
    categoriesTitle:
      settings.footerCategoriesTitle || DEFAULT_SETTINGS.footerCategoriesTitle || "Categories",
    privacyTitle:
      settings.footerPrivacyTitle || DEFAULT_SETTINGS.footerPrivacyTitle || "Privacy Policy",
    privacyLabel:
      settings.footerPrivacyLabel || DEFAULT_SETTINGS.footerPrivacyLabel || "Our policy",
    privacyPath:
      settings.footerPrivacyPath || DEFAULT_SETTINGS.footerPrivacyPath || "/privacy",
    supportTitle:
      settings.footerSupportTitle || DEFAULT_SETTINGS.footerSupportTitle || "Support",
    supportLinkLabel:
      settings.footerSupportLinkLabel || DEFAULT_SETTINGS.footerSupportLinkLabel || "Support Center",
    supportLinkPath:
      settings.footerSupportLinkPath || DEFAULT_SETTINGS.footerSupportLinkPath || "/support",
    contactLinkLabel:
      settings.footerContactLinkLabel || DEFAULT_SETTINGS.footerContactLinkLabel || "Contact Us",
    contactLinkPath:
      settings.footerContactLinkPath || DEFAULT_SETTINGS.footerContactLinkPath || "/contact",
    supportPhone:
      settings.supportPhone || DEFAULT_SETTINGS.supportPhone || "1-800-REMOTES",
    supportHoursWeekdays:
      settings.supportHoursWeekdays ||
      DEFAULT_SETTINGS.supportHoursWeekdays ||
      "Monday - Friday: 9:00 AM - 5:00 PM",
    supportHoursSaturday:
      settings.supportHoursSaturday ||
      DEFAULT_SETTINGS.supportHoursSaturday ||
      "Saturday: 10:00 AM - 2:00 PM",
    footerCopyright:
      settings.footerCopyright ||
      DEFAULT_SETTINGS.footerCopyright ||
      "© 2026 ALLREMOTES. All rights reserved.",
  };
}

function cloneStorefrontState<T>(value: T): T {
  return structuredClone(value);
}

function editorSectionKey(editor: EditorKey): DirtyKey {
  switch (editor) {
    case "top-info-bar":
      return "promotions";
    case "navigation":
      return "navigation";
    case "products":
      return "products";
    case "reviews":
      return "reviews";
    default:
      return "home";
  }
}

function ensureReviews(reviews: Review[]) {
  if (reviews.length >= 6) {
    return reviews;
  }

  const fallback = FALLBACK_REVIEWS.filter(
    (entry) => !reviews.some((review) => review.author === entry.author && review.text === entry.text),
  );

  return [...reviews, ...fallback].slice(0, 6);
}

function matchesProductCategory(product: Product, routeKey: string) {
  const category = `${product.category} ${product.name} ${product.brand}`.toLowerCase();
  const normalized = routeKey.toLowerCase();

  if (normalized === "all") {
    return true;
  }

  if (normalized === "car" || normalized === "automotive") {
    return category.includes("car") || category.includes("automotive") || category.includes("key");
  }

  if (
    normalized === "garage" ||
    normalized === "garage-gate" ||
    normalized === "garage and gate" ||
    normalized === "garage remote"
  ) {
    return category.includes("garage") || category.includes("gate");
  }

  if (normalized === "for-the-home") {
    return (
      category.includes("home") ||
      category.includes("tv") ||
      category.includes("alarm") ||
      category.includes("blind") ||
      category.includes("lock")
    );
  }

  if (normalized === "locksmithing") {
    return category.includes("locksmith") || category.includes("xhorse") || category.includes("key");
  }

  if (normalized === "shop-by-brand") {
    return true;
  }

  return category.includes(normalized.replace(/-/g, " "));
}

function iconFromIndex(index?: number) {
  if (typeof index !== "number") {
    return assetUrl(REMOTE_ICON_PATHS[0]);
  }

  return assetUrl(REMOTE_ICON_PATHS[index % REMOTE_ICON_PATHS.length]);
}

function topInfoIcon(item: string): LucideIcon {
  const value = item.toLowerCase();

  if (value.includes("warranty")) {
    return ShieldCheck;
  }

  if (value.includes("return")) {
    return RotateCcw;
  }

  if (value.includes("secure")) {
    return LockKeyhole;
  }

  if (value.includes("trade")) {
    return Wallet;
  }

  if (value.includes("minimum")) {
    return Tags;
  }

  return Truck;
}

function resolveWhyBuyIcon(item: { icon?: string; title?: string }, index: number) {
  const iconKey = String(item.icon || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const titleKey = String(item.title || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return (
    WHY_BUY_ICON_MAP[iconKey] ??
    WHY_BUY_ICON_MAP[titleKey] ??
    [ShieldCheck, Truck, RotateCcw, Headset, CreditCard, Users][index % 6]
  );
}

function publicReviews(reviews: Review[]) {
  const normalized = reviews
    .map((review, index) => ({
      ...review,
      id: review.id || `review-${index}`,
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
      text: String(review.text || "").trim(),
      author: String(review.author || "").trim() || `Customer ${index + 1}`,
      verified: Boolean(review.verified),
    }))
    .filter((review) => review.text);

  const next = [...normalized];
  const seen = new Set(
    normalized.map((review) => `${review.author}__${review.text}`.toLowerCase()),
  );

  for (const fallback of PUBLIC_REVIEW_FALLBACKS) {
    if (next.length >= 9) {
      break;
    }

    const key = `${fallback.author}__${fallback.text}`.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(fallback);
  }

  return next.length ? next.slice(0, 9) : PUBLIC_REVIEW_FALLBACKS;
}

function splitNavigationItems(column?: NavigationColumn) {
  const visible = (column?.items ?? []).filter((item) => !item.hidden);

  return {
    regularItems: visible.filter((item) => !item.isShopAll),
    shopItem: visible.find((item) => item.isShopAll) ?? null,
  };
}

function EditorField(props: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`inline-editor-field${props.full ? " inline-editor-field--full" : ""}`}>
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

function ToggleInput(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`inline-toggle${props.checked ? " inline-toggle--checked" : ""}`}
      onClick={() => props.onChange(!props.checked)}
    >
      <span className="inline-toggle__track">
        <span className="inline-toggle__thumb" />
      </span>
      <span>{props.label}</span>
    </button>
  );
}

function DeleteIconButton(props: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-editor-icon-button"
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 6h18" />
        <path d="M8 6V4.75C8 4.06 8.56 3.5 9.25 3.5h5.5c.69 0 1.25.56 1.25 1.25V6" />
        <path d="M18 6v13.25c0 .69-.56 1.25-1.25 1.25h-9.5C6.56 20.5 6 19.94 6 19.25V6" />
        <path d="M10 10.5v6" />
        <path d="M14 10.5v6" />
      </svg>
    </button>
  );
}

function AddItemButton(props: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-editor-add-button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function RepeatableCard(props: {
  deleteLabel: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <div className="inline-editor-card">
      <div className="inline-editor-card__header">
        <div className="inline-editor-card__spacer" />
        <DeleteIconButton label={props.deleteLabel} onClick={props.onDelete} />
      </div>
      <div className="inline-editor-card__body">{props.children}</div>
    </div>
  );
}

function EditorPanel(props: {
  editor: EditorKey;
  title: string;
  description?: string;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
  children: ReactNode;
}) {
  return (
    <aside className="inline-editor-panel" aria-label={`${props.title} editor`}>
      <div className="inline-editor-panel__header">
        <strong>{props.title}</strong>
        <button
          type="button"
          className="inline-editor-close"
          onClick={props.onClose}
          aria-label={`Close ${props.title} editor`}
        >
          ×
        </button>
      </div>
      <div className="inline-editor-panel__body">{props.children}</div>
      <div className="inline-editor-panel__footer">
        <button
          type="button"
          className="inline-toolbar-button inline-toolbar-button--ghost"
          onClick={props.onDiscard}
        >
          Discard
        </button>
        <button
          type="button"
          className="inline-toolbar-button inline-toolbar-button--primary"
          disabled={props.saveDisabled || props.saving}
          onClick={props.onSave}
        >
          {props.saving ? "Saving..." : "Save"}
        </button>
      </div>
    </aside>
  );
}

function SectionToolbar(props: {
  visible: boolean;
  onEdit: () => void;
  onAdd?: () => void;
}) {
  if (!props.visible) {
    return null;
  }

  return (
    <div className="section-edit-toolbar">
      <button
        type="button"
        className="section-edit-button"
        onClick={props.onEdit}
      >
        ✏ Edit
      </button>
      {props.onAdd ? (
        <button
          type="button"
          className="section-edit-button"
          onClick={props.onAdd}
        >
          + Add
        </button>
      ) : null}
    </div>
  );
}

export default function StorefrontAdminApp({
  slug,
}: StorefrontAdminAppProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    () => null,
  );
  const [store, setStore] = useState<StorefrontState | null>(null);
  const [savedStore, setSavedStore] = useState<StorefrontState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [savingTarget, setSavingTarget] = useState<DirtyKey | "publish" | null>(null);
  const [activeEditor, setActiveEditor] = useState<EditorKey | null>(null);
  const [expandedNavigationSections, setExpandedNavigationSections] = useState<
    Partial<Record<string, boolean>>
  >({});
  const [dirtySections, setDirtySections] = useState<Partial<Record<DirtyKey, true>>>({});
  const [deletedReviewIds, setDeletedReviewIds] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState(
    searchParams.get("search") ?? searchParams.get("query") ?? "",
  );
  const [catalogBrand, setCatalogBrand] = useState(searchParams.get("brand") ?? "all");
  const [catalogStock, setCatalogStock] = useState("all");
  const [catalogSort, setCatalogSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || "1") || 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "card",
  });
  const deferredSearch = useDeferredValue(searchQuery);
  const routePath = normalizeRoutePath(slug);

  async function loadStore() {
    setLoading(true);
    setLoadError("");

    try {
      const [homeContent, navigation, products, promotions, reviews, settings] =
        await Promise.all([
          getHomeContent(),
          getNavigation(),
          getProducts(),
          getPromotions(),
          getReviews(),
          getSettings(),
        ]);

      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
      };
      const nextStore = {
        homeContent: {
          ...homeContent,
          footer: {
            companyName:
              homeContent.footer.companyName ||
              nextSettings.footerBrandTitle ||
              DEFAULT_SETTINGS.footerBrandTitle ||
              homeContent.footer.companyName,
            tagline:
              homeContent.footer.tagline ||
              nextSettings.footerTagline ||
              DEFAULT_SETTINGS.footerTagline ||
              homeContent.footer.tagline,
            email:
              homeContent.footer.email ||
              nextSettings.siteEmail ||
              DEFAULT_SETTINGS.siteEmail,
          },
        },
        navigation,
        products,
        promotions,
        reviews: ensureReviews(reviews),
        settings: nextSettings,
      };

      setStore(nextStore);
      setSavedStore(cloneStorefrontState(nextStore));
      setDeletedReviewIds([]);
      setDirtySections({});
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load the live site content.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStore();
  }, []);

  useEffect(() => {
    if (!store?.homeContent.heroImages.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % store.homeContent.heroImages.length);
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, [store?.homeContent.heroImages.length]);

  useEffect(() => {
    setCatalogSearch(searchParams.get("search") ?? searchParams.get("query") ?? "");
    setCatalogBrand(searchParams.get("brand") ?? "all");
    setCatalogStock("all");
    setCatalogSort("featured");
    setCurrentPage(Number(searchParams.get("page") || "1") || 1);
    setMobileDrawerOpen(false);
    setMobileExpandedMenu(null);
    setActiveDropdown(null);
    setCatalogFiltersOpen(false);
    setActiveEditor(null);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (cartInitialized || !store?.products.length) {
      return;
    }

    const sample = store.products
      .filter((product) => product.inStock)
      .slice(0, 2)
      .map((product, index) => ({
        ...product,
        quantity: index === 0 ? 1 : 2,
      }));

    setCartItems(sample);
    setCartInitialized(true);
  }, [cartInitialized, store?.products]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (!contactSubmitted) {
      return;
    }

    const timer = window.setTimeout(() => {
      setContactSubmitted(false);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [contactSubmitted]);

  function markDirty(section: DirtyKey) {
    setDirtySections((current) => ({
      ...current,
      [section]: true,
    }));
    setToast(null);
  }

  function updateStore(updater: (current: StorefrontState) => StorefrontState) {
    setStore((current) => (current ? updater(current) : current));
  }

  function updateHome(updater: (current: HomeContent) => HomeContent) {
    updateStore((current) => ({
      ...current,
      homeContent: updater(current.homeContent),
    }));
    markDirty("home");
  }

  function updateNavigation(updater: (current: NavigationTree) => NavigationTree) {
    updateStore((current) => ({
      ...current,
      navigation: updater(current.navigation),
    }));
    markDirty("navigation");
  }

  function updatePromotions(updater: (current: PromotionsData) => PromotionsData) {
    updateStore((current) => ({
      ...current,
      promotions: updater(current.promotions),
    }));
    markDirty("promotions");
  }

  function updateReviews(updater: (current: Review[]) => Review[]) {
    updateStore((current) => ({
      ...current,
      reviews: updater(current.reviews),
    }));
    markDirty("reviews");
  }

  function updateProducts(updater: (current: Product[]) => Product[]) {
    updateStore((current) => ({
      ...current,
      products: updater(current.products),
    }));
    markDirty("products");
  }

  function clearDirtySection(section: DirtyKey) {
    setDirtySections((current) => {
      const next = { ...current };
      delete next[section];
      return next;
    });
  }

  async function saveSectionChanges(section: DirtyKey, source: StorefrontState) {
    if (section === "home") {
      await saveHomeContent(source.homeContent);
      return;
    }

    if (section === "navigation") {
      await saveNavigation(source.navigation);
      return;
    }

    if (section === "promotions") {
      await savePromotions(source.promotions);
      return;
    }

    if (section === "products") {
      await saveProducts(source.products);
      return;
    }

    const persistedReviewIds = new Set(savedStore?.reviews.map((review) => review.id) ?? []);
    for (const reviewId of deletedReviewIds) {
      if (
        persistedReviewIds.has(reviewId) &&
        !reviewId.startsWith("review_") &&
        !reviewId.startsWith("fallback-")
      ) {
        await deleteReview(reviewId).catch(() => undefined);
      }
    }

    await saveReviews(source.reviews);
  }

  function syncSavedStore(sections: DirtyKey[]) {
    if (!store) {
      return;
    }

    const snapshot = cloneStorefrontState(store);
    setSavedStore((current) => {
      if (!current) {
        return snapshot;
      }

      const next = cloneStorefrontState(current);

      for (const section of sections) {
        if (section === "home") {
          next.homeContent = snapshot.homeContent;
        }

        if (section === "navigation") {
          next.navigation = snapshot.navigation;
        }

        if (section === "promotions") {
          next.promotions = snapshot.promotions;
        }

        if (section === "products") {
          next.products = snapshot.products;
        }

        if (section === "reviews") {
          next.reviews = snapshot.reviews;
        }
      }

      return next;
    });
  }

  async function persistSections(sections: DirtyKey[], options?: { closeEditor?: boolean }) {
    if (!store) {
      return false;
    }

    setSavingTarget(sections.length > 1 ? "publish" : sections[0]);

    try {
      for (const section of sections) {
        await saveSectionChanges(section, store);
      }

      for (const section of sections) {
        clearDirtySection(section);
      }

      if (sections.includes("reviews")) {
        setDeletedReviewIds([]);
      }

      syncSavedStore(sections);
      if (options?.closeEditor) {
        setActiveEditor(null);
      }
      setToast({
        tone: "success",
        message: "Changes saved",
      });
      return true;
    } catch {
      setToast({
        tone: "error",
        message: "Save failed",
      });
      return false;
    } finally {
      setSavingTarget(null);
    }
  }

  function discardEditorChanges(editor: EditorKey) {
    if (!savedStore) {
      setActiveEditor(null);
      return;
    }

    const snapshot = cloneStorefrontState(savedStore);
    const section = editorSectionKey(editor);

    setStore((current) => {
      if (!current) {
        return current;
      }

      if (section === "home") {
        return {
          ...current,
          homeContent: snapshot.homeContent,
        };
      }

      if (section === "navigation") {
        return {
          ...current,
          navigation: snapshot.navigation,
        };
      }

      if (section === "promotions") {
        return {
          ...current,
          promotions: snapshot.promotions,
        };
      }

      if (section === "products") {
        return {
          ...current,
          products: snapshot.products,
        };
      }

      return {
        ...current,
        reviews: snapshot.reviews,
      };
    });

    if (section === "reviews") {
      setDeletedReviewIds([]);
    }

    clearDirtySection(section);
    setActiveEditor(null);
  }

  function handlePublishChanges() {
    const sections = Object.keys(dirtySections) as DirtyKey[];

    if (!sections.length) {
      return;
    }

    void persistSections(sections);
  }

  function handleEditorSave(editor: EditorKey) {
    void persistSections([editorSectionKey(editor)], { closeEditor: true });
  }

  function visibleSections() {
    if (!store) {
      return [];
    }

    return Object.entries(store.navigation).filter(([, entry]) => !entry.hidden);
  }

  function footerCategoryEntries() {
    if (!store) {
      return [];
    }

    return FOOTER_CATEGORY_KEYS.map((key) => ({
      key,
      entry: store.navigation[key],
    })).filter((item) => item.entry);
  }

  function findNavigationLeaf(path: string) {
    if (!store) {
      return null;
    }

    for (const [sectionKey, section] of Object.entries(store.navigation)) {
      if (section.path === path) {
        return { sectionKey, section, item: null as NavigationItem | null };
      }

      for (const column of section.columns ?? []) {
        for (const item of column.items) {
          if (item.path === path) {
            return { sectionKey, section, item };
          }
        }
      }
    }

    return null;
  }

  function pageModel() {
    if (!store) {
      return { kind: "home" as const };
    }

    if (routePath === "/") {
      return { kind: "home" as const };
    }

    if (slug?.[0] === "products") {
      return {
        kind: "products" as const,
        routeCategory: slug[1] ?? "all",
      };
    }

    if (slug?.[0] === "product") {
      return {
        kind: "product" as const,
        productId: slug[1] ?? "",
      };
    }

    if (routePath === "/contact") {
      return { kind: "contact" as const };
    }

    if (routePath === "/cart") {
      return { kind: "cart" as const };
    }

    if (routePath === "/checkout") {
      return { kind: "checkout" as const };
    }

    if (routePath === "/account") {
      return { kind: "account" as const };
    }

    const leaf = findNavigationLeaf(routePath);

    if (leaf?.item) {
      return {
        kind: "category-leaf" as const,
        sectionKey: leaf.sectionKey,
        section: leaf.section,
        item: leaf.item,
      };
    }

    if (slug?.[0] && store.navigation[slug[0]]) {
      return {
        kind: "category" as const,
        sectionKey: slug[0],
        section: store.navigation[slug[0]],
      };
    }

    return { kind: "fallback" as const };
  }

  const page = pageModel();
  const topLevelLinks = visibleSections();
  const settingsContent = supportSettings(store?.settings ?? DEFAULT_SETTINGS);
  const searchResults = (store?.products ?? [])
    .filter((product) => {
      const haystack = `${product.name} ${product.brand} ${product.sku ?? ""}`.toLowerCase();
      return haystack.includes(deferredSearch.trim().toLowerCase());
    })
    .slice(0, 6);
  const featuredProducts = (store?.products ?? []).slice(0, 8);
  const catalogProducts = (() => {
    if (!store || page.kind !== "products") {
      return [];
    }

    const routeCategory = page.routeCategory.toLowerCase();
    let items = store.products.filter((product) =>
      matchesProductCategory(product, routeCategory),
    );

    if (catalogSearch.trim()) {
      const query = catalogSearch.trim().toLowerCase();
      items = items.filter((product) =>
        `${product.name} ${product.brand} ${product.sku ?? ""}`
          .toLowerCase()
          .includes(query),
      );
    }

    if (catalogBrand !== "all") {
      items = items.filter(
        (product) => product.brand.toLowerCase() === catalogBrand.toLowerCase(),
      );
    }

    if (catalogStock === "in") {
      items = items.filter((product) => product.inStock);
    }

    if (catalogStock === "out") {
      items = items.filter((product) => !product.inStock);
    }

    if (catalogSort === "price-asc") {
      items = [...items].sort((left, right) => left.price - right.price);
    }

    if (catalogSort === "price-desc") {
      items = [...items].sort((left, right) => right.price - left.price);
    }

    if (catalogSort === "name") {
      items = [...items].sort((left, right) => left.name.localeCompare(right.name));
    }

    return items;
  })();
  const totalPages = store
    ? Math.max(1, Math.ceil(catalogProducts.length / (store.settings.itemsPerPage || 12)))
    : 1;
  const pagedCatalogProducts = catalogProducts.slice(
    (currentPage - 1) * (store?.settings.itemsPerPage || 12),
    currentPage * (store?.settings.itemsPerPage || 12),
  );
  const catalogBrands = Array.from(
    new Set(
      (catalogProducts.length ? catalogProducts : store?.products ?? [])
        .map((product) => product.brand)
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const customerReviews = publicReviews(store?.reviews ?? []);
  const marqueeReviews = [...customerReviews, ...customerReviews];
  const cartItemCount = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const dirtyCount = Object.keys(dirtySections).length;
  const currentSearch = searchParams.toString();
  const loginHref = `/login?next=${encodeURIComponent(
    `${pathname}${currentSearch ? `?${currentSearch}` : ""}`,
  )}`;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  function openEditor(key: EditorKey) {
    setActiveEditor((current) => (current === key ? null : key));
  }

  function addProductToCart(product: Product) {
    if (!product.inStock) {
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Number(item.quantity || 0) + 1 }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCartItems((current) =>
      current.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Math.floor(quantity || 1)) }
          : item,
      ),
    );
  }

  function removeCartItem(productId: string) {
    setCartItems((current) => current.filter((item) => item.id !== productId));
  }

  function updateNavigationSection(sectionKey: string, patch: Partial<NavigationSectionEntry>) {
    updateNavigation((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        ...patch,
      },
    }));
  }

  function isNavigationSectionExpanded(sectionKey: string) {
    return expandedNavigationSections[sectionKey] ?? true;
  }

  function toggleNavigationSectionExpanded(sectionKey: string) {
    setExpandedNavigationSections((current) => ({
      ...current,
      [sectionKey]: !(current[sectionKey] ?? true),
    }));
  }

  function navigationItemsForSection(section: NavigationSectionEntry) {
    return (section.columns ?? []).flatMap((column, columnIndex) =>
      column.items.map((item, itemIndex) => ({
        columnIndex,
        itemIndex,
        item,
      })),
    );
  }

  function updateNavigationItem(
    sectionKey: string,
    columnIndex: number,
    itemIndex: number,
    patch: Partial<NavigationItem>,
  ) {
    updateNavigation((current) => {
      const section = current[sectionKey];

      if (!section) {
        return current;
      }

      const columns = (section.columns ?? []).map((column, currentColumnIndex) => {
        if (currentColumnIndex !== columnIndex) {
          return column;
        }

        return {
          ...column,
          items: column.items.map((item, currentItemIndex) =>
            currentItemIndex === itemIndex ? { ...item, ...patch } : item,
          ),
        };
      });

      return {
        ...current,
        [sectionKey]: {
          ...section,
          columns,
        },
      };
    });
  }

  function addNavigationItem(sectionKey: string) {
    updateNavigation((current) => {
      const section = current[sectionKey];

      if (!section) {
        return current;
      }

      const columns =
        section.columns && section.columns.length
          ? section.columns.map((column) => ({
              ...column,
              items: [...column.items],
            }))
          : [{ title: "Links", items: [] }];

      columns[0] = {
        ...columns[0],
        items: [
          ...columns[0].items,
          {
            name: "",
            path: "/",
            hidden: false,
          },
        ],
      };

      return {
        ...current,
        [sectionKey]: {
          ...section,
          columns,
          hasDropdown: true,
        },
      };
    });
  }

  function removeNavigationItem(sectionKey: string, columnIndex: number, itemIndex: number) {
    updateNavigation((current) => {
      const section = current[sectionKey];

      if (!section) {
        return current;
      }

      const columns = (section.columns ?? []).map((column, currentColumnIndex) => {
        if (currentColumnIndex !== columnIndex) {
          return column;
        }

        return {
          ...column,
          items: column.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
        };
      });

      return {
        ...current,
        [sectionKey]: {
          ...section,
          columns,
        },
      };
    });
  }

  function removeNavigationSection(sectionKey: string) {
    updateNavigation((current) => {
      const next = { ...current };
      delete next[sectionKey];
      return next;
    });
    setExpandedNavigationSections((current) => {
      const next = { ...current };
      delete next[sectionKey];
      return next;
    });
  }

  function addNavigationSection() {
    const sectionKey = `nav_${crypto.randomUUID().slice(0, 8)}`;

    updateNavigation((current) => {
      return {
        ...current,
        [sectionKey]: {
          title: "New Section",
          path: "/new-section",
          hidden: false,
          columns: [{ title: "Links", items: [] }],
        },
      };
    });
    setExpandedNavigationSections((current) => ({
      ...current,
      [sectionKey]: true,
    }));
    setActiveEditor("navigation");
  }

  function primaryHeroImage() {
    return store?.homeContent.heroImages[0] ?? "";
  }

  function updatePrimaryHeroImage(value: string) {
    updateHome((current) => ({
      ...current,
      heroImages: current.heroImages.length
        ? [value, ...current.heroImages.slice(1)]
        : [value],
    }));
  }

  function updateProduct(productId: string, patch: Partial<Product>) {
    updateProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
  }

  function addProduct() {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      brand: "",
      name: "",
      category: "garage",
      price: 0,
      inStock: true,
      image: "",
      description: "",
      sku: "",
      condition: "Brand New",
      returns: "No returns accepted",
      seller: "AllRemotes (100% positive)",
      skuKey: null,
    };

    updateProducts((current) => [newProduct, ...current]);
    setActiveEditor("products");
  }

  function removeProduct(productId: string) {
    if (!window.confirm("Delete this product from the live catalog?")) {
      return;
    }

    updateProducts((current) => current.filter((product) => product.id !== productId));
  }

  function addReview() {
    const review: Review = {
      id: crypto.randomUUID(),
      rating: 5,
      text: "",
      author: "",
      verified: true,
      date: new Date().toISOString().slice(0, 10),
    };

    updateReviews((current) => [review, ...current]);
    setActiveEditor("reviews");
  }

  function removeReview(reviewId: string) {
    if (!window.confirm("Delete this review?")) {
      return;
    }

    updateReviews((current) => current.filter((review) => review.id !== reviewId));
    setDeletedReviewIds((current) => {
      if (!savedStore?.reviews.some((review) => review.id === reviewId)) {
        return current;
      }

      return [...current, reviewId];
    });
  }

  function updateReview(reviewId: string, patch: Partial<Review>) {
    updateReviews((current) =>
      current.map((review) => (review.id === reviewId ? { ...review, ...patch } : review)),
    );
  }

  function renderNavigationEditor() {
    if (!store || activeEditor !== "navigation") {
      return null;
    }

    return (
      <EditorPanel
        editor="navigation"
        title="Navigation"
        description="Update each navigation link label, path, and visibility."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("navigation")}
        onSave={() => handleEditorSave("navigation")}
        saveDisabled={!session}
        saving={savingTarget === "navigation" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          {Object.entries(store.navigation).map(([sectionKey, section]) => (
            <div key={sectionKey} className="inline-editor-accordion">
              <div className="inline-editor-accordion__header">
                <button
                  type="button"
                  className="inline-editor-accordion__trigger"
                  onClick={() => toggleNavigationSectionExpanded(sectionKey)}
                  aria-expanded={isNavigationSectionExpanded(sectionKey)}
                >
                  <span>{section.title || "Untitled Section"}</span>
                  <svg
                    className={`inline-editor-accordion__chevron${
                      isNavigationSectionExpanded(sectionKey)
                        ? " inline-editor-accordion__chevron--open"
                        : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m6 8 4 4 4-4" />
                  </svg>
                </button>
                <DeleteIconButton
                  label={`Delete ${section.title || "section"}`}
                  onClick={() => removeNavigationSection(sectionKey)}
                />
              </div>

              {isNavigationSectionExpanded(sectionKey) ? (
                <div className="inline-editor-accordion__body">
                  <div className="inline-editor-grid">
                    <EditorField label="Section Title">
                      <input
                        value={section.title}
                        onChange={(event) =>
                          updateNavigationSection(sectionKey, { title: event.target.value })
                        }
                      />
                    </EditorField>
                    <EditorField label="Path">
                      <input
                        value={section.path}
                        onChange={(event) =>
                          updateNavigationSection(sectionKey, { path: event.target.value })
                        }
                      />
                    </EditorField>
                    <EditorField label="Show / Hide">
                      <ToggleInput
                        checked={!section.hidden}
                        onChange={(checked) =>
                          updateNavigationSection(sectionKey, { hidden: !checked })
                        }
                        label={section.hidden ? "Hidden" : "Visible"}
                      />
                    </EditorField>
                  </div>

                  <div className="inline-editor-stack">
                    {navigationItemsForSection(section).map(
                      ({ columnIndex, itemIndex, item }) => (
                        <RepeatableCard
                          key={`${sectionKey}_${columnIndex}_${itemIndex}_${item.path}`}
                          deleteLabel={`Delete ${item.name || "navigation item"}`}
                          onDelete={() =>
                            removeNavigationItem(sectionKey, columnIndex, itemIndex)
                          }
                        >
                          <div className="inline-editor-grid">
                            <EditorField label="Label">
                              <input
                                value={item.name}
                                onChange={(event) =>
                                  updateNavigationItem(sectionKey, columnIndex, itemIndex, {
                                    name: event.target.value,
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label="Path">
                              <input
                                value={item.path}
                                onChange={(event) =>
                                  updateNavigationItem(sectionKey, columnIndex, itemIndex, {
                                    path: event.target.value,
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label="Show / Hide">
                              <ToggleInput
                                checked={!item.hidden}
                                onChange={(checked) =>
                                  updateNavigationItem(sectionKey, columnIndex, itemIndex, {
                                    hidden: !checked,
                                  })
                                }
                                label={item.hidden ? "Hidden" : "Visible"}
                              />
                            </EditorField>
                          </div>
                        </RepeatableCard>
                      ),
                    )}
                  </div>

                  <AddItemButton onClick={() => addNavigationItem(sectionKey)}>
                    + Add item
                  </AddItemButton>
                </div>
              ) : null}
            </div>
          ))}

          <AddItemButton onClick={addNavigationSection}>+ Add section</AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderTopInfoBarEditor() {
    if (!store || activeEditor !== "top-info-bar") {
      return null;
    }

    return (
      <EditorPanel
        editor="top-info-bar"
        title="Top Info Bar"
        description="Update the enabled state and scrolling marketing text."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("top-info-bar")}
        onSave={() => handleEditorSave("top-info-bar")}
        saveDisabled={!session}
        saving={savingTarget === "promotions" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          <EditorField label="Enabled">
            <ToggleInput
              checked={store.promotions.topInfoBar.enabled}
              onChange={(checked) =>
                updatePromotions((current) => ({
                  ...current,
                  topInfoBar: {
                    ...current.topInfoBar,
                    enabled: checked,
                  },
                }))
              }
              label={store.promotions.topInfoBar.enabled ? "Enabled" : "Disabled"}
            />
          </EditorField>
          {store.promotions.topInfoBar.items.map((item, index) => (
            <RepeatableCard
              key={`${item}_${index}`}
              deleteLabel={`Delete top bar item ${index + 1}`}
              onDelete={() =>
                updatePromotions((current) => ({
                  ...current,
                  topInfoBar: {
                    ...current.topInfoBar,
                    items: current.topInfoBar.items.filter(
                      (_, currentIndex) => currentIndex !== index,
                    ),
                  },
                }))
              }
            >
              <EditorField label="Text Item">
                <input
                  value={item}
                  onChange={(event) =>
                    updatePromotions((current) => ({
                      ...current,
                      topInfoBar: {
                        ...current.topInfoBar,
                        items: current.topInfoBar.items.map((entry, currentIndex) =>
                          currentIndex === index ? event.target.value : entry,
                        ),
                      },
                    }))
                  }
                />
              </EditorField>
            </RepeatableCard>
          ))}
          <AddItemButton
            onClick={() =>
              updatePromotions((current) => ({
                ...current,
                topInfoBar: {
                  ...current.topInfoBar,
                  items: [...current.topInfoBar.items, "NEW MESSAGE"],
                },
              }))
            }
          >
            + Add item
          </AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderHeroEditor() {
    if (!store || activeEditor !== "hero") {
      return null;
    }

    const heroImage = primaryHeroImage();

    return (
      <EditorPanel
        editor="hero"
        title="Hero"
        description="Update the hero heading, subheading, CTAs, and overlay color palette."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("hero")}
        onSave={() => handleEditorSave("hero")}
        saveDisabled={!session}
        saving={savingTarget === "home" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          <EditorField label="Heading">
            <textarea
              rows={3}
              value={store.homeContent.hero.title}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    title: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <EditorField label="Subheading">
            <textarea
              rows={3}
              value={store.homeContent.hero.subtitle}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    subtitle: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <EditorField label="Supporting Copy">
            <textarea
              rows={3}
              value={store.homeContent.hero.description}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    description: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <div className="inline-editor-grid inline-editor-grid--split">
            <EditorField label="Primary Button Text">
              <input
                value={store.homeContent.hero.primaryCta}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      primaryCta: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
            <EditorField label="Primary Button Path">
              <input
                value={store.homeContent.hero.primaryCtaPath}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      primaryCtaPath: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
          </div>
          <div className="inline-editor-grid inline-editor-grid--split">
            <EditorField label="Secondary Button Text">
              <input
                value={store.homeContent.hero.secondaryCta}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      secondaryCta: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
            <EditorField label="Secondary Button Path">
              <input
                value={store.homeContent.hero.secondaryCtaPath}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      secondaryCtaPath: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
          </div>
          <EditorField label="Image URL">
            <div className="inline-editor-preview-row">
              <input
                value={heroImage}
                onChange={(event) => updatePrimaryHeroImage(event.target.value)}
              />
              <div className="inline-editor-thumbnail">
                {heroImage ? <img src={assetUrl(heroImage)} alt="Hero preview" /> : <span>No image</span>}
              </div>
            </div>
          </EditorField>
          <div className="inline-editor-subsection">
            <strong>Background Color Swatches</strong>
            <div className="hero-swatch-grid">
              {HERO_BACKGROUND_SWATCHES.map((swatch) => {
                const isActive =
                  JSON.stringify(swatch.colors) ===
                  JSON.stringify(store.homeContent.hero.backgroundColors);

                return (
                  <button
                    key={swatch.id}
                    type="button"
                    className={`hero-swatch${isActive ? " hero-swatch--active" : ""}`}
                    onClick={() =>
                      updateHome((current) => ({
                        ...current,
                        hero: {
                          ...current.hero,
                          backgroundColors: [...swatch.colors],
                        },
                      }))
                    }
                    aria-label={swatch.label}
                    title={swatch.label}
                  >
                    <span
                      className="hero-swatch__chip"
                      style={{ background: swatch.swatch }}
                    />
                    {isActive ? (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5.5 10 3 3 6-6" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </EditorPanel>
    );
  }

  function renderFeaturesEditor() {
    if (!store || activeEditor !== "features") {
      return null;
    }

    return (
      <EditorPanel
        editor="features"
        title="Feature Cards"
        description="Update the feature section title and feature card content."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("features")}
        onSave={() => handleEditorSave("features")}
        saveDisabled={!session}
        saving={savingTarget === "home" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          <EditorField label="Section Title">
            <input
              value={store.homeContent.featuresTitle}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  featuresTitle: event.target.value,
                }))
              }
            />
          </EditorField>
          {store.homeContent.features.map((feature, index) => (
            <RepeatableCard
              key={`${feature.title}_${index}`}
              deleteLabel={`Delete feature card ${index + 1}`}
              onDelete={() =>
                updateHome((current) => ({
                  ...current,
                  features: current.features.filter((_, currentIndex) => currentIndex !== index),
                }))
              }
            >
              <div className="inline-editor-grid">
                <EditorField label="Icon">
                  <input
                    value={feature.icon}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        features: current.features.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, icon: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Title">
                  <input
                    value={feature.title}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        features: current.features.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, title: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Description" full>
                  <textarea
                    value={feature.description}
                    rows={3}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        features: current.features.map((entry, currentIndex) =>
                          currentIndex === index
                            ? { ...entry, description: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Link Text">
                  <input
                    value={feature.linkText}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        features: current.features.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, linkText: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Link Path">
                  <input
                    value={feature.path}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        features: current.features.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, path: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
              </div>
            </RepeatableCard>
          ))}
          <AddItemButton
            onClick={() =>
              updateHome((current) => ({
                ...current,
                features: [
                  ...current.features,
                  {
                    icon: "",
                    title: "",
                    description: "",
                    path: "/products/all",
                    linkText: "Explore →",
                  },
                ],
              }))
            }
          >
            + Add item
          </AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderWhyBuyEditor() {
    if (!store || activeEditor !== "why-buy") {
      return null;
    }

    return (
      <EditorPanel
        editor="why-buy"
        title="Why Buy"
        description="Edit the reasons to buy from ALLREMOTES."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("why-buy")}
        onSave={() => handleEditorSave("why-buy")}
        saveDisabled={!session}
        saving={savingTarget === "home" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          {store.homeContent.whyBuy.map((item, index) => (
            <RepeatableCard
              key={`${item.title}_${index}`}
              deleteLabel={`Delete why buy item ${index + 1}`}
              onDelete={() =>
                updateHome((current) => ({
                  ...current,
                  whyBuy: current.whyBuy.filter((_, currentIndex) => currentIndex !== index),
                }))
              }
            >
              <div className="inline-editor-grid">
                <EditorField label="Icon">
                  <input
                    value={item.icon}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        whyBuy: current.whyBuy.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, icon: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Title">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        whyBuy: current.whyBuy.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, title: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
                <EditorField label="Description" full>
                  <textarea
                    value={item.description}
                    rows={3}
                    onChange={(event) =>
                      updateHome((current) => ({
                        ...current,
                        whyBuy: current.whyBuy.map((entry, currentIndex) =>
                          currentIndex === index
                            ? { ...entry, description: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                  />
                </EditorField>
              </div>
            </RepeatableCard>
          ))}
          <AddItemButton
            onClick={() =>
              updateHome((current) => ({
                ...current,
                whyBuy: [
                  ...current.whyBuy,
                  {
                    icon: "✓",
                    title: "",
                    description: "",
                  },
                ],
              }))
            }
          >
            + Add item
          </AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderCtaEditor() {
    if (!store || activeEditor !== "cta") {
      return null;
    }

    return (
      <EditorPanel
        editor="cta"
        title="CTA"
        description="Edit the closing call-to-action content."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("cta")}
        onSave={() => handleEditorSave("cta")}
        saveDisabled={!session}
        saving={savingTarget === "home" || savingTarget === "publish"}
      >
        <div className="inline-editor-grid">
          <EditorField label="Title">
            <input
              value={store.homeContent.ctaSection.title}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  ctaSection: {
                    ...current.ctaSection,
                    title: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <EditorField label="Button Text">
            <input
              value={store.homeContent.ctaSection.buttonText}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  ctaSection: {
                    ...current.ctaSection,
                    buttonText: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <EditorField label="Description" full>
            <textarea
              value={store.homeContent.ctaSection.description}
              rows={3}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  ctaSection: {
                    ...current.ctaSection,
                    description: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
          <EditorField label="Button Path">
            <input
              value={store.homeContent.ctaSection.buttonPath}
              onChange={(event) =>
                updateHome((current) => ({
                  ...current,
                  ctaSection: {
                    ...current.ctaSection,
                    buttonPath: event.target.value,
                  },
                }))
              }
            />
          </EditorField>
        </div>
      </EditorPanel>
    );
  }

  function renderFooterEditor() {
    if (!store || activeEditor !== "footer") {
      return null;
    }

    return (
      <EditorPanel
        editor="footer"
        title="Footer"
        description="Update the company name, footer tagline, and support email."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("footer")}
        onSave={() => handleEditorSave("footer")}
        saveDisabled={!session}
        saving={savingTarget === "home" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          <div className="inline-editor-grid">
            <EditorField label="Company Name">
              <input
                value={store.homeContent.footer.companyName}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    footer: {
                      ...current.footer,
                      companyName: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
            <EditorField label="Tagline" full>
              <input
                value={store.homeContent.footer.tagline}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    footer: {
                      ...current.footer,
                      tagline: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
            <EditorField label="Email">
              <input
                value={store.homeContent.footer.email}
                onChange={(event) =>
                  updateHome((current) => ({
                    ...current,
                    footer: {
                      ...current.footer,
                      email: event.target.value,
                    },
                  }))
                }
              />
            </EditorField>
          </div>
        </div>
      </EditorPanel>
    );
  }

  function renderReviewsEditor() {
    if (!store || activeEditor !== "reviews") {
      return null;
    }

    return (
      <EditorPanel
        editor="reviews"
        title="Reviews"
        description="Update review rating, text, author, and verification state."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("reviews")}
        onSave={() => handleEditorSave("reviews")}
        saveDisabled={!session}
        saving={savingTarget === "reviews" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          {store.reviews.map((review) => (
            <RepeatableCard
              key={review.id}
              deleteLabel={`Delete ${review.author || "review"}`}
              onDelete={() => removeReview(review.id)}
            >
              <div className="inline-editor-grid">
                <EditorField label="Rating">
                  <input
                    min={1}
                    max={5}
                    type="number"
                    value={review.rating}
                    onChange={(event) =>
                      updateReview(review.id, {
                        rating: Math.max(1, Math.min(5, Number(event.target.value || 5))),
                      })
                    }
                  />
                </EditorField>
                <EditorField label="Author">
                  <input
                    value={review.author}
                    onChange={(event) =>
                      updateReview(review.id, { author: event.target.value })
                    }
                  />
                </EditorField>
                <EditorField label="Verified">
                  <ToggleInput
                    checked={review.verified}
                    onChange={(checked) => updateReview(review.id, { verified: checked })}
                    label={review.verified ? "Verified" : "Unverified"}
                  />
                </EditorField>
                <EditorField label="Text" full>
                  <textarea
                    value={review.text}
                    rows={4}
                    onChange={(event) => updateReview(review.id, { text: event.target.value })}
                  />
                </EditorField>
              </div>
            </RepeatableCard>
          ))}
          <AddItemButton onClick={addReview}>+ Add item</AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderProductsEditor() {
    if (!store || activeEditor !== "products") {
      return null;
    }

    return (
      <EditorPanel
        editor="products"
        title="Products"
        description="Update product name, price, category, stock state, and image URL."
        onClose={() => setActiveEditor(null)}
        onDiscard={() => discardEditorChanges("products")}
        onSave={() => handleEditorSave("products")}
        saveDisabled={!session}
        saving={savingTarget === "products" || savingTarget === "publish"}
      >
        <div className="inline-editor-stack">
          {store.products.map((product) => (
            <RepeatableCard
              key={product.id}
              deleteLabel={`Delete ${product.name || "product"}`}
              onDelete={() => removeProduct(product.id)}
            >
              <div className="inline-editor-grid">
                <EditorField label="Name">
                  <input
                    value={product.name}
                    onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                  />
                </EditorField>
                <EditorField label="Price">
                  <input
                    min={0}
                    step="0.01"
                    type="number"
                    value={product.price}
                    onChange={(event) =>
                      updateProduct(product.id, {
                        price: Number(event.target.value || 0),
                      })
                    }
                  />
                </EditorField>
                <EditorField label="Category">
                  <input
                    value={product.category}
                    onChange={(event) =>
                      updateProduct(product.id, { category: event.target.value })
                    }
                  />
                </EditorField>
                <EditorField label="In Stock">
                  <ToggleInput
                    checked={product.inStock}
                    onChange={(checked) => updateProduct(product.id, { inStock: checked })}
                    label={product.inStock ? "In stock" : "Out of stock"}
                  />
                </EditorField>
                <EditorField label="Image URL" full>
                  <input
                    value={product.image}
                    onChange={(event) => updateProduct(product.id, { image: event.target.value })}
                  />
                </EditorField>
              </div>
            </RepeatableCard>
          ))}
          <AddItemButton onClick={addProduct}>+ Add item</AddItemButton>
        </div>
      </EditorPanel>
    );
  }

  function renderHeader() {
    const navItems = topLevelLinks.map(([key, entry]) => ({ key, entry }));

    return (
      <header className="sticky top-12 z-[1100] border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md">
        <div
          className={`editor-section-shell${
            store?.promotions.topInfoBar.enabled ? "" : " editor-section-shell--collapsed"
          }`}
        >
          {store?.promotions.topInfoBar.enabled ? (
            <div className="border-b border-[#0F4F47]/50 bg-[#0F4F47]">
              <div className="site-container">
                <div className="flex flex-wrap items-center justify-center gap-y-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/90 [column-gap:clamp(0.75rem,2.6vw,2.25rem)] sm:text-[11px]">
                  {store.promotions.topInfoBar.items.map((item, index) => {
                    const Icon = topInfoIcon(item);

                    return (
                      <span
                        key={`${item}_${index}`}
                        className="inline-flex max-w-full items-center gap-1.5 text-center"
                      >
                        <span className="text-[#3C9697]">
                          <Icon size={14} strokeWidth={2} />
                        </span>
                        {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-0 overflow-hidden" aria-hidden="true" />
          )}
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("top-info-bar")}
            onAdd={() => {
              updatePromotions((current) => ({
                ...current,
                topInfoBar: {
                  ...current.topInfoBar,
                  items: [...current.topInfoBar.items, "NEW MESSAGE"],
                },
              }));
              setActiveEditor("top-info-bar");
            }}
          />
        </div>

        {renderTopInfoBarEditor()}

        <div>
          <div className="site-container">
            <div className="flex flex-wrap items-center gap-3 py-3.5 sm:gap-4 md:gap-6 md:py-4">
              <Link href="/" className="shrink-0" aria-label="ALLREMOTES home">
                <img
                  src={assetUrl("/images/mainlogo.png")}
                  alt="ALLREMOTES"
                  className="h-10 w-auto sm:h-12 lg:h-14"
                />
              </Link>

              <div className="order-3 relative basis-full lg:order-none lg:mx-auto lg:flex-1 lg:max-w-2xl">
                <form
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = searchQuery.trim();
                    router.push(
                      value
                        ? `/products/all?search=${encodeURIComponent(value)}`
                        : "/products/all",
                    );
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search remote, brand, or model"
                    className="h-12 w-full rounded-lg border border-neutral-300 bg-white pl-5 pr-12 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#1A7A6E]/50 focus:outline-none focus:ring-1 focus:ring-[#1A7A6E]/20"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#1A7A6E] text-white transition hover:bg-[#0F4F47]"
                    aria-label="Search"
                  >
                    <Search size={20} strokeWidth={2} />
                  </button>
                </form>

                {deferredSearch.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[1300] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_28px_54px_rgba(12,34,38,0.12)]">
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-neutral-200 px-4 py-3 text-xs font-semibold text-neutral-700">
                      <span>Search Results ({searchResults.length})</span>
                      <span className="text-neutral-400">Top matches</span>
                    </div>
                    {searchResults.length ? (
                      <div className="max-h-[22rem] overflow-auto">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-100"
                            href={`/product/${product.id}`}
                            onClick={() => setSearchQuery("")}
                          >
                            <img
                              className="h-12 w-12 rounded-lg border border-neutral-200 bg-white object-contain p-1"
                              src={assetUrl(product.image)}
                              alt={product.name}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-neutral-900">
                                {product.name}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-neutral-500">
                                {product.brand || titleFromSlug(product.category)}
                              </div>
                            </div>
                            <div className="text-sm font-extrabold text-neutral-900">
                              {formatCurrency(product.price, store?.settings.currency || "AUD")}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          No products found for &quot;{deferredSearch}&quot;
                        </p>
                        <div className="mt-1 text-sm text-neutral-600">
                          Try a brand, SKU, or remote name.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-[359px]:w-full max-[359px]:justify-between">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 transition hover:border-[#1A7A6E]/30 hover:bg-[#1A7A6E]/5 hover:text-[#0F4F47] max-[359px]:flex-1"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A7A6E] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#0F4F47] max-[359px]:flex-1"
                >
                  Register
                </Link>
                <Link
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                  href="/cart"
                  aria-label="Cart"
                >
                  <ShoppingCart size={24} strokeWidth={2.2} />
                  {cartItemCount ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C0392B] px-1 text-[10px] font-extrabold text-white">
                      {cartItemCount}
                    </span>
                  ) : null}
                </Link>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100 lg:hidden"
                  aria-expanded={mobileDrawerOpen}
                  aria-controls="mobile-drawer"
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileDrawerOpen((current) => !current)}
                >
                  <Menu size={20} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-section-shell">
          <nav className="hidden border-t border-neutral-200 bg-white/70 lg:block">
            <div
              className="site-container relative"
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-1">
                  {navItems.map(({ key, entry }) => {
                    const visibleColumns = (entry.columns ?? [])
                      .map((column) => ({
                        ...column,
                        items: column.items.filter((item) => !item.hidden),
                      }))
                      .filter((column) => column.items.length > 0);
                    const isOpen = activeDropdown === key;
                    const isActive =
                      routePath === entry.path ||
                      routePath.startsWith(`${entry.path}/`);

                    return (
                      <div
                        key={key}
                        className="relative"
                        onMouseEnter={() => setActiveDropdown(visibleColumns.length ? key : null)}
                      >
                        <Link
                          href={entry.path}
                          className={cx(
                            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
                            isActive || isOpen
                              ? "bg-[#1A7A6E]/10 text-[#0F4F47]"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {entry.title}
                          {visibleColumns.length ? (
                            <ChevronDown
                              size={12}
                              strokeWidth={2.2}
                              className={cx("transition", isOpen ? "rotate-180" : "")}
                            />
                          ) : null}
                        </Link>
                      </div>
                    );
                  })}
                  <Link
                    className="ml-2 inline-flex items-center justify-center rounded-lg bg-[#C0392B] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#A02D23]"
                    href="/products/all"
                  >
                    View Products
                  </Link>
                </div>
              </div>

              {activeDropdown
                ? (() => {
                    const menu = navItems.find((item) => item.key === activeDropdown);

                    if (!menu) {
                      return null;
                    }

                    const columns = (menu.entry.columns ?? [])
                      .map((column) => ({
                        ...column,
                        items: column.items.filter((item) => !item.hidden),
                      }))
                      .filter((column) => column.items.length > 0);

                    if (!columns.length) {
                      return null;
                    }

                    return (
                      <div className="absolute left-1/2 top-[calc(100%+0.65rem)] z-[1400] -translate-x-1/2 max-w-[calc(100vw-2rem)]">
                        <div className="w-[min(82rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,248,245,0.98))] shadow-[0_28px_54px_rgba(12,34,38,0.12)]">
                          <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.10),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,248,245,0.96))] px-6 py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
                                  {menu.entry.title}
                                </div>
                                <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
                                  Browse collections
                                </h3>
                              </div>
                              <Link
                                href={menu.entry.path}
                                className="inline-flex items-center rounded-full border border-[#1A7A6E]/20 bg-[#1A7A6E]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0F4F47] transition hover:bg-[#1A7A6E]/15"
                                onClick={() => setActiveDropdown(null)}
                              >
                                Explore All
                              </Link>
                            </div>
                          </div>
                          <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden p-4">
                            <div
                              className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,15.5rem),1fr))]"
                            >
                              {columns.map((column) => {
                                const { regularItems, shopItem } = splitNavigationItems(column);

                                return (
                                  <section
                                    key={`${menu.key}-${column.title}`}
                                    className="flex h-full min-w-0 flex-col rounded-[1.4rem] border border-neutral-200 bg-white/96 p-4 shadow-[0_14px_32px_rgba(12,34,38,0.08)]"
                                  >
                                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
                                      {column.title}
                                    </h3>
                                    <div className="mt-3 grid gap-2">
                                      {regularItems.map((item) => (
                                        <Link
                                          key={item.path}
                                          href={item.path}
                                          className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 transition hover:border-[#1A7A6E]/20 hover:bg-neutral-50"
                                          onClick={() => setActiveDropdown(null)}
                                        >
                                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                                            <img
                                              src={iconFromIndex(item.iconIndex)}
                                              alt={item.name}
                                              className="h-6 w-6 object-contain"
                                            />
                                          </span>
                                          <span className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-neutral-900">
                                            {item.name}
                                          </span>
                                          <ChevronRight
                                            size={16}
                                            strokeWidth={2}
                                            className="shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-700"
                                          />
                                        </Link>
                                      ))}
                                    </div>
                                    {shopItem ? (
                                      <div className="mt-auto pt-3">
                                        <Link
                                          href={shopItem.path}
                                          className="group flex w-full items-center gap-3 rounded-2xl border border-[#C0392B]/20 bg-[linear-gradient(135deg,rgba(192,57,43,0.10),rgba(231,76,60,0.08))] px-3 py-3 transition hover:border-[#C0392B]/30 hover:bg-[linear-gradient(135deg,rgba(192,57,43,0.14),rgba(231,76,60,0.12))]"
                                          onClick={() => setActiveDropdown(null)}
                                        >
                                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                                            <img
                                              src={iconFromIndex(shopItem.iconIndex)}
                                              alt={shopItem.name}
                                              className="h-6 w-6 object-contain"
                                            />
                                          </span>
                                          <span className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-neutral-900">
                                            {shopItem.name}
                                          </span>
                                          <ChevronRight
                                            size={16}
                                            strokeWidth={2}
                                            className="shrink-0 text-[#A02D23] transition group-hover:translate-x-0.5"
                                          />
                                        </Link>
                                      </div>
                                    ) : null}
                                  </section>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                : null}
            </div>
          </nav>
          <div className="border-t border-neutral-200 bg-white/70 lg:hidden">
            <div className="site-container py-3">
              <Link className={SITE_PRIMARY_BUTTON_CLASS} href="/products/all">
                View Products
              </Link>
            </div>
          </div>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("navigation")}
            onAdd={addNavigationSection}
          />
        </div>

        {renderNavigationEditor()}

        {mobileDrawerOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 top-12 z-[1300] bg-black/40"
              aria-label="Close navigation drawer"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <aside
              className="fixed right-0 top-12 z-[1400] flex h-[calc(100vh-48px)] w-full max-w-[24rem] flex-col border-l border-neutral-200 bg-[#fbf8f5] p-5 shadow-[0_28px_54px_rgba(12,34,38,0.12)]"
              id="mobile-drawer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
                  <p className="text-sm text-neutral-600">
                    Browse categories, shop products, and access your account.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-6 grid gap-3 overflow-y-auto pb-6">
                {navItems.map(({ key, entry }) => {
                  const visibleColumns = (entry.columns ?? [])
                    .map((column) => ({
                      ...column,
                      items: column.items.filter((item) => !item.hidden),
                    }))
                    .filter((column) => column.items.length > 0);
                  const isExpanded = mobileExpandedMenu === key;

                  if (!visibleColumns.length) {
                    return (
                      <Link
                        key={key}
                        href={entry.path}
                        className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        {entry.title}
                      </Link>
                    );
                  }

                  return (
                    <section
                      key={key}
                      className={cx(
                        "overflow-hidden rounded-[1.4rem] border transition",
                        isExpanded
                          ? "border-[#1A7A6E]/25 bg-[linear-gradient(180deg,rgba(26,122,110,0.08),rgba(255,255,255,0.96))]"
                          : "border-neutral-200 bg-white",
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setMobileExpandedMenu((current) => (current === key ? null : key))
                        }
                      >
                        <span className="text-sm font-semibold text-neutral-900">
                          {entry.title}
                        </span>
                        <ChevronDown
                          size={16}
                          strokeWidth={2.2}
                          className={cx("text-neutral-500 transition", isExpanded ? "rotate-180" : "")}
                        />
                      </button>
                      {isExpanded ? (
                        <div className="border-t border-neutral-200 px-3 pb-3 pt-3">
                          <div className="mb-3">
                            <Link
                              href={entry.path}
                              className="inline-flex items-center rounded-full border border-[#1A7A6E]/20 bg-[#1A7A6E]/10 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0F4F47]"
                              onClick={() => setMobileDrawerOpen(false)}
                            >
                              Explore {entry.title}
                            </Link>
                          </div>
                          <div className="grid gap-3">
                            {visibleColumns.map((column) => {
                              const { regularItems, shopItem } = splitNavigationItems(column);

                              return (
                                <section
                                  key={`${key}-${column.title}`}
                                  className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                                >
                                  <h3 className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                                    {column.title}
                                  </h3>
                                  <div className="mt-2 grid gap-1.5">
                                    {regularItems.map((item) => (
                                      <Link
                                        key={item.path}
                                        href={item.path}
                                        className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-2.5 py-2.5 transition hover:border-[#1A7A6E]/20 hover:bg-neutral-50"
                                        onClick={() => setMobileDrawerOpen(false)}
                                      >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                                          <img
                                            src={iconFromIndex(item.iconIndex)}
                                            alt={item.name}
                                            className="h-6 w-6 object-contain"
                                          />
                                        </span>
                                        <span className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-neutral-900">
                                          {item.name}
                                        </span>
                                        <ChevronRight
                                          size={16}
                                          strokeWidth={2}
                                          className="shrink-0 text-neutral-400"
                                        />
                                      </Link>
                                    ))}
                                    {shopItem ? (
                                      <Link
                                        href={shopItem.path}
                                        className="group flex w-full items-center gap-3 rounded-2xl border border-[#C0392B]/20 bg-[linear-gradient(135deg,rgba(192,57,43,0.10),rgba(231,76,60,0.08))] px-2.5 py-2.5 transition hover:border-[#C0392B]/30"
                                        onClick={() => setMobileDrawerOpen(false)}
                                      >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                                          <img
                                            src={iconFromIndex(shopItem.iconIndex)}
                                            alt={shopItem.name}
                                            className="h-6 w-6 object-contain"
                                          />
                                        </span>
                                        <span className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-neutral-900">
                                          {shopItem.name}
                                        </span>
                                        <ChevronRight
                                          size={16}
                                          strokeWidth={2}
                                          className="shrink-0 text-[#A02D23]"
                                        />
                                      </Link>
                                    ) : null}
                                  </div>
                                </section>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </section>
                  );
                })}

                <Link
                  href="/products/all"
                  className="rounded-2xl bg-[#C0392B] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#A02D23]"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  View Products
                </Link>

                <div className="grid gap-2">
                  <Link
                    href="/login"
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-2xl bg-[#1A7A6E] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0F4F47]"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </div>
            </aside>
          </>
        ) : null}
      </header>
    );
  }

  function renderFeatureIcon(icon: string, index: number, title: string) {
    if (isImageReference(icon)) {
      return <img src={assetUrl(icon)} alt={title} />;
    }

    const fallback = FEATURE_ICON_FALLBACKS[index] ?? FEATURE_ICON_FALLBACKS[0];

    return <img src={assetUrl(fallback)} alt={title} />;
  }

  function renderProductCard(product: Product, extraClassName?: string) {
    const imageUrl = assetUrl(product.image || "/images/mainlogo.png");

    return (
      <div key={product.id} className={extraClassName ? extraClassName : undefined}>
        <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/85 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_54px_rgba(12,34,38,0.12)]">
          <Link
            className="relative flex aspect-square items-center justify-center overflow-hidden bg-white"
            href={`/product/${product.id}`}
          >
            <img
              className={cx(
                "h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105 sm:p-5",
                product.inStock ? "" : "opacity-50",
              )}
              src={imageUrl}
              alt={product.name}
            />
            <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 sm:left-3 sm:top-3">
              {product.inStock ? (
                <span className="inline-flex max-w-full items-center gap-2 self-start rounded-full bg-[#1A7A6E]/10 px-3 py-1.5 text-xs font-extrabold text-[#0F4F47]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A7A6E]" />
                  In Stock
                </span>
              ) : (
                <span className="inline-flex max-w-full items-center self-start rounded-full bg-neutral-200 px-3 py-1.5 text-xs font-extrabold text-neutral-600">
                  Out of Stock
                </span>
              )}
            </div>
          </Link>
          <div className="flex flex-1 flex-col bg-white p-3 sm:p-5">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
              {product.brand?.trim() || "ALLREMOTES"}
            </p>
            <Link href={`/product/${product.id}`} className="mb-3 block">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-[#A02D23] sm:text-base">
                {product.name}
              </h3>
            </Link>
            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-base font-extrabold tracking-tight text-neutral-900 sm:text-lg">
                  {formatCurrency(product.price || 0, store?.settings.currency || "AUD")}
                </span>
              </div>
              {product.inStock ? (
                <button
                  type="button"
                  className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#C0392B] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23] sm:w-auto sm:py-2"
                  onClick={() => addProductToCart(product)}
                >
                  <ShoppingCart size={14} strokeWidth={1.8} />
                  Add to Cart
                </button>
              ) : (
                <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-400">
                  Out of stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderHome() {
    if (!store) {
      return null;
    }

    const hero = store.homeContent.hero;
    const heroImages = store.homeContent.heroImages.length
      ? store.homeContent.heroImages
      : ["/images/hero.jpg", "/images/heroimg.jpg"];
    const carProductsCount = store.products.filter((product) => matchesProductCategory(product, "car")).length;
    const garageProductsCount = store.products.filter((product) =>
      matchesProductCategory(product, "garage"),
    ).length;
    const heroSlides = heroImages.map((image, index) => {
      if (index === 1) {
        return {
          image,
          subtitle: "Automotive remote keys",
          title: "Replacement Car Keys & Smart Remotes",
          description:
            (carProductsCount
              ? `Browse ${carProductsCount}+ automotive remote options across smart keys, shells, and replacement key solutions.`
              : "Browse automotive remote options across smart keys, shells, and replacement key solutions.") +
            " Built for clean fitment, dependable day-to-day use, and fast reordering.",
          primaryCta: "Shop Automotive",
          primaryCtaPath: "/products/car",
          secondaryCta: "View All Products",
          secondaryCtaPath: "/products/all",
        };
      }

      if (index === 2) {
        return {
          image,
          subtitle: "Garage & gate access",
          title: "Garage, Gate & Access Remotes",
          description:
            (garageProductsCount
              ? `Explore ${garageProductsCount}+ garage and gate remote options for home, building, and access automation needs.`
              : "Explore garage and gate remote options for home, building, and access automation needs.") +
            " A practical range backed by responsive support and reliable fulfilment.",
          primaryCta: "Shop Garage & Gate",
          primaryCtaPath: "/products/garage",
          secondaryCta: "Browse Best Sellers",
          secondaryCtaPath: "/products/all",
        };
      }

      return {
        image,
        subtitle: hero.subtitle || "Quality is Guaranteed",
        title: hero.title || "Garage Door & Gate Remotes",
        description:
          hero.description ||
          "Your trusted source for premium car and garage remotes. Browse reliable replacements, accessories, and business-ready service support.",
        primaryCta: hero.primaryCta || "Shop Car Remotes",
        primaryCtaPath: hero.primaryCtaPath || "/products/car",
        secondaryCta: hero.secondaryCta || "Shop Garage Remotes",
        secondaryCtaPath: hero.secondaryCtaPath || "/products/garage",
      };
    });

    return (
      <div className="animate-[fadeIn_0.3s_ease-out]">
        <div className="editor-section-shell">
          <section className="relative overflow-hidden border-b border-neutral-200/70">
            <div className="relative h-[500px] sm:h-[540px] lg:h-[620px]">
              <div className="absolute inset-0">
                {heroSlides.map((slide, index) => (
                  <img
                    key={`${slide.image}_${index}`}
                    src={assetUrl(slide.image)}
                    alt=""
                    className={cx(
                      "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out",
                      heroIndex === index ? "hero-slide-image--active opacity-100" : "opacity-0",
                    )}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/92 via-neutral-900/72 to-neutral-900/46" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_42%)]" />
              </div>

              <div className="site-container relative z-10 flex h-full items-center py-8 sm:py-10">
                <div className="relative min-h-[320px] w-full max-w-4xl sm:min-h-[360px] lg:min-h-[390px]">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={`hero-content-${index}`}
                      className={cx(
                        "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        heroIndex === index
                          ? "hero-slide-content translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-3 opacity-0",
                      )}
                    >
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1A7A6E]/35 bg-[#1A7A6E]/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#3C9697] backdrop-blur-sm">
                        <Check size={12} strokeWidth={2.5} />
                        {slide.subtitle}
                      </div>
                      <h1 className="mt-5 max-w-3xl text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                        {slide.title}
                      </h1>
                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                        {slide.description}
                      </p>
                      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                          href={slide.primaryCtaPath}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition-all hover:bg-[#A02D23] sm:w-auto"
                        >
                          {slide.primaryCta}
                          <ChevronRight size={15} strokeWidth={2.5} />
                        </Link>
                        <Link
                          href={slide.secondaryCtaPath}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15 sm:w-auto"
                        >
                          {slide.secondaryCta}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.image}_indicator_${index}`}
                    type="button"
                    className={cx(
                      "h-2 rounded-full transition-all duration-500 ease-out",
                      heroIndex === index
                        ? "w-8 bg-white"
                        : "w-2 bg-white/45 hover:bg-white/70",
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setHeroIndex(index)}
                  />
                ))}
              </div>
            </div>
          </section>
          <SectionToolbar visible={Boolean(session)} onEdit={() => openEditor("hero")} />
        </div>

        {renderHeroEditor()}

        <div className="overflow-hidden border-y border-neutral-200 bg-white/70">
          <div className="feedback-marquee">
            <div className="feedback-marquee-track py-3">
              {[...DEFAULT_TRUST_ITEMS, ...DEFAULT_TRUST_ITEMS].map((item, index) => (
                <div
                  key={`${item.label}_${index}`}
                  className="flex shrink-0 items-center gap-2 px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-700"
                >
                  <span className="text-[#1A7A6E]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-section-shell">
          <section className="site-container py-10 sm:py-14">
            <div className="grid gap-10">
              <div className="max-w-2xl">
                <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                  {store.homeContent.featuresTitle || "Browse By Category"}
                </span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                  Start with the remote type you need
                </h2>
                <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                  Move through automotive, garage, gate, home, and locksmith ranges
                  with clearer entry points and business-ready product organization.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {store.homeContent.features.map((feature, index) => (
                  <div key={`${feature.title}_${index}`} className={cx(SITE_CARD_CLASS, "p-6")}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
                        <div className="h-10 w-10 overflow-hidden rounded-xl">
                          {renderFeatureIcon(feature.icon, index, feature.title)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-neutral-900">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-neutral-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    {feature.path && feature.linkText ? (
                      <Link
                        className="mt-5 inline-flex text-sm font-semibold text-[#0F4F47] hover:text-[#1A7A6E]"
                        href={feature.path}
                      >
                        {feature.linkText}
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("features")}
            onAdd={() => {
              updateHome((current) => ({
                ...current,
                features: [
                  ...current.features,
                  {
                    icon: "",
                    title: "",
                    description: "",
                    path: "/products/all",
                    linkText: "Explore →",
                  },
                ],
              }));
              setActiveEditor("features");
            }}
          />
        </div>

        {renderFeaturesEditor()}

        <div className="editor-section-shell">
          <section className="site-container py-10 sm:py-14">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#A02D23]">
                Best Sellers
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Featured Products
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                Browse our most popular remote controls across car, garage, and
                access-control categories.
              </p>
            </div>
            {featuredProducts.length ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {featuredProducts.map((product) => renderProductCard(product))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 text-sm font-semibold text-neutral-700">
                No products available right now.
              </div>
            )}
            <div className="mt-8">
              <Link className={SITE_PRIMARY_BUTTON_CLASS} href="/products/all">
                View All Products
              </Link>
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("products")}
            onAdd={addProduct}
          />
        </div>

        {renderProductsEditor()}

        <div className="editor-section-shell">
          <section className="site-container py-10 sm:py-14">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                Why ALLREMOTES
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Built for repeat orders and dependable support
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                The store is designed for straightforward product discovery,
                cleaner reorder flows, and support that understands remote keys.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {store.homeContent.whyBuy.map((item, index) => {
                const Icon = resolveWhyBuyIcon(item, index);

                return (
                  <div key={`${item.title}_${index}`} className={cx(SITE_CARD_CLASS, "p-6")}>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A7A6E]/10 text-[#0F4F47]">
                      <Icon size={22} strokeWidth={2.1} />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("why-buy")}
            onAdd={() => {
              updateHome((current) => ({
                ...current,
                whyBuy: [
                  ...current.whyBuy,
                  {
                    icon: "✓",
                    title: "",
                    description: "",
                  },
                ],
              }));
              setActiveEditor("why-buy");
            }}
          />
        </div>

        {renderWhyBuyEditor()}

        <div className="editor-section-shell">
          <section className="site-container py-10 sm:py-14">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#A02D23]">
                Customer Feedback
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Trusted by homeowners, workshops, and trade buyers
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                Real reviews from customers ordering replacement remotes, smart
                keys, and access-control products.
              </p>
            </div>
            <div className="feedback-marquee mt-8" aria-live="polite">
              <div className="feedback-marquee-track">
                {marqueeReviews.map((review, index) => (
                  <div
                    key={`${review.author}-${index}`}
                    aria-hidden={index >= marqueeReviews.length / 2}
                    className="w-[min(88vw,22rem)] shrink-0 pr-3 sm:w-[20rem] sm:pr-4 lg:w-[22rem]"
                  >
                    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                      <div className="text-sm font-extrabold">
                        <span className="text-[#C0392B]">
                          {"★".repeat(Math.max(1, Math.min(5, review.rating)))}
                        </span>
                        <span className="text-neutral-300">
                          {"☆".repeat(5 - Math.max(1, Math.min(5, review.rating)))}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-neutral-700">
                        &quot;{review.text}&quot;
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <strong className="text-sm font-semibold text-neutral-900">
                          {review.author}
                        </strong>
                        {review.verified ? (
                          <span className="rounded-full bg-[#1A7A6E]/10 px-3 py-1 text-xs font-semibold text-[#0F4F47]">
                            Verified Purchase
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("reviews")}
            onAdd={addReview}
          />
        </div>

        {renderReviewsEditor()}

        <div className="editor-section-shell">
          <section className="site-container py-10 sm:py-14">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(130%_120%_at_2%_0%,rgba(26,122,110,0.30)_0%,rgba(26,122,110,0.10)_40%,transparent_68%),radial-gradient(110%_120%_at_100%_4%,rgba(192,57,43,0.24)_0%,rgba(192,57,43,0.08)_46%,transparent_74%),linear-gradient(102deg,rgba(26,122,110,0.14)_0%,rgba(60,150,151,0.12)_52%,rgba(192,57,43,0.14)_100%)] p-8 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur sm:p-12">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  {store.homeContent.ctaSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
                  {store.homeContent.ctaSection.description}
                </p>
                <Link
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#C0392B] px-8 py-4 text-base font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23] sm:w-auto"
                  href={store.homeContent.ctaSection.buttonPath}
                >
                  {store.homeContent.ctaSection.buttonText}
                </Link>
              </div>
            </div>
          </section>
          <SectionToolbar visible={Boolean(session)} onEdit={() => openEditor("cta")} />
        </div>

        {renderCtaEditor()}
      </div>
    );
  }

  function renderCategoryLanding(sectionKey: string, section: NavigationSectionEntry) {
    const visibleColumns = (section.columns ?? [])
      .map((column) => ({
        ...column,
        items: column.items.filter((item) => !item.hidden),
      }))
      .filter((column) => column.items.length > 0);
    const relatedProducts = (store?.products ?? [])
      .filter((product) => matchesProductCategory(product, sectionKey))
      .slice(0, 8);

    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="border-b border-neutral-200 bg-white">
          <div className="site-container py-14 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              {section.title}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-neutral-500">
              {CATEGORY_SUBTITLES[sectionKey] ||
                `Explore ${section.title.toLowerCase()} resources and products.`}
            </p>
          </div>
        </div>

        {visibleColumns.length ? (
          <div className="border-b border-neutral-100 bg-white/50">
            <div className="site-container py-12">
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {visibleColumns.map((column, columnIndex) => (
                  <section key={`${column.title}_${columnIndex}`}>
                    <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                      {column.title}
                    </h2>
                    <div className="grid gap-2">
                      {column.items.map((item) => (
                        <Link
                          key={item.path}
                          href={
                            sectionKey === "shop-by-brand"
                              ? `/products/all?brand=${encodeURIComponent(
                                  String(item.name || "").toUpperCase(),
                                )}`
                              : item.path
                          }
                          className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-[#C0392B]/30 hover:shadow-md"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50">
                            <img
                              src={iconFromIndex(item.iconIndex)}
                              alt={item.name}
                              className="h-6 w-6 object-contain"
                            />
                          </span>
                          <span className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-800 transition-colors group-hover:text-[#C0392B]">
                            {item.name}
                          </span>
                          <ChevronRight
                            className="ml-auto h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#C0392B]"
                            strokeWidth={2}
                          />
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {relatedProducts.length ? (
          <div className="site-container py-12">
            <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Featured Products
              </h2>
              <Link
                href={section.path}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#C0392B] transition-colors hover:text-[#A02D23]"
              >
                View All
                <ChevronRight size={16} strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {relatedProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderCategoryLeaf(sectionKey: string, section: NavigationSectionEntry, item: NavigationItem) {
    const relatedProducts = (store?.products ?? [])
      .filter((product) => matchesProductCategory(product, sectionKey))
      .slice(0, 8);

    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="border-b border-neutral-200 bg-white">
          <div className="site-container py-14 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              {item.name}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-neutral-500">
              Browse related resources and products from {section.title}.
            </p>
          </div>
        </div>

        <div className="border-b border-neutral-100 bg-white/50">
          <div className="site-container py-12">
            <section>
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                Explore More In {section.title}
              </h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {(section.columns ?? [])
                  .flatMap((column) => column.items.filter((entry) => !entry.hidden))
                  .map((entry) => (
                    <Link
                      key={entry.path}
                      href={entry.path}
                      className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-[#C0392B]/30 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50">
                        <img
                          src={iconFromIndex(entry.iconIndex)}
                          alt={entry.name}
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-800 transition-colors group-hover:text-[#C0392B]">
                        {entry.name}
                      </span>
                      <ChevronRight
                        className="ml-auto h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#C0392B]"
                        strokeWidth={2}
                      />
                    </Link>
                  ))}
              </div>
            </section>
          </div>
        </div>

        <div className="site-container py-12">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Popular Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {relatedProducts.map((product) => renderProductCard(product))}
          </div>
        </div>
      </div>
    );
  }

  function renderContactPage() {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="border-b border-neutral-200 bg-white">
          <div className="site-container py-16 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#C0392B]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#C0392B]">
              <Mail size={14} strokeWidth={2} />
              Get in Touch
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Have a question about our products or need help finding the right remote?
              Our friendly team is here to help.
            </p>
          </div>
        </div>

        <div className="site-container py-12">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="flex flex-col gap-5 lg:col-span-2">
              {[
                {
                  title: "Email",
                  value: store?.homeContent.footer.email || settingsContent.supportLinkLabel,
                  meta: "We typically respond within 2-4 hours",
                  href: `mailto:${store?.homeContent.footer.email || "support@allremotes.com"}`,
                  icon: Mail,
                  accent: "bg-[#C0392B]/10 text-[#C0392B]",
                },
                {
                  title: "Phone",
                  value: settingsContent.supportPhone,
                  meta: "Call us during business hours",
                  href: `tel:${settingsContent.supportPhone.replace(/\s+/g, "")}`,
                  icon: Phone,
                  accent: "bg-emerald-50 text-emerald-600",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#C0392B]/30 hover:shadow-md"
                  >
                    <div
                      className={cx(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors group-hover:text-white",
                        item.accent,
                      )}
                    >
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                      {item.title}
                    </h3>
                    <a
                      href={item.href}
                      className="mt-1 block text-lg font-semibold text-neutral-900 transition-colors hover:text-[#C0392B]"
                    >
                      {item.value}
                    </a>
                    <p className="mt-1 text-sm text-neutral-500">{item.meta}</p>
                  </div>
                );
              })}

              <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#C0392B]/30 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <Clock3 size={22} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                  Business Hours
                </h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Monday – Friday</span>
                    <span className="font-semibold text-neutral-900">
                      {settingsContent.supportHoursWeekdays.replace(/^Monday - Friday:\s*/i, "")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Saturday</span>
                    <span className="font-semibold text-neutral-900">
                      {settingsContent.supportHoursSaturday.replace(/^Saturday:\s*/i, "")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Sunday</span>
                    <span className="font-semibold text-neutral-500">Closed</span>
                  </div>
                </div>
              </div>

              <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#C0392B]/30 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <MapPin size={22} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                  Location
                </h3>
                <p className="mt-1 text-base font-semibold text-neutral-900">Australia-wide Service</p>
                <p className="mt-1 text-sm text-neutral-500">
                  We ship to all states and territories
                </p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Send us a Message
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>

                {contactSubmitted ? (
                  <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                    <Check size={18} strokeWidth={2.5} />
                    Thank you! Your message has been sent successfully.
                  </div>
                ) : null}

                <form
                  className="mt-8 space-y-6"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    setContactSubmitted(true);
                    setContactForm({ name: "", email: "", subject: "", message: "" });
                  }}
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="mb-2 block text-sm font-semibold text-neutral-700"
                      >
                        Your Name <span className="text-[#C0392B]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        required
                        value={contactForm.name}
                        onChange={(event) =>
                          setContactForm((current) => ({ ...current, name: event.target.value }))
                        }
                        className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#C0392B] focus:outline-none focus:ring-1 focus:ring-[#C0392B]/30"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="mb-2 block text-sm font-semibold text-neutral-700"
                      >
                        Email Address <span className="text-[#C0392B]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(event) =>
                          setContactForm((current) => ({ ...current, email: event.target.value }))
                        }
                        className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#C0392B] focus:outline-none focus:ring-1 focus:ring-[#C0392B]/30"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block text-sm font-semibold text-neutral-700"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      value={contactForm.subject}
                      onChange={(event) =>
                        setContactForm((current) => ({ ...current, subject: event.target.value }))
                      }
                      className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#C0392B] focus:outline-none focus:ring-1 focus:ring-[#C0392B]/30"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-semibold text-neutral-700"
                    >
                      Your Message <span className="text-[#C0392B]">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={6}
                      value={contactForm.message}
                      onChange={(event) =>
                        setContactForm((current) => ({ ...current, message: event.target.value }))
                      }
                      className="w-full resize-none rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#C0392B] focus:outline-none focus:ring-1 focus:ring-[#C0392B]/30"
                      placeholder="Tell us what you need help with..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C0392B] px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#A02D23] sm:w-auto"
                  >
                    <Mail size={16} strokeWidth={2.2} />
                    Send Message
                  </button>
                </form>
              </div>

              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm">
                    <Headset size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Looking for quick answers?</h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Check our support section for FAQs about shipping, returns, warranty,
                      and compatibility guides.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProductsPage() {
    if (page.kind !== "products") {
      return null;
    }

    const pageTitle =
      catalogBrand !== "all"
        ? catalogBrand
        : PRODUCT_HERO_CONTENT[page.routeCategory]?.title || titleFromSlug(page.routeCategory);
    const pageSize = store?.settings.itemsPerPage || 12;
    const visiblePages = (() => {
      const pages = new Set<number | string>([1, totalPages]);
      for (let pageNumber = currentPage - 2; pageNumber <= currentPage + 2; pageNumber += 1) {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
          pages.add(pageNumber);
        }
      }

      const sorted = Array.from(pages).sort((left, right) => Number(left) - Number(right)) as number[];
      const items: Array<number | string> = [];

      for (let index = 0; index < sorted.length; index += 1) {
        const value = sorted[index];
        const previous = sorted[index - 1];

        if (index > 0 && value - previous > 1) {
          items.push("…");
        }

        items.push(value);
      }

      return items;
    })();

    const filters = (
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-700">Search</span>
          <input
            id="catalog-search"
            value={catalogSearch}
            onChange={(event) => setCatalogSearch(event.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm transition focus:border-[#C0392B] focus:outline-none focus:ring-1"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-700">Brand</span>
          <select
            id="catalog-brand"
            value={catalogBrand}
            onChange={(event) => setCatalogBrand(event.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm transition focus:border-[#C0392B] focus:outline-none focus:ring-1"
          >
            <option value="all">All brands</option>
            {catalogBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-700">Stock</span>
          <select
            id="catalog-stock"
            value={catalogStock}
            onChange={(event) => setCatalogStock(event.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm transition focus:border-[#C0392B] focus:outline-none focus:ring-1"
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-700">Sort</span>
          <select
            id="catalog-sort"
            value={catalogSort}
            onChange={(event) => setCatalogSort(event.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm transition focus:border-[#C0392B] focus:outline-none focus:ring-1"
          >
            <option value="featured">Featured</option>
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>

        <button
          type="button"
          className={SITE_OUTLINE_BUTTON_CLASS}
          onClick={() => {
            setCatalogSearch("");
            setCatalogBrand("all");
            setCatalogStock("all");
            setCatalogSort("featured");
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </button>
      </div>
    );

    return (
      <div className="animate-[fadeIn_0.3s_ease-out]">
        <div className="site-container py-8 sm:py-10">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(251,248,245,0.88))] p-7 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Browse our complete range of remotes and accessories.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={cx(SITE_SUBTLE_CHIP_CLASS, "bg-[#1A7A6E]/10 text-[#0F4F47]")}>
                Quality Tested
              </span>
              <span className={cx(SITE_SUBTLE_CHIP_CLASS, "bg-[#C0392B]/10 text-[#A02D23]")}>
                Fast Shipping
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
            <aside className={cx(SITE_PANEL_CLASS, "hidden p-6 lg:block")}>{filters}</aside>

            <main className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-600">
                  Showing {catalogProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{" "}
                  {Math.min(currentPage * pageSize, catalogProducts.length)} of{" "}
                  {catalogProducts.length} products
                </p>
                <button
                  type="button"
                  className={cx(SITE_OUTLINE_BUTTON_CLASS, "px-4 py-2 text-xs lg:hidden")}
                  onClick={() => setCatalogFiltersOpen(true)}
                  aria-label="Open filters"
                >
                  ☰ Filters
                </button>
              </div>

              {pagedCatalogProducts.length ? (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                    {pagedCatalogProducts.map((product) => renderProductCard(product))}
                  </div>

                  {totalPages > 1 ? (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                      <button
                        type="button"
                        className={cx(SITE_OUTLINE_BUTTON_CLASS, "px-4 py-2 text-xs")}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                      >
                        Prev
                      </button>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {visiblePages.map((pageNumber, index) =>
                          pageNumber === "…" ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-neutral-400">
                              …
                            </span>
                          ) : (
                            <button
                              key={pageNumber}
                              type="button"
                              className={cx(
                                "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition",
                                pageNumber === currentPage
                                  ? "bg-[#C0392B] text-white"
                                  : "border border-neutral-200 bg-white text-neutral-800 hover:border-[#1A7A6E]/30 hover:bg-[#1A7A6E]/5 hover:text-[#0F4F47]",
                              )}
                              onClick={() => setCurrentPage(Number(pageNumber))}
                            >
                              {pageNumber}
                            </button>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        className={cx(SITE_OUTLINE_BUTTON_CLASS, "px-4 py-2 text-xs")}
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((current) => Math.min(totalPages, current + 1))
                        }
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 text-sm font-semibold text-neutral-700">
                  No products found.
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="editor-section-shell">
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("products")}
            onAdd={addProduct}
          />
        </div>

        {renderProductsEditor()}

        {catalogFiltersOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 top-12 z-[1300] bg-black/40"
              aria-label="Close filters"
              onClick={() => setCatalogFiltersOpen(false)}
            />
            <aside className="fixed right-0 top-12 z-[1400] h-[calc(100vh-48px)] w-full max-w-[24rem] overflow-y-auto border-l border-neutral-200 bg-[#fbf8f5] p-5 shadow-[0_28px_54px_rgba(12,34,38,0.12)] lg:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
                  <p className="text-sm text-neutral-600">
                    Narrow the catalog by brand, stock status, and search terms.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700"
                  onClick={() => setCatalogFiltersOpen(false)}
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
              <div className="mt-5">{filters}</div>
            </aside>
          </>
        ) : null}
      </div>
    );
  }

  function renderProductDetail() {
    if (!store || page.kind !== "product") {
      return null;
    }

    const product = store.products.find((entry) => entry.id === page.productId);

    if (!product) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center py-16">
          <div className="mx-auto w-full max-w-7xl px-5">
            <h2 className="text-center text-2xl font-bold text-sf-body">Product not found</h2>
          </div>
        </div>
      );
    }

    const relatedProducts = store.products
      .filter((entry) => entry.id !== product.id && matchesProductCategory(entry, product.category))
      .slice(0, 4);

    return (
      <>
        <div className="editor-section-shell">
          <div className="site-container py-8 sm:py-10">
            <Link
              href="/products/all"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-100"
            >
              <ChevronRight className="rotate-180" size={16} strokeWidth={2} />
              Back to Products
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
              <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_14px_32px_rgba(12,34,38,0.08)]">
                <img
                  src={assetUrl(product.image)}
                  alt={product.name}
                  className="relative h-full w-full max-h-[28rem] object-contain p-6 sm:max-h-[34rem]"
                />
              </div>

              <div className={cx(SITE_CARD_CLASS, "p-6 sm:p-8")}>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                  {product.brand || "ALLREMOTES"}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  {product.name}
                </h1>
                <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
                    {formatCurrency(product.price, store.settings.currency)}
                  </p>
                  <span
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold",
                      product.inStock
                        ? "bg-[#1A7A6E]/10 text-[#0F4F47]"
                        : "bg-neutral-200 text-neutral-600",
                    )}
                  >
                    {product.inStock ? <Check size={16} strokeWidth={2.2} /> : null}
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <p className="mt-6 text-sm leading-7 text-neutral-600">
                  {product.description || product.name}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C0392B] px-6 py-3 text-sm font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23] disabled:opacity-60"
                    disabled={!product.inStock}
                    onClick={() => addProductToCart(product)}
                  >
                    <ShoppingCart size={18} />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <Link
                    href="/cart"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-extrabold text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-neutral-200 bg-white/80 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur">
              <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                Description
              </div>
              <div className="p-5 text-sm leading-7 text-neutral-600 sm:p-6">
                {product.description || product.name}
              </div>
            </div>

            {relatedProducts.length ? (
              <div className="mt-10">
                <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                      Related Products
                    </h2>
                    <p className="text-sm text-neutral-600">
                      Similar products from the live catalog
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {relatedProducts.map((entry) => renderProductCard(entry))}
                </div>
              </div>
            ) : null}
          </div>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("products")}
            onAdd={addProduct}
          />
        </div>
        {renderProductsEditor()}
      </>
    );
  }

  function renderCartPage() {
    if (!cartItems.length) {
      return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <div className="site-container py-10 sm:py-12">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(251,248,245,0.88))] p-8 shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur sm:p-12">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                Checkout ready
              </span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Shopping Cart
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                Your cart is empty. Browse the catalog and add a remote to get started.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className={cx(SITE_SUBTLE_CHIP_CLASS, "bg-neutral-100 text-neutral-700")}>
                  0 items
                </span>
                <span className={cx(SITE_SUBTLE_CHIP_CLASS, "bg-[#1A7A6E]/10 text-[#0F4F47]")}>
                  Free standard shipping
                </span>
              </div>
              <Link href="/products/all" className="mt-8 inline-flex rounded-full bg-[#C0392B] px-8 py-4 text-base font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23]">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-[fadeIn_0.3s_ease-out]">
        <div className="site-container py-8 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                Checkout ready
              </span>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Shopping Cart
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-sm">
                <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">
                  {cartItemCount}
                </strong>
                <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                  {cartItemCount === 1 ? "item selected" : "items selected"}
                </span>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-sm">
                <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">
                  Free
                </strong>
                <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                  standard shipping
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <div className="grid gap-4">
              {cartItems.map((item) => (
                <div key={item.id} className={cx(SITE_PANEL_CLASS, "p-4 sm:p-5")}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      href={`/product/${item.id}`}
                      className="mx-auto shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-[#1A7A6E]/40 sm:mx-0"
                    >
                      <img
                        src={assetUrl(item.image)}
                        alt={item.name}
                        className="h-24 w-24 object-contain"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${item.id}`} className="group inline-block max-w-full">
                        <h3 className="line-clamp-2 text-base font-semibold text-neutral-900 transition group-hover:text-[#0F4F47]">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                        {item.brand || titleFromSlug(item.category)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="text-lg font-extrabold tracking-tight text-neutral-900">
                          {formatCurrency(item.price, store?.settings.currency || "AUD")}
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="flex-1 rounded-full bg-[#C0392B]/10 px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-[#A02D23] hover:bg-[#C0392B]/15 sm:flex-none"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 sm:border-0 sm:bg-transparent sm:p-0">
                        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="inline-flex h-10 w-12 items-center justify-center border-x border-neutral-200 text-sm font-extrabold text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-lg font-extrabold tracking-tight text-neutral-900">
                          {formatCurrency(item.price * item.quantity, store?.settings.currency || "AUD")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={cx(SITE_PANEL_CLASS, "p-5 sm:p-6 lg:sticky lg:top-24")}>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Order Summary</h2>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal, store?.settings.currency || "AUD")}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-extrabold text-neutral-900">
                  <span>Total</span>
                  <span>{formatCurrency(cartSubtotal, store?.settings.currency || "AUD")}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#C0392B] px-6 py-4 text-base font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23]"
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={() => setCartItems([])}
                className="mt-3 w-full rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-extrabold text-neutral-800 shadow-sm hover:bg-neutral-100"
              >
                Clear Cart
              </button>
              <Link href="/products/all" className="mt-4 block text-center text-sm font-semibold text-[#0F4F47] hover:text-[#1A7A6E]">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCheckoutPage() {
    if (!cartItems.length) {
      return renderCartPage();
    }

    return (
      <div className="animate-[fadeIn_0.3s_ease-out]">
        <div className="site-container py-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F4F47]">
                Secure checkout
              </span>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Checkout
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                Contact info, shipping address, and payment details in one streamlined
                checkout flow.
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <div className="min-w-[10rem] flex-1 rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-sm sm:flex-none">
                <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">
                  {cartItemCount}
                </strong>
                <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                  items in order
                </span>
              </div>
              <div className="min-w-[10rem] flex-1 rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-sm sm:flex-none">
                <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">
                  Free
                </strong>
                <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                  standard shipping
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <div className="grid gap-5">
              <section className={cx(SITE_PANEL_CLASS, "p-5 sm:p-6")}>
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
                  Contact Information
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "fullName", label: "Full Name" },
                    { key: "email", label: "Email", type: "email" },
                  ].map((field) => (
                    <label key={field.key} className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">
                        {field.label}
                      </span>
                      <input
                        type={field.type || "text"}
                        value={checkoutForm[field.key as keyof typeof checkoutForm]}
                        onChange={(event) =>
                          setCheckoutForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 shadow-sm transition-colors focus:border-[#1A7A6E] focus:outline-none focus:ring-2 focus:ring-[#1A7A6E]/30"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className={cx(SITE_PANEL_CLASS, "p-5 sm:p-6")}>
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
                  Shipping Address
                </h2>
                <div className="mt-4 grid gap-3">
                  {[
                    { key: "address", label: "Street Address" },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                    { key: "zipCode", label: "Postcode" },
                  ].map((field) => (
                    <label key={field.key} className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">
                        {field.label}
                      </span>
                      <input
                        value={checkoutForm[field.key as keyof typeof checkoutForm]}
                        onChange={(event) =>
                          setCheckoutForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 shadow-sm transition-colors focus:border-[#1A7A6E] focus:outline-none focus:ring-2 focus:ring-[#1A7A6E]/30"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className={cx(SITE_PANEL_CLASS, "p-5 sm:p-6")}>
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
                  Payment Method
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "card", label: "Card", icon: CreditCard },
                    { id: "afterpay", label: "Afterpay", icon: Wallet },
                    { id: "bank", label: "Bank Deposit", icon: Bookmark },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = checkoutForm.paymentMethod === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setCheckoutForm((current) => ({
                            ...current,
                            paymentMethod: option.id,
                          }))
                        }
                        className={cx(
                          "flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-[#1A7A6E]/30 bg-[#1A7A6E]/10 text-[#0F4F47]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                        )}
                      >
                        <Icon size={18} strokeWidth={2} />
                        <span className="text-sm font-semibold">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className={cx(SITE_PANEL_CLASS, "p-5 sm:p-6 lg:sticky lg:top-24")}>
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">Order Summary</h2>
              <div className="mt-4 grid gap-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-neutral-800">{item.name}</div>
                      <div className="text-xs text-neutral-500">Qty {item.quantity}</div>
                    </div>
                    <div className="text-sm font-extrabold text-neutral-900">
                      {formatCurrency(item.price * item.quantity, store?.settings.currency || "AUD")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal, store?.settings.currency || "AUD")}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-neutral-900">
                  <span>Total</span>
                  <span>{formatCurrency(cartSubtotal, store?.settings.currency || "AUD")}</span>
                </div>
              </div>
              <button
                type="button"
                className="mt-6 w-full rounded-full bg-[#C0392B] px-6 py-4 text-base font-extrabold text-white shadow-[0_18px_38px_rgba(12,34,38,0.08)] transition hover:bg-[#A02D23]"
              >
                Place Order
              </button>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  function renderAccountPage() {
    const activeTab = ACCOUNT_TABS.some((tab) => tab.id === searchParams.get("tab"))
      ? (searchParams.get("tab") as (typeof ACCOUNT_TABS)[number]["id"])
      : "basics";
    const displayName = session?.name || "ALLREMOTES Customer";

    return (
      <div className="py-6 md:py-10">
        <div className="site-container">
          <div className="mb-6 grid justify-items-center border-y border-neutral-200/80 py-14 text-center md:py-20">
            <div className="w-full max-w-4xl">
              <h1 className="m-0 text-[clamp(2.2rem,5.2vw,4.6rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-neutral-900">
                My Account
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-neutral-600">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="grid gap-4 xl:sticky xl:top-[6.2rem]">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-sm max-md:flex-col max-md:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1A7A6E]/20 to-[#3C9697]/35 text-lg font-extrabold text-neutral-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-neutral-900">{displayName}</h3>
                  <p className="max-w-full break-all text-xs text-neutral-600">
                    support@allremotes.com
                  </p>
                </div>
              </div>

              <nav className="grid gap-2 rounded-2xl border border-neutral-200/80 bg-white/95 p-2 shadow-sm md:grid-cols-2 xl:grid-cols-1">
                {ACCOUNT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={cx(
                        "group flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100",
                        isActive ? "border-[#C0392B]/20 bg-[#C0392B]/10 text-[#A02D23] shadow-sm" : "",
                      )}
                      onClick={() => router.replace(`/account?tab=${tab.id}`)}
                    >
                      <span
                        className={cx(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[11px] font-bold",
                          isActive ? "border-[#C0392B]/20 text-[#A02D23]" : "",
                        )}
                      >
                        <Icon size={16} strokeWidth={2.1} />
                      </span>
                      <span className="text-sm font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="min-w-0">
              {activeTab === "basics" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Account Basics
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    {[
                      ["Full Name", displayName],
                      ["Email", "support@allremotes.com"],
                      ["Phone", settingsContent.supportPhone],
                      ["Member Type", "Trade buyer"],
                    ].map(([label, value]) => (
                      <div key={label} className="grid gap-2">
                        <span className="text-[0.78rem] font-bold uppercase tracking-[0.06em] text-neutral-700">
                          {label}
                        </span>
                        <div className="h-11 rounded-xl border border-neutral-300 bg-white px-3.5 leading-[44px] text-[0.97rem] text-neutral-900 shadow-sm">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "orders" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Orders & Shopping
                  </div>
                  <div className="grid gap-3 p-5 sm:p-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900">{item.name}</div>
                            <div className="text-xs text-neutral-500">Qty {item.quantity}</div>
                          </div>
                          <span className="inline-flex rounded-full border border-[#1A7A6E]/30 bg-[#1A7A6E]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#0F4F47]">
                            Processing
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "payments" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Payments & Billing
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    {["Mastercard", "VISA", "AMEX", "Afterpay", "Bank Deposit"].map((label) => (
                      <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-neutral-900">{label}</div>
                        <div className="mt-1 text-xs text-neutral-500">Available at checkout</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "addresses" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Addresses
                  </div>
                  <div className="p-5 text-sm leading-7 text-neutral-600 sm:p-6">
                    14 Collins Street
                    <br />
                    Melbourne VIC 3000
                    <br />
                    Australia
                  </div>
                </div>
              ) : null}

              {activeTab === "preferences" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Preferences & Saved
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    {store?.products.slice(0, 2).map((product) => renderProductCard(product))}
                  </div>
                </div>
              ) : null}

              {activeTab === "reviews" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Reviews & Interactions
                  </div>
                  <div className="grid gap-3 p-5 sm:p-6">
                    {customerReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="text-sm font-extrabold text-[#C0392B]">
                          {"★".repeat(review.rating)}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-neutral-600">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "notifications" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Notifications & Settings
                  </div>
                  <div className="grid gap-4 p-5 sm:p-6">
                    {["Order updates", "Promotions", "New arrivals"].map((label) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <span className="text-sm font-semibold text-neutral-900">{label}</span>
                        <span className="inline-flex rounded-full border border-[#1A7A6E]/30 bg-[#1A7A6E]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#0F4F47]">
                          Enabled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "help" ? (
                <div className={cx(SITE_PANEL_CLASS, "overflow-hidden")}>
                  <div className="border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900">
                    Help & Support
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    {[
                      { label: "Support Center", path: settingsContent.supportLinkPath },
                      { label: "Contact Us", path: settingsContent.contactLinkPath },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.path}
                        className="rounded-xl border border-neutral-200 bg-white p-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-[#1A7A6E]/30 hover:bg-[#1A7A6E]/5 hover:text-[#0F4F47]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFallback() {
    return (
      <div className="site-container py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white/85 p-8 text-center shadow-[0_14px_32px_rgba(12,34,38,0.08)] backdrop-blur sm:p-12">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
            {titleFromSlug(slug?.join(" ") || "Not Found")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
            This route exists in the public structure, but the live backend does not expose
            page-specific content for it yet.
          </p>
          <div className="mt-8">
            <Link className={SITE_PRIMARY_BUTTON_CLASS} href="/products/all">
              View All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function renderFooter() {
    return (
      <div className="editor-section-shell">
        <footer className="relative mt-0 overflow-hidden text-white [background:radial-gradient(circle_at_6%_18%,rgba(10,71,67,0.48),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(126,32,43,0.42),transparent_34%),linear-gradient(100deg,#0d2020_0%,#272326_48%,#5d1f29_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />
          <div className="site-container relative z-10 py-12 sm:py-14">
            <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2.85fr)] lg:gap-14">
              <section className="grid min-w-0 content-start justify-items-center gap-4 text-center lg:justify-items-start lg:text-left">
                <Link href="/" className="inline-flex w-fit max-w-full items-center" aria-label="ALLREMOTES home">
                  <img
                    src={assetUrl("/images/mainlogo.png")}
                    alt="ALLREMOTES"
                    className="h-[3.1rem] w-auto max-w-full brightness-0 invert sm:h-[3.5rem]"
                  />
                </Link>
                <p className="max-w-[22rem] text-[0.98rem] leading-7 text-white/80">
                  {store?.homeContent.footer.tagline ||
                    "Australia's trusted source for premium remote controls, automotive keys, and locksmithing tools. Quality guaranteed."}
                </p>
              </section>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                <section className="min-w-0">
                  <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                    Shop
                  </h4>
                  <ul className="grid gap-4">
                    {footerCategoryEntries().map(({ key, entry }) => (
                      <li key={key}>
                        <Link href={entry.path} className="inline-flex items-center">
                          <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
                            {entry.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href="/products/all" className="inline-flex items-center">
                        <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
                          All Products
                        </span>
                      </Link>
                    </li>
                  </ul>
                </section>
                <section className="min-w-0">
                  <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                    Support
                  </h4>
                  <ul className="grid gap-4">
                    {[
                      { href: settingsContent.supportLinkPath, label: settingsContent.supportLinkLabel },
                      { href: settingsContent.contactLinkPath, label: settingsContent.contactLinkLabel },
                      {
                        href: `mailto:${store?.homeContent.footer.email || "support@allremotes.com"}`,
                        label: store?.homeContent.footer.email || "support@allremotes.com",
                      },
                    ].map((item) => (
                      <li key={item.label}>
                        {item.href.startsWith("mailto:") ? (
                          <a href={item.href} className="inline-flex items-center">
                            <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
                              {item.label}
                            </span>
                          </a>
                        ) : (
                          <Link href={item.href} className="inline-flex items-center">
                            <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
                              {item.label}
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="min-w-0">
                  <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                    Company
                  </h4>
                  <ul className="grid gap-4">
                    {[
                      { href: settingsContent.privacyPath, label: settingsContent.privacyLabel },
                      { href: settingsContent.supportLinkPath, label: "Shipping & Delivery" },
                      { href: settingsContent.supportLinkPath, label: "Returns & Warranty" },
                      { href: settingsContent.supportLinkPath, label: "Safe & Secure Checkout" },
                    ].map((item) => (
                      <li key={item.label}>
                        <Link href={item.href} className="inline-flex items-center">
                          <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 lg:mt-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                {["30 Day Returns", "Trade Support", "Secure Payments"].map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 text-[0.94rem] font-medium text-white/75 max-[480px]:w-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-[0.96rem] text-white/45 lg:text-right">
                {settingsContent.footerCopyright}
              </p>
            </div>
          </div>
        </footer>
        <SectionToolbar visible={Boolean(session)} onEdit={() => openEditor("footer")} />
        {renderFooterEditor()}
      </div>
    );
  }

  let content: ReactNode = null;

  if (loading) {
    content = (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-sf-border border-t-brand-teal" />
      </div>
    );
  } else if (loadError) {
    content = (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-16">
        <div className="mx-auto w-full max-w-7xl px-5">
          <h2 className="text-center text-2xl font-bold text-sf-body">Unable to load live content</h2>
          <p className="mt-4 text-center text-lg text-sf-muted">{loadError}</p>
        </div>
      </div>
    );
  } else if (page.kind === "home") {
    content = renderHome();
  } else if (page.kind === "products") {
    content = renderProductsPage();
  } else if (page.kind === "product") {
    content = renderProductDetail();
  } else if (page.kind === "contact") {
    content = renderContactPage();
  } else if (page.kind === "cart") {
    content = renderCartPage();
  } else if (page.kind === "checkout") {
    content = renderCheckoutPage();
  } else if (page.kind === "account") {
    content = renderAccountPage();
  } else if (page.kind === "category") {
    content = renderCategoryLanding(page.sectionKey, page.section);
  } else if (page.kind === "category-leaf") {
    content = renderCategoryLeaf(page.sectionKey, page.section, page.item);
  } else {
    content = renderFallback();
  }

  return (
    <>
      <div className="storefront-editor-topbar">
        <div className="storefront-editor-topbar__brand">
          <span className="storefront-editor-topbar__dot" />
          <span>AllRemotes Admin</span>
        </div>
        <div className="storefront-editor-topbar__actions">
          <button
            type="button"
            className="storefront-editor-publish"
            disabled={!session || !dirtyCount || savingTarget !== null}
            onClick={handlePublishChanges}
          >
            {savingTarget === "publish" ? "Publishing..." : "Publish"}
          </button>
          {session ? (
            <button
              type="button"
              className="storefront-editor-avatar"
              aria-label="Log out"
              onClick={() => {
                clearAdminSession();
                setActiveEditor(null);
              }}
            >
              {(session.name || "Admin").slice(0, 1).toUpperCase()}
            </button>
          ) : (
            <Link className="storefront-editor-avatar" href={loginHref} aria-label="Sign in">
              A
            </Link>
          )}
        </div>
      </div>

      <div className="flex min-h-screen flex-col allremotes-admin-clone site-shell">
        {renderHeader()}
        <main>{content}</main>
        {renderFooter()}
      </div>

      {toast ? (
        <div
          className={`inline-save-banner ${
            toast.tone === "success"
              ? "inline-save-banner--success"
              : "inline-save-banner--error"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );
}
