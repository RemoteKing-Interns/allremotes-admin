"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { LoadingState, Notice, PageTransition } from "@/components/admin/ui";
import { createEmptyOffer, getPromotions, savePromotions } from "@/lib/admin/api";
import { createClientId } from "@/lib/admin/utils";
import type { PromotionsData } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

const fieldLabelClass = "mb-1.5 block text-xs font-semibold text-neutral-700";
const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 transition focus:border-neutral-400 focus:outline-none";
const selectClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 transition focus:border-neutral-400 focus:outline-none";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextPromotions = await getPromotions();
        if (!active) {
          return;
        }

        setPromotions(nextPromotions);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load promotions.",
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

  async function onSave() {
    if (!promotions) {
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      await savePromotions(promotions);
      setNotice({
        tone: "success",
        text: "Promotions saved successfully.",
      });
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not save promotions.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !promotions) {
    return <LoadingState label="Loading promotions…" />;
  }

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Promotions</h1>
            <p className="text-sm text-neutral-500">Edit info bar, categories, and offer rules.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Promotions"}
            </button>
          </div>
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Top Info Bar</p>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Enable Info Bar</p>
              <p className="text-xs text-neutral-500">Show or hide the announcement strip.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={promotions.topInfoBar.enabled}
                onChange={(event) =>
                  setPromotions({
                    ...promotions,
                    topInfoBar: {
                      ...promotions.topInfoBar,
                      enabled: event.target.checked,
                    },
                  })
                }
              />
              <span className="h-6 w-11 rounded-full bg-neutral-200 transition peer-checked:bg-emerald-500" />
              <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </div>

          <div className="space-y-3">
            {promotions.topInfoBar.items.map((item, index) => (
              <div key={`${item}_${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">Info Item {index + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setPromotions({
                        ...promotions,
                        topInfoBar: {
                          ...promotions.topInfoBar,
                          items: promotions.topInfoBar.items.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        },
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete info item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  className={inputClassName}
                  value={item}
                  onChange={(event) =>
                    setPromotions({
                      ...promotions,
                      topInfoBar: {
                        ...promotions.topInfoBar,
                        items: promotions.topInfoBar.items.map((entry, currentIndex) =>
                          currentIndex === index ? event.target.value : entry,
                        ),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setPromotions({
                ...promotions,
                topInfoBar: {
                  ...promotions.topInfoBar,
                  items: [...promotions.topInfoBar.items, ""],
                },
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Info Item
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Offer Categories</p>

          <div className="space-y-3">
            {promotions.offers.categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">Category</p>
                  <button
                    type="button"
                    onClick={() =>
                      setPromotions({
                        ...promotions,
                        offers: {
                          ...promotions.offers,
                          categories: promotions.offers.categories.filter(
                            (entry) => entry.id !== category.id,
                          ),
                          offers: promotions.offers.offers.map((offer) =>
                            offer.categoryId === category.id
                              ? { ...offer, categoryId: "" }
                              : offer,
                          ),
                        },
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <label className={fieldLabelClass}>Name</label>
                <input
                  className={inputClassName}
                  value={category.name}
                  onChange={(event) =>
                    setPromotions({
                      ...promotions,
                      offers: {
                        ...promotions.offers,
                        categories: promotions.offers.categories.map((entry) =>
                          entry.id === category.id
                            ? { ...entry, name: event.target.value }
                            : entry,
                        ),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setPromotions({
                ...promotions,
                offers: {
                  ...promotions.offers,
                  categories: [
                    ...promotions.offers.categories,
                    {
                      id: createClientId("promo-category"),
                      name: "New Category",
                    },
                  ],
                },
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Offer Settings</p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Stack with Member Discount</p>
              <p className="text-xs text-neutral-500">Allow offer stacking with member discount rules.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={promotions.offers.stackWithMemberDiscount}
                onChange={(event) =>
                  setPromotions({
                    ...promotions,
                    offers: {
                      ...promotions.offers,
                      stackWithMemberDiscount: event.target.checked,
                    },
                  })
                }
              />
              <span className="h-6 w-11 rounded-full bg-neutral-200 transition peer-checked:bg-emerald-500" />
              <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Offers</p>

          <div className="space-y-3">
            {promotions.offers.offers.map((offer) => (
              <div
                key={offer.id}
                className={`rounded-2xl border border-neutral-200 bg-white p-4 ${
                  offer.enabled ? "border-l-4 border-l-emerald-400" : ""
                }`}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3 w-3 rounded-full ${
                        offer.enabled ? "bg-emerald-400" : "bg-neutral-300"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{offer.name || "Untitled Promotion"}</p>
                      <p className="text-xs text-neutral-500">Edit targeting, discount, and active dates.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={offer.enabled}
                        onChange={(event) =>
                          patchOffer(promotions, setPromotions, offer.id, {
                            enabled: event.target.checked,
                          })
                        }
                      />
                      <span className="peer h-6 w-11 rounded-full bg-neutral-200 transition peer-checked:bg-emerald-500" />
                      <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPromotions({
                          ...promotions,
                          offers: {
                            ...promotions.offers,
                            offers: promotions.offers.offers.filter(
                              (entry) => entry.id !== offer.id,
                            ),
                          },
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className={fieldLabelClass}>Name</label>
                    <input
                      className={inputClassName}
                      value={offer.name}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          name: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Category</label>
                    <select
                      className={selectClassName}
                      value={offer.categoryId}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          categoryId: event.target.value,
                        })
                      }
                    >
                      <option value="">Select category</option>
                      {promotions.offers.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Discount %</label>
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      max="95"
                      value={offer.discountPercent}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          discountPercent: Number(event.target.value || 0),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Applies To</label>
                    <input
                      className={inputClassName}
                      value={offer.appliesTo}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          appliesTo: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Start Date</label>
                    <input
                      className={inputClassName}
                      type="date"
                      value={offer.startDate}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          startDate: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>End Date</label>
                    <input
                      className={inputClassName}
                      type="date"
                      value={offer.endDate}
                      onChange={(event) =>
                        patchOffer(promotions, setPromotions, offer.id, {
                          endDate: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setPromotions({
                ...promotions,
                offers: {
                  ...promotions.offers,
                  offers: [
                    ...promotions.offers.offers,
                    createEmptyOffer(promotions.offers.offers.length),
                  ],
                },
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Offer
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

function patchOffer(
  promotions: PromotionsData,
  onChange: (value: PromotionsData) => void,
  offerId: string,
  patch: Partial<PromotionsData["offers"]["offers"][number]>,
) {
  onChange({
    ...promotions,
    offers: {
      ...promotions.offers,
      offers: promotions.offers.offers.map((offer) =>
        offer.id === offerId ? { ...offer, ...patch } : offer,
      ),
    },
  });
}
