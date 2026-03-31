import { NextRequest, NextResponse } from "next/server";
import { getDb, hasMongoUri } from "@/lib/mongodb";

/* ─── Fallback defaults (used when MongoDB has no data) ─── */
const FALLBACK_DATA: Record<string, unknown> = {
  home: {
    heroImages: ["/images/hero.jpg"],
    hero: {
      title: "Garage Door & Gate Remotes",
      subtitle: "Quality is Guaranteed",
      description:
        "Your trusted source for premium car and garage remotes. Browse our extensive collection of high-quality remote controls designed to meet all your automation needs.",
      buttons: [
        { label: "Shop Car Remotes", link: "/products/car" },
        { label: "Shop Garage Remotes", link: "/products/garage" },
      ],
      backgroundColors: ["#2e6b6f", "#2e6b6f", "#a0312d"],
    },
    featuresTitle: "Our Product Categories",
    features: [
      {
        icon: "🚗",
        title: "Car Remotes",
        description: "Universal and brand-specific car remotes with advanced security features",
        link: "/products/car",
      },
      {
        icon: "🚪",
        title: "Garage Remotes",
        description: "Reliable garage door and gate remotes for all your home automation needs",
        link: "/products/garage",
      },
    ],
    whyBuy: [
      {
        icon: "✓",
        title: "Quality Guaranteed",
        description: "All our products are genuine and come with quality assurance.",
      },
      {
        icon: "🚚",
        title: "Free Shipping Australia Wide",
        description: "We offer free shipping on all non-bulky items across Australia.",
      },
    ],
    cta: {
      title: "Ready to Find Your Perfect Remote?",
      description: "Browse our collection and find the perfect remote for your needs",
      buttonText: "View All Products",
      buttonLink: "/products/all",
    },
    footer: {
      companyName: "ALLREMOTES",
      tagline: "Your trusted source for car and garage remotes",
      email: "contact@allremotes.com",
    },
  },
  navigation: {
    "garage-gate": {
      title: "Garage & Gate",
      path: "/garage-gate",
      hasDropdown: true,
      columns: [
        {
          title: "Garage & Gate Remotes",
          items: [
            { name: "All Garage Remotes", path: "/products/garage", isShopAll: true },
          ],
        },
      ],
    },
    automotive: {
      title: "Automotive",
      path: "/automotive",
      hasDropdown: true,
      columns: [
        {
          title: "Car Remotes & Keys",
          items: [
            { name: "All Car Remotes", path: "/products/car", isShopAll: true },
          ],
        },
      ],
    },
    support: {
      title: "Support",
      path: "/support",
      hasDropdown: false,
      columns: [],
    },
  },
  reviews: [
    {
      id: "review-1",
      author: "John M.",
      rating: 5,
      text: "Fast dispatch and clear compatibility notes. The remote paired in minutes.",
      verified: true,
      date: "2026-03-23",
    },
    {
      id: "review-2",
      author: "Sarah K.",
      rating: 5,
      text: "Exactly what we needed for workshop reorders. Product quality is consistent.",
      verified: true,
      date: "2026-03-23",
    },
    {
      id: "review-3",
      author: "Michael T.",
      rating: 4,
      text: "Good pricing and support replied quickly with programming guidance.",
      verified: true,
      date: "2026-03-23",
    },
    {
      id: "review-4",
      author: "Emma L.",
      rating: 5,
      text: "Ordered two gate remotes and both worked perfectly. Packaging was secure.",
      verified: true,
      date: "2026-03-23",
    },
    {
      id: "review-5",
      author: "David R.",
      rating: 5,
      text: "Trade account workflow is smooth and reordering is much faster now.",
      verified: true,
      date: "2026-03-23",
    },
    {
      id: "review-6",
      author: "Lisa W.",
      rating: 5,
      text: "Reliable stock levels and straightforward checkout. Will buy again.",
      verified: true,
      date: "2026-03-23",
    },
  ],
  promotions: {
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
  },
  settings: {
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
  },
};

async function loadSection(section: string) {
  if (hasMongoUri()) {
    try {
      const db = await getDb();
      const doc = await db.collection("content").findOne({ _id: section as never });
      if (doc) {
        const { _id, ...data } = doc;
        void _id;
        return data.data ?? data;
      }
    } catch (err) {
      console.error(`[content] MongoDB read failed for "${section}":`, err);
    }
  }
  return FALLBACK_DATA[section] ?? null;
}

async function saveSection(section: string, data: unknown) {
  if (hasMongoUri()) {
    const db = await getDb();
    await db.collection("content").updateOne(
      { _id: section as never },
      { $set: { data, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return;
  }
  // Without MongoDB, store in the fallback cache (memory-only — not persisted)
  FALLBACK_DATA[section] = data;
}

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section");
  if (!section) {
    return NextResponse.json({ error: "Missing section parameter" }, { status: 400 });
  }

  try {
    const data = await loadSection(section);
    return NextResponse.json({ key: section, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "Missing section or data" },
        { status: 400 },
      );
    }

    await saveSection(section, data);
    return NextResponse.json({ success: true, section });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
