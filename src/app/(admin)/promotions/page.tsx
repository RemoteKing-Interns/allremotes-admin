"use client";

import { useEffect, useState } from "react";
import { Card, LoadingState, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { createEmptyOffer, getPromotions, savePromotions } from "@/lib/admin/api";
import { createClientId } from "@/lib/admin/utils";
import type { PromotionsData } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

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
    <div className="stack">
      <PageHeader
        title="Promotions"
        description="Manage the top info bar, offer categories, offer rules, and stack settings."
        actions={
          <>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Refresh
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Promotions"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card title="Top Info Bar" description="Enabled toggle and repeatable text items.">
          <Toggle
            checked={promotions.topInfoBar.enabled}
            onChange={(checked) =>
              setPromotions({
                ...promotions,
                topInfoBar: {
                  ...promotions.topInfoBar,
                  enabled: checked,
                },
              })
            }
            label="Enable top info bar"
          />

          <div className="repeatable-list">
            {promotions.topInfoBar.items.map((item, index) => (
              <div key={`${item}_${index}`} className="repeatable-item">
                <div className="section-head">
                  <span className="section-label">Info Item {index + 1}</span>
                  <button
                    type="button"
                    className="button button--danger"
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
                  >
                    Delete
                  </button>
                </div>
                <input
                  className="input"
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
            className="button button--ghost"
            onClick={() =>
              setPromotions({
                ...promotions,
                topInfoBar: {
                  ...promotions.topInfoBar,
                  items: [...promotions.topInfoBar.items, ""],
                },
              })
            }
          >
            Add Info Item
          </button>
        </Card>

        <Card title="Offer Categories" description="Create or remove categories for promotion rules.">
          <div className="repeatable-list">
            {promotions.offers.categories.map((category) => (
              <div key={category.id} className="repeatable-item">
                <div className="section-head">
                  <span className="section-label">Category</span>
                  <button
                    type="button"
                    className="button button--danger"
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
                  >
                    Delete
                  </button>
                </div>
                <label className="field">
                  <span>Name</span>
                  <input
                    className="input"
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
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
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
          >
            Add Category
          </button>
        </Card>
      </div>

      <Card title="Offer Settings" description="Global stacking behavior for promotions.">
        <Toggle
          checked={promotions.offers.stackWithMemberDiscount}
          onChange={(checked) =>
            setPromotions({
              ...promotions,
              offers: {
                ...promotions.offers,
                stackWithMemberDiscount: checked,
              },
            })
          }
          label="Stack with member discount"
        />
      </Card>

      <Card title="Offers" description="Name, category, discount, target, dates, and enabled state.">
        <div className="repeatable-list">
          {promotions.offers.offers.map((offer) => (
            <div key={offer.id} className="repeatable-item">
              <div className="section-head">
                <span className="section-label">Offer</span>
                <button
                  type="button"
                  className="button button--danger"
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
                >
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    className="input"
                    value={offer.name}
                    onChange={(event) =>
                      patchOffer(promotions, setPromotions, offer.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select
                    className="input"
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
                </label>
                <label className="field">
                  <span>Discount %</span>
                  <input
                    className="input"
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
                </label>
                <label className="field">
                  <span>Applies To</span>
                  <input
                    className="input"
                    value={offer.appliesTo}
                    onChange={(event) =>
                      patchOffer(promotions, setPromotions, offer.id, {
                        appliesTo: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Start Date</span>
                  <input
                    className="input"
                    type="date"
                    value={offer.startDate}
                    onChange={(event) =>
                      patchOffer(promotions, setPromotions, offer.id, {
                        startDate: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>End Date</span>
                  <input
                    className="input"
                    type="date"
                    value={offer.endDate}
                    onChange={(event) =>
                      patchOffer(promotions, setPromotions, offer.id, {
                        endDate: event.target.value,
                      })
                    }
                  />
                </label>
                <Toggle
                  checked={offer.enabled}
                  onChange={(checked) =>
                    patchOffer(promotions, setPromotions, offer.id, {
                      enabled: checked,
                    })
                  }
                  label="Enabled"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="button button--ghost"
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
        >
          Add Offer
        </button>
      </Card>
    </div>
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
