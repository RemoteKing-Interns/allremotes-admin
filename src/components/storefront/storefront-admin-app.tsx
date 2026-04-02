/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  deleteReview,
  getHomeContent,
  getNavigation,
  getOrders,
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
  DEFAULT_PROMOTIONS,
  DEFAULT_HOME_CONTENT,
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
  ["#2e6b6f", "#2e6b6f", "#a0312d"],
  ["#153b50", "#265e73", "#2e6b6f"],
  ["#5a2a27", "#a0312d", "#d16455"],
  ["#22343c", "#2e6b6f", "#4d968a"],
];

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

type AdminNavPanelKey =
  | "dashboard"
  | "analytics"
  | "users"
  | "orders"
  | "promotions"
  | "reviews"
  | "settings";

const ADMIN_NAV_ITEMS: Array<{ key: AdminNavPanelKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "analytics", label: "Analytics" },
  { key: "users", label: "Users" },
  { key: "orders", label: "Orders" },
  { key: "promotions", label: "Promotions" },
  { key: "reviews", label: "Reviews" },
  { key: "settings", label: "Settings" },
];

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

function ProductPrice({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  return (
    <div className="price-discount-wrap">
      <span className="price">{formatCurrency(product.price || 0, currency)}</span>
    </div>
  );
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
        <div>
          <strong>{props.title}</strong>
          {props.description ? <p>{props.description}</p> : null}
        </div>
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
  const [dirtySections, setDirtySections] = useState<Partial<Record<DirtyKey, true>>>({});
  const [deletedReviewIds, setDeletedReviewIds] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState(searchParams.get("query") ?? "");
  const [catalogBrand, setCatalogBrand] = useState("all");
  const [catalogStock, setCatalogStock] = useState("all");
  const [catalogSort, setCatalogSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNavPanel, setActiveNavPanel] = useState<AdminNavPanelKey | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState("30d");
  const [navOrders, setNavOrders] = useState<Array<{ id: string; status: string; createdAt?: string }>>([]);
  const [navOrdersLoading, setNavOrdersLoading] = useState(false);
  const [navOrdersError, setNavOrdersError] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const deferredSearch = useDeferredValue(searchQuery);
  const routePath = normalizeRoutePath(slug);

  const loadStore = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [homeContentResult, navigationResult, productsResult, promotionsResult, reviewsResult, settingsResult] =
        await Promise.allSettled([
          getHomeContent(),
          getNavigation(),
          getProducts(),
          getPromotions(),
          getReviews(),
          getSettings(),
        ]);

      const homeContent =
        homeContentResult.status === "fulfilled"
          ? homeContentResult.value
          : DEFAULT_HOME_CONTENT;
      const navigation =
        navigationResult.status === "fulfilled"
          ? navigationResult.value
          : savedStore?.navigation ?? {};
      const products =
        productsResult.status === "fulfilled"
          ? productsResult.value
          : savedStore?.products ?? [];
      const promotions =
        promotionsResult.status === "fulfilled"
          ? promotionsResult.value
          : savedStore?.promotions ?? DEFAULT_PROMOTIONS;
      const reviews =
        reviewsResult.status === "fulfilled"
          ? reviewsResult.value
          : savedStore?.reviews ?? [];
      const settings =
        settingsResult.status === "fulfilled"
          ? settingsResult.value
          : savedStore?.settings ?? DEFAULT_SETTINGS;

      const hasFailure =
        homeContentResult.status === "rejected" ||
        navigationResult.status === "rejected" ||
        productsResult.status === "rejected" ||
        promotionsResult.status === "rejected" ||
        reviewsResult.status === "rejected" ||
        settingsResult.status === "rejected";

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

      if (hasFailure) {
        setToast({
          tone: "error",
          message: "Live API is unavailable. Showing fallback content.",
        });
      }
    } catch {
      setLoadError("Unable to load live content or fallback content.");
    } finally {
      setLoading(false);
    }
  }, [savedStore]);

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveNavPanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (typeof event.reason === "undefined") {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("admin_users") ??
        localStorage.getItem("admin_accounts") ??
        "[]";
      const parsed = JSON.parse(raw) as Array<{ id?: string; name?: string; email?: string }>;
      const normalized = parsed
        .map((item, index) => ({
          id: String(item.id ?? `user-${index + 1}`),
          name: String(item.name ?? "Unnamed User"),
          email: String(item.email ?? ""),
        }))
        .filter((item) => item.email || item.name);
      setAdminUsers(normalized);
    } catch {
      setAdminUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!activeNavPanel || (activeNavPanel !== "dashboard" && activeNavPanel !== "orders")) {
      return;
    }

    let active = true;

    async function loadNavOrders() {
      setNavOrdersLoading(true);
      setNavOrdersError("");
      try {
        const orders = await getOrders();
        if (!active) {
          return;
        }
        setNavOrders(
          orders.map((order) => ({
            id: order.id,
            status: order.status ?? "Processing",
            createdAt: order.createdAt,
          })),
        );
      } catch (error) {
        if (!active) {
          return;
        }
        setNavOrdersError(error instanceof Error ? error.message : "Failed to load orders");
      } finally {
        if (active) {
          setNavOrdersLoading(false);
        }
      }
    }

    void loadNavOrders();

    return () => {
      active = false;
    };
  }, [activeNavPanel]);

  useEffect(() => {
    setCatalogSearch(searchParams.get("query") ?? "");
    setCatalogBrand("all");
    setCatalogStock("all");
    setCatalogSort("featured");
    setCurrentPage(1);
    setMobileDrawerOpen(false);
    setCatalogFiltersOpen(false);
    setActiveEditor(null);
  }, [pathname, searchParams]);

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
        message: "Saved successfully",
      });
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
      return true;
    } catch {
      setToast({
        tone: "error",
        message: "Save failed — please try again",
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

  async function updateNavOrderStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed with ${response.status}`);
      }

      setNavOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order)),
      );
    } catch {
      setToast({
        tone: "error",
        message: "Unable to update order status",
      });
    }
  }

  function renderAdminNavPanel() {
    if (!activeNavPanel) {
      return null;
    }

    const promotionsCount =
      (store?.promotions.offers.offers.length ?? 0) +
      (store?.promotions.topInfoBar.items.length ?? 0);

    return (
      <>
        <div className="admin-nav-overlay" onClick={() => setActiveNavPanel(null)} />
        <aside className="admin-nav-panel" role="dialog" aria-modal="true" aria-label="Admin panel">
          <div className="admin-nav-panel__header">
            <strong>{ADMIN_NAV_ITEMS.find((item) => item.key === activeNavPanel)?.label}</strong>
            <button
              type="button"
              className="admin-nav-panel__close"
              onClick={() => setActiveNavPanel(null)}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          <div className="admin-nav-panel__body">
            {activeNavPanel === "dashboard" ? (
              <div className="admin-nav-panel__grid">
                <div className="admin-nav-panel__section">
                  <div className="admin-nav-panel__sub-title">Total Products</div>
                  <strong>{store?.products.length ?? 0}</strong>
                </div>
                <div className="admin-nav-panel__section">
                  <div className="admin-nav-panel__sub-title">Orders</div>
                  <strong>{navOrders.length}</strong>
                </div>
                <div className="admin-nav-panel__section">
                  <div className="admin-nav-panel__sub-title">Reviews</div>
                  <strong>{store?.reviews.length ?? 0}</strong>
                </div>
                <div className="admin-nav-panel__section">
                  <div className="admin-nav-panel__sub-title">Active Promotions</div>
                  <strong>{promotionsCount}</strong>
                </div>
                {navOrdersLoading ? <p className="admin-nav-panel__placeholder">Loading order totals...</p> : null}
                {navOrdersError ? <p className="admin-nav-panel__placeholder">{navOrdersError}</p> : null}
              </div>
            ) : null}

            {activeNavPanel === "analytics" ? (
              <div className="admin-nav-panel__section">
                <label className="admin-nav-panel__sub-title" htmlFor="analytics-range">Time Range</label>
                <select
                  id="analytics-range"
                  className="inline-editor-input"
                  value={analyticsRange}
                  onChange={(event) => setAnalyticsRange(event.target.value)}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <p className="admin-nav-panel__placeholder">Analytics coming soon.</p>
              </div>
            ) : null}

            {activeNavPanel === "users" ? (
              <div className="admin-nav-panel__section">
                <div className="admin-nav-panel__sub-title">User Accounts</div>
                {adminUsers.length ? (
                  <ul className="admin-nav-panel__list">
                    {adminUsers.map((user) => (
                      <li key={user.id} className="admin-nav-panel__row">
                        <span>{user.name}</span>
                        <small>{user.email}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-nav-panel__placeholder">No local users found.</p>
                )}
              </div>
            ) : null}

            {activeNavPanel === "orders" ? (
              <div className="admin-nav-panel__section">
                {navOrdersLoading ? <p className="admin-nav-panel__placeholder">Loading orders...</p> : null}
                {navOrdersError ? <p className="admin-nav-panel__placeholder">{navOrdersError}</p> : null}
                {navOrders.length ? (
                  <ul className="admin-nav-panel__list">
                    {navOrders.map((order) => (
                      <li key={order.id} className="admin-nav-panel__row">
                        <span>#{order.id}</span>
                        <select
                          className="inline-editor-input"
                          value={order.status}
                          onChange={(event) => void updateNavOrderStatus(order.id, event.target.value)}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {activeNavPanel === "promotions" ? (
              <div className="admin-nav-panel__section">
                <p className="admin-nav-panel__placeholder">
                  Edit top info bar and offers with the existing page editor, then publish.
                </p>
              </div>
            ) : null}

            {activeNavPanel === "reviews" ? (
              <div className="admin-nav-panel__section">
                <p className="admin-nav-panel__placeholder">
                  Use the Reviews editor section to add, edit, and delete homepage reviews.
                </p>
              </div>
            ) : null}

            {activeNavPanel === "settings" ? (
              <div className="admin-nav-panel__section">
                <p className="admin-nav-panel__placeholder">Manage site settings from the admin settings route.</p>
                <Link href="/settings" className="inline-toolbar-button inline-toolbar-button--primary">
                  Open Settings
                </Link>
              </div>
            ) : null}
          </div>
        </aside>
      </>
    );
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
  const currentSearch = searchParams.toString();
  const loginHref = `/login?next=${encodeURIComponent(
    `${pathname}${currentSearch ? `?${currentSearch}` : ""}`,
  )}`;

  function openEditor(key: EditorKey) {
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

  function addNavigationSection() {
    const sectionKey = `nav_${crypto.randomUUID().slice(0, 8)}`;

    updateNavigation((current) => {
      return {
        ...current,
        [sectionKey]: {
          title: "New Link",
          path: "/new-link",
          hidden: false,
          columns: [],
        },
      };
    });
    setActiveEditor("navigation");
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
            <div key={sectionKey} className="inline-editor-card">
              <div className="inline-editor-grid">
                <EditorField label="Label">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() =>
                  updateNavigation((current) => {
                    const next = { ...current };
                    delete next[sectionKey];
                    return next;
                  })
                }
              >
                Delete Link
              </button>
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
          <div className="inline-editor-stack">
            <EditorField label="Heading">
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
            <EditorField label="Subheading">
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
            <div className="inline-editor-subsection">
              <strong>Background Color Swatches</strong>
              <div className="hero-swatch-grid">
                {HERO_BACKGROUND_SWATCHES.map((colors) => {
                  const isActive =
                    JSON.stringify(colors) ===
                    JSON.stringify(store.homeContent.hero.backgroundColors);

                  return (
                    <button
                      key={colors.join("_")}
                      type="button"
                      className={`hero-swatch${isActive ? " hero-swatch--active" : ""}`}
                      onClick={() =>
                        updateHome((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            backgroundColors: colors,
                          },
                        }))
                      }
                    >
                      {colors.map((color) => (
                        <span
                          key={color}
                          className="hero-swatch__chip"
                          style={{ background: color }}
                        />
                      ))}
                    </button>
                  );
                })}
              </div>
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
            <div key={review.id} className="inline-editor-card">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() => removeReview(review.id)}
              >
                Delete Review
              </button>
            </div>
          ))}
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
            <div key={product.id} className="inline-editor-card">
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
              <button
                type="button"
                className="inline-editor-action inline-editor-action--danger"
                onClick={() => removeProduct(product.id)}
              >
                Delete Product
              </button>
            </div>
          ))}
        </div>
      </EditorPanel>
    );
  }

  function renderHeader() {
    return (
      <header className="header">
        <div
          className={`editor-section-shell${
            store?.promotions.topInfoBar.enabled ? "" : " editor-section-shell--collapsed"
          }`}
        >
          {store?.promotions.topInfoBar.enabled ? (
            <div className="top-info-bar">
              <div className="container">
                <div className="info-items">
                  {store.promotions.topInfoBar.items.map((item, index) => (
                    <span key={`${item}_${index}`} className="info-item">
                      {item}
                      {index < store.promotions.topInfoBar.items.length - 1 ? (
                        <span className="separator">|</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="top-info-bar top-info-bar--editor-hidden" aria-hidden="true" />
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

        <div className="main-header">
          <div className="container">
            <div className="header-content">
              <Link className="logo-container" href="/">
                <img
                  src={assetUrl("/images/mainlogo.png")}
                  alt="ALLREMOTES"
                  className="logo"
                />
              </Link>

              <div className="search-container">
                <form
                  className="search-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    router.push(`/products/all?query=${encodeURIComponent(searchQuery)}`);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search Products"
                    className="search-input"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <button type="submit" className="search-submit-btn">
                    <svg
                      className="search-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </form>

                {deferredSearch.trim() ? (
                  <div className="search-results">
                    <div className="search-results-header">Matching products</div>
                    {searchResults.length ? (
                      <div className="search-results-list">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            className="search-result-item"
                            href={`/product/${product.id}`}
                            onClick={() => setSearchQuery("")}
                          >
                            <img
                              className="search-result-image"
                              src={assetUrl(product.image)}
                              alt={product.name}
                            />
                            <div className="search-result-info">
                              <div className="search-result-name">{product.name}</div>
                              <div className="search-result-category">{product.brand}</div>
                            </div>
                            <div className="search-result-price">
                              <span className="search-result-price-new">
                                {formatCurrency(product.price, store?.settings.currency || "AUD")}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="search-no-results">
                        <p>No products found.</p>
                        <div className="search-suggestion">
                          Try a brand, SKU, or remote name.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="header-actions">
                <button type="button" className="btn btn-outline btn-small">
                  Login
                </button>
                <button type="button" className="btn btn-primary btn-small">
                  Register
                </button>
                <Link className="cart-icon-new" href="/products/all">
                  <div className="cart-icon-wrapper">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 6h15l-1.5 9h-13L6 6Z" />
                      <path d="M6 6 5 3H2" />
                      <circle cx="9" cy="20" r="1.3" />
                      <circle cx="18" cy="20" r="1.3" />
                    </svg>
                  </div>
                </Link>
                <button
                  className="hamburger-btn"
                  aria-expanded={mobileDrawerOpen}
                  aria-controls="mobile-drawer"
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <span className="hamburger-line" />
                  <span className="hamburger-line" />
                  <span className="hamburger-line" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-section-shell">
          <nav className="main-nav">
            <div className="container">
              <div className="nav-inner">
                <div className="nav-links">
                  <Link className="nav-cta" href="/products/all">
                    View Products
                  </Link>
                </div>
              </div>
            </div>
          </nav>
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
              className="drawer-overlay"
              aria-label="Close navigation drawer"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <aside className="mobile-drawer" id="mobile-drawer">
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
              <div className="drawer-content">
                <h2 className="drawer-title">Browse</h2>
                {topLevelLinks.map(([key, entry]) => (
                  <Link
                    key={key}
                    href={entry.path}
                    className="drawer-nav-link"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {entry.title}
                  </Link>
                ))}
                <Link
                  href="/products/all"
                  className="drawer-nav-link drawer-nav-cta"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  View Products
                </Link>
                <div className="drawer-auth-section">
                  <button type="button" className="drawer-auth-btn drawer-auth-outline">
                    Login
                  </button>
                  <button type="button" className="drawer-auth-btn drawer-auth-primary">
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

    return (
      <div key={product.id} className={extraClassName ? extraClassName : undefined}>
        <Link className="product-card product-card--shop" href={`/product/${product.id}`}>
          <div className="image-box product-image-container">
            <img className="product-image" src={imageUrl} alt={product.name} />
            {!product.inStock ? <span className="out-of-stock-badge">Out of Stock</span> : null}
          </div>
          <div className="card-body product-info">
            <div className="brand">{product.brand || titleFromSlug(product.category)}</div>
            <h3>{product.name}</h3>
            <div className="price-row product-footer">
              <ProductPrice product={product} currency={store?.settings.currency || "AUD"} />
              <span className={`stock ${product.inStock ? "in" : "out"}`}>
                {product.inStock ? "In Stock" : "Out"}
              </span>
            </div>
            <span className="add-to-cart btn-add-cart">
              Add to Cart
            </span>
          </div>
        </Link>
      </div>
    );
  }

  function renderHome() {
    if (!store) {
      return null;
    }

    return (
      <div className="home">
        <div className="editor-section-shell">
          <section className="hero">
            <div className="hero-slider">
              {store.homeContent.heroImages.map((image, index) => (
                <div
                  key={`${image}_${index}`}
                  className={`hero-slide${heroIndex === index ? " active" : ""}`}
                  style={{ backgroundImage: `url(${assetUrl(image)})` }}
                />
              ))}
            </div>
            <div
              className="hero-overlay"
              style={{
                background: `linear-gradient(135deg, ${store.homeContent.hero.backgroundColors[0]} 0%, ${store.homeContent.hero.backgroundColors[1]} 50%, ${store.homeContent.hero.backgroundColors[2]} 100%)`,
              }}
            />
            <div className="container">
              <div className="hero-content">
                <h1>{store.homeContent.hero.title}</h1>
                <p className="hero-subtitle">{store.homeContent.hero.subtitle}</p>
                <p className="hero-description">{store.homeContent.hero.description}</p>
                <div className="hero-buttons">
                  <Link className="btn btn-hero-secondary" href={store.homeContent.hero.secondaryCtaPath}>
                    {store.homeContent.hero.secondaryCta}
                  </Link>
                  <Link className="btn btn-hero-primary" href={store.homeContent.hero.primaryCtaPath}>
                    {store.homeContent.hero.primaryCta}
                  </Link>
                </div>
              </div>
            </div>
            <div className="hero-indicators">
              {store.homeContent.heroImages.map((image, index) => (
                <button
                  key={`${image}_indicator_${index}`}
                  type="button"
                  className={`indicator${heroIndex === index ? " active" : ""}`}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                />
              ))}
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("hero")}
          />
        </div>

        {renderHeroEditor()}

        <div className="trust-bar">
          <div className="container">
            <div className="trust-bar-inner">
              {[...DEFAULT_TRUST_ITEMS, ...DEFAULT_TRUST_ITEMS].map((item, index) => (
                <div key={`${item.label}_${index}`} className="trust-item">
                  <span className="trust-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-section-shell">
          <section className="features">
            <div className="container">
              <h2 className="section-title">{store.homeContent.featuresTitle}</h2>
              <p className="section-subtitle">Discover the perfect remote for your needs</p>
              <div className="features-grid">
                {store.homeContent.features.map((feature, index) => (
                  <div key={`${feature.title}_${index}`} className="feature-card">
                    <div className="feature-icon">
                      {renderFeatureIcon(feature.icon, index, feature.title)}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <Link className="feature-link" href={feature.path}>
                      {feature.linkText || "Explore →"}
                    </Link>
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
          <section className="featured-products">
            <div className="container">
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Browse our most popular remote controls</p>
              {featuredProducts.length ? (
                <div className="products-grid">
                  {featuredProducts.map((product) => renderProductCard(product))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gray-dark)" }}>
                  No products available right now.
                </div>
              )}
              <div className="view-all-link">
                <Link className="btn btn-primary" href="/products/all">
                  View All Products
                </Link>
              </div>
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
          <section className="why-buy-section">
            <div className="container">
              <h2 className="section-title">Why Buy From ALLREMOTES?</h2>
              <div className="why-buy-grid">
                {store.homeContent.whyBuy.map((item, index) => (
                  <div key={`${item.title}_${index}`} className="why-buy-card">
                    <div className="why-buy-icon">{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
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
          <section className="reviews-section">
            <div className="container">
              <h2 className="section-title">What Our Customers Say</h2>
              <p className="section-subtitle">Real reviews from satisfied customers</p>
              <div className="reviews-grid">
                {store.reviews.map((review) => (
                  <div key={review.id}>
                    <div className="review-card">
                      <div className="review-rating">
                        <span>{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</span>
                      </div>
                      <p className="review-text">&quot;{review.text}&quot;</p>
                      <div className="review-author">
                        <strong>{review.author}</strong>
                        <span>{review.verified ? "Verified Purchase" : "Customer Review"}</span>
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
          <section
            className="cta-section"
            style={{ backgroundImage: `url(${assetUrl("/images/heroimg2.jpg")})` }}
          >
            <div className="cta-overlay" />
            <div className="container">
              <div className="cta-content">
                <h2>{store.homeContent.ctaSection.title}</h2>
                <p>{store.homeContent.ctaSection.description}</p>
                <Link className="btn btn-hero-primary btn-large" href={store.homeContent.ctaSection.buttonPath}>
                  {store.homeContent.ctaSection.buttonText}
                </Link>
              </div>
            </div>
          </section>
          <SectionToolbar
            visible={Boolean(session)}
            onEdit={() => openEditor("cta")}
          />
        </div>

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
                    <p>{store?.homeContent.footer.email}</p>
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

        <div className="editor-section-shell">
          <section className="shop-content">
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
          </section>
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
      <>
        <div className="editor-section-shell">
          <div className="category-products">
            <div className="container">
              <div className="product-grid">
                <div className="product-image-box">
                  <img src={assetUrl(product.image)} alt={product.name} />
                </div>

                <div className="product-info">
                  <p className="brand">{product.brand || titleFromSlug(product.category)}</p>
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
                </div>
              </div>

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
    return (
      <div className="editor-section-shell">
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>{store?.homeContent.footer.companyName}</h3>
                <p>{settingsContent.brandSubtitle}</p>
                <p className="footer-tagline">{store?.homeContent.footer.tagline}</p>
              </div>
              <div className="footer-section">
                <h4>{settingsContent.categoriesTitle}</h4>
                {footerCategoryEntries().map(({ key, entry }) => (
                  <Link key={key} href={entry.path}>
                    {entry.title}
                  </Link>
                ))}
              </div>
              <div className="footer-section">
                <h4>{settingsContent.privacyTitle}</h4>
                <Link href={settingsContent.privacyPath}>{settingsContent.privacyLabel}</Link>
              </div>
              <div className="footer-section">
                <h4>{settingsContent.supportTitle}</h4>
                <Link href={settingsContent.supportLinkPath}>{settingsContent.supportLinkLabel}</Link>
                <Link href={settingsContent.contactLinkPath}>{settingsContent.contactLinkLabel}</Link>
                <p>Email: {store?.homeContent.footer.email}</p>
                <p>Phone: {settingsContent.supportPhone}</p>
              </div>
            </div>
            <div className="footer-bottom">
              <p>{settingsContent.footerCopyright}</p>
            </div>
          </div>
        </footer>
        <SectionToolbar
          visible={Boolean(session)}
          onEdit={() => openEditor("footer")}
        />
        {renderFooterEditor()}
      </div>
    );
  }

  let content: ReactNode = null;

  if (loading && !store) {
    content = (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  } else {
    content = (
      <div className="storefront-live-frame-wrap">
        {loadError ? (
          <div className="storefront-live-frame-banner">
            Live sync warning: {loadError}
          </div>
        ) : null}
        <div className="storefront-live-frame-shell">
          <iframe
            ref={iframeRef}
            src="https://allremotes.vercel.app"
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "calc(100vh - 48px)", border: "none" }}
            title="Live storefront preview"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="storefront-editor-topbar">
        <div className="storefront-editor-topbar__brand">
          <span className="storefront-editor-topbar__dot" />
          <span>AllRemotes Admin</span>
        </div>
        <nav className="storefront-editor-topbar__nav" aria-label="Admin quick navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = activeNavPanel === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`storefront-editor-topbar__nav-item${isActive ? " storefront-editor-topbar__nav-item--active" : ""}`}
                onClick={() => setActiveNavPanel((current) => (current === item.key ? null : item.key))}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="storefront-editor-topbar__actions">
          <button
            type="button"
            className={`storefront-editor-topbar__nav-item${inlineEditMode ? " storefront-editor-topbar__nav-item--active" : ""}`}
            onClick={() => setInlineEditMode((current) => !current)}
          >
            Edit
          </button>
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

      <main className="allremotes-admin-clone">{content}</main>

      {inlineEditMode && session ? (
        <div
          style={{
            position: "fixed",
            inset: "48px 0 0 0",
            zIndex: 1350,
            pointerEvents: "none",
          }}
        >
          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "8px", left: "0", right: "0", height: "64px", pointerEvents: "auto" }}
          >
            <SectionToolbar
              visible
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

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "90px", left: "0", right: "0", height: "72px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("navigation")} onAdd={addNavigationSection} />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "176px", left: "0", right: "0", height: "210px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("hero")} />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "410px", left: "0", right: "0", height: "190px", pointerEvents: "auto" }}
          >
            <SectionToolbar
              visible
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
                      linkText: "Explore ->",
                    },
                  ],
                }));
                setActiveEditor("features");
              }}
            />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "630px", left: "0", right: "0", height: "230px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("products")} onAdd={addProduct} />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "880px", left: "0", right: "0", height: "210px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("reviews")} onAdd={addReview} />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "1110px", left: "0", right: "0", height: "180px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("cta")} />
          </div>

          <div
            className="editor-section-shell editor-section-shell--collapsed"
            style={{ position: "absolute", top: "1320px", left: "0", right: "0", height: "220px", pointerEvents: "auto" }}
          >
            <SectionToolbar visible onEdit={() => openEditor("footer")} />
          </div>
        </div>
      ) : null}

      {renderTopInfoBarEditor()}
      {renderNavigationEditor()}
      {renderHeroEditor()}
      {renderFeaturesEditor()}
      {renderProductsEditor()}
      {renderWhyBuyEditor()}
      {renderReviewsEditor()}
      {renderCtaEditor()}
      {renderFooterEditor()}

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
      {renderAdminNavPanel()}
    </>
  );
}
