/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  Users,
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
  saveSettings,
} from "@/lib/admin/api";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEFAULT_SETTINGS,
  type HomeContent,
  type NavigationItem,
  type NavigationSectionEntry,
  type NavigationTree,
  type Product,
  type PromotionsData,
  type Review,
  type SiteSettings,
} from "@/lib/admin/types";
import {
  authenticateAdmin,
  clearAdminSession,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";

const ASSET_ORIGIN = (process.env.NEXT_PUBLIC_ASSET_ORIGIN ?? "")
  .trim()
  .replace(/\/+$/, "");
const DEFAULT_TOP_BAR_ITEMS = [
  "12 MONTH WARRANTY",
  "30 DAY RETURNS",
  "SAFE & SECURE",
  "TRADE PRICING",
  "NO MINIMUM ORDER",
  "FREE SHIPPING",
];
const FEATURE_ICON_FALLBACKS = [
  "/remotes/010_s-l500.webp",
  "/remotes/002_s-l500.webp",
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
const WHY_BUY_ICON_MAP = {
  qa: ShieldCheck,
  shieldcheck: ShieldCheck,
  shield: ShieldCheck,
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
} as const;

type DirtyKey =
  | "home"
  | "navigation"
  | "promotions"
  | "reviews"
  | "products"
  | "settings";

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

  if (ASSET_ORIGIN) {
    return `${ASSET_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }

  return pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
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

function topBarIcon(text: string) {
  const upper = text.toUpperCase();

  if (upper.includes("WARRANTY")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  if (upper.includes("RETURN")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    );
  }

  if (upper.includes("SAFE") || upper.includes("SECURE")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }

  if (upper.includes("TRADE")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }

  if (upper.includes("FREE SHIPPING")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
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

function resolveWhyBuyIcon(
  card: Pick<HomeContent["whyBuy"][number], "icon" | "title">,
  index: number,
) {
  const keyFromIcon = String(card.icon || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const keyFromTitle = String(card.title || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const mapped =
    WHY_BUY_ICON_MAP[keyFromIcon as keyof typeof WHY_BUY_ICON_MAP] ??
    WHY_BUY_ICON_MAP[keyFromTitle as keyof typeof WHY_BUY_ICON_MAP];

  if (mapped) {
    return mapped;
  }

  const fallbackIcons = [ShieldCheck, Truck, RotateCcw, Headset, CreditCard, Users];
  return fallbackIcons[index % fallbackIcons.length];
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

function EditorPanel(props: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="inline-editor-panel">
      <div className="inline-editor-panel__header">
        <div>
          <strong>{props.title}</strong>
          {props.description ? <p>{props.description}</p> : null}
        </div>
        <button
          type="button"
          className="inline-editor-close"
          onClick={props.onClose}
        >
          Close
        </button>
      </div>
      {props.children}
    </div>
  );
}

function SectionEditButton(props: {
  visible: boolean;
  label: string;
  onClick: () => void;
}) {
  if (!props.visible) {
    return null;
  }

  return (
    <button
      type="button"
      className="section-edit-button"
      onClick={props.onClick}
    >
      Edit {props.label}
    </button>
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [dirtySections, setDirtySections] = useState<Record<string, true>>({});
  const [deletedReviewIds, setDeletedReviewIds] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState(searchParams.get("query") ?? "");
  const [catalogBrand, setCatalogBrand] = useState("all");
  const [catalogStock, setCatalogStock] = useState("all");
  const [catalogSort, setCatalogSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
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

      setStore({
        homeContent,
        navigation,
        products,
        promotions,
        reviews: ensureReviews(reviews),
        settings: {
          ...DEFAULT_SETTINGS,
          ...settings,
        },
      });
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
    setCatalogSearch(searchParams.get("query") ?? "");
    setCatalogBrand("all");
    setCatalogStock("all");
    setCatalogSort("featured");
    setCurrentPage(1);
    setMobileDrawerOpen(false);
    setCatalogFiltersOpen(false);
  }, [pathname, searchParams]);

  function markDirty(section: DirtyKey) {
    setDirtySections((current) => ({
      ...current,
      [section]: true,
    }));
    setSaveMessage("");
    setSaveError("");
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

  function updateSettings(updater: (current: SiteSettings) => SiteSettings) {
    updateStore((current) => ({
      ...current,
      settings: updater(current.settings),
    }));
    markDirty("settings");
  }

  async function handleSaveChanges() {
    if (!store) {
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      if (dirtySections.home) {
        await saveHomeContent(store.homeContent);
      }

      if (dirtySections.navigation) {
        await saveNavigation(store.navigation);
      }

      if (dirtySections.promotions) {
        await savePromotions(store.promotions);
      }

      if (dirtySections.products) {
        await saveProducts(store.products);
      }

      if (dirtySections.reviews) {
        for (const reviewId of deletedReviewIds) {
          if (!reviewId.startsWith("review_") && !reviewId.startsWith("fallback-")) {
            await deleteReview(reviewId).catch(() => undefined);
          }
        }

        await saveReviews(store.reviews);
      }

      if (dirtySections.settings) {
        await saveSettings(store.settings);
      }

      setDeletedReviewIds([]);
      setDirtySections({});
      setSaveMessage("Changes saved to the live site.");
      await loadStore();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save live changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const authSession = authenticateAdmin(loginEmail, loginPassword);

    if (!authSession) {
      setLoginError("Invalid admin credentials.");
      return;
    }

    setLoginError("");
    setLoginPassword("");
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
  const dirtyCount = Object.keys(dirtySections).length;
  const showLoginOverlay = !session;

  function openEditor(key: string) {
    setActiveEditor((current) => (current === key ? null : key));
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

  function updateNavigationItem(
    sectionKey: string,
    columnIndex: number,
    itemIndex: number,
    patch: Partial<NavigationItem>,
  ) {
    updateNavigation((current) => {
      const section = current[sectionKey];

      if (!section || !section.columns) {
        return current;
      }

      const columns = section.columns.map((column, currentColumnIndex) => {
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
    setActiveEditor(`product:${newProduct.id}`);
  }

  function removeProduct(productId: string) {
    if (!window.confirm("Delete this product from the live catalog?")) {
      return;
    }

    updateProducts((current) => current.filter((product) => product.id !== productId));
    setActiveEditor((current) => (current === `product:${productId}` ? null : current));
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
    setActiveEditor(`review:${review.id}`);
  }

  function removeReview(reviewId: string) {
    if (!window.confirm("Delete this review?")) {
      return;
    }

    updateReviews((current) => current.filter((review) => review.id !== reviewId));
    setDeletedReviewIds((current) => [...current, reviewId]);
    setActiveEditor((current) => (current === `review:${reviewId}` ? null : current));
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
        title="Header / Navigation"
        description="Update section titles, paths, visibility, and dropdown items."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
          {Object.entries(store.navigation).map(([sectionKey, section]) => (
            <div key={sectionKey} className="inline-editor-card">
              <div className="inline-editor-grid">
                <EditorField label="Section Title">
                  <input
                    value={section.title}
                    onChange={(event) =>
                      updateNavigationSection(sectionKey, { title: event.target.value })
                    }
                  />
                </EditorField>
                <EditorField label="Section Path">
                  <input
                    value={section.path}
                    onChange={(event) =>
                      updateNavigationSection(sectionKey, { path: event.target.value })
                    }
                  />
                </EditorField>
                <EditorField label="Visibility">
                  <ToggleInput
                    checked={!section.hidden}
                    onChange={(checked) =>
                      updateNavigationSection(sectionKey, { hidden: !checked })
                    }
                    label={section.hidden ? "Hidden" : "Visible"}
                  />
                </EditorField>
              </div>
              {(section.columns ?? []).map((column, columnIndex) => (
                <div key={`${sectionKey}_${column.title}_${columnIndex}`} className="inline-editor-subsection">
                  <strong>{column.title}</strong>
                  <div className="inline-editor-stack">
                    {column.items.map((item, itemIndex) => (
                      <div key={`${item.path}_${itemIndex}`} className="inline-editor-grid inline-editor-grid--items">
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
                        <EditorField label="Show">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
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
        title="Top Info Bar"
        description="Update the enabled state and scrolling marketing text."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
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
          {store.promotions.topInfoBar.items.map((item, index) => (
            <div key={`${item}_${index}`} className="inline-editor-row">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() =>
                  updatePromotions((current) => ({
                    ...current,
                    topInfoBar: {
                      ...current.topInfoBar,
                      items: current.topInfoBar.items.filter((_, currentIndex) => currentIndex !== index),
                    },
                  }))
                }
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-editor-action"
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
            Add Text Item
          </button>
        </div>
      </EditorPanel>
    );
  }

  function renderHeroEditor() {
    if (!store || activeEditor !== "hero") {
      return null;
    }

    return (
      <EditorPanel
        title="Hero Section"
        description="Edit hero images, copy, and primary actions."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
          <div className="inline-editor-grid">
            <EditorField label="Title">
              <input
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
            <EditorField label="Subtitle">
              <input
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
            <EditorField label="Description" full>
              <textarea
                value={store.homeContent.hero.description}
                rows={4}
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
          <div className="inline-editor-stack">
            {store.homeContent.heroImages.map((image, index) => (
              <div key={`${image}_${index}`} className="inline-editor-row">
                <input
                  value={image}
                  onChange={(event) =>
                    updateHome((current) => ({
                      ...current,
                      heroImages: current.heroImages.map((entry, currentIndex) =>
                        currentIndex === index ? event.target.value : entry,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="inline-editor-action inline-editor-action--danger"
                  onClick={() =>
                    updateHome((current) => ({
                      ...current,
                      heroImages: current.heroImages.filter((_, currentIndex) => currentIndex !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-editor-action"
              onClick={() =>
                updateHome((current) => ({
                  ...current,
                  heroImages: [...current.heroImages, ""],
                }))
              }
            >
              Add Image URL
            </button>
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
        title="Feature Cards"
        description="Update cards, links, and icons. Add or remove cards inline."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
          {store.homeContent.features.map((feature, index) => (
            <div key={`${feature.title}_${index}`} className="inline-editor-card">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() =>
                  updateHome((current) => ({
                    ...current,
                    features: current.features.filter((_, currentIndex) => currentIndex !== index),
                  }))
                }
              >
                Delete Card
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-editor-action"
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
            Add Feature Card
          </button>
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
        title="Why Buy"
        description="Edit the reasons to buy from ALLREMOTES."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
          {store.homeContent.whyBuy.map((item, index) => (
            <div key={`${item.title}_${index}`} className="inline-editor-card">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() =>
                  updateHome((current) => ({
                    ...current,
                    whyBuy: current.whyBuy.filter((_, currentIndex) => currentIndex !== index),
                  }))
                }
              >
                Delete Item
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-editor-action"
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
            Add Item
          </button>
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
        title="CTA Section"
        description="Edit the closing call-to-action content."
        onClose={() => setActiveEditor(null)}
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
        title="Footer"
        description="Footer text is stored in settings. Category footer links update the navigation entries they mirror."
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-stack">
          <div className="inline-editor-grid">
            <EditorField label="Brand Title">
              <input
                value={settingsContent.brandTitle}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerBrandTitle: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Brand Subtitle">
              <input
                value={settingsContent.brandSubtitle}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerBrandSubtitle: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Tagline" full>
              <input
                value={settingsContent.footerTagline}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerTagline: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Privacy Title">
              <input
                value={settingsContent.privacyTitle}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerPrivacyTitle: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Privacy Link Label">
              <input
                value={settingsContent.privacyLabel}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerPrivacyLabel: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Privacy Path">
              <input
                value={settingsContent.privacyPath}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerPrivacyPath: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Support Title">
              <input
                value={settingsContent.supportTitle}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerSupportTitle: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Support Link Label">
              <input
                value={settingsContent.supportLinkLabel}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerSupportLinkLabel: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Support Link Path">
              <input
                value={settingsContent.supportLinkPath}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerSupportLinkPath: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Contact Link Label">
              <input
                value={settingsContent.contactLinkLabel}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerContactLinkLabel: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Contact Link Path">
              <input
                value={settingsContent.contactLinkPath}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerContactLinkPath: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Support Email">
              <input
                value={store.settings.siteEmail}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    siteEmail: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Support Phone">
              <input
                value={settingsContent.supportPhone}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    supportPhone: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Weekday Hours">
              <input
                value={settingsContent.supportHoursWeekdays}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    supportHoursWeekdays: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Saturday Hours">
              <input
                value={settingsContent.supportHoursSaturday}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    supportHoursSaturday: event.target.value,
                  }))
                }
              />
            </EditorField>
            <EditorField label="Copyright" full>
              <input
                value={settingsContent.footerCopyright}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    footerCopyright: event.target.value,
                  }))
                }
              />
            </EditorField>
          </div>
          <div className="inline-editor-subsection">
            <strong>Category Links</strong>
            <div className="inline-editor-stack">
              {footerCategoryEntries().map(({ key, entry }) => (
                <div key={key} className="inline-editor-grid inline-editor-grid--items">
                  <EditorField label="Label">
                    <input
                      value={entry.title}
                      onChange={(event) =>
                        updateNavigationSection(key, { title: event.target.value })
                      }
                    />
                  </EditorField>
                  <EditorField label="Path">
                    <input
                      value={entry.path}
                      onChange={(event) =>
                        updateNavigationSection(key, { path: event.target.value })
                      }
                    />
                  </EditorField>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EditorPanel>
    );
  }

  function renderReviewEditor(review: Review) {
    if (activeEditor !== `review:${review.id}`) {
      return null;
    }

    return (
      <EditorPanel
        title={`Review: ${review.author || "New review"}`}
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-grid">
          <EditorField label="Author">
            <input
              value={review.author}
              onChange={(event) => updateReview(review.id, { author: event.target.value })}
            />
          </EditorField>
          <EditorField label="Rating">
            <input
              min={1}
              max={5}
              type="number"
              value={review.rating}
              onChange={(event) =>
                updateReview(review.id, { rating: Number(event.target.value || 5) })
              }
            />
          </EditorField>
          <EditorField label="Review Text" full>
            <textarea
              value={review.text}
              rows={4}
              onChange={(event) => updateReview(review.id, { text: event.target.value })}
            />
          </EditorField>
          <EditorField label="Verified">
            <ToggleInput
              checked={review.verified}
              onChange={(checked) => updateReview(review.id, { verified: checked })}
              label={review.verified ? "Verified" : "Unverified"}
            />
          </EditorField>
          <button
            type="button"
            className="inline-editor-action inline-editor-action--danger"
            onClick={() => removeReview(review.id)}
          >
            Delete Review
          </button>
        </div>
      </EditorPanel>
    );
  }

  function renderProductEditor(product: Product) {
    if (activeEditor !== `product:${product.id}`) {
      return null;
    }

    return (
      <EditorPanel
        title={`Product: ${product.name || "New product"}`}
        onClose={() => setActiveEditor(null)}
      >
        <div className="inline-editor-grid">
          <EditorField label="Name">
            <input
              value={product.name}
              onChange={(event) => updateProduct(product.id, { name: event.target.value })}
            />
          </EditorField>
          <EditorField label="Brand">
            <input
              value={product.brand}
              onChange={(event) => updateProduct(product.id, { brand: event.target.value })}
            />
          </EditorField>
          <EditorField label="Category">
            <input
              value={product.category}
              onChange={(event) => updateProduct(product.id, { category: event.target.value })}
            />
          </EditorField>
          <EditorField label="Price">
            <input
              min={0}
              step="0.01"
              type="number"
              value={product.price}
              onChange={(event) =>
                updateProduct(product.id, { price: Number(event.target.value || 0) })
              }
            />
          </EditorField>
          <EditorField label="Image URL" full>
            <input
              value={product.image}
              onChange={(event) => updateProduct(product.id, { image: event.target.value })}
            />
          </EditorField>
          <EditorField label="Description" full>
            <textarea
              value={product.description}
              rows={4}
              onChange={(event) =>
                updateProduct(product.id, { description: event.target.value })
              }
            />
          </EditorField>
          <EditorField label="SKU">
            <input
              value={product.sku ?? ""}
              onChange={(event) => updateProduct(product.id, { sku: event.target.value })}
            />
          </EditorField>
          <EditorField label="Condition">
            <input
              value={product.condition ?? ""}
              onChange={(event) =>
                updateProduct(product.id, { condition: event.target.value })
              }
            />
          </EditorField>
          <EditorField label="Returns">
            <input
              value={product.returns ?? ""}
              onChange={(event) => updateProduct(product.id, { returns: event.target.value })}
            />
          </EditorField>
          <EditorField label="Seller">
            <input
              value={product.seller ?? ""}
              onChange={(event) => updateProduct(product.id, { seller: event.target.value })}
            />
          </EditorField>
          <EditorField label="In Stock">
            <ToggleInput
              checked={product.inStock}
              onChange={(checked) => updateProduct(product.id, { inStock: checked })}
              label={product.inStock ? "In stock" : "Out of stock"}
            />
          </EditorField>
          <button
            type="button"
            className="inline-editor-action inline-editor-action--danger"
            onClick={() => removeProduct(product.id)}
          >
            Delete Product
          </button>
        </div>
      </EditorPanel>
    );
  }

  function renderHeader() {
    const topBarItems =
      store?.promotions.topInfoBar.enabled && store.promotions.topInfoBar.items.length
        ? store.promotions.topInfoBar.items
        : DEFAULT_TOP_BAR_ITEMS;

    const isRouteActive = (path: string) => {
      if (!path) {
        return false;
      }

      if (path === "/") {
        return routePath === "/";
      }

      return routePath === path || routePath.startsWith(`${path}/`);
    };

    return (
      <header className="sticky top-0 z-[1200] border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md">
        <div className="relative editable-region">
          <div className="border-b border-[#0a4743]/50 bg-[#0a4743]">
            <div className="container">
              <div className="flex flex-wrap items-center justify-center gap-y-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/90 [column-gap:clamp(0.75rem,2.6vw,2.25rem)] sm:text-[11px]">
                {topBarItems.map((item, index) => (
                  <span key={`${item}_${index}`} className="inline-flex max-w-full items-center gap-1.5 text-center">
                    <span className="text-[#7cd3c8]">{topBarIcon(item)}</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Top Info Bar"
            onClick={() => openEditor("top-info-bar")}
          />
        </div>

        {renderTopInfoBarEditor()}

        <div className="border-b border-neutral-200 bg-white/90">
          <div className="container">
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
                  onSubmit={(event) => {
                    event.preventDefault();
                    router.push(`/products/all?query=${encodeURIComponent(searchQuery)}`);
                    setMobileDrawerOpen(false);
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search remote, brand, or model"
                    className="h-12 w-full rounded-lg border border-neutral-300 bg-white pl-5 pr-12 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-[#1a7a6e]/50 focus:outline-none focus:ring-1 focus:ring-[#1a7a6e]/20"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#1a7a6e] text-white transition hover:bg-[#0a4743]"
                    aria-label="Search"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </form>

                {deferredSearch.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[1300] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-neutral-200 px-4 py-3 text-xs font-semibold text-neutral-700">
                      <span>Search Results</span>
                      <span className="text-neutral-400">Top matches</span>
                    </div>
                    {searchResults.length ? (
                      <div className="max-h-[22rem] overflow-auto">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-100"
                            onClick={() => setSearchQuery("")}
                          >
                            <img
                              src={assetUrl(product.image || "/images/mainlogo.png")}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-neutral-200 bg-white object-contain p-1"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-neutral-900">
                                {product.name}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-neutral-500">
                                {product.brand || "ALLREMOTES"}
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
                        <p className="text-sm font-semibold text-neutral-900">No products found.</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Try searching for a brand, SKU, or remote model.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-[359px]:w-full max-[359px]:justify-between">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-800 transition hover:border-[#1a7a6e]/30 hover:bg-[#1a7a6e]/5 hover:text-[#0a4743] h-10 max-[359px]:flex-1"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c0392b] px-4 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(192,57,43,0.18)] transition hover:bg-[#962d22] h-10 max-[359px]:flex-1"
                >
                  Register
                </button>
                <Link
                  href="/products/all"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                  aria-label="Cart"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 6h15l-1.5 9h-13L6 6Z" />
                    <path d="M6 6 5 3H2" />
                    <circle cx="9" cy="20" r="1.3" />
                    <circle cx="18" cy="20" r="1.3" />
                  </svg>
                </Link>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100 lg:hidden"
                  aria-expanded={mobileDrawerOpen}
                  aria-controls="mobile-drawer"
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <div className="grid gap-1.5">
                    <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                    <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                    <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative editable-region hidden lg:block">
          <nav className="border-t border-neutral-200 bg-white/70">
            <div className="container">
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-1">
                  {topLevelLinks.map(([key, entry]) => (
                    <Link
                      key={key}
                      href={entry.path}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isRouteActive(entry.path)
                          ? "bg-[#1a7a6e]/10 text-[#0a4743]"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      {entry.title}
                      {entry.columns?.some((column) => column.items.some((item) => !item.hidden)) ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 4l4 4 4-4" />
                        </svg>
                      ) : null}
                    </Link>
                  ))}

                  <Link
                    href="/products/all"
                    className="ml-2 inline-flex items-center justify-center rounded-lg bg-[#c0392b] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#962d22]"
                  >
                    View Products
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <SectionEditButton
            visible={Boolean(session)}
            label="Navigation"
            onClick={() => openEditor("navigation")}
          />
        </div>

        {renderNavigationEditor()}

        {mobileDrawerOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[1300] bg-black/30 lg:hidden"
              aria-label="Close navigation drawer"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <aside
              className="fixed right-0 top-0 z-[1400] h-full w-full max-w-sm overflow-y-auto bg-white p-5 shadow-[0_0_40px_rgba(0,0,0,0.2)] lg:hidden"
              id="mobile-drawer"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Browse</h2>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid gap-2">
                {topLevelLinks.map(([key, entry]) => (
                  <Link
                    key={key}
                    href={entry.path}
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {entry.title}
                  </Link>
                ))}
                <Link
                  href="/products/all"
                  className="rounded-2xl bg-[#c0392b] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#962d22]"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  View Products
                </Link>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl bg-[#1a7a6e] px-4 py-3 text-sm font-extrabold text-white"
                  >
                    Register
                  </button>
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
    const brandLabel = product.brand?.trim() || "ALLREMOTES";
    const productName = product.name?.trim() || "Replacement Remote";

    return (
      <div
        key={product.id}
        className={`editable-card-wrapper group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/85 shadow-[0_18px_52px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]${extraClassName ? ` ${extraClassName}` : ""}`}
      >
        <SectionEditButton
          visible={Boolean(session)}
          label="Product"
          onClick={() => openEditor(`product:${product.id}`)}
        />
        <Link className="absolute inset-0 z-10" href={`/product/${product.id}`} aria-label={`View details for ${productName}`} />
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
          <img
            className={`h-full w-full object-contain p-4 pt-11 transition-transform duration-300 group-hover:scale-110 sm:p-5 ${
              !product.inStock ? "opacity-50" : ""
            }`}
            src={imageUrl}
            alt={productName}
          />
          <div className="absolute left-3 top-3 right-12 z-20 flex flex-col gap-1.5">
            <span
              className={`inline-flex max-w-full items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-extrabold ${
                product.inStock
                  ? "bg-[#1a7a6e]/10 text-[#0a4743]"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {product.inStock ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a7a6e]" /> : null}
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>
        <div className="relative z-20 flex flex-1 flex-col bg-white p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
            {brandLabel}
          </p>
          <h3 className="mb-3 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-[#8b271f] sm:text-base">
            {productName}
          </h3>
          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-base font-extrabold tracking-tight text-neutral-900 sm:text-lg">
              {formatCurrency(product.price || 0, store?.settings.currency || "AUD")}
            </div>
            {product.inStock ? (
              <span className="inline-flex w-full items-center justify-center rounded-lg bg-[#c0392b] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(192,57,43,0.18)] transition hover:bg-[#962d22] sm:w-auto">
                Add to Cart
              </span>
            ) : null}
          </div>
        </div>
        {renderProductEditor(product)}
      </div>
    );
  }

  function renderHome() {
    if (!store) {
      return null;
    }

    const hero = store.homeContent.hero;
    const features = store.homeContent.features;
    const whyBuyCards = store.homeContent.whyBuy.length
      ? store.homeContent.whyBuy
      : [
          {
            icon: "shield",
            title: "Quality Guaranteed",
            description: "Every remote is checked for fit, finish, and reliable day-to-day use.",
          },
          {
            icon: "truck",
            title: "Fast Shipping",
            description: "Responsive dispatch and practical support for trade and retail buyers.",
          },
          {
            icon: "support",
            title: "Support That Knows Remotes",
            description: "Practical help with product identification and repeat ordering.",
          },
        ];
    const reviews = store.reviews.length ? store.reviews.slice(0, 6) : FALLBACK_REVIEWS;
    const cta = store.homeContent.ctaSection;
    const heroImages = store.homeContent.heroImages.length
      ? store.homeContent.heroImages
      : ["/images/hero.jpg", "/images/heroimg.jpg"];
    const carProductsCount = store.products.filter((product) => product.category === "car").length;
    const garageProductsCount = store.products.filter((product) => product.category === "garage").length;
    const heroSlides = heroImages.map((image, index) => {
      const fallbackSlides = [
        {
          subtitle: hero.subtitle || "Quality is Guaranteed",
          title: hero.title || "Garage Door & Gate Remotes",
          description:
            hero.description ||
            "Your trusted source for premium car and garage remotes. Browse reliable replacements, accessories, and business-ready service support.",
          primaryCta: hero.primaryCta || "Shop Car Remotes",
          primaryCtaPath: hero.primaryCtaPath || "/products/car",
          secondaryCta: hero.secondaryCta || "Shop Garage Remotes",
          secondaryCtaPath: hero.secondaryCtaPath || "/products/garage",
        },
        {
          subtitle: "Automotive remote keys",
          title: "Replacement Car Keys & Smart Remotes",
          description:
            (carProductsCount > 0
              ? `Browse ${carProductsCount}+ automotive remote options across smart keys, shells, and replacement key solutions. `
              : "Browse automotive remote options across smart keys, shells, and replacement key solutions. ") +
            "Built for clean fitment, dependable day-to-day use, and fast reordering.",
          primaryCta: "Shop Automotive",
          primaryCtaPath: "/products/car",
          secondaryCta: "View All Products",
          secondaryCtaPath: "/products/all",
        },
        {
          subtitle: "Garage & gate access",
          title: "Garage, Gate & Access Remotes",
          description:
            (garageProductsCount > 0
              ? `Explore ${garageProductsCount}+ garage and gate remote options for home and trade access automation. `
              : "Explore garage and gate remote options for home and trade access automation. ") +
            "A practical range backed by responsive support and reliable fulfilment.",
          primaryCta: "Shop Garage & Gate",
          primaryCtaPath: "/products/garage",
          secondaryCta: "Browse Best Sellers",
          secondaryCtaPath: "/products/all",
        },
      ];

      return {
        image,
        ...fallbackSlides[index % fallbackSlides.length],
      };
    });

    return (
      <div className="home animate-fadeIn">
        <section className="relative overflow-hidden border-b border-neutral-200/70 editable-region">
          <div className="relative h-[500px] sm:h-[540px] lg:h-[620px]">
            <div className="absolute inset-0">
              {heroSlides.map((slide, index) => (
                <img
                  key={`${slide.image}_${index}`}
                  src={assetUrl(slide.image)}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                    index === heroIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/92 via-neutral-900/72 to-neutral-900/46" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_42%)]" />
            </div>

            <div className="container relative z-10 flex h-full items-center py-8 sm:py-10">
              <div className="relative min-h-[320px] w-full max-w-4xl sm:min-h-[360px] lg:min-h-[390px]">
                {heroSlides.map((slide, index) => (
                  <div
                    key={`hero-content-${index}`}
                    className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      index === heroIndex
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-3 opacity-0"
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1a7a6e]/35 bg-[#1a7a6e]/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7cd3c8] backdrop-blur-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c0392b] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(192,57,43,0.2)] transition-all hover:bg-[#962d22] sm:w-auto"
                      >
                        {slide.primaryCta}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
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
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                    index === heroIndex ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                />
              ))}
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Hero"
            onClick={() => openEditor("hero")}
          />
        </section>

        {renderHeroEditor()}

        <section className="container py-10 sm:py-14 editable-region">
          <div className="grid gap-10">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0a4743]">
                Browse By Category
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Start with the remote type you need
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                Move through automotive, garage, gate, home, and locksmith ranges with clearer entry
                points and business-ready product organization.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={`${feature.title}_${index}`}
                  className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-[0_18px_52px_rgba(15,23,42,0.08)] backdrop-blur"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
                      <div className="h-10 w-10 overflow-hidden rounded-xl">
                        {renderFeatureIcon(feature.icon, index, feature.title)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-900">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">{feature.description}</p>
                    </div>
                  </div>
                  {feature.path ? (
                    <Link href={feature.path} className="mt-5 inline-flex text-sm font-semibold text-[#0a4743] hover:text-[#1a7a6e]">
                      {feature.linkText || "Explore"}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Feature Cards"
            onClick={() => openEditor("features")}
          />
        </section>

        {renderFeaturesEditor()}

        <section className="container py-10 sm:py-14 editable-region">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8b271f]">
              Best Sellers
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              Browse our most popular remote controls across car, garage, and access-control categories.
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
            <Link
              href="/products/all"
              className="inline-flex items-center justify-center rounded-full bg-[#c0392b] px-7 py-3 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(192,57,43,0.2)] hover:bg-[#962d22]"
            >
              View All Products
            </Link>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Products"
            onClick={() => openEditor("products")}
          />
          {session && activeEditor === "products" ? (
            <EditorPanel
              title="Products Grid"
              description="Edit products inline on cards, or add a new product here."
              onClose={() => setActiveEditor(null)}
            >
              <button type="button" className="inline-editor-action" onClick={addProduct}>
                Add Product
              </button>
            </EditorPanel>
          ) : null}
        </section>

        <section className="container py-10 sm:py-14 editable-region">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0a4743]">
              Why ALLREMOTES
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Built for repeat orders and dependable support
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              The store is designed for straightforward product discovery, cleaner reorder flows, and
              support that understands remote keys.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyBuyCards.map((item, index) => {
              const WhyBuyIcon = resolveWhyBuyIcon(item, index);

              return (
                <div
                  key={`${item.title}_${index}`}
                  className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-[0_18px_52px_rgba(15,23,42,0.08)] backdrop-blur"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a7a6e]/10 text-[#0a4743]">
                    <WhyBuyIcon size={22} strokeWidth={2.1} />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{item.description}</p>
                </div>
              );
            })}
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Why Buy"
            onClick={() => openEditor("why-buy")}
          />
        </section>

        {renderWhyBuyEditor()}

        <section className="container py-10 sm:py-14 editable-region">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8b271f]">
              Customer Feedback
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Trusted by homeowners, workshops, and trade buyers
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              Real reviews from customers ordering replacement remotes, smart keys, and access-control
              products.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="editable-card-wrapper">
                <SectionEditButton
                  visible={Boolean(session)}
                  label="Review"
                  onClick={() => openEditor(`review:${review.id}`)}
                />
                <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                  <div className="text-sm font-extrabold text-[#c0392b]">
                    <span>{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</span>
                    <span className="text-neutral-300">
                      {"☆".repeat(5 - Math.max(1, Math.min(5, review.rating)))}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-neutral-700">&quot;{review.text}&quot;</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <strong className="text-sm font-semibold text-neutral-900">{review.author}</strong>
                    <span className="rounded-full bg-[#1a7a6e]/10 px-3 py-1 text-xs font-semibold text-[#0a4743]">
                      {review.verified ? "Verified Purchase" : "Customer Review"}
                    </span>
                  </div>
                </div>
                {renderReviewEditor(review)}
              </div>
            ))}
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Reviews"
            onClick={() => openEditor("reviews")}
          />
          {session && activeEditor === "reviews" ? (
            <EditorPanel
              title="Reviews"
              description="Add new reviews or edit existing cards inline."
              onClose={() => setActiveEditor(null)}
            >
              <button type="button" className="inline-editor-action" onClick={addReview}>
                Add Review
              </button>
            </EditorPanel>
          ) : null}
        </section>

        <section className="container py-10 sm:py-14 editable-region">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(130%_120%_at_2%_0%,rgba(26,122,110,0.30)_0%,rgba(26,122,110,0.10)_40%,transparent_68%),radial-gradient(110%_120%_at_100%_4%,rgba(192,57,43,0.24)_0%,rgba(192,57,43,0.08)_46%,transparent_74%),linear-gradient(102deg,rgba(26,122,110,0.14)_0%,rgba(60,150,151,0.12)_52%,rgba(192,57,43,0.14)_100%)] p-8 shadow-[0_18px_52px_rgba(15,23,42,0.08)] backdrop-blur sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                {cta.title || "Ready to Find Your Perfect Remote?"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
                {cta.description || "Browse our collection and find the perfect remote for your needs"}
              </p>
              <Link
                href={cta.buttonPath || "/products/all"}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#c0392b] px-8 py-4 text-base font-extrabold text-white shadow-[0_16px_36px_rgba(192,57,43,0.2)] hover:bg-[#962d22] sm:w-auto"
              >
                {cta.buttonText || "View All Products"}
              </Link>
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="CTA"
            onClick={() => openEditor("cta")}
          />
        </section>

        {renderCtaEditor()}
      </div>
    );
  }

  function renderCategoryLanding(sectionKey: string, section: NavigationSectionEntry) {
    return (
      <div className="category-page">
        <div
          className="category-hero"
          style={{ backgroundImage: `url(${assetUrl("/images/heroimg2.jpg")})` }}
        >
          <div className="category-hero-overlay" />
          <div className="container">
            <h1>{section.title}</h1>
            <p className="category-subtitle">
              {CATEGORY_SUBTITLES[sectionKey] || `Explore ${section.title.toLowerCase()} resources and products.`}
            </p>
          </div>
        </div>
        <div className="category-sections">
          <div className="container">
            {(section.columns ?? []).map((column, columnIndex) => (
              <section key={`${column.title}_${columnIndex}`} className="category-section">
                <h2 className="section-title">{column.title}</h2>
                <div className="section-links">
                  {column.items
                    .filter((item) => !item.hidden)
                    .map((item) => (
                      <Link key={item.path} className="section-link" href={item.path}>
                        <span className="link-icon">
                          <img src={iconFromIndex(item.iconIndex)} alt={item.name} />
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderCategoryLeaf(sectionKey: string, section: NavigationSectionEntry, item: NavigationItem) {
    const relatedProducts = (store?.products ?? [])
      .filter((product) => matchesProductCategory(product, sectionKey))
      .slice(0, 8);

    return (
      <div className="category-page">
        <div
          className="category-hero"
          style={{ backgroundImage: `url(${assetUrl("/images/heroimg2.jpg")})` }}
        >
          <div className="category-hero-overlay" />
          <div className="container">
            <h1>{item.name}</h1>
            <p className="category-subtitle">
              Browse related resources and products from {section.title}.
            </p>
          </div>
        </div>
        <div className="category-sections">
          <div className="container">
            <section className="category-section">
              <h2 className="section-title">Explore More in {section.title}</h2>
              <div className="section-links">
                {(section.columns ?? [])
                  .flatMap((column) => column.items.filter((entry) => !entry.hidden))
                  .map((entry) => (
                    <Link key={entry.path} className="section-link" href={entry.path}>
                      <span className="link-icon">
                        <img src={iconFromIndex(entry.iconIndex)} alt={entry.name} />
                      </span>
                      <span>{entry.name}</span>
                    </Link>
                  ))}
              </div>
            </section>
          </div>
        </div>
        <div className="category-products">
          <div className="container">
            <h2 className="products-title">Popular Products</h2>
            <div className="products-grid">
              {relatedProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderContactPage() {
    return (
      <div className="category-page">
        <div className="contact-section">
          <div className="container">
            <div className="contact-content">
              <div className="contact-info">
                <h2>Get in Touch</h2>
                <div className="contact-details">
                  <div className="contact-item">
                    <h3>Email</h3>
                    <p>{store?.settings.siteEmail}</p>
                  </div>
                  <div className="contact-item">
                    <h3>Phone</h3>
                    <p>{settingsContent.supportPhone}</p>
                  </div>
                  <div className="contact-item">
                    <h3>Business Hours</h3>
                    <p>{settingsContent.supportHoursWeekdays}</p>
                    <p>{settingsContent.supportHoursSaturday}</p>
                  </div>
                </div>
              </div>
              <div className="contact-form">
                <h2>Send us a Message</h2>
                <form>
                  <div className="form-group">
                    <input type="text" placeholder="Your Name" />
                  </div>
                  <div className="form-group">
                    <input type="email" placeholder="Your Email" />
                  </div>
                  <div className="form-group">
                    <textarea placeholder="Your Message" rows={5} />
                  </div>
                  <button type="button" className="btn btn-primary">
                    Send Message
                  </button>
                </form>
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

    const content = PRODUCT_HERO_CONTENT[page.routeCategory] ?? {
      title: titleFromSlug(page.routeCategory),
      badges: ["Quality Guaranteed", "Trade Pricing", "Fast Dispatch"],
    };

    const filters = (
      <>
        <h3>Filter Products</h3>
        <label htmlFor="catalog-search">Search</label>
        <input
          id="catalog-search"
          value={catalogSearch}
          onChange={(event) => setCatalogSearch(event.target.value)}
          placeholder="Name, brand, or SKU"
        />

        <label htmlFor="catalog-brand">Brand</label>
        <select
          id="catalog-brand"
          value={catalogBrand}
          onChange={(event) => setCatalogBrand(event.target.value)}
        >
          <option value="all">All brands</option>
          {catalogBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <label htmlFor="catalog-stock">Stock</label>
        <select
          id="catalog-stock"
          value={catalogStock}
          onChange={(event) => setCatalogStock(event.target.value)}
        >
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>

        <label htmlFor="catalog-sort">Sort</label>
        <select
          id="catalog-sort"
          value={catalogSort}
          onChange={(event) => setCatalogSort(event.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="name">Name</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

        <button
          type="button"
          className="clear-btn"
          onClick={() => {
            setCatalogSearch("");
            setCatalogBrand("all");
            setCatalogStock("all");
            setCatalogSort("featured");
          }}
        >
          Clear Filters
        </button>
      </>
    );

    return (
      <div className="shop-page">
        <section className="shop-hero">
          <div className="container">
            <h1>{content.title}</h1>
            <div className="hero-badges">
              {content.badges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="shop-content editable-region">
          <div className="container">
            <div className="shop-grid">
              <aside className="filters filters-desktop">{filters}</aside>

              <div>
                <div className="products-header">
                  <div className="product-count">
                    {catalogProducts.length} products
                  </div>
                  <button
                    type="button"
                    className="filter-toggle-btn"
                    onClick={() => setCatalogFiltersOpen(true)}
                  >
                    Filters
                  </button>
                </div>

                {pagedCatalogProducts.length ? (
                  <div className="products-grid">
                    {pagedCatalogProducts.map((product) =>
                      renderProductCard(product),
                    )}
                  </div>
                ) : (
                  <div className="no-products">
                    No products match the current filters.
                  </div>
                )}

                {totalPages > 1 ? (
                  <div className="pager">
                    <button
                      type="button"
                      className="pager-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </button>
                    <div className="pager-pages">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          className={`pager-page${pageNumber === currentPage ? " active" : ""}`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="pager-btn"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((current) => Math.min(totalPages, current + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Products"
            onClick={() => openEditor("products")}
          />
          {session && activeEditor === "products" ? (
            <EditorPanel
              title="Products Grid"
              description="Edit products from any product card, or add a new item."
              onClose={() => setActiveEditor(null)}
            >
              <button type="button" className="inline-editor-action" onClick={addProduct}>
                Add Product
              </button>
            </EditorPanel>
          ) : null}
        </section>

        {catalogFiltersOpen ? (
          <>
            <button
              type="button"
              className="filter-drawer-backdrop"
              aria-label="Close filters"
              onClick={() => setCatalogFiltersOpen(false)}
            />
            <aside className="filter-drawer">
              <div className="filter-drawer-header">
                <h2>Filters</h2>
                <button
                  type="button"
                  className="filter-drawer-close"
                  onClick={() => setCatalogFiltersOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="filter-drawer-content">{filters}</div>
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
        <div className="category-page">
          <div className="category-products">
            <div className="container">
              <h2 className="products-title">Product not found</h2>
            </div>
          </div>
        </div>
      );
    }

    const relatedProducts = store.products
      .filter((entry) => entry.id !== product.id && matchesProductCategory(entry, product.category))
      .slice(0, 4);

    return (
      <div className="category-products editable-region">
        <div className="container">
          <div className="product-grid">
            <div className="product-image-box">
              <img src={assetUrl(product.image)} alt={product.name} />
            </div>

            <div className="product-info">
              <p className="brand">{product.brand}</p>
              <h1>{product.name}</h1>
              <div className="price-stock">
                <div className="price-block">
                  <p className="price-new">
                    {formatCurrency(product.price, store.settings.currency)}
                  </p>
                </div>
                <span className="stock">
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <p>{product.description}</p>
              <div className="product-actions">
                <button type="button" className="btn btn-primary product-action-btn">
                  Add to Cart
                </button>
                <button type="button" className="btn btn-outline product-action-btn">
                  Buy Now
                </button>
              </div>
              {session ? (
                <button
                  type="button"
                  className="inline-editor-action"
                  onClick={() => openEditor(`product:${product.id}`)}
                >
                  Edit Product
                </button>
              ) : null}
            </div>
          </div>

          {renderProductEditor(product)}

          <div className="tabs-section">
            <div className="tabs-header">
              <button type="button" className="tab-btn active">
                Description
              </button>
              <button type="button" className="tab-btn">
                Details
              </button>
            </div>
            <div className="tabs-content">
              <div className="tab-pane">
                <h3>Product Description</h3>
                <p>{product.description || product.name}</p>
              </div>
            </div>
          </div>

          {relatedProducts.length ? (
            <div className="related-section">
              <div className="related-header">
                <h2>Related Products</h2>
                <p className="related-subtitle">Similar products from the live catalog</p>
              </div>
              <div className="related-grid">
                {relatedProducts.map((entry) => renderProductCard(entry))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderFallback() {
    return (
      <div className="category-page">
        <div className="category-products">
          <div className="container">
            <h2 className="products-title">{titleFromSlug(slug?.join(" ") || "Not Found")}</h2>
            <p className="section-subtitle">
              This route exists in the public structure, but the live backend does not expose page-specific content for it yet.
            </p>
            <div className="view-all-link">
              <Link className="btn btn-primary" href="/products/all">
                View All Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFooter() {
    const companyLinks = [
      { href: settingsContent.privacyPath, label: settingsContent.privacyLabel },
      { href: settingsContent.supportLinkPath, label: "Shipping & Delivery" },
      { href: settingsContent.supportLinkPath, label: "Returns & Warranty" },
      { href: settingsContent.supportLinkPath, label: "Safe & Secure Checkout" },
    ];

    return (
      <footer className="relative mt-0 overflow-hidden text-white editable-region [background:radial-gradient(circle_at_6%_18%,rgba(10,71,67,0.48),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(126,32,43,0.42),transparent_34%),linear-gradient(100deg,#0d2020_0%,#272326_48%,#5d1f29_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />

        <div className="container relative z-10 py-12 sm:py-14">
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
                {settingsContent.footerTagline}
              </p>
            </section>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <section className="min-w-0">
                <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                  {settingsContent.categoriesTitle}
                </h4>
                <ul className="grid gap-4">
                  {footerCategoryEntries().map(({ key, entry }) => (
                    <li key={key}>
                      <Link href={entry.path} className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                        {entry.title}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/products/all" className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                      All Products
                    </Link>
                  </li>
                </ul>
              </section>

              <section className="min-w-0">
                <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                  {settingsContent.supportTitle}
                </h4>
                <ul className="grid gap-4">
                  <li>
                    <Link href={settingsContent.supportLinkPath} className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                      {settingsContent.supportLinkLabel}
                    </Link>
                  </li>
                  <li>
                    <Link href={settingsContent.contactLinkPath} className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                      {settingsContent.contactLinkLabel}
                    </Link>
                  </li>
                  <li>
                    <a href={`mailto:${store?.settings.siteEmail || settingsContent.supportLinkLabel}`} className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                      {store?.settings.siteEmail}
                    </a>
                  </li>
                </ul>
              </section>

              <section className="min-w-0">
                <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
                  {settingsContent.privacyTitle}
                </h4>
                <ul className="grid gap-4">
                  {companyLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="inline-flex items-center text-[0.98rem] leading-snug text-white/70 hover:text-white">
                        {item.label}
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

            <p className="text-[0.96rem] text-white/45 lg:text-right">{settingsContent.footerCopyright}</p>
          </div>

          <SectionEditButton
            visible={Boolean(session)}
            label="Footer"
            onClick={() => openEditor("footer")}
          />
          {renderFooterEditor()}
        </div>
      </footer>
    );
  }

  let content: ReactNode = null;

  if (loading) {
    content = (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  } else if (loadError) {
    content = (
      <div className="category-page">
        <div className="category-products">
          <div className="container">
            <h2 className="products-title">Unable to load live content</h2>
            <p className="section-subtitle">{loadError}</p>
          </div>
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
  } else if (page.kind === "category") {
    content = renderCategoryLanding(page.sectionKey, page.section);
  } else if (page.kind === "category-leaf") {
    content = renderCategoryLeaf(page.sectionKey, page.section, page.item);
  } else {
    content = renderFallback();
  }

  return (
    <>
      <div className="App allremotes-admin-clone">
        {renderHeader()}
        <main>{content}</main>
        {renderFooter()}
      </div>

      <div className="floating-admin-toolbar">
        <div className="floating-admin-toolbar__copy">
          <strong>{session ? `Logged in as ${session.email}` : "Admin login required"}</strong>
          <span>
            {dirtyCount
              ? `${dirtyCount} section${dirtyCount === 1 ? "" : "s"} ready to save`
              : "No unsaved changes"}
          </span>
        </div>
        <div className="floating-admin-toolbar__actions">
          <button
            type="button"
            className="inline-toolbar-button inline-toolbar-button--primary"
            disabled={!session || saving || !dirtyCount}
            onClick={() => void handleSaveChanges()}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="inline-toolbar-button inline-toolbar-button--secondary"
            onClick={() => {
              clearAdminSession();
              setActiveEditor(null);
            }}
          >
            {session ? "Logout" : "Close"}
          </button>
        </div>
      </div>

      {saveMessage ? <div className="inline-save-banner inline-save-banner--success">{saveMessage}</div> : null}
      {saveError ? <div className="inline-save-banner inline-save-banner--error">{saveError}</div> : null}

      {showLoginOverlay ? (
        <div className="inline-auth-overlay">
          <div className="inline-auth-backdrop" />
          <form className="inline-auth-card" onSubmit={handleLoginSubmit}>
            <span className="inline-auth-card__eyebrow">ALLREMOTES ADMIN</span>
            <h2>Sign in to edit the live site</h2>
            <p>
              Use the admin credentials to unlock hover edit controls and save changes
              back to the live backend.
            </p>

            <EditorField label="Email" full>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="admin@allremotes.com"
              />
            </EditorField>

            <EditorField label="Password" full>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Admin123!"
              />
            </EditorField>

            {loginError ? <div className="inline-save-banner inline-save-banner--error">{loginError}</div> : null}

            <button type="submit" className="inline-toolbar-button inline-toolbar-button--primary">
              Login
            </button>

            <p className="inline-auth-hint">
              Admin login: <strong>{ADMIN_EMAIL}</strong> / <strong>{ADMIN_PASSWORD}</strong>
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}
