/* eslint-disable @next/next/no-img-element */
"use client";

import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  createEmptyOffer,
  createPresignedUpload,
  getApiBaseLabel,
  getHomeContent,
  getNavigation,
  getOrders,
  getProducts,
  getPromotions,
  getReviews,
  getS3Images,
  getSettings,
  saveHomeContent,
  saveNavigation,
  saveProducts,
  savePromotions,
  saveReviews,
  saveSettings,
  updateOrderStatus,
  uploadFileToS3,
} from "@/lib/admin/api";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEFAULT_HOME_CONTENT,
  DEFAULT_PROMOTIONS,
  DEFAULT_SETTINGS,
  type AdminSection,
  type AdminUser,
  type HomeContent,
  type NavigationColumn,
  type NavigationItem,
  type NavigationSectionEntry,
  type NavigationTree,
  type Order,
  type Product,
  type PromotionCategory,
  type PromotionsData,
  type Review,
  type SiteSettings,
} from "@/lib/admin/types";

type FlashTone = "success" | "error" | "info";

interface FlashMessage {
  tone: FlashTone;
  message: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

const SESSION_KEY = "allremotes_admin_session";
const USERS_KEY = "allremotes_admin_users";
const LAST_SECTION_KEY = "allremotes_admin_last_section";

const SECTION_META: Array<{
  id: AdminSection;
  label: string;
  icon: string;
  detail: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "01",
    detail: "Snapshot of the catalog, orders, promotions, and sync state.",
  },
  {
    id: "products",
    label: "Products",
    icon: "02",
    detail: "Manage the live catalog behind `/api/products`.",
  },
  {
    id: "orders",
    label: "Orders",
    icon: "03",
    detail: "Review orders and push status changes to the API.",
  },
  {
    id: "home",
    label: "Home Content",
    icon: "04",
    detail: "Edit hero content, features, proof points, and CTA blocks.",
  },
  {
    id: "promotions",
    label: "Promotions",
    icon: "05",
    detail: "Top info bar items, sale categories, and active offers.",
  },
  {
    id: "navigation",
    label: "Navigation",
    icon: "06",
    detail: "Control mega-menu structure, hidden sections, and shop-all links.",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: "07",
    detail: "Curate customer proof used across the storefront.",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "08",
    detail: "General site settings, toggles, and environment details.",
  },
  {
    id: "users",
    label: "Users",
    icon: "09",
    detail: "Local demo-only admin and customer accounts for this browser.",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "10",
    detail: "Operational metrics derived from products and orders.",
  },
];

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "section"
  );
}

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(date);
}

function createEmptyProduct() {
  return {
    id: uid("product"),
    brand: "",
    name: "New Product",
    category: "garage",
    price: 0,
    inStock: true,
    image: "",
    description: "",
    sku: "",
    condition: "Brand New",
    returns: "No returns accepted",
    seller: "AllRemotes (100% positive)",
  } satisfies Product;
}

function createEmptyReview() {
  return {
    id: uid("review"),
    author: "",
    rating: 5,
    text: "",
    verified: true,
    date: new Date().toISOString().slice(0, 10),
  } satisfies Review;
}

function createNavigationSection(title = "New section") {
  const key = uid(slugify(title));

  return {
    key,
    section: {
      title,
      path: `/${slugify(title)}`,
      hasDropdown: true,
      hidden: false,
      columns: [],
    } satisfies NavigationSectionEntry,
  };
}

function createNavigationColumn(title = "New column") {
  return {
    title,
    items: [],
  } satisfies NavigationColumn;
}

function createNavigationItem(name = "New item") {
  return {
    name,
    path: `/${slugify(name)}`,
    iconIndex: 0,
    isShopAll: false,
    hidden: false,
  } satisfies NavigationItem;
}

function loadStoredUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === "object" && entry !== null && "id" in entry,
      )
      .map(
        (entry): AdminUser => ({
          id: String(entry.id),
          name: String(entry.name ?? ""),
          email: String(entry.email ?? ""),
          password: entry.password ? String(entry.password) : "",
          role: entry.role === "admin" ? "admin" : "customer",
          status: entry.status === "inactive" ? "inactive" : "active",
          createdAt: entry.createdAt ? String(entry.createdAt) : undefined,
        }),
      );
  } catch {
    return [];
  }
}

function persistUsers(users: AdminUser[]) {
  const toPersist = users.map((user) => ({
    ...user,
    password: user.password ?? "",
  }));

  window.localStorage.setItem(USERS_KEY, JSON.stringify(toPersist));
}

function summarizeConnection(loadErrors: string[], booting: boolean) {
  if (booting) {
    return {
      tone: "info" as const,
      label: "Syncing",
      detail: "Loading the live admin datasets.",
    };
  }

  if (loadErrors.length > 0) {
    return {
      tone: "error" as const,
      label: "Needs attention",
      detail: `${loadErrors.length} API request${loadErrors.length > 1 ? "s" : ""} failed.`,
    };
  }

  return {
    tone: "success" as const,
    label: "Connected",
    detail: "All sections are reading from the configured API.",
  };
}

export default function AdminApp() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [selectedSection, setSelectedSection] =
    useState<AdminSection>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>(
    DEFAULT_HOME_CONTENT,
  );
  const [navigation, setNavigation] = useState<NavigationTree>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promotions, setPromotions] =
    useState<PromotionsData>(DEFAULT_PROMOTIONS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [booting, setBooting] = useState(false);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [sectionTransitionPending, startSectionTransition] = useTransition();

  useEffect(() => {
    try {
      const storedSession = window.localStorage.getItem(SESSION_KEY);
      const storedSection = window.localStorage.getItem(LAST_SECTION_KEY);

      if (storedSession) {
        setSession(JSON.parse(storedSession) as SessionUser);
      }

      if (
        storedSection &&
        SECTION_META.some((section) => section.id === storedSection)
      ) {
        setSelectedSection(storedSection as AdminSection);
      }

      setUsers(loadStoredUsers());
    } catch {
      setUsers([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!flash) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setFlash(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [flash]);

  useEffect(() => {
    if (!session) {
      return;
    }

    window.localStorage.setItem(LAST_SECTION_KEY, selectedSection);
  }, [selectedSection, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setBooting(true);
      setLoadErrors([]);

      const results = await Promise.allSettled([
        getProducts(),
        getOrders(),
        getHomeContent(),
        getNavigation(),
        getReviews(),
        getPromotions(),
        getSettings(),
      ]);

      if (cancelled) {
        return;
      }

      const nextErrors: string[] = [];

      if (results[0].status === "fulfilled") {
        setProducts(results[0].value);
      } else {
        nextErrors.push(`Products: ${results[0].reason instanceof Error ? results[0].reason.message : "Failed to load"}`);
      }

      if (results[1].status === "fulfilled") {
        setOrders(results[1].value);
      } else {
        nextErrors.push(`Orders: ${results[1].reason instanceof Error ? results[1].reason.message : "Failed to load"}`);
      }

      if (results[2].status === "fulfilled") {
        setHomeContent(results[2].value);
      } else {
        nextErrors.push(`Home content: ${results[2].reason instanceof Error ? results[2].reason.message : "Failed to load"}`);
      }

      if (results[3].status === "fulfilled") {
        setNavigation(results[3].value);
      } else {
        nextErrors.push(`Navigation: ${results[3].reason instanceof Error ? results[3].reason.message : "Failed to load"}`);
      }

      if (results[4].status === "fulfilled") {
        setReviews(results[4].value);
      } else {
        nextErrors.push(`Reviews: ${results[4].reason instanceof Error ? results[4].reason.message : "Failed to load"}`);
      }

      if (results[5].status === "fulfilled") {
        setPromotions(results[5].value);
      } else {
        nextErrors.push(`Promotions: ${results[5].reason instanceof Error ? results[5].reason.message : "Failed to load"}`);
      }

      if (results[6].status === "fulfilled") {
        setSettings(results[6].value);
      } else {
        nextErrors.push(`Settings: ${results[6].reason instanceof Error ? results[6].reason.message : "Failed to load"}`);
      }

      setLoadErrors(nextErrors);
      setLastSyncedAt(new Date().toISOString());
      setBooting(false);
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const connection = summarizeConnection(loadErrors, booting);

  const demoAdminCount =
    users.filter((user) => user.role === "admin" && user.status === "active")
      .length + 1;

  const catalogValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    [products],
  );

  const liveRevenue = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.pricing?.total ?? 0),
        0,
      ),
    [orders],
  );

  const signIn = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const storedUsers = loadStoredUsers();
    const matchedUser = storedUsers.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password === password &&
        user.role === "admin" &&
        user.status === "active",
    );

    if (
      normalizedEmail === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      const adminSession = {
        id: "admin",
        name: "Admin",
        email: ADMIN_EMAIL,
        role: "admin" as const,
      };

      window.localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession));
      setSession(adminSession);
      setFlash({
        tone: "success",
        message: "Admin session started. Syncing live data now.",
      });
      setPassword("");
      return;
    }

    if (matchedUser) {
      const adminSession = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: "admin" as const,
      };

      window.localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession));
      setSession(adminSession);
      setFlash({
        tone: "success",
        message: `Signed in as ${matchedUser.name}.`,
      });
      setPassword("");
      return;
    }

    setFlash({
      tone: "error",
      message: "Invalid admin credentials.",
    });
  };

  const signOut = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setBusyKey(null);
    setFlash({
      tone: "info",
      message: "Admin session closed.",
    });
  };

  const refreshEverything = async () => {
    if (!session) {
      return;
    }

    setBusyKey("refresh");
    setLoadErrors([]);

    try {
      const [
        nextProducts,
        nextOrders,
        nextHomeContent,
        nextNavigation,
        nextReviews,
        nextPromotions,
        nextSettings,
      ] = await Promise.all([
        getProducts(),
        getOrders(),
        getHomeContent(),
        getNavigation(),
        getReviews(),
        getPromotions(),
        getSettings(),
      ]);

      setProducts(nextProducts);
      setOrders(nextOrders);
      setHomeContent(nextHomeContent);
      setNavigation(nextNavigation);
      setReviews(nextReviews);
      setPromotions(nextPromotions);
      setSettings(nextSettings);
      setLastSyncedAt(new Date().toISOString());
      setFlash({
        tone: "success",
        message: "Live admin data refreshed.",
      });
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Refresh failed unexpectedly.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveProductsHandler = async () => {
    setBusyKey("save-products");

    try {
      await saveProducts(products);
      setFlash({
        tone: "success",
        message: "Products saved to the live API.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save products.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveHomeHandler = async () => {
    setBusyKey("save-home");

    try {
      await saveHomeContent(homeContent);
      setFlash({
        tone: "success",
        message: "Home content saved.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save home content.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveNavigationHandler = async () => {
    setBusyKey("save-navigation");

    try {
      await saveNavigation(navigation);
      setFlash({
        tone: "success",
        message: "Navigation saved.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save navigation.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveReviewsHandler = async () => {
    setBusyKey("save-reviews");

    try {
      await saveReviews(reviews);
      setFlash({
        tone: "success",
        message: "Reviews saved.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save reviews.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const savePromotionsHandler = async () => {
    setBusyKey("save-promotions");

    try {
      await savePromotions(promotions);
      setFlash({
        tone: "success",
        message: "Promotions saved.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save promotions.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveSettingsHandler = async () => {
    setBusyKey("save-settings");

    try {
      await saveSettings(settings);
      setFlash({
        tone: "success",
        message: "Settings saved.",
      });
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save settings.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveUsersHandler = (nextUsers: AdminUser[]) => {
    setUsers(nextUsers);
    persistUsers(nextUsers);
    setFlash({
      tone: "success",
      message: "Local admin users updated for this browser.",
    });
  };

  const updateOrderStatusHandler = async (orderId: string, status: string) => {
    setBusyKey(`order-${orderId}`);

    try {
      const response = await updateOrderStatus(orderId, status);

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...response,
                status:
                  (response.status as Order["status"] | undefined) ??
                  (status as Order["status"]),
              }
            : order,
        ),
      );

      setFlash({
        tone: "success",
        message: `Order ${orderId} moved to ${status}.`,
      });
    } catch (error) {
      setFlash({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not update the order status.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  if (!isReady) {
    return (
      <div className="admin-loading-screen">
        <div className="loader-ring" />
        <p>Preparing the allremotes admin workspace…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="admin-auth-shell">
        <div className="admin-auth-panel">
          <div className="eyebrow">Standalone Admin</div>
          <h1>Manage the live allremotes storefront.</h1>
          <p className="auth-copy">
            This standalone build targets <code>{getApiBaseLabel()}</code> via{" "}
            <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </p>

          {flash ? <FlashBanner flash={flash} /> : null}

          <div className="form-grid">
            <Field label="Admin email">
              <input
                className="input"
                value={email}
                type="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@allremotes.com"
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                value={password}
                type="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the admin password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    signIn();
                  }
                }}
              />
            </Field>
          </div>

          <div className="auth-actions">
            <button className="btn btn--primary" type="button" onClick={signIn}>
              Sign In
            </button>
            <div className="surface surface--muted auth-hint">
              <strong>Live reference admin:</strong> <code>{ADMIN_EMAIL}</code>
            </div>
          </div>
        </div>

        <div className="admin-auth-aside">
          <div className="surface surface--emphasis hero-panel">
            <div className="hero-metric-grid">
              <MetricCard
                label="Catalog rows"
                value={String(products.length || "Live")}
                helper="Products are pulled from the existing API."
              />
              <MetricCard
                label="Orders"
                value={String(orders.length || "Live")}
                helper="Status changes go back to the current backend."
              />
              <MetricCard
                label="Content domains"
                value="5"
                helper="Home, navigation, reviews, promotions, settings."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMeta =
    SECTION_META.find((section) => section.id === selectedSection) ??
    SECTION_META[0];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div>
            <div className="eyebrow">AllRemotes</div>
            <h1>Admin</h1>
          </div>
          <div className={`status-pill status-pill--${connection.tone}`}>
            <span>{connection.label}</span>
          </div>
        </div>

        <div className="surface surface--muted sidebar-connection">
          <div className="status-copy">{connection.detail}</div>
          <div className="status-meta">
            <span>API</span>
            <code>{getApiBaseLabel()}</code>
          </div>
          <div className="status-meta">
            <span>Last sync</span>
            <strong>{lastSyncedAt ? formatDateTime(lastSyncedAt) : "Waiting"}</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SECTION_META.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`nav-chip ${
                selectedSection === section.id ? "nav-chip--active" : ""
              }`}
              onClick={() =>
                startSectionTransition(() => {
                  setSelectedSection(section.id);
                })
              }
            >
              <span className="nav-chip__icon">{section.icon}</span>
              <span>
                <strong>{section.label}</strong>
                <small>{section.detail}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer surface surface--muted">
          <div>
            <div className="eyebrow">Signed in</div>
            <strong>{session.name}</strong>
            <p>{session.email}</p>
          </div>
          <button className="btn btn--ghost" type="button" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="page-header">
          <div>
            <div className="eyebrow">Section {activeMeta.icon}</div>
            <h2>{activeMeta.label}</h2>
            <p>{activeMeta.detail}</p>
          </div>
          <div className="page-header__actions">
            {sectionTransitionPending ? (
              <span className="page-status">Switching view…</span>
            ) : null}
            <button
              className="btn btn--secondary"
              type="button"
              onClick={refreshEverything}
              disabled={busyKey === "refresh"}
            >
              {busyKey === "refresh" ? "Refreshing…" : "Refresh Live Data"}
            </button>
          </div>
        </header>

        {flash ? <FlashBanner flash={flash} /> : null}

        {loadErrors.length > 0 ? (
          <div className="surface surface--warning">
            <strong>API warnings</strong>
            <ul className="inline-list">
              {loadErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {selectedSection === "dashboard" ? (
          <DashboardSection
            products={products}
            orders={orders}
            reviews={reviews}
            promotions={promotions}
            homeContent={homeContent}
            catalogValue={catalogValue}
            revenue={liveRevenue}
            adminCount={demoAdminCount}
            onNavigate={(section) =>
              startSectionTransition(() => {
                setSelectedSection(section);
              })
            }
          />
        ) : null}

        {selectedSection === "products" ? (
          <ProductsSection
            products={products}
            currentProductId={currentProductId}
            busy={busyKey === "save-products"}
            onPick={setCurrentProductId}
            onChange={setProducts}
            onSave={saveProductsHandler}
          />
        ) : null}

        {selectedSection === "orders" ? (
          <OrdersSection
            orders={orders}
            currentOrderId={currentOrderId}
            busyKey={busyKey}
            onSelect={setCurrentOrderId}
            onStatusChange={updateOrderStatusHandler}
          />
        ) : null}

        {selectedSection === "home" ? (
          <HomeContentSection
            content={homeContent}
            busy={busyKey === "save-home"}
            onChange={setHomeContent}
            onSave={saveHomeHandler}
          />
        ) : null}

        {selectedSection === "promotions" ? (
          <PromotionsSection
            promotions={promotions}
            busy={busyKey === "save-promotions"}
            onChange={setPromotions}
            onSave={savePromotionsHandler}
          />
        ) : null}

        {selectedSection === "navigation" ? (
          <NavigationSection
            navigation={navigation}
            busy={busyKey === "save-navigation"}
            onChange={setNavigation}
            onSave={saveNavigationHandler}
          />
        ) : null}

        {selectedSection === "reviews" ? (
          <ReviewsSection
            reviews={reviews}
            busy={busyKey === "save-reviews"}
            onChange={setReviews}
            onSave={saveReviewsHandler}
          />
        ) : null}

        {selectedSection === "settings" ? (
          <SettingsSection
            settings={settings}
            busy={busyKey === "save-settings"}
            onChange={setSettings}
            onSave={saveSettingsHandler}
          />
        ) : null}

        {selectedSection === "users" ? (
          <UsersSection
            users={users}
            onSave={saveUsersHandler}
          />
        ) : null}

        {selectedSection === "analytics" ? (
          <AnalyticsSection
            products={products}
            orders={orders}
            promotions={promotions}
          />
        ) : null}
      </main>
    </div>
  );
}

function DashboardSection(props: {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  promotions: PromotionsData;
  homeContent: HomeContent;
  catalogValue: number;
  revenue: number;
  adminCount: number;
  onNavigate: (section: AdminSection) => void;
}) {
  const activePromotions = props.promotions.offers.offers.filter(
    (offer) => offer.enabled,
  ).length;

  const latestOrder = props.orders[0];
  const featuredCategories = Array.from(
    new Set(props.products.map((product) => product.category)),
  ).slice(0, 4);

  return (
    <div className="section-stack">
      <div className="hero-metric-grid">
        <MetricCard
          label="Products"
          value={String(props.products.length)}
          helper={`${featuredCategories.join(", ") || "No categories yet"}`}
        />
        <MetricCard
          label="Order revenue"
          value={formatCurrency(props.revenue)}
          helper={`${props.orders.length} total orders`}
        />
        <MetricCard
          label="Active promos"
          value={String(activePromotions)}
          helper={`${props.promotions.topInfoBar.items.length} info-bar items`}
        />
        <MetricCard
          label="Admin users"
          value={String(props.adminCount)}
          helper="Local demo-only admin accounts"
        />
      </div>

      <div className="layout-grid layout-grid--primary">
        <Panel
          title="Storefront snapshot"
          subtitle="A quick read of the current live storefront data."
        >
          <dl className="detail-grid">
            <Detail label="Hero headline" value={props.homeContent.hero.title} />
            <Detail
              label="Hero image count"
              value={String(props.homeContent.heroImages.length)}
            />
            <Detail label="Catalog value" value={formatCurrency(props.catalogValue)} />
            <Detail label="Saved reviews" value={String(props.reviews.length)} />
          </dl>
        </Panel>

        <Panel
          title="Quick actions"
          subtitle="Jump straight to the sections that change the live site."
        >
          <div className="action-stack">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => props.onNavigate("products")}
            >
              Edit Catalog
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => props.onNavigate("home")}
            >
              Update Home Content
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => props.onNavigate("orders")}
            >
              Review Orders
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => props.onNavigate("promotions")}
            >
              Manage Promotions
            </button>
          </div>
        </Panel>
      </div>

      <div className="layout-grid layout-grid--primary">
        <Panel
          title="Latest order"
          subtitle="The most recent order returned by `/api/orders`."
        >
          {latestOrder ? (
            <div className="order-snapshot">
              <p>
                <strong>{latestOrder.id}</strong>
              </p>
              <p>{latestOrder.customer?.email ?? "No email supplied"}</p>
              <p>{formatCurrency(Number(latestOrder.pricing?.total ?? 0))}</p>
              <p>{formatDateTime(latestOrder.createdAt)}</p>
            </div>
          ) : (
            <EmptyState title="No orders yet" detail="Orders will appear here once the API returns them." />
          )}
        </Panel>

        <Panel
          title="Content heartbeat"
          subtitle="Signals from the current homepage configuration."
        >
          <ul className="signal-list">
            <li>
              <span>Primary CTA</span>
              <strong>{props.homeContent.hero.primaryCta || "Unset"}</strong>
            </li>
            <li>
              <span>Features</span>
              <strong>{props.homeContent.features.length}</strong>
            </li>
            <li>
              <span>Why-buy blocks</span>
              <strong>{props.homeContent.whyBuy.length}</strong>
            </li>
            <li>
              <span>CTA destination</span>
              <strong>{props.homeContent.ctaSection.buttonPath || "Unset"}</strong>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function ProductsSection(props: {
  products: Product[];
  currentProductId: string | null;
  busy: boolean;
  onPick: (id: string | null) => void;
  onChange: (products: Product[]) => void;
  onSave: () => void;
}) {
  const { products, currentProductId, busy, onPick, onChange, onSave } = props;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!currentProductId && products.length > 0) {
      onPick(products[0].id);
    }
  }, [currentProductId, onPick, products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        String(product.sku ?? "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, deferredSearch, products]);

  const currentProduct = products.find((product) => product.id === currentProductId) ?? null;

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  ).sort();

  function patchProduct(productId: string, patch: Partial<Product>) {
    onChange(
      products.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
  }

  function addProduct() {
    const product = createEmptyProduct();
    onChange([product, ...products]);
    onPick(product.id);
  }

  function duplicateProduct(product: Product) {
    const clone = {
      ...product,
      id: uid("product"),
      name: `${product.name} Copy`,
    };

    onChange([clone, ...products]);
    onPick(clone.id);
  }

  function removeProduct(productId: string) {
    onChange(products.filter((product) => product.id !== productId));

    if (currentProductId === productId) {
      const next = products.find((product) => product.id !== productId);
      onPick(next?.id ?? null);
    }
  }

  return (
    <div className="section-stack">
      <div className="layout-grid layout-grid--primary">
        <Panel
          title="Catalog workspace"
          subtitle="Search, filter, duplicate, or delete live catalog rows."
          actions={
            <>
              <button className="btn btn--secondary" type="button" onClick={addProduct}>
                Add Product
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={onSave}
                disabled={busy}
              >
                {busy ? "Saving…" : "Save Catalog"}
              </button>
            </>
          }
        >
          <div className="filter-row">
            <input
              className="input"
              value={search}
              placeholder="Search by name, SKU, brand, or description"
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="input"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={product.id === currentProductId ? "table-row-active" : ""}
                  >
                    <td>
                      <div className="table-product">
                        <div className="thumb">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <span>IMG</span>
                          )}
                        </div>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.brand || "No brand"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{product.category || "Uncategorized"}</td>
                    <td>{formatCurrency(Number(product.price || 0))}</td>
                    <td>
                      <span
                        className={`status-dot ${
                          product.inStock ? "status-dot--ok" : "status-dot--bad"
                        }`}
                      >
                        {product.inStock ? "In stock" : "Out of stock"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn--ghost"
                          type="button"
                          onClick={() => onPick(product.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--ghost"
                          type="button"
                          onClick={() => duplicateProduct(product)}
                        >
                          Duplicate
                        </button>
                        <button
                          className="btn btn--danger"
                          type="button"
                          onClick={() => removeProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Product editor"
          subtitle="Edits are local until you save the catalog."
        >
          {currentProduct ? (
            <div className="form-grid">
              <Field label="Product name">
                <input
                  className="input"
                  value={currentProduct.name}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { name: event.target.value })
                  }
                />
              </Field>
              <Field label="Brand">
                <input
                  className="input"
                  value={currentProduct.brand}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { brand: event.target.value })
                  }
                />
              </Field>
              <Field label="Category">
                <input
                  className="input"
                  value={currentProduct.category}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { category: event.target.value })
                  }
                />
              </Field>
              <Field label="SKU">
                <input
                  className="input"
                  value={currentProduct.sku ?? ""}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { sku: event.target.value })
                  }
                />
              </Field>
              <Field label="Price (AUD)">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={currentProduct.price}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, {
                      price: Number(event.target.value || 0),
                    })
                  }
                />
              </Field>
              <Field label="Condition">
                <input
                  className="input"
                  value={currentProduct.condition ?? ""}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { condition: event.target.value })
                  }
                />
              </Field>
              <Field label="Seller">
                <input
                  className="input"
                  value={currentProduct.seller ?? ""}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { seller: event.target.value })
                  }
                />
              </Field>
              <Field label="Returns">
                <input
                  className="input"
                  value={currentProduct.returns ?? ""}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { returns: event.target.value })
                  }
                />
              </Field>
              <Field label="Image URL" full>
                <input
                  className="input"
                  value={currentProduct.image}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, { image: event.target.value })
                  }
                  placeholder="https://..."
                />
              </Field>
              <Field label="Description" full>
                <textarea
                  className="textarea"
                  value={currentProduct.description}
                  onChange={(event) =>
                    patchProduct(currentProduct.id, {
                      description: event.target.value,
                    })
                  }
                />
              </Field>
              <Toggle
                label="Available for sale"
                checked={currentProduct.inStock}
                onChange={(checked) =>
                  patchProduct(currentProduct.id, { inStock: checked })
                }
              />
            </div>
          ) : (
            <EmptyState
              title="Choose a product"
              detail="Pick a row from the table to edit it here."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function OrdersSection(props: {
  orders: Order[];
  currentOrderId: string | null;
  busyKey: string | null;
  onSelect: (id: string | null) => void;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const { orders, currentOrderId, busyKey, onSelect, onStatusChange } = props;
  const currentOrder = orders.find((order) => order.id === currentOrderId) ?? null;

  useEffect(() => {
    if (!currentOrderId && orders.length > 0) {
      onSelect(orders[0].id);
    }
  }, [currentOrderId, onSelect, orders]);

  return (
    <div className="section-stack">
      <div className="layout-grid layout-grid--primary">
        <Panel
          title="Order queue"
          subtitle="Live order data returned by `/api/orders`."
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={order.id === currentOrderId ? "table-row-active" : ""}
                    onClick={() => onSelect(order.id)}
                  >
                    <td>
                      <strong>{order.id}</strong>
                    </td>
                    <td>{order.customer?.email ?? "Unknown customer"}</td>
                    <td>{formatCurrency(Number(order.pricing?.total ?? 0))}</td>
                    <td>{formatShortDate(order.createdAt)}</td>
                    <td>
                      <select
                        className="input"
                        value={order.status ?? "processing"}
                        onChange={(event) =>
                          onStatusChange(order.id, event.target.value)
                        }
                        disabled={busyKey === `order-${order.id}`}
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Order detail"
          subtitle="Inspect the selected order before updating it."
        >
          {currentOrder ? (
            <div className="section-stack">
              <dl className="detail-grid">
                <Detail label="Customer" value={currentOrder.customer?.fullName ?? "Unknown"} />
                <Detail label="Email" value={currentOrder.customer?.email ?? "Unknown"} />
                <Detail label="Status" value={currentOrder.status ?? "processing"} />
                <Detail label="Created" value={formatDateTime(currentOrder.createdAt)} />
                <Detail label="Subtotal" value={formatCurrency(Number(currentOrder.pricing?.subtotal ?? 0))} />
                <Detail label="Total" value={formatCurrency(Number(currentOrder.pricing?.total ?? 0))} />
              </dl>

              <div className="surface surface--muted">
                <strong>Shipping</strong>
                <p>
                  {currentOrder.shipping?.address ?? "No address"}
                  <br />
                  {[
                    currentOrder.shipping?.city,
                    currentOrder.shipping?.state,
                    currentOrder.shipping?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div className="surface surface--muted">
                <strong>Items</strong>
                <ul className="inline-list">
                  {(currentOrder.items ?? []).map((item) => (
                    <li key={item.id}>
                      {item.quantity} x {item.name} ({formatCurrency(item.lineTotal)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Pick an order"
              detail="Select a row from the order queue to inspect its contents."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function HomeContentSection(props: {
  content: HomeContent;
  busy: boolean;
  onChange: (content: HomeContent) => void;
  onSave: () => void;
}) {
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  function patchHero<K extends keyof HomeContent["hero"]>(
    key: K,
    value: HomeContent["hero"][K],
  ) {
    props.onChange({
      ...props.content,
      hero: {
        ...props.content.hero,
        [key]: value,
      },
    });
  }

  function patchCta<K extends keyof HomeContent["ctaSection"]>(
    key: K,
    value: HomeContent["ctaSection"][K],
  ) {
    props.onChange({
      ...props.content,
      ctaSection: {
        ...props.content.ctaSection,
        [key]: value,
      },
    });
  }

  function patchFeature(index: number, patch: Partial<HomeContent["features"][number]>) {
    props.onChange({
      ...props.content,
      features: props.content.features.map((feature, featureIndex) =>
        featureIndex === index ? { ...feature, ...patch } : feature,
      ),
    });
  }

  function patchWhyBuy(index: number, patch: Partial<HomeContent["whyBuy"][number]>) {
    props.onChange({
      ...props.content,
      whyBuy: props.content.whyBuy.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  }

  function patchHeroImage(index: number, value: string) {
    props.onChange({
      ...props.content,
      heroImages: props.content.heroImages.map((image, imageIndex) =>
        imageIndex === index ? value : image,
      ),
    });
  }

  async function loadAssets() {
    setAssetBusy(true);
    setAssetError("");

    try {
      const images = await getS3Images();
      setAssetUrls(images);
    } catch (error) {
      setAssetUrls([]);
      setAssetError(
        error instanceof Error ? error.message : "Could not load asset library.",
      );
    } finally {
      setAssetBusy(false);
    }
  }

  async function uploadAsset(file: File | null) {
    if (!file) {
      return;
    }

    setAssetBusy(true);
    setAssetError("");
    setUploadProgress(0);

    try {
      const response = await createPresignedUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });

      if (!response.presignedUrl || !response.publicUrl) {
        throw new Error(response.error || "Upload URL was not returned.");
      }

      await uploadFileToS3(response.presignedUrl, file, setUploadProgress);
      const images = await getS3Images();
      setAssetUrls(images);
    } catch (error) {
      setAssetError(
        error instanceof Error ? error.message : "Could not upload the asset.",
      );
    } finally {
      setAssetBusy(false);
    }
  }

  return (
    <div className="section-stack">
      <Panel
        title="Hero and landing content"
        subtitle="These fields power the live homepage messaging and CTA flow."
        actions={
          <button
            className="btn btn--primary"
            type="button"
            onClick={props.onSave}
            disabled={props.busy}
          >
            {props.busy ? "Saving…" : "Save Home Content"}
          </button>
        }
      >
        <div className="form-grid">
          <Field label="Hero title">
            <input
              className="input"
              value={props.content.hero.title}
              onChange={(event) => patchHero("title", event.target.value)}
            />
          </Field>
          <Field label="Hero subtitle">
            <input
              className="input"
              value={props.content.hero.subtitle}
              onChange={(event) => patchHero("subtitle", event.target.value)}
            />
          </Field>
          <Field label="Hero description" full>
            <textarea
              className="textarea"
              value={props.content.hero.description}
              onChange={(event) => patchHero("description", event.target.value)}
            />
          </Field>
          <Field label="Primary CTA">
            <input
              className="input"
              value={props.content.hero.primaryCta}
              onChange={(event) => patchHero("primaryCta", event.target.value)}
            />
          </Field>
          <Field label="Primary CTA path">
            <input
              className="input"
              value={props.content.hero.primaryCtaPath}
              onChange={(event) => patchHero("primaryCtaPath", event.target.value)}
            />
          </Field>
          <Field label="Secondary CTA">
            <input
              className="input"
              value={props.content.hero.secondaryCta}
              onChange={(event) => patchHero("secondaryCta", event.target.value)}
            />
          </Field>
          <Field label="Secondary CTA path">
            <input
              className="input"
              value={props.content.hero.secondaryCtaPath}
              onChange={(event) =>
                patchHero("secondaryCtaPath", event.target.value)
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="layout-grid layout-grid--primary">
        <Panel title="Hero image URLs" subtitle="Use live S3 URLs or public paths.">
          <div className="stack-list">
            {props.content.heroImages.map((image, index) => (
              <div key={`${image}_${index}`} className="surface surface--muted">
                <div className="field-label">Slide {index + 1}</div>
                <input
                  className="input"
                  value={image}
                  onChange={(event) => patchHeroImage(index, event.target.value)}
                />
                <div className="image-preview">
                  {image ? <img src={image} alt={`Hero ${index + 1}`} /> : <span>No image</span>}
                </div>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() =>
                    props.onChange({
                      ...props.content,
                      heroImages: props.content.heroImages.filter(
                        (_, imageIndex) => imageIndex !== index,
                      ),
                    })
                  }
                >
                  Remove Slide
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() =>
              props.onChange({
                ...props.content,
                heroImages: [...props.content.heroImages, ""],
              })
            }
          >
            Add Hero Slide
          </button>
        </Panel>

        <Panel
          title="Asset library"
          subtitle="Optional helper for the live S3 media endpoints."
          actions={
            <button
              className="btn btn--secondary"
              type="button"
              onClick={loadAssets}
              disabled={assetBusy}
            >
              {assetBusy ? "Loading…" : "Load Assets"}
            </button>
          }
        >
          <div className="action-stack">
            <label className="btn btn--ghost file-input">
              Upload to S3
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => uploadAsset(event.target.files?.[0] ?? null)}
              />
            </label>
            {assetBusy && uploadProgress > 0 ? (
              <span className="page-status">Upload progress: {uploadProgress}%</span>
            ) : null}
            {assetError ? <p className="status-copy">{assetError}</p> : null}
          </div>
          <div className="asset-grid">
            {assetUrls.map((url) => (
              <button
                key={url}
                type="button"
                className="asset-card"
                onClick={() => navigator.clipboard?.writeText(url)?.catch(() => {})}
              >
                <img src={url} alt="Asset preview" />
                <span>Copy URL</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Feature tiles" subtitle="Cards shown beneath the hero section.">
        <div className="stack-list">
          {props.content.features.map((feature, index) => (
            <div key={`${feature.title}_${index}`} className="surface surface--muted">
              <div className="form-grid">
                <Field label="Icon">
                  <input
                    className="input"
                    value={feature.icon}
                    onChange={(event) =>
                      patchFeature(index, { icon: event.target.value })
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    className="input"
                    value={feature.title}
                    onChange={(event) =>
                      patchFeature(index, { title: event.target.value })
                    }
                  />
                </Field>
                <Field label="Description" full>
                  <textarea
                    className="textarea"
                    value={feature.description}
                    onChange={(event) =>
                      patchFeature(index, { description: event.target.value })
                    }
                  />
                </Field>
                <Field label="Path">
                  <input
                    className="input"
                    value={feature.path}
                    onChange={(event) =>
                      patchFeature(index, { path: event.target.value })
                    }
                  />
                </Field>
                <Field label="Link text">
                  <input
                    className="input"
                    value={feature.linkText}
                    onChange={(event) =>
                      patchFeature(index, { linkText: event.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Why buy blocks" subtitle="Trust and value propositions.">
        <div className="stack-list">
          {props.content.whyBuy.map((item, index) => (
            <div key={`${item.title}_${index}`} className="surface surface--muted">
              <div className="form-grid">
                <Field label="Icon">
                  <input
                    className="input"
                    value={item.icon}
                    onChange={(event) =>
                      patchWhyBuy(index, { icon: event.target.value })
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    className="input"
                    value={item.title}
                    onChange={(event) =>
                      patchWhyBuy(index, { title: event.target.value })
                    }
                  />
                </Field>
                <Field label="Description" full>
                  <textarea
                    className="textarea"
                    value={item.description}
                    onChange={(event) =>
                      patchWhyBuy(index, { description: event.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Closing CTA" subtitle="Final conversion block on the homepage.">
        <div className="form-grid">
          <Field label="CTA title">
            <input
              className="input"
              value={props.content.ctaSection.title}
              onChange={(event) => patchCta("title", event.target.value)}
            />
          </Field>
          <Field label="CTA button text">
            <input
              className="input"
              value={props.content.ctaSection.buttonText}
              onChange={(event) => patchCta("buttonText", event.target.value)}
            />
          </Field>
          <Field label="CTA description" full>
            <textarea
              className="textarea"
              value={props.content.ctaSection.description}
              onChange={(event) => patchCta("description", event.target.value)}
            />
          </Field>
          <Field label="CTA path">
            <input
              className="input"
              value={props.content.ctaSection.buttonPath}
              onChange={(event) => patchCta("buttonPath", event.target.value)}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}

function PromotionsSection(props: {
  promotions: PromotionsData;
  busy: boolean;
  onChange: (promotions: PromotionsData) => void;
  onSave: () => void;
}) {
  function patchTopInfoItem(index: number, value: string) {
    props.onChange({
      ...props.promotions,
      topInfoBar: {
        ...props.promotions.topInfoBar,
        items: props.promotions.topInfoBar.items.map((item, itemIndex) =>
          itemIndex === index ? value : item,
        ),
      },
    });
  }

  function patchOffer(offerId: string, patch: Partial<PromotionsData["offers"]["offers"][number]>) {
    props.onChange({
      ...props.promotions,
      offers: {
        ...props.promotions.offers,
        offers: props.promotions.offers.offers.map((offer) =>
          offer.id === offerId ? { ...offer, ...patch } : offer,
        ),
      },
    });
  }

  function patchCategory(categoryId: string, patch: Partial<PromotionCategory>) {
    props.onChange({
      ...props.promotions,
      offers: {
        ...props.promotions.offers,
        categories: props.promotions.offers.categories.map((category) =>
          category.id === categoryId ? { ...category, ...patch } : category,
        ),
      },
    });
  }

  return (
    <div className="section-stack">
      <Panel
        title="Info bar and offer engine"
        subtitle="Top-of-site trust messages plus promotional rules."
        actions={
          <button
            className="btn btn--primary"
            type="button"
            onClick={props.onSave}
            disabled={props.busy}
          >
            {props.busy ? "Saving…" : "Save Promotions"}
          </button>
        }
      >
        <Toggle
          label="Enable top info bar"
          checked={props.promotions.topInfoBar.enabled}
          onChange={(checked) =>
            props.onChange({
              ...props.promotions,
              topInfoBar: {
                ...props.promotions.topInfoBar,
                enabled: checked,
              },
            })
          }
        />

        <div className="stack-list">
          {props.promotions.topInfoBar.items.map((item, index) => (
            <Field key={`${item}_${index}`} label={`Info item ${index + 1}`}>
              <input
                className="input"
                value={item}
                onChange={(event) => patchTopInfoItem(index, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </Panel>

      <div className="layout-grid layout-grid--primary">
        <Panel title="Offer categories" subtitle="Reusable buckets for seasonal offers.">
          <div className="stack-list">
            {props.promotions.offers.categories.map((category) => (
              <div key={category.id} className="form-grid">
                <Field label="Category ID">
                  <input
                    className="input"
                    value={category.id}
                    onChange={(event) =>
                      patchCategory(category.id, { id: event.target.value })
                    }
                  />
                </Field>
                <Field label="Display name">
                  <input
                    className="input"
                    value={category.name}
                    onChange={(event) =>
                      patchCategory(category.id, { name: event.target.value })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() =>
              props.onChange({
                ...props.promotions,
                offers: {
                  ...props.promotions.offers,
                  categories: [
                    ...props.promotions.offers.categories,
                    { id: uid("category"), name: "New Category" },
                  ],
                },
              })
            }
          >
            Add Category
          </button>
        </Panel>

        <Panel title="Offer settings" subtitle="Global discount behavior.">
          <Toggle
            label="Stack promotional and member discounts"
            checked={props.promotions.offers.stackWithMemberDiscount}
            onChange={(checked) =>
              props.onChange({
                ...props.promotions,
                offers: {
                  ...props.promotions.offers,
                  stackWithMemberDiscount: checked,
                },
              })
            }
          />
        </Panel>
      </div>

      <Panel title="Offers" subtitle="Discount rules active on the storefront.">
        <div className="stack-list">
          {props.promotions.offers.offers.map((offer) => (
            <div key={offer.id} className="surface surface--muted">
              <div className="form-grid">
                <Field label="Offer name">
                  <input
                    className="input"
                    value={offer.name}
                    onChange={(event) =>
                      patchOffer(offer.id, { name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Category">
                  <select
                    className="input"
                    value={offer.categoryId}
                    onChange={(event) =>
                      patchOffer(offer.id, { categoryId: event.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {props.promotions.offers.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Applies to">
                  <select
                    className="input"
                    value={offer.appliesTo}
                    onChange={(event) =>
                      patchOffer(offer.id, { appliesTo: event.target.value })
                    }
                  >
                    <option value="all">All products</option>
                    <option value="garage">Garage</option>
                    <option value="car">Car</option>
                  </select>
                </Field>
                <Field label="Discount %">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="95"
                    value={offer.discountPercent}
                    onChange={(event) =>
                      patchOffer(offer.id, {
                        discountPercent: Number(event.target.value || 0),
                      })
                    }
                  />
                </Field>
                <Field label="Start date">
                  <input
                    className="input"
                    type="date"
                    value={offer.startDate}
                    onChange={(event) =>
                      patchOffer(offer.id, { startDate: event.target.value })
                    }
                  />
                </Field>
                <Field label="End date">
                  <input
                    className="input"
                    type="date"
                    value={offer.endDate}
                    onChange={(event) =>
                      patchOffer(offer.id, { endDate: event.target.value })
                    }
                  />
                </Field>
                <Toggle
                  label="Offer enabled"
                  checked={offer.enabled}
                  onChange={(checked) => patchOffer(offer.id, { enabled: checked })}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn btn--secondary"
          type="button"
          onClick={() =>
            props.onChange({
              ...props.promotions,
              offers: {
                ...props.promotions.offers,
                offers: [
                  ...props.promotions.offers.offers,
                  createEmptyOffer(props.promotions.offers.offers.length),
                ],
              },
            })
          }
        >
          Add Offer
        </button>
      </Panel>
    </div>
  );
}

function NavigationSection(props: {
  navigation: NavigationTree;
  busy: boolean;
  onChange: (navigation: NavigationTree) => void;
  onSave: () => void;
}) {
  const entries = Object.entries(props.navigation);

  function patchSection(key: string, patch: Partial<NavigationSectionEntry>) {
    props.onChange({
      ...props.navigation,
      [key]: {
        ...props.navigation[key],
        ...patch,
      },
    });
  }

  function patchColumn(
    key: string,
    columnIndex: number,
    patch: Partial<NavigationColumn>,
  ) {
    patchSection(key, {
      columns: (props.navigation[key].columns ?? []).map((column, currentIndex) =>
        currentIndex === columnIndex ? { ...column, ...patch } : column,
      ),
    });
  }

  function patchItem(
    key: string,
    columnIndex: number,
    itemIndex: number,
    patch: Partial<NavigationItem>,
  ) {
    patchColumn(key, columnIndex, {
      items: (props.navigation[key].columns?.[columnIndex]?.items ?? []).map(
        (item, currentIndex) =>
          currentIndex === itemIndex ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="section-stack">
      <Panel
        title="Mega-menu editor"
        subtitle="Edit section visibility, columns, and item metadata."
        actions={
          <>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => {
                const { key, section } = createNavigationSection();
                props.onChange({
                  ...props.navigation,
                  [key]: section,
                });
              }}
            >
              Add Section
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={props.onSave}
              disabled={props.busy}
            >
              {props.busy ? "Saving…" : "Save Navigation"}
            </button>
          </>
        }
      >
        <div className="stack-list">
          {entries.map(([key, section]) => (
            <div key={key} className="surface surface--muted">
              <div className="section-headline">
                <div>
                  <div className="eyebrow">Key</div>
                  <strong>{key}</strong>
                </div>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() => {
                    const next = { ...props.navigation };
                    delete next[key];
                    props.onChange(next);
                  }}
                >
                  Delete Section
                </button>
              </div>

              <div className="form-grid">
                <Field label="Section title">
                  <input
                    className="input"
                    value={section.title}
                    onChange={(event) =>
                      patchSection(key, { title: event.target.value })
                    }
                  />
                </Field>
                <Field label="Section path">
                  <input
                    className="input"
                    value={section.path}
                    onChange={(event) =>
                      patchSection(key, { path: event.target.value })
                    }
                  />
                </Field>
                <Toggle
                  label="Hidden on storefront"
                  checked={Boolean(section.hidden)}
                  onChange={(checked) => patchSection(key, { hidden: checked })}
                />
                <Toggle
                  label="Has dropdown"
                  checked={section.hasDropdown !== false}
                  onChange={(checked) =>
                    patchSection(key, { hasDropdown: checked })
                  }
                />
              </div>

              <div className="stack-list">
                {(section.columns ?? []).map((column, columnIndex) => (
                  <div key={`${column.title}_${columnIndex}`} className="surface">
                    <div className="section-headline">
                      <Field label={`Column ${columnIndex + 1}`} full>
                        <input
                          className="input"
                          value={column.title}
                          onChange={(event) =>
                            patchColumn(key, columnIndex, {
                              title: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <button
                        className="btn btn--danger"
                        type="button"
                        onClick={() =>
                          patchSection(key, {
                            columns: (section.columns ?? []).filter(
                              (_, index) => index !== columnIndex,
                            ),
                          })
                        }
                      >
                        Remove Column
                      </button>
                    </div>

                    <div className="stack-list">
                      {column.items.map((item, itemIndex) => (
                        <div key={`${item.name}_${itemIndex}`} className="surface surface--muted">
                          <div className="form-grid">
                            <Field label="Item name">
                              <input
                                className="input"
                                value={item.name}
                                onChange={(event) =>
                                  patchItem(key, columnIndex, itemIndex, {
                                    name: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Field label="Item path">
                              <input
                                className="input"
                                value={item.path}
                                onChange={(event) =>
                                  patchItem(key, columnIndex, itemIndex, {
                                    path: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Field label="Icon index">
                              <input
                                className="input"
                                type="number"
                                value={item.iconIndex ?? 0}
                                onChange={(event) =>
                                  patchItem(key, columnIndex, itemIndex, {
                                    iconIndex: Number(event.target.value || 0),
                                  })
                                }
                              />
                            </Field>
                            <Toggle
                              label="Shop-all item"
                              checked={Boolean(item.isShopAll)}
                              onChange={(checked) =>
                                patchItem(key, columnIndex, itemIndex, {
                                  isShopAll: checked,
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() =>
                        patchColumn(key, columnIndex, {
                          items: [...column.items, createNavigationItem()],
                        })
                      }
                    >
                      Add Item
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="btn btn--secondary"
                type="button"
                onClick={() =>
                  patchSection(key, {
                    columns: [...(section.columns ?? []), createNavigationColumn()],
                  })
                }
              >
                Add Column
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ReviewsSection(props: {
  reviews: Review[];
  busy: boolean;
  onChange: (reviews: Review[]) => void;
  onSave: () => void;
}) {
  function patchReview(reviewId: string, patch: Partial<Review>) {
    props.onChange(
      props.reviews.map((review) =>
        review.id === reviewId ? { ...review, ...patch } : review,
      ),
    );
  }

  return (
    <div className="section-stack">
      <Panel
        title="Review curation"
        subtitle="These reviews are displayed as social proof on the storefront."
        actions={
          <>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => props.onChange([createEmptyReview(), ...props.reviews])}
            >
              Add Review
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={props.onSave}
              disabled={props.busy}
            >
              {props.busy ? "Saving…" : "Save Reviews"}
            </button>
          </>
        }
      >
        <div className="stack-list">
          {props.reviews.map((review) => (
            <div key={review.id} className="surface surface--muted">
              <div className="section-headline">
                <strong>{review.author || "New review"}</strong>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() =>
                    props.onChange(
                      props.reviews.filter((entry) => entry.id !== review.id),
                    )
                  }
                >
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <Field label="Author">
                  <input
                    className="input"
                    value={review.author}
                    onChange={(event) =>
                      patchReview(review.id, { author: event.target.value })
                    }
                  />
                </Field>
                <Field label="Rating">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="5"
                    value={review.rating}
                    onChange={(event) =>
                      patchReview(review.id, {
                        rating: Number(event.target.value || 5),
                      })
                    }
                  />
                </Field>
                <Field label="Date">
                  <input
                    className="input"
                    type="date"
                    value={review.date}
                    onChange={(event) =>
                      patchReview(review.id, { date: event.target.value })
                    }
                  />
                </Field>
                <Toggle
                  label="Verified purchase"
                  checked={review.verified}
                  onChange={(checked) =>
                    patchReview(review.id, { verified: checked })
                  }
                />
                <Field label="Review text" full>
                  <textarea
                    className="textarea"
                    value={review.text}
                    onChange={(event) =>
                      patchReview(review.id, { text: event.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SettingsSection(props: {
  settings: SiteSettings;
  busy: boolean;
  onChange: (settings: SiteSettings) => void;
  onSave: () => void;
}) {
  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    props.onChange({
      ...props.settings,
      [key]: value,
    });
  }

  return (
    <div className="section-stack">
      <Panel
        title="Site settings"
        subtitle="General configuration that the storefront reads at runtime."
        actions={
          <button
            className="btn btn--primary"
            type="button"
            onClick={props.onSave}
            disabled={props.busy}
          >
            {props.busy ? "Saving…" : "Save Settings"}
          </button>
        }
      >
        <div className="form-grid">
          <Field label="Site name">
            <input
              className="input"
              value={props.settings.siteName}
              onChange={(event) => patch("siteName", event.target.value)}
            />
          </Field>
          <Field label="Site email">
            <input
              className="input"
              type="email"
              value={props.settings.siteEmail}
              onChange={(event) => patch("siteEmail", event.target.value)}
            />
          </Field>
          <Field label="Items per page">
            <input
              className="input"
              type="number"
              value={props.settings.itemsPerPage}
              onChange={(event) =>
                patch("itemsPerPage", Number(event.target.value || 0))
              }
            />
          </Field>
          <Field label="Currency">
            <select
              className="input"
              value={props.settings.currency}
              onChange={(event) => patch("currency", event.target.value)}
            >
              <option value="AUD">AUD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select
              className="input"
              value={props.settings.timezone}
              onChange={(event) => patch("timezone", event.target.value)}
            >
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </Field>
        </div>
      </Panel>

      <Panel title="Feature toggles" subtitle="Switch storefront behaviors on or off.">
        <div className="toggle-grid">
          <Toggle
            label="Maintenance mode"
            checked={props.settings.maintenanceMode}
            onChange={(checked) => patch("maintenanceMode", checked)}
          />
          <Toggle
            label="User registration"
            checked={props.settings.enableRegistration}
            onChange={(checked) => patch("enableRegistration", checked)}
          />
          <Toggle
            label="Customer reviews"
            checked={props.settings.enableReviews}
            onChange={(checked) => patch("enableReviews", checked)}
          />
        </div>
      </Panel>

      <Panel title="Runtime notes" subtitle="What this standalone admin is currently wired to.">
        <dl className="detail-grid">
          <Detail label="Configured API base" value={getApiBaseLabel()} />
          <Detail label="Persistence" value="/api/content, /api/products, /api/orders" />
          <Detail label="Admin auth" value="Local browser session + known admin credentials" />
          <Detail label="Users" value="Browser-local demo storage only" />
        </dl>
      </Panel>
    </div>
  );
}

function UsersSection(props: {
  users: AdminUser[];
  onSave: (users: AdminUser[]) => void;
}) {
  const [draft, setDraft] = useState<AdminUser>({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "customer",
    status: "active",
  });

  const allUsers = useMemo(
    () => [
      {
        id: "admin",
        name: "Admin",
        email: ADMIN_EMAIL,
        role: "admin" as const,
        status: "active" as const,
        createdAt: undefined,
      },
      ...props.users,
    ],
    [props.users],
  );

  return (
    <div className="section-stack">
      <Panel title="Local demo users" subtitle="This section is browser-local, not backed by the live API.">
        <div className="form-grid">
          <Field label="Name">
            <input
              className="input"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              value={draft.email}
              type="email"
              onChange={(event) =>
                setDraft((current) => ({ ...current, email: event.target.value }))
              }
            />
          </Field>
          <Field label="Password">
            <input
              className="input"
              value={draft.password}
              type="password"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Role">
            <select
              className="input"
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  role: event.target.value === "admin" ? "admin" : "customer",
                }))
              }
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>

        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            if (!draft.name || !draft.email || !draft.password) {
              return;
            }

            props.onSave([
              ...props.users,
              {
                ...draft,
                id: uid("user"),
                createdAt: new Date().toISOString(),
              },
            ]);
            setDraft({
              id: "",
              name: "",
              email: "",
              password: "",
              role: "customer",
              status: "active",
            });
          }}
        >
          Add Local User
        </button>
      </Panel>

      <Panel title="User list" subtitle="Admin access is granted only to active admin-role accounts.">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.createdAt ? formatShortDate(user.createdAt) : "Built-in"}</td>
                  <td>
                    {user.id === "admin" ? (
                      <span className="page-status">Protected</span>
                    ) : (
                      <div className="row-actions">
                        <button
                          className="btn btn--ghost"
                          type="button"
                          onClick={() =>
                            props.onSave(
                              props.users.map((entry) =>
                                entry.id === user.id
                                  ? {
                                      ...entry,
                                      status:
                                        entry.status === "active"
                                          ? "inactive"
                                          : "active",
                                    }
                                  : entry,
                              ),
                            )
                          }
                        >
                          {user.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="btn btn--danger"
                          type="button"
                          onClick={() =>
                            props.onSave(
                              props.users.filter((entry) => entry.id !== user.id),
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsSection(props: {
  products: Product[];
  orders: Order[];
  promotions: PromotionsData;
}) {
  const averageOrderValue =
    props.orders.length > 0
      ? props.orders.reduce(
          (sum, order) => sum + Number(order.pricing?.total ?? 0),
          0,
        ) / props.orders.length
      : 0;

  const inStockRate =
    props.products.length > 0
      ? (props.products.filter((product) => product.inStock).length /
          props.products.length) *
        100
      : 0;

  const brandBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of props.products) {
      const key = product.brand || "Unbranded";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [props.products]);

  return (
    <div className="section-stack">
      <div className="hero-metric-grid">
        <MetricCard
          label="Average order value"
          value={formatCurrency(averageOrderValue)}
          helper="Derived from current orders"
        />
        <MetricCard
          label="In-stock rate"
          value={`${Math.round(inStockRate)}%`}
          helper="Products flagged as available"
        />
        <MetricCard
          label="Discount rules"
          value={String(props.promotions.offers.offers.length)}
          helper="Includes enabled and scheduled offers"
        />
      </div>

      <div className="layout-grid layout-grid--primary">
        <Panel
          title="Top brands"
          subtitle="Most represented brands in the current catalog snapshot."
        >
          <ul className="signal-list">
            {brandBreakdown.map(([brand, count]) => (
              <li key={brand}>
                <span>{brand}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Tracking note"
          subtitle="What this standalone admin can infer without an analytics provider."
        >
          <p className="status-copy">
            This screen reports live operational metrics from products, orders,
            and promotions. For traffic, funnels, and campaign attribution, wire
            a dedicated analytics provider into the storefront.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function FlashBanner({ flash }: { flash: FlashMessage }) {
  return (
    <div className={`flash flash--${flash.tone}`}>
      <strong>{flash.tone === "error" ? "Issue" : "Update"}</strong>
      <span>{flash.message}</span>
    </div>
  );
}

function Panel(props: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface panel">
      <div className="panel-header">
        <div>
          <h3>{props.title}</h3>
          {props.subtitle ? <p>{props.subtitle}</p> : null}
        </div>
        {props.actions ? <div className="panel-actions">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

function Field(props: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`field ${props.full ? "field--full" : ""}`}>
      <span className="field-label">{props.label}</span>
      {props.children}
    </label>
  );
}

function Toggle(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`toggle ${props.checked ? "toggle--checked" : ""}`}
      onClick={() => props.onChange(!props.checked)}
    >
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__label">{props.label}</span>
    </button>
  );
}

function MetricCard(props: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="surface surface--emphasis metric-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.helper}</small>
    </div>
  );
}

function Detail(props: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function EmptyState(props: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <strong>{props.title}</strong>
      <p>{props.detail}</p>
    </div>
  );
}
