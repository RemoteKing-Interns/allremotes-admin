"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, LoadingState, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { getProducts, saveProducts } from "@/lib/admin/api";
import { createClientId, formatCurrency } from "@/lib/admin/utils";
import type { Product } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextProducts = await getProducts();

        if (!active) {
          return;
        }

        setProducts(nextProducts);
        setSelectedId((current) => current ?? nextProducts[0]?.id ?? null);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load products.",
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

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );

  function patchProduct(productId: string, patch: Partial<Product>) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
  }

  function addProduct() {
    const nextProduct: Product = {
      id: createClientId("product"),
      name: "New Product",
      category: "garage",
      price: 0,
      image: "",
      description: "",
      brand: "",
      inStock: true,
      sku: "",
      condition: "Brand New",
      returns: "30-day returns",
      seller: "AllRemotes",
    };

    setProducts((current) => [nextProduct, ...current]);
    setSelectedId(nextProduct.id);
    setNotice({
      tone: "info",
      text: "New product added locally. Save to push the catalog update.",
    });
  }

  function removeProduct(productId: string) {
    const currentProduct = products.find((product) => product.id === productId);
    if (!currentProduct) {
      return;
    }

    if (!window.confirm(`Delete "${currentProduct.name}" from the catalog draft?`)) {
      return;
    }

    const nextProducts = products.filter((product) => product.id !== productId);
    setProducts(nextProducts);
    setSelectedId((current) =>
      current === productId ? nextProducts[0]?.id ?? null : current,
    );
    setNotice({
      tone: "info",
      text: "Product removed locally. Save to update the live catalog.",
    });
  }

  async function onSave() {
    setSaving(true);
    setNotice(null);

    try {
      await saveProducts(products);
      setNotice({
        tone: "success",
        text: "Products saved successfully.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not save products.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading products…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Products"
        description="Manage the live catalog and push the full product list with one save."
        actions={
          <>
            <button type="button" className="button button--ghost" onClick={addProduct}>
              Add Product
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Products"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card
          title="Catalog Table"
          description="Image, price, stock status, and row actions for the current catalog."
          actions={
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Reload
            </button>
          }
        >
          {products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Use Add Product to create the first draft row."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>In Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={product.id === selectedId ? "table-row--active" : ""}
                    >
                      <td>
                        <div
                          className="media-thumb"
                          style={
                            product.image
                              ? { backgroundImage: `url(${product.image})` }
                              : undefined
                          }
                        >
                          {!product.image ? <span className="media-fallback">IMG</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="cell-title">{product.name || "Untitled product"}</div>
                        <span className="cell-subtitle">{product.brand || "No brand"}</span>
                      </td>
                      <td>{product.category || "Uncategorised"}</td>
                      <td>{formatCurrency(Number(product.price ?? 0))}</td>
                      <td>
                        <span
                          className={
                            product.inStock
                              ? "status-pill status-pill--success"
                              : "status-pill status-pill--danger"
                          }
                        >
                          {product.inStock ? "In stock" : "Out of stock"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => setSelectedId(product.id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--danger"
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
          )}
        </Card>

        <Card title="Add / Edit Product" description="Edits stay local until you save.">
          {selectedProduct ? (
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  value={selectedProduct.name}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { name: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Category</span>
                <input
                  className="input"
                  value={selectedProduct.category}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { category: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Price</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedProduct.price}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, {
                      price: Number(event.target.value || 0),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Brand</span>
                <input
                  className="input"
                  value={selectedProduct.brand}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { brand: event.target.value })
                  }
                />
              </label>
              <label className="field field--full">
                <span>Image URL</span>
                <input
                  className="input"
                  value={selectedProduct.image}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { image: event.target.value })
                  }
                />
              </label>
              <label className="field field--full">
                <span>Description</span>
                <textarea
                  className="textarea"
                  value={selectedProduct.description}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, {
                      description: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>SKU</span>
                <input
                  className="input"
                  value={selectedProduct.sku ?? ""}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { sku: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Condition</span>
                <input
                  className="input"
                  value={selectedProduct.condition ?? ""}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { condition: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Returns</span>
                <input
                  className="input"
                  value={selectedProduct.returns ?? ""}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { returns: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Seller</span>
                <input
                  className="input"
                  value={selectedProduct.seller ?? ""}
                  onChange={(event) =>
                    patchProduct(selectedProduct.id, { seller: event.target.value })
                  }
                />
              </label>
              <Toggle
                checked={selectedProduct.inStock}
                onChange={(checked) =>
                  patchProduct(selectedProduct.id, { inStock: checked })
                }
                label="In Stock"
              />
              <div className="card-surface hero-preview">
                <div
                  className="media-thumb"
                  style={
                    selectedProduct.image
                      ? { width: "100%", height: "100%", backgroundImage: `url(${selectedProduct.image})` }
                      : { width: "100%", height: "100%" }
                  }
                >
                  {!selectedProduct.image ? (
                    <span className="media-fallback">Preview</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Select a product"
              description="Choose a row from the table to edit it here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
