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
    return (
      <header className="header editable-region">
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
            <SectionEditButton
              visible={Boolean(session)}
              label="Top Info Bar"
              onClick={() => openEditor("top-info-bar")}
            />
          </div>
        ) : null}

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

        <nav className="main-nav editable-region">
          <div className="container">
            <div className="nav-inner">
              <div className="nav-links">
                <Link className="nav-cta" href="/products/all">
                  View Products
                </Link>
              </div>
            </div>
          </div>
          <SectionEditButton
            visible={Boolean(session)}
            label="Navigation"
            onClick={() => openEditor("navigation")}
          />
        </nav>

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
      <div key={product.id} className={`editable-card-wrapper${extraClassName ? ` ${extraClassName}` : ""}`}>
        <SectionEditButton
          visible={Boolean(session)}
          label="Product"
          onClick={() => openEditor(`product:${product.id}`)}
        />
        <Link className="product-card product-card--shop" href={`/product/${product.id}`}>
          <div className="image-box product-image-container">
            <img className="product-image" src={imageUrl} alt={product.name} />
            {!product.inStock ? <span className="out-of-stock-badge">Out of Stock</span> : null}
          </div>
          <div className="card-body product-info">
            <div className="brand">{product.brand}</div>
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
        {renderProductEditor(product)}
      </div>
    );
  }

  function renderHome() {
    if (!store) {
      return null;
    }

    return (
      <div className="home">
        <section className="hero editable-region">
          <div className="hero-slider">
            {store.homeContent.heroImages.map((image, index) => (
              <div
                key={`${image}_${index}`}
                className={`hero-slide${heroIndex === index ? " active" : ""}`}
                style={{ backgroundImage: `url(${assetUrl(image)})` }}
              />
            ))}
          </div>
          <div className="hero-overlay" />
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
          <SectionEditButton
            visible={Boolean(session)}
            label="Hero"
            onClick={() => openEditor("hero")}
          />
        </section>

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

        <section className="features editable-region">
          <div className="container">
            <h2 className="section-title">Our Product Categories</h2>
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
          <SectionEditButton
            visible={Boolean(session)}
            label="Feature Cards"
            onClick={() => openEditor("features")}
          />
        </section>

        {renderFeaturesEditor()}

        <section className="featured-products editable-region">
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

        <section className="why-buy-section editable-region">
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
          <SectionEditButton
            visible={Boolean(session)}
            label="Why Buy"
            onClick={() => openEditor("why-buy")}
          />
        </section>

        {renderWhyBuyEditor()}

        <section className="reviews-section editable-region">
          <div className="container">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real reviews from satisfied customers</p>
            <div className="reviews-grid">
              {store.reviews.map((review) => (
                <div key={review.id} className="editable-card-wrapper">
                  <SectionEditButton
                    visible={Boolean(session)}
                    label="Review"
                    onClick={() => openEditor(`review:${review.id}`)}
                  />
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
                  {renderReviewEditor(review)}
                </div>
              ))}
            </div>
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

        <section
          className="cta-section editable-region"
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
    return (
      <footer className="footer editable-region">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>{settingsContent.brandTitle}</h3>
              <p>{settingsContent.brandSubtitle}</p>
              <p className="footer-tagline">{settingsContent.footerTagline}</p>
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
              <p>Email: {store?.settings.siteEmail}</p>
              <p>Phone: {settingsContent.supportPhone}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{settingsContent.footerCopyright}</p>
          </div>
        </div>
        <SectionEditButton
          visible={Boolean(session)}
          label="Footer"
          onClick={() => openEditor("footer")}
        />
        {renderFooterEditor()}
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
