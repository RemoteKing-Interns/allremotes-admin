import {
  DEFAULT_HOME_CONTENT,
  DEFAULT_PROMOTIONS,
  DEFAULT_SETTINGS,
  type ApiEnvelope,
  type ApiErrorShape,
  type AdminUser,
  type HomeContent,
  type NavigationTree,
  type Order,
  type Product,
  type ProductPage,
  type PromotionOffer,
  type PromotionsData,
  type Review,
  type SiteSettings,
  type UploadCsvRowResult,
  type UploadCsvResult,
  type UserApiRecord,
} from "@/lib/admin/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

type ContentSection =
  | "home"
  | "navigation"
  | "reviews"
  | "promotions"
  | "settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;

  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as ApiErrorShape | null;
  return data?.error ?? data?.message ?? `Request failed with ${response.status}`;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { noJson?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    headers,
    ...init,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (options?.noJson) {
    return undefined as T;
  }

  return (await response.json().catch(() => null)) as T;
}

async function requestBlob(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.blob();
}

function normalizeProduct(input: unknown): Product {
  const record = isRecord(input) ? input : {};

  return {
    id: String(record.id ?? crypto.randomUUID()),
    brand: String(record.brand ?? ""),
    name: String(record.name ?? ""),
    category: String(record.category ?? "garage"),
    price: Number(record.price ?? 0),
    inStock: record.inStock !== false,
    image: String(record.image ?? ""),
    description: String(record.description ?? ""),
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
    sku: record.sku ? String(record.sku) : "",
    condition: record.condition ? String(record.condition) : "Brand New",
    imageIndex:
      typeof record.imageIndex === "number" ? record.imageIndex : undefined,
    returns: record.returns ? String(record.returns) : "No returns accepted",
    seller:
      record.seller ? String(record.seller) : "AllRemotes (100% positive)",
    skuKey: record.skuKey ? String(record.skuKey) : null,
  };
}

function normalizeOrder(input: unknown): Order {
  const record = isRecord(input) ? input : {};
  const customer = isRecord(record.customer) ? record.customer : {};
  const shipping = isRecord(record.shipping) ? record.shipping : {};
  const pricing = isRecord(record.pricing) ? record.pricing : {};
  const rawItems = Array.isArray(record.items) ? record.items : [];

  return {
    id: String(record.id ?? crypto.randomUUID()),
    status:
      record.status === "processing" ||
      record.status === "shipped" ||
      record.status === "delivered" ||
      record.status === "cancelled"
        ? record.status
        : "processing",
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : typeof record.created_at === "string"
          ? record.created_at
          : undefined,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : typeof record.updated_at === "string"
          ? record.updated_at
          : undefined,
    customer: {
      fullName:
        typeof customer.fullName === "string"
          ? customer.fullName
          : typeof customer.name === "string"
            ? customer.name
            : undefined,
      email: typeof customer.email === "string" ? customer.email : undefined,
    },
    shipping: {
      address: typeof shipping.address === "string" ? shipping.address : undefined,
      city: typeof shipping.city === "string" ? shipping.city : undefined,
      state: typeof shipping.state === "string" ? shipping.state : undefined,
      zipCode: typeof shipping.zipCode === "string" ? shipping.zipCode : undefined,
      country: typeof shipping.country === "string" ? shipping.country : undefined,
    },
    pricing: {
      currency:
        typeof pricing.currency === "string"
          ? pricing.currency
          : typeof pricing.currencyCode === "string"
            ? pricing.currencyCode
            : undefined,
      subtotal: Number(pricing.subtotal ?? 0),
      discountTotal: Number(pricing.discountTotal ?? pricing.discount ?? 0),
      total: Number(pricing.total ?? 0),
      hasMemberDiscount: Boolean(pricing.hasMemberDiscount),
      memberDiscountRate: Number(pricing.memberDiscountRate ?? 0),
    },
    items: rawItems.map((item, index) => {
      const itemRecord = isRecord(item) ? item : {};

      return {
        id: String(itemRecord.id ?? `${record.id ?? "order"}_${index}`),
        name: String(itemRecord.name ?? "Item"),
        category:
          typeof itemRecord.category === "string" ? itemRecord.category : undefined,
        quantity: Number(itemRecord.quantity ?? 1),
        unitPrice: Number(itemRecord.unitPrice ?? itemRecord.price ?? 0),
        lineTotal:
          Number(
            itemRecord.lineTotal ??
              Number(itemRecord.quantity ?? 1) * Number(itemRecord.unitPrice ?? itemRecord.price ?? 0),
          ),
      };
    }),
  };
}

function normalizeOrderCollection(input: unknown): Order[] {
  if (Array.isArray(input)) {
    return input.map(normalizeOrder);
  }

  if (!isRecord(input)) {
    return [];
  }

  const candidates = [input.orders, input.data, input.items, input.results];
  const list = candidates.find((candidate) => Array.isArray(candidate));

  return Array.isArray(list) ? list.map(normalizeOrder) : [];
}

function toPositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function normalizeProductsPage(input: unknown, page: number, pageSize: number): ProductPage {
  if (Array.isArray(input)) {
    const total = input.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: input.slice(start, end).map(normalizeProduct),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const record = isRecord(input) ? input : {};
  const list = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.products)
      ? record.products
      : Array.isArray(record.data)
        ? record.data
        : [];
  const normalizedItems = list.map(normalizeProduct);
  const normalizedPage = toPositiveInteger(record.page, page);
  const normalizedPageSize = toPositiveInteger(
    record.pageSize ?? record.limit,
    pageSize,
  );
  const normalizedTotal = Math.max(
    normalizedItems.length,
    toPositiveInteger(record.total ?? record.count, normalizedItems.length),
  );
  const normalizedTotalPages = Math.max(
    1,
    toPositiveInteger(
      record.totalPages,
      Math.ceil(normalizedTotal / Math.max(1, normalizedPageSize)),
    ),
  );

  return {
    items: normalizedItems,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total: normalizedTotal,
    totalPages: normalizedTotalPages,
  };
}

export function normalizeReviews(input: unknown): Review[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry, index) => {
    const record = isRecord(entry) ? entry : {};

    return {
      id:
        typeof record.id === "string" && record.id
          ? record.id
          : `review_${index}_${Date.now()}`,
      author: String(record.author ?? ""),
      rating: Number(record.rating ?? 5),
      text: String(record.text ?? ""),
      verified: Boolean(record.verified),
      date:
        typeof record.date === "string" && record.date
          ? record.date
          : new Date().toISOString().slice(0, 10),
    };
  });
}

export function normalizeHomeContent(input: unknown): HomeContent {
  if (!isRecord(input)) {
    return DEFAULT_HOME_CONTENT;
  }

  const heroRecord = isRecord(input.hero) ? input.hero : {};
  const featureList = Array.isArray(input.features) ? input.features : [];
  const whyBuyList = Array.isArray(input.whyBuy) ? input.whyBuy : [];

  if (
    typeof heroRecord.primaryCta === "string" ||
    typeof heroRecord.primaryCtaPath === "string" ||
    isRecord(input.ctaSection)
  ) {
    return {
      heroImages: Array.isArray(input.heroImages)
        ? input.heroImages.map((image) => String(image))
        : DEFAULT_HOME_CONTENT.heroImages,
      hero: {
        title: String(heroRecord.title ?? ""),
        subtitle: String(heroRecord.subtitle ?? ""),
        description: String(heroRecord.description ?? ""),
        primaryCta: String(heroRecord.primaryCta ?? ""),
        primaryCtaPath: String(heroRecord.primaryCtaPath ?? ""),
        secondaryCta: String(heroRecord.secondaryCta ?? ""),
        secondaryCtaPath: String(heroRecord.secondaryCtaPath ?? ""),
        backgroundColors:
          Array.isArray(heroRecord.backgroundColors) && heroRecord.backgroundColors.length
            ? heroRecord.backgroundColors.map((entry) => String(entry))
            : DEFAULT_HOME_CONTENT.hero.backgroundColors,
      },
      featuresTitle: String(
        input.featuresTitle ?? DEFAULT_HOME_CONTENT.featuresTitle,
      ),
      features: featureList.map((feature) => {
        const record = isRecord(feature) ? feature : {};

        return {
          icon: String(record.icon ?? ""),
          title: String(record.title ?? ""),
          description: String(record.description ?? ""),
          path: String(record.path ?? ""),
          linkText: String(record.linkText ?? ""),
        };
      }),
      whyBuy: whyBuyList.map((entry) => {
        const record = isRecord(entry) ? entry : {};

        return {
          icon: String(record.icon ?? ""),
          title: String(record.title ?? ""),
          description: String(record.description ?? ""),
        };
      }),
      ctaSection: isRecord(input.ctaSection)
        ? {
            title: String(input.ctaSection.title ?? ""),
            description: String(input.ctaSection.description ?? ""),
            buttonText: String(input.ctaSection.buttonText ?? ""),
            buttonPath: String(input.ctaSection.buttonPath ?? ""),
          }
        : DEFAULT_HOME_CONTENT.ctaSection,
      footer: isRecord(input.footer)
        ? {
            companyName: String(
              input.footer.companyName ?? DEFAULT_HOME_CONTENT.footer.companyName,
            ),
            tagline: String(
              input.footer.tagline ?? DEFAULT_HOME_CONTENT.footer.tagline,
            ),
            email: String(input.footer.email ?? DEFAULT_HOME_CONTENT.footer.email),
          }
        : DEFAULT_HOME_CONTENT.footer,
    };
  }

  const heroButtons = Array.isArray(heroRecord.buttons) ? heroRecord.buttons : [];
  const primaryButton = isRecord(heroButtons[0]) ? heroButtons[0] : {};
  const secondaryButton = isRecord(heroButtons[1]) ? heroButtons[1] : {};
  const ctaRecord = isRecord(input.cta) ? input.cta : {};

  return {
    heroImages: Array.isArray(input.heroImages)
      ? input.heroImages.map((image) => String(image))
      : DEFAULT_HOME_CONTENT.heroImages,
    hero: {
      title: String(heroRecord.title ?? ""),
      subtitle: String(heroRecord.subtitle ?? ""),
      description: String(heroRecord.description ?? ""),
      primaryCta: String(primaryButton.label ?? ""),
      primaryCtaPath: String(primaryButton.link ?? ""),
      secondaryCta: String(secondaryButton.label ?? ""),
      secondaryCtaPath: String(secondaryButton.link ?? ""),
      backgroundColors:
        Array.isArray(heroRecord.backgroundColors) && heroRecord.backgroundColors.length
          ? heroRecord.backgroundColors.map((entry) => String(entry))
          : DEFAULT_HOME_CONTENT.hero.backgroundColors,
    },
    featuresTitle: String(
      input.featuresTitle ?? DEFAULT_HOME_CONTENT.featuresTitle,
    ),
    features: featureList.map((feature) => {
      const record = isRecord(feature) ? feature : {};

      return {
        icon: String(record.icon ?? ""),
        title: String(record.title ?? ""),
        description: String(record.description ?? ""),
        path: String(record.path ?? record.link ?? ""),
        linkText: String(
          record.linkText ?? (record.link ? "Explore →" : ""),
        ),
      };
    }),
    whyBuy: whyBuyList.map((entry) => {
      const record = isRecord(entry) ? entry : {};

      return {
        icon: String(record.icon ?? ""),
        title: String(record.title ?? ""),
        description: String(record.description ?? ""),
      };
    }),
    ctaSection: {
      title: String(ctaRecord.title ?? ""),
      description: String(ctaRecord.description ?? ""),
      buttonText: String(ctaRecord.buttonText ?? ""),
      buttonPath: String(ctaRecord.buttonLink ?? ""),
    },
    footer: isRecord(input.footer)
      ? {
          companyName: String(
            input.footer.companyName ?? DEFAULT_HOME_CONTENT.footer.companyName,
          ),
          tagline: String(input.footer.tagline ?? DEFAULT_HOME_CONTENT.footer.tagline),
          email: String(input.footer.email ?? DEFAULT_HOME_CONTENT.footer.email),
        }
      : DEFAULT_HOME_CONTENT.footer,
  };
}

export function normalizeSettings(input: unknown): SiteSettings {
  if (!isRecord(input)) {
    return DEFAULT_SETTINGS;
  }

  const siteEmail = String(input.siteEmail ?? input.contactEmail ?? "");

  return {
    siteName: String(input.siteName ?? DEFAULT_SETTINGS.siteName),
    siteEmail: siteEmail || DEFAULT_SETTINGS.siteEmail,
    maintenanceMode: Boolean(
      input.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
    ),
    enableRegistration: Boolean(
      input.enableRegistration ?? DEFAULT_SETTINGS.enableRegistration,
    ),
    enableReviews: Boolean(input.enableReviews ?? DEFAULT_SETTINGS.enableReviews),
    itemsPerPage: Number(input.itemsPerPage ?? DEFAULT_SETTINGS.itemsPerPage),
    currency: String(input.currency ?? DEFAULT_SETTINGS.currency),
    timezone: String(input.timezone ?? DEFAULT_SETTINGS.timezone),
    contactEmail:
      typeof input.contactEmail === "string" ? input.contactEmail : siteEmail,
    showOutOfStock:
      typeof input.showOutOfStock === "boolean"
        ? input.showOutOfStock
        : undefined,
    footerBrandTitle:
      typeof input.footerBrandTitle === "string"
        ? input.footerBrandTitle
        : DEFAULT_SETTINGS.footerBrandTitle,
    footerBrandSubtitle:
      typeof input.footerBrandSubtitle === "string"
        ? input.footerBrandSubtitle
        : DEFAULT_SETTINGS.footerBrandSubtitle,
    footerTagline:
      typeof input.footerTagline === "string"
        ? input.footerTagline
        : DEFAULT_SETTINGS.footerTagline,
    footerCategoriesTitle:
      typeof input.footerCategoriesTitle === "string"
        ? input.footerCategoriesTitle
        : DEFAULT_SETTINGS.footerCategoriesTitle,
    footerPrivacyTitle:
      typeof input.footerPrivacyTitle === "string"
        ? input.footerPrivacyTitle
        : DEFAULT_SETTINGS.footerPrivacyTitle,
    footerPrivacyLabel:
      typeof input.footerPrivacyLabel === "string"
        ? input.footerPrivacyLabel
        : DEFAULT_SETTINGS.footerPrivacyLabel,
    footerPrivacyPath:
      typeof input.footerPrivacyPath === "string"
        ? input.footerPrivacyPath
        : DEFAULT_SETTINGS.footerPrivacyPath,
    footerSupportTitle:
      typeof input.footerSupportTitle === "string"
        ? input.footerSupportTitle
        : DEFAULT_SETTINGS.footerSupportTitle,
    footerSupportLinkLabel:
      typeof input.footerSupportLinkLabel === "string"
        ? input.footerSupportLinkLabel
        : DEFAULT_SETTINGS.footerSupportLinkLabel,
    footerSupportLinkPath:
      typeof input.footerSupportLinkPath === "string"
        ? input.footerSupportLinkPath
        : DEFAULT_SETTINGS.footerSupportLinkPath,
    footerContactLinkLabel:
      typeof input.footerContactLinkLabel === "string"
        ? input.footerContactLinkLabel
        : DEFAULT_SETTINGS.footerContactLinkLabel,
    footerContactLinkPath:
      typeof input.footerContactLinkPath === "string"
        ? input.footerContactLinkPath
        : DEFAULT_SETTINGS.footerContactLinkPath,
    supportPhone:
      typeof input.supportPhone === "string"
        ? input.supportPhone
        : DEFAULT_SETTINGS.supportPhone,
    supportHoursWeekdays:
      typeof input.supportHoursWeekdays === "string"
        ? input.supportHoursWeekdays
        : DEFAULT_SETTINGS.supportHoursWeekdays,
    supportHoursSaturday:
      typeof input.supportHoursSaturday === "string"
        ? input.supportHoursSaturday
        : DEFAULT_SETTINGS.supportHoursSaturday,
    footerCopyright:
      typeof input.footerCopyright === "string"
        ? input.footerCopyright
        : DEFAULT_SETTINGS.footerCopyright,
  };
}

export function normalizePromotions(input: unknown): PromotionsData {
  if (!isRecord(input)) {
    return DEFAULT_PROMOTIONS;
  }

  const topInfoBar = isRecord(input.topInfoBar) ? input.topInfoBar : {};
  const offersRecord = isRecord(input.offers) ? input.offers : {};

  return {
    topInfoBar: {
      enabled: Boolean(topInfoBar.enabled),
      items: Array.isArray(topInfoBar.items)
        ? topInfoBar.items.map((item) => String(item))
        : DEFAULT_PROMOTIONS.topInfoBar.items,
    },
    offers: {
      categories: Array.isArray(offersRecord.categories)
        ? offersRecord.categories.map((category, index) => {
            const record = isRecord(category) ? category : {};

            return {
              id: String(record.id ?? `category_${index}`),
              name: String(record.name ?? ""),
            };
          })
        : DEFAULT_PROMOTIONS.offers.categories,
      offers: Array.isArray(offersRecord.offers)
        ? offersRecord.offers.map((offer, index) => {
            const record = isRecord(offer) ? offer : {};

            return {
              id: String(record.id ?? `offer_${index}`),
              categoryId: String(record.categoryId ?? ""),
              name: String(record.name ?? ""),
              enabled: Boolean(record.enabled),
              appliesTo: String(record.appliesTo ?? "all"),
              discountPercent: Number(record.discountPercent ?? 0),
              startDate: String(record.startDate ?? ""),
              endDate: String(record.endDate ?? ""),
            };
          })
        : [],
      stackWithMemberDiscount: Boolean(offersRecord.stackWithMemberDiscount),
    },
  };
}

export function normalizeNavigation(input: unknown): NavigationTree {
  return isRecord(input) ? (input as NavigationTree) : {};
}

export function normalizeUsers(input: unknown): AdminUser[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry, index) => {
    const record = isRecord(entry)
      ? (entry as UserApiRecord & Record<string, unknown>)
      : ({} as UserApiRecord & Record<string, unknown>);
    const createdAt =
      typeof record.createdAt === "string" ? record.createdAt : undefined;

    return {
      id: String(record.id ?? `user_${index}`),
      name: String(record.name ?? "Unknown User"),
      email: String(record.email ?? ""),
      role: record.role === "admin" ? "admin" : "customer",
      status: record.status === "inactive" ? "inactive" : "active",
      createdAt,
      joined: createdAt ? createdAt.slice(0, 10) : undefined,
      password: typeof record.password === "string" ? record.password : "",
    };
  });
}

function normalizeUploadCsvResult(input: unknown): UploadCsvResult {
  const record = isRecord(input) ? input : {};
  const rawDetails = Array.isArray(record.details)
    ? record.details
    : Array.isArray(record.results)
      ? record.results
      : [];

  const details = rawDetails.map((detail, index) => {
    const detailRecord = isRecord(detail) ? detail : {};
    const status: UploadCsvRowResult["status"] =
      detailRecord.status === "created" ||
      detailRecord.status === "updated" ||
      detailRecord.status === "failed"
        ? detailRecord.status
        : "failed";

    return {
      row: Number(detailRecord.row ?? detailRecord.line ?? index + 1),
      status,
      sku: typeof detailRecord.sku === "string" ? detailRecord.sku : undefined,
      name:
        typeof detailRecord.name === "string" ? detailRecord.name : undefined,
      error:
        typeof detailRecord.error === "string"
          ? detailRecord.error
          : typeof detailRecord.message === "string"
            ? detailRecord.message
            : undefined,
    };
  });

  return {
    rowsProcessed: Number(
      record.rowsProcessed ?? record.processed ?? rawDetails.length ?? 0,
    ),
    created: Number(record.created ?? 0),
    updated: Number(record.updated ?? 0),
    failed: Number(record.failed ?? details.filter((detail) => detail.status === "failed").length),
    details,
  };
}

function homeContentToPayload(content: HomeContent) {
  const buttons = [];

  if (content.hero.primaryCta || content.hero.primaryCtaPath) {
    buttons.push({
      label: content.hero.primaryCta,
      link: content.hero.primaryCtaPath,
    });
  }

  if (content.hero.secondaryCta || content.hero.secondaryCtaPath) {
    buttons.push({
      label: content.hero.secondaryCta,
      link: content.hero.secondaryCtaPath,
    });
  }

  return {
    heroImages: content.heroImages,
    hero: {
      title: content.hero.title,
      subtitle: content.hero.subtitle,
      description: content.hero.description,
      backgroundColors: content.hero.backgroundColors,
      buttons,
    },
    featuresTitle: content.featuresTitle,
    features: content.features.map((feature) => ({
      icon: feature.icon,
      title: feature.title,
      description: feature.description,
      link: feature.path,
    })),
    whyBuy: content.whyBuy.map((item) => ({
      icon: item.icon,
      title: item.title,
      description: item.description,
    })),
    cta: {
      title: content.ctaSection.title,
      description: content.ctaSection.description,
      buttonText: content.ctaSection.buttonText,
      buttonLink: content.ctaSection.buttonPath,
    },
    footer: {
      companyName: content.footer.companyName,
      tagline: content.footer.tagline,
      email: content.footer.email,
    },
  };
}

function settingsToPayload(settings: SiteSettings) {
  return {
    ...settings,
    contactEmail: settings.contactEmail ?? settings.siteEmail,
    showOutOfStock: settings.showOutOfStock ?? true,
  };
}

export async function getProducts() {
  const data = await request<unknown>("/api/products", {
    cache: "no-store",
  });

  if (Array.isArray(data)) {
    return data.map(normalizeProduct);
  }

  if (isRecord(data) && Array.isArray(data.items)) {
    return data.items.map(normalizeProduct);
  }

  if (isRecord(data) && Array.isArray(data.products)) {
    return data.products.map(normalizeProduct);
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(normalizeProduct);
  }

  return [];
}

export async function getProductsPage(options: {
  page: number;
  pageSize: number;
  query?: string;
  stock?: "all" | "in" | "out";
}) {
  const params = new URLSearchParams();
  params.set("page", String(toPositiveInteger(options.page, 1)));
  params.set("pageSize", String(toPositiveInteger(options.pageSize, 20)));

  if (options.query?.trim()) {
    params.set("search", options.query.trim());
  }

  if (options.stock === "in") {
    params.set("inStock", "true");
  }

  if (options.stock === "out") {
    params.set("inStock", "false");
  }

  const response = await request<unknown>(`/api/products?${params.toString()}`, {
    cache: "no-store",
  });

  return normalizeProductsPage(response, options.page, options.pageSize);
}

export async function saveProducts(products: Product[]) {
  await request("/api/admin/products", {
    method: "PUT",
    body: JSON.stringify(products),
  });
}

export async function getOrders() {
  try {
    const data = await request<unknown>("/api/orders", {
      cache: "no-store",
    });

    return normalizeOrderCollection(data);
  } catch (primaryError) {
    const primaryMessage =
      primaryError instanceof Error ? primaryError.message : "Primary order API failed";

    try {
      const fallbackData = await request<unknown>("/api/admin/orders", {
        cache: "no-store",
      });
      return normalizeOrderCollection(fallbackData);
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Fallback order API failed";
      throw new Error(
        `Orders API flow failed: GET /api/orders -> GET /api/admin/orders. ${primaryMessage}. ${fallbackMessage}`,
      );
    }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  return request<Order>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getContentSection<T>(section: ContentSection) {
  return request<ApiEnvelope<T>>(`/api/content?section=${section}`, {
    cache: "no-store",
  });
}

export async function getHomeContent() {
  const response = await getContentSection<unknown>("home");
  return normalizeHomeContent(response?.data ?? response);
}

export async function saveHomeContent(content: HomeContent) {
  await request("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      section: "home",
      data: homeContentToPayload(content),
    }),
  });
}

export async function getNavigation() {
  const response = await getContentSection<unknown>("navigation");
  return normalizeNavigation(response?.data ?? response);
}

export async function saveNavigation(navigation: NavigationTree) {
  await request("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      section: "navigation",
      data: navigation,
    }),
  });
}

export async function getReviews() {
  const response = await getContentSection<unknown>("reviews");
  return normalizeReviews(response?.data ?? response);
}

export async function saveReviews(reviews: Review[]) {
  await request("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      section: "reviews",
      data: reviews,
    }),
  });
}

export async function deleteReview(reviewId: string) {
  await request(`/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
}

export async function getPromotions() {
  const response = await getContentSection<unknown>("promotions");
  return normalizePromotions(response?.data ?? response);
}

export async function savePromotions(promotions: PromotionsData) {
  await request("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      section: "promotions",
      data: promotions,
    }),
  });
}

export async function getSettings() {
  const response = await getContentSection<unknown>("settings");
  return normalizeSettings(response?.data ?? response);
}

export async function saveSettings(settings: SiteSettings) {
  await request("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      section: "settings",
      data: settingsToPayload(settings),
    }),
  });
}

export async function getUsers() {
  const response = await request<unknown>("/api/users", {
    cache: "no-store",
  });
  return normalizeUsers(
    isRecord(response) && Array.isArray(response.data) ? response.data : response,
  );
}

export async function createUser(user: Pick<AdminUser, "name" | "email" | "password" | "role">) {
  const response = await request<unknown>("/api/users", {
    method: "POST",
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      status: "active",
    }),
  });

  if (isRecord(response) && isRecord(response.user)) {
    return normalizeUsers([response.user])[0];
  }

  return normalizeUsers([response])[0];
}

export async function resetAdminData() {
  await request("/api/admin/reset", {
    method: "POST",
  });
}

export async function downloadUploadTemplate() {
  return requestBlob("/api/admin/upload-products/template.csv");
}

export async function uploadProductsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await request<unknown>("/api/admin/upload-products", {
    method: "POST",
    body: formData,
    headers: {},
  });

  return normalizeUploadCsvResult(response);
}

export async function getS3Images() {
  const response = await request<{ images?: string[]; error?: string }>(
    "/api/admin/s3",
    {
      cache: "no-store",
    },
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return Array.isArray(response.images) ? response.images : [];
}

export async function createPresignedUpload(file: {
  filename: string;
  contentType: string;
}) {
  return request<{
    key?: string;
    presignedUrl?: string;
    publicUrl?: string;
    error?: string;
  }>("/api/admin/s3/upload", {
    method: "POST",
    body: JSON.stringify(file),
  });
}

export function uploadFileToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export function createEmptyOffer(index: number): PromotionOffer {
  return {
    id: `offer_${Date.now()}_${index}`,
    categoryId: "",
    name: "",
    enabled: false,
    appliesTo: "all",
    discountPercent: 0,
    startDate: "",
    endDate: "",
  };
}

export function getApiBaseLabel() {
  return API_BASE_URL || "same-origin /api";
}
