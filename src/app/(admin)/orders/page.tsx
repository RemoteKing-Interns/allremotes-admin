"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Eye, Plus, Search } from "lucide-react";
import { EmptyState, LoadingState, Notice, PageTransition } from "@/components/admin/ui";
import { getOrders, updateOrderStatus } from "@/lib/admin/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/admin/utils";
import type { Order } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

const ORDER_STATUSES: NonNullable<Order["status"]>[] = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

type SortKey = "id" | "createdAt" | "customer" | "total" | "status";
type SortDirection = "asc" | "desc";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextOrders = await getOrders();

        if (!active) {
          return;
        }

        setOrders(nextOrders);
        setSelectedId((current) => current ?? nextOrders[0]?.id ?? null);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load orders.",
        });
      } finally {
        if (!active) {
          return;
        }

        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const sortedOrders = useMemo(() => {
    const sorted = [...orders];

    sorted.sort((left, right) => {
      let leftValue = "";
      let rightValue = "";

      if (sortKey === "id") {
        leftValue = left.id;
        rightValue = right.id;
      } else if (sortKey === "createdAt") {
        leftValue = String(left.createdAt ?? "");
        rightValue = String(right.createdAt ?? "");
      } else if (sortKey === "customer") {
        leftValue = left.customer?.fullName ?? "";
        rightValue = right.customer?.fullName ?? "";
      } else if (sortKey === "total") {
        leftValue = String(Number(left.pricing?.total ?? 0));
        rightValue = String(Number(right.pricing?.total ?? 0));
      } else {
        leftValue = left.status ?? "processing";
        rightValue = right.status ?? "processing";
      }

      if (sortKey === "total") {
        const delta = Number(leftValue) - Number(rightValue);
        return sortDirection === "asc" ? delta : -delta;
      }

      const comparison = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [orders, sortDirection, sortKey]);

  function onSort(nextKey: SortKey) {
    setSortDirection((currentDirection) =>
      sortKey === nextKey && currentDirection === "asc" ? "desc" : "asc",
    );
    setSortKey(nextKey);
  }

  async function onStatusChange(orderId: string, status: string) {
    setSavingId(orderId);
    setNotice(null);

    try {
      const nextOrder = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...nextOrder,
                status: (nextOrder.status ?? status) as Order["status"],
              }
            : order,
        ),
      );
      setNotice({
        tone: "success",
        text: `Order ${orderId} updated to ${status}.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not update order status.",
      });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Loading orders…" />;
  }

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-neutral-900">Orders</h1>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Refresh Orders
          </button>
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <div className="mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 text-sm focus:border-neutral-400 focus:outline-none transition"
              placeholder="Search orders"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {orders.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No orders available"
                  description="Orders will appear here when the API returns data."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                      <SortableHeader label="Order ID" onSort={() => onSort("id")} />
                      <SortableHeader label="Date" onSort={() => onSort("createdAt")} />
                      <SortableHeader label="Customer Name" onSort={() => onSort("customer")} />
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Items Count</th>
                      <SortableHeader label="Total" onSort={() => onSort("total")} />
                      <SortableHeader label="Status" onSort={() => onSort("status")} />
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`border-b border-neutral-100 transition hover:bg-neutral-50 last:border-0 ${order.id === selectedId ? "bg-neutral-50" : ""}`}
                        onClick={() => setSelectedId(order.id)}
                      >
                        <td className="px-4 py-3 text-sm text-neutral-700 font-mono">{order.id}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{order.customer?.fullName || "Unknown customer"}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{order.customer?.email || "No email"}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{order.items?.length ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">
                          {formatCurrency(Number(order.pricing?.total ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700">
                          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                            <span className={getStatusBadgeClass(order.status)}>
                              {order.status ?? "processing"}
                            </span>
                            <select
                              className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 outline-none transition focus:border-neutral-400"
                              value={order.status ?? "processing"}
                              disabled={savingId === order.id}
                              onChange={(event) =>
                                void onStatusChange(order.id, event.target.value)
                              }
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                            aria-label="View order"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-neutral-900">Order Detail</h2>
              <p className="text-xs text-neutral-500">Quick reference for the selected order.</p>
            </div>

            {selectedOrder ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Order ID" value={selectedOrder.id} mono />
                  <DetailItem label="Status" value={selectedOrder.status ?? "processing"} />
                  <DetailItem label="Customer" value={selectedOrder.customer?.fullName || "Unknown customer"} />
                  <DetailItem label="Email" value={selectedOrder.customer?.email || "No email"} />
                  <DetailItem label="Created" value={formatDateTime(selectedOrder.createdAt)} />
                  <DetailItem
                    label="Total"
                    value={formatCurrency(Number(selectedOrder.pricing?.total ?? 0))}
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Items
                  </div>
                  {selectedOrder.items?.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="border-b border-neutral-200 bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Unit Price</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id} className="border-b border-neutral-100 transition hover:bg-neutral-50 last:border-0">
                              <td className="px-4 py-3 text-sm text-neutral-700">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-neutral-700">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-neutral-700">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3 text-sm text-neutral-700">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5">
                      <EmptyState
                        title="No items listed"
                        description="This order does not currently include item rows."
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Select an order"
                description="Choose a row from the table to inspect customer and item details."
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function SortableHeader({ label, onSort }: { label: string; onSort: () => void }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-500 transition hover:text-neutral-700"
        onClick={onSort}
      >
        {label}
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold tracking-tight text-neutral-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function getStatusBadgeClass(status?: string) {
  if (status === "pending") {
    return "rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700";
  }

  if (status === "processing") {
    return "rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700";
  }

  if (status === "shipped") {
    return "rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700";
  }

  if (status === "delivered") {
    return "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700";
  }

  if (status === "cancelled") {
    return "rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700";
  }

  return "rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700";
}
