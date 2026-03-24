"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getOrders,
  getProducts,
  getPromotions,
  getReviews,
} from "@/lib/admin/api";
import { Card, EmptyState, LoadingState, Notice, PageHeader, StatCard } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/utils";
import type { Order, Product, PromotionsData, Review } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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

        if (!active) {
          return;
        }

        setProducts(nextProducts);
        setOrders(nextOrders);
        setReviews(nextReviews);
        setPromotions(nextPromotions);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load dashboard data.",
        });
      } finally {
        if (!active) {
          return;
        }

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
        .slice(0, 6),
    [orders],
  );

  const activePromotions = promotions?.offers.offers.filter((offer) => offer.enabled).length ?? 0;

  if (loading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        description="Operational snapshot for products, orders, reviews, and live promotions."
        actions={
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="stat-grid">
        <StatCard
          label="Total Products"
          value={String(products.length)}
          detail="Current catalog rows returned by the products API."
        />
        <StatCard
          label="Total Orders"
          value={String(orders.length)}
          detail="All orders currently available to the admin app."
        />
        <StatCard
          label="Total Reviews"
          value={String(reviews.length)}
          detail="Live reviews loaded from the reviews content section."
        />
        <StatCard
          label="Active Promotions"
          value={String(activePromotions)}
          detail="Enabled offers in the promotions content payload."
        />
      </div>

      <div className="section-grid">
        <Card title="Recent Orders" description="Most recent order activity.">
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No recent orders"
              description="Orders will appear here once the API returns them."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="cell-title mono">{order.id}</div>
                        <span className="cell-subtitle">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="cell-title">
                          {order.customer?.fullName || "Unknown customer"}
                        </div>
                        <span className="cell-subtitle">
                          {order.customer?.email || "No email"}
                        </span>
                      </td>
                      <td>{formatCurrency(Number(order.pricing?.total ?? 0))}</td>
                      <td>
                        <span className={getStatusClass(order.status)}>{order.status || "processing"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Quick Actions" description="Jump directly to common admin tasks.">
          <div className="quick-actions">
            <Link href="/products" className="button button--primary">
              Add Product
            </Link>
            <Link href="/upload-csv" className="button button--secondary">
              Upload CSV
            </Link>
            <Link href="/settings" className="button button--ghost">
              Settings
            </Link>
          </div>
          <div className="summary-strip">
            <div className="detail-item">
              <span>Catalog value</span>
              <strong>
                {formatCurrency(
                  products.reduce(
                    (total, product) => total + Number(product.price ?? 0),
                    0,
                  ),
                )}
              </strong>
            </div>
            <div className="detail-item">
              <span>Processing orders</span>
              <strong>
                {
                  orders.filter((order) => (order.status ?? "processing") === "processing")
                    .length
                }
              </strong>
            </div>
            <div className="detail-item">
              <span>Verified reviews</span>
              <strong>{reviews.filter((review) => review.verified).length}</strong>
            </div>
            <div className="detail-item">
              <span>Info bar items</span>
              <strong>{promotions?.topInfoBar.items.length ?? 0}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getStatusClass(status?: Order["status"]) {
  if (status === "delivered") {
    return "status-pill status-pill--success";
  }

  if (status === "cancelled") {
    return "status-pill status-pill--danger";
  }

  if (status === "shipped") {
    return "status-pill status-pill--warning";
  }

  return "status-pill status-pill--muted";
}
