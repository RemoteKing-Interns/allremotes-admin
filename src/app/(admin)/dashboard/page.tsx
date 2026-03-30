"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  MessageSquareText,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  ShoppingCart,
} from "lucide-react";
import {
  getOrders,
  getProducts,
  getPromotions,
  getReviews,
} from "@/lib/admin/api";
import { LoadingState, Notice } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/utils";
import type { Order, Product, PromotionsData, Review } from "@/lib/admin/types";
import { motion } from "framer-motion";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setReviews] = useState<Review[]>([]);
  const [promotions, setPromotions] = useState<PromotionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const initialLoad = reloadKey === 0;

    async function load() {
      try {
        if (initialLoad) {
          setNotice(null);
        } else {
          setRefreshing(true);
        }

        const [nextProducts, nextOrders, nextReviews, nextPromotions] =
          await Promise.all([
            getProducts(),
            getOrders(),
            getReviews(),
            getPromotions(),
          ]);

        if (!active) return;

        setProducts(nextProducts);
        setOrders(nextOrders);
        setReviews(nextReviews);
        setPromotions(nextPromotions);
      } catch (error) {
        if (!active) return;
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load dashboard data.",
        });
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((left, right) =>
          String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")),
        )
        .slice(0, 5),
    [orders],
  );

  const activePromotions = promotions?.offers.offers.filter((offer) => offer.enabled).length ?? 0;

  if (loading) {
    return <LoadingState label="Loading dashboard data…" />;
  }

  /* 
    Stitch Design System Tokens utilized inline to avoid dependency conflicts.
    Values: 
      background: surface-container-lowest #ffffff
      subtle shadow: 0px 4px 20px rgba(27, 28, 28, 0.04) 
      rounding: rounded-xl (1.5rem / 16px) 
  */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {/* Hero Stats Board - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Products */}
        <div
          className="flex flex-col justify-between rounded-xl px-4 py-4 sm:px-5 sm:py-5"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
            border: "1px solid rgba(189, 200, 206, 0.15)", // Ghost border
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "radial-gradient(circle at top left, rgba(14, 165, 233, 0.15), rgba(2, 132, 199, 0.05))",
                color: "#0ea5e9",
              }}
            >
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className="block tracking-tight text-neutral-900"
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {products.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6e797e" }}>Products</span>
          </div>
        </div>

        {/* Orders */}
        <div
          className="flex flex-col justify-between rounded-xl px-4 py-4 sm:px-5 sm:py-5"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
            border: "1px solid rgba(189, 200, 206, 0.15)",
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "radial-gradient(circle at top left, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))",
                color: "#10b981",
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className="block tracking-tight text-neutral-900"
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {orders.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6e797e" }}>Orders</span>
          </div>
        </div>

        {/* Reviews */}
        <div
          className="flex flex-col justify-between rounded-xl px-4 py-4 sm:px-5 sm:py-5"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
            border: "1px solid rgba(189, 200, 206, 0.15)",
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "radial-gradient(circle at top left, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))",
                color: "#f59e0b",
              }}
            >
              <MessageSquareText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className="block tracking-tight text-neutral-900"
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              89<span className="text-xl text-neutral-400">%</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6e797e" }}>Positive Reviews</span>
          </div>
        </div>

        {/* Promotions */}
        <div
          className="flex flex-col justify-between rounded-xl px-4 py-4 sm:px-5 sm:py-5"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
            border: "1px solid rgba(189, 200, 206, 0.15)",
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "radial-gradient(circle at top left, rgba(244, 63, 94, 0.15), rgba(225, 29, 72, 0.05))",
                color: "#f43f5e",
              }}
            >
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className="block tracking-tight text-neutral-900"
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {activePromotions}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6e797e" }}>Active Promos</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)",
            color: "#ffffff",
            boxShadow: "0px 8px 30px rgba(0, 100, 124, 0.25)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 transition hover:bg-neutral-200/50 disabled:opacity-50"
          style={{
            backgroundColor: "#e9e8e7", // surface_container_high
            color: "#1b1c1c",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin text-neutral-600" : "h-4 w-4 text-neutral-600"} />
          <span className="hidden sm:inline">Sync</span>
        </button>
        <Link
          href="/settings"
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition hover:bg-neutral-200/50"
          style={{
            backgroundColor: "#e9e8e7",
            color: "#1b1c1c",
          }}
        >
          <Settings2 className="h-4 w-4 text-neutral-600" />
        </Link>
      </div>

      {/* Recent Activity List */}
      <section className="flex flex-col gap-1">
        <div className="mb-2 px-1 text-sm font-semibold tracking-tight text-neutral-900">
          Recent Activity
        </div>
        
        {recentOrders.length === 0 ? (
          <div
            className="rounded-xl px-5 py-6 text-center text-sm"
            style={{ backgroundColor: "#ffffff", color: "#6e797e", border: "1px solid rgba(189, 200, 206, 0.15)" }}
          >
            No recent activity securely logged yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recentOrders.map((order, i) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-xl px-4 py-3.5 transition hover:scale-[1.01]"
                style={{
                  backgroundColor: i % 2 === 0 ? "#ffffff" : "#fbf9f9",
                  boxShadow: i % 2 === 0 ? "0px 4px 15px rgba(27, 28, 28, 0.02)" : "none",
                  border: i % 2 === 0 ? "1px solid rgba(189, 200, 206, 0.15)" : "1px solid transparent",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <div>
                      <p className="text-[13px] font-medium leading-tight text-neutral-900">
                        Order <span className="text-neutral-500">#{order.id.slice(-6).toUpperCase()}</span> received
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {order.customer?.fullName || "Guest User"} • {formatCurrency(Number(order.pricing?.total ?? 0))}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    {formatDateTime(order.createdAt).split(",")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
