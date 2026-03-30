"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingState,
  Notice,
  PageTransition,
  Toggle,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/admin/ui";
import { getProducts, saveProducts } from "@/lib/admin/api";
import { createClientId, formatCurrency } from "@/lib/admin/utils";
import type { Product } from "@/lib/admin/types";
import { motion, AnimatePresence } from "framer-motion";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextProducts = await getProducts();
        if (!active) return;
        setProducts(nextProducts);
      } catch (error) {
        if (!active) return;
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load products.",
        });
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (stockFilter === "in" && !product.inStock) return false;
      if (stockFilter === "out" && product.inStock) return false;

      if (!query) return true;
      return [product.name, product.brand, product.category, product.sku]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [products, searchQuery, stockFilter]);

  const pendingDeleteProduct = useMemo(
    () => products.find((product) => product.id === pendingDeleteId) ?? null,
    [pendingDeleteId, products],
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
    setViewMode("edit");
    setNotice({
      tone: "info",
      text: "New product drafted. Fill details and save.",
    });
  }

  function handleEditClick(id: string) {
    setSelectedId(id);
    setViewMode("edit");
    setNotice(null);
  }

  function handleBackToList() {
    setViewMode("list");
    setNotice(null);
  }

  function requestRemoveProduct(productId: string) {
    setPendingDeleteId(productId);
  }

  function confirmRemoveProduct() {
    if (!pendingDeleteId) return;

    const nextProducts = products.filter((p) => p.id !== pendingDeleteId);
    setProducts(nextProducts);
    
    if (selectedId === pendingDeleteId) {
      setViewMode("list");
    }
    setPendingDeleteId(null);
    setNotice({
      tone: "info",
      text: "Product removed locally. Save to finalize.",
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
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save products.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading catalog…" />;
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-5">
        
        {/* Header Actions */}
        <div className="flex flex-col gap-3">
          {viewMode === "list" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[22px] font-bold tracking-tight text-[#1b1c1c]">Products</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-neutral-200/60 px-4 py-2 text-[13px] font-bold text-[#1b1c1c] transition hover:bg-neutral-300/60 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">{saving ? "Saving…" : "Save Live"}</span>
                </button>
                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)" }}
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="flex items-center gap-2 rounded-xl bg-[#ffffff] px-4 py-2 text-[13px] font-bold text-[#3e484d] transition hover:bg-[#efeded] shadow-[0_2px_8px_rgba(27,28,28,0.04)]"
                style={{ border: "1px solid rgba(189, 200, 206, 0.4)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90 shadow-[0_4px_15px_rgba(0,100,124,0.3)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)" }}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Search & Filters */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e797e]" />
                  <input
                    className={inputClassName + " pl-9"}
                    placeholder="Search name, brand, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className={selectClassName + " w-32"}
                    value={stockFilter}
                    onChange={(e) =>
                      setStockFilter(e.target.value as "all" | "in" | "out")
                    }
                  >
                    <option value="all">All Stock</option>
                    <option value="in">In Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setReloadKey((v) => v + 1)}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#efeded] bg-[#ffffff] text-[#6e797e] hover:bg-[#f5f3f3] shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Product List */}
              <div 
                className="flex flex-col rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
                  border: "1px solid rgba(189, 200, 206, 0.15)",
                }}
              >
                {filteredProducts.length === 0 ? (
                  <EmptyState title="No products found" description="Try adjusting your search criteria." />
                ) : (
                  <div className="flex flex-col divide-y divide-[#efeded]">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleEditClick(product.id)}
                        className="flex w-full items-center gap-3 bg-[#ffffff] p-3 text-left transition hover:bg-[#fbf9f9]"
                      >
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#efeded] bg-[#f5f3f3]"
                          style={
                            product.image
                              ? {
                                  backgroundImage: `url(${product.image})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                        >
                          {!product.image && <ImageIcon className="h-5 w-5 text-[#bdc8ce]" />}
                        </div>
                        
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="truncate text-[13px] font-bold text-[#1b1c1c]">
                            {product.name || "Untitled"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#6e797e]">
                            <span>{formatCurrency(Number(product.price ?? 0))}</span>
                            <span>•</span>
                            <span
                              className={product.inStock ? "text-[#10b981]" : "text-[#f59e0b]"}
                            >
                              {product.inStock ? "In Stock" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 text-[#bdc8ce]">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedProduct ? (
                <div 
                  className="flex flex-col gap-5 rounded-xl p-5"
                  style={{
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
                    border: "1px solid rgba(189, 200, 206, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[#efeded] pb-4">
                    <div>
                      <h2 className="text-[16px] font-bold text-[#1b1c1c]">Edit Product</h2>
                      <p className="text-[12px] font-medium text-[#6e797e]">Make changes to {selectedProduct.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestRemoveProduct(selectedProduct.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#e11d48] transition hover:bg-[#fff1f2]"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Field label="Image URL">
                      <input
                        className={inputClassName}
                        placeholder="https://..."
                        value={selectedProduct.image}
                        onChange={(e) => patchProduct(selectedProduct.id, { image: e.target.value })}
                      />
                    </Field>

                    {/* Image Preview Area */}
                    <div 
                      className="flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border border-[#efeded] bg-[#fbf9f9]"
                      style={
                        selectedProduct.image
                          ? {
                              backgroundImage: `url(${selectedProduct.image})`,
                              backgroundSize: "contain",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      {!selectedProduct.image && (
                        <div className="flex flex-col items-center gap-2 text-[#6e797e]">
                          <ImageIcon className="h-6 w-6 opacity-40" />
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">No Image</span>
                        </div>
                      )}
                    </div>

                    <Field label="Name">
                      <input
                        className={inputClassName}
                        value={selectedProduct.name}
                        onChange={(e) => patchProduct(selectedProduct.id, { name: e.target.value })}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Price">
                        <input
                          className={inputClassName}
                          type="number"
                          min="0"
                          step="0.01"
                          value={selectedProduct.price}
                          onChange={(e) => patchProduct(selectedProduct.id, { price: Number(e.target.value || 0) })}
                        />
                      </Field>
                      <Field label="SKU">
                        <input
                          className={inputClassName}
                          value={selectedProduct.sku ?? ""}
                          onChange={(e) => patchProduct(selectedProduct.id, { sku: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Category">
                        <input
                          className={inputClassName}
                          value={selectedProduct.category}
                          onChange={(e) => patchProduct(selectedProduct.id, { category: e.target.value })}
                        />
                      </Field>
                      <Field label="Brand">
                        <input
                          className={inputClassName}
                          value={selectedProduct.brand}
                          onChange={(e) => patchProduct(selectedProduct.id, { brand: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Description">
                      <textarea
                        className={textareaClassName}
                        value={selectedProduct.description}
                        onChange={(e) => patchProduct(selectedProduct.id, { description: e.target.value })}
                      />
                    </Field>

                    <Toggle
                      checked={selectedProduct.inStock}
                      onChange={(checked) => patchProduct(selectedProduct.id, { inStock: checked })}
                      label="In Stock / Active"
                    />
                  </div>
                </div>
              ) : (
                <EmptyState title="Not found" description="The selected product no longer exists." />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteProduct)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete product"
        description={
          pendingDeleteProduct
            ? `Delete "${pendingDeleteProduct.name}"? This removes it from the local draft.`
            : "Delete this product?"
        }
        confirmLabel="Delete Draft"
        tone="danger"
        onConfirm={confirmRemoveProduct}
      />
    </PageTransition>
  );
}
