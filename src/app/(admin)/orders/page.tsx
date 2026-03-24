"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, LoadingState, Notice, PageHeader } from "@/components/admin/ui";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
    <div className="stack">
      <PageHeader
        title="Orders"
        description="Monitor live order traffic and update fulfillment status directly from each row."
        actions={
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Refresh
          </button>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card title="Order Table" description="Editable status is applied per order row.">
          {orders.length === 0 ? (
            <EmptyState
              title="No orders available"
              description="Orders will appear here when the API returns data."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Items Count</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={order.id === selectedId ? "table-row--active" : ""}
                      onClick={() => setSelectedId(order.id)}
                    >
                      <td className="mono">{order.id}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.customer?.fullName || "Unknown customer"}</td>
                      <td>{order.customer?.email || "No email"}</td>
                      <td>{order.items?.length ?? 0}</td>
                      <td>{formatCurrency(Number(order.pricing?.total ?? 0))}</td>
                      <td>
                        <select
                          className="input"
                          value={order.status ?? "processing"}
                          disabled={savingId === order.id}
                          onClick={(event) => event.stopPropagation()}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Order Detail" description="Quick reference for the selected order.">
          {selectedOrder ? (
            <div className="stack">
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Order ID</span>
                  <strong className="mono">{selectedOrder.id}</strong>
                </div>
                <div className="detail-item">
                  <span>Status</span>
                  <strong>{selectedOrder.status ?? "processing"}</strong>
                </div>
                <div className="detail-item">
                  <span>Customer</span>
                  <strong>{selectedOrder.customer?.fullName || "Unknown customer"}</strong>
                </div>
                <div className="detail-item">
                  <span>Email</span>
                  <strong>{selectedOrder.customer?.email || "No email"}</strong>
                </div>
                <div className="detail-item">
                  <span>Created</span>
                  <strong>{formatDateTime(selectedOrder.createdAt)}</strong>
                </div>
                <div className="detail-item">
                  <span>Total</span>
                  <strong>{formatCurrency(Number(selectedOrder.pricing?.total ?? 0))}</strong>
                </div>
              </div>

              <Card title="Items" description="Products included in this order.">
                {selectedOrder.items?.length ? (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No items listed"
                    description="This order does not currently include item rows."
                  />
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              title="Select an order"
              description="Choose a row from the table to inspect customer and item details."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
