"use client";

import { useEffect, useState } from "react";
import {
  GripVertical,
  ImagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { LoadingState, Notice, PageTransition } from "@/components/admin/ui";
import { getHomeContent, saveHomeContent } from "@/lib/admin/api";
import type { HomeContent } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

const fieldLabelClass = "mb-1.5 block text-xs font-semibold text-neutral-700";
const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 transition focus:border-neutral-400 focus:outline-none";
const textareaClassName =
  "min-h-[80px] w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 transition focus:border-neutral-400 focus:outline-none";

export default function HomeContentPage() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextContent = await getHomeContent();
        if (!active) {
          return;
        }

        setContent(nextContent);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load home content.",
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
    if (!content) {
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      await saveHomeContent(content);
      setNotice({
        tone: "success",
        text: "Home content saved successfully.",
      });
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not save home content.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !content) {
    return <LoadingState label="Loading home content…" />;
  }

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Home Content</h1>
            <p className="text-sm text-neutral-500">Manage homepage sections and live messaging.</p>
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
              {saving ? "Saving…" : "Save Home Content"}
            </button>
          </div>
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Hero Section</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={fieldLabelClass}>Headline</label>
              <input
                className={inputClassName}
                value={content.hero.title}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, title: event.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Subheadline</label>
              <input
                className={inputClassName}
                value={content.hero.subtitle}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, subtitle: event.target.value },
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className={fieldLabelClass}>Description</label>
              <textarea
                className={textareaClassName}
                value={content.hero.description}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, description: event.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabelClass}>CTA Text (Primary)</label>
              <input
                className={inputClassName}
                value={content.hero.primaryCta}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, primaryCta: event.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabelClass}>CTA URL (Primary)</label>
              <input
                className={inputClassName}
                value={content.hero.primaryCtaPath}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, primaryCtaPath: event.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabelClass}>CTA Text (Secondary)</label>
              <input
                className={inputClassName}
                value={content.hero.secondaryCta}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, secondaryCta: event.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabelClass}>CTA URL (Secondary)</label>
              <input
                className={inputClassName}
                value={content.hero.secondaryCtaPath}
                onChange={(event) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, secondaryCtaPath: event.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Hero Images</p>
          <div className="grid gap-4 md:grid-cols-2">
            {content.heroImages.map((image, index) => (
              <div key={`${image}_${index}`} className="rounded-xl border border-neutral-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-neutral-600">Hero Slot {index + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        heroImages: content.heroImages.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove hero image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className="mb-3 cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400 transition hover:bg-neutral-50"
                  style={
                    image
                      ? {
                          backgroundImage: `url(${image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          minHeight: 140,
                        }
                      : undefined
                  }
                >
                  {!image ? (
                    <>
                      <ImagePlus className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                      <span>Click to add hero image</span>
                    </>
                  ) : (
                    <span className="rounded bg-white/80 px-2 py-1 text-xs text-neutral-600">
                      Preview
                    </span>
                  )}
                </div>

                <label className={fieldLabelClass}>Image URL</label>
                <input
                  className={inputClassName}
                  value={image}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      heroImages: content.heroImages.map((entry, currentIndex) =>
                        currentIndex === index ? event.target.value : entry,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setContent({
                ...content,
                heroImages: [...content.heroImages, ""],
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Hero Image
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Features List</p>
          <div className="space-y-3">
            {content.features.map((feature, index) => (
              <div key={`${feature.title}_${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-900">Feature {index + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        features: content.features.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      })
                    }
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete feature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelClass}>Icon</label>
                    <input
                      className={inputClassName}
                      value={feature.icon}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          features: content.features.map((entry, currentIndex) =>
                            currentIndex === index
                              ? { ...entry, icon: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Title</label>
                    <input
                      className={inputClassName}
                      value={feature.title}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          features: content.features.map((entry, currentIndex) =>
                            currentIndex === index
                              ? { ...entry, title: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={fieldLabelClass}>Description</label>
                    <textarea
                      className={textareaClassName}
                      value={feature.description}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          features: content.features.map((entry, currentIndex) =>
                            currentIndex === index
                              ? { ...entry, description: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Link Text</label>
                    <input
                      className={inputClassName}
                      value={feature.linkText}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          features: content.features.map((entry, currentIndex) =>
                            currentIndex === index
                              ? { ...entry, linkText: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Link URL</label>
                    <input
                      className={inputClassName}
                      value={feature.path}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          features: content.features.map((entry, currentIndex) =>
                            currentIndex === index
                              ? { ...entry, path: event.target.value }
                              : entry,
                          ),
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
              setContent({
                ...content,
                features: [
                  ...content.features,
                  {
                    icon: "",
                    title: "",
                    description: "",
                    path: "",
                    linkText: "",
                  },
                ],
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Feature Card
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:mb-0">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Why Buy</p>
            <div className="space-y-3">
              {content.whyBuy.map((item, index) => (
                <div key={`${item.title}_${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">Trust Item {index + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setContent({
                          ...content,
                          whyBuy: content.whyBuy.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete trust item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={fieldLabelClass}>Icon</label>
                      <input
                        className={inputClassName}
                        value={item.icon}
                        onChange={(event) =>
                          setContent({
                            ...content,
                            whyBuy: content.whyBuy.map((entry, currentIndex) =>
                              currentIndex === index
                                ? { ...entry, icon: event.target.value }
                                : entry,
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={fieldLabelClass}>Title</label>
                      <input
                        className={inputClassName}
                        value={item.title}
                        onChange={(event) =>
                          setContent({
                            ...content,
                            whyBuy: content.whyBuy.map((entry, currentIndex) =>
                              currentIndex === index
                                ? { ...entry, title: event.target.value }
                                : entry,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={fieldLabelClass}>Description</label>
                      <textarea
                        className={textareaClassName}
                        value={item.description}
                        onChange={(event) =>
                          setContent({
                            ...content,
                            whyBuy: content.whyBuy.map((entry, currentIndex) =>
                              currentIndex === index
                                ? { ...entry, description: event.target.value }
                                : entry,
                            ),
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
                setContent({
                  ...content,
                  whyBuy: [
                    ...content.whyBuy,
                    {
                      icon: "",
                      title: "",
                      description: "",
                    },
                  ],
                })
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" />
              Add Why Buy Item
            </button>
          </div>

          <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:mb-0">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">CTA Section</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={fieldLabelClass}>Title</label>
                <input
                  className={inputClassName}
                  value={content.ctaSection.title}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      ctaSection: {
                        ...content.ctaSection,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Button Text</label>
                <input
                  className={inputClassName}
                  value={content.ctaSection.buttonText}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      ctaSection: {
                        ...content.ctaSection,
                        buttonText: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className={fieldLabelClass}>Description</label>
                <textarea
                  className={textareaClassName}
                  value={content.ctaSection.description}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      ctaSection: {
                        ...content.ctaSection,
                        description: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Button URL</label>
                <input
                  className={inputClassName}
                  value={content.ctaSection.buttonPath}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      ctaSection: {
                        ...content.ctaSection,
                        buttonPath: event.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
