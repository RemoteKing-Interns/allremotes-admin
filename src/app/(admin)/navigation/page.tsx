"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { LoadingState, Notice, PageTransition } from "@/components/admin/ui";
import { getNavigation, saveNavigation } from "@/lib/admin/api";
import { createClientId, slugify } from "@/lib/admin/utils";
import type { NavigationTree } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

interface NavigationSectionDraft {
  key: string;
  title: string;
  path: string;
  hidden: boolean;
  items: NavigationItemDraft[];
}

interface NavigationItemDraft {
  id: string;
  label: string;
  path: string;
  iconIndex: number;
  hidden: boolean;
}

const fieldLabelClass = "mb-1.5 block text-xs font-semibold text-neutral-700";
const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 transition focus:border-neutral-400 focus:outline-none";

export default function NavigationPage() {
  const [sections, setSections] = useState<NavigationSectionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const navigation = await getNavigation();
        if (!active) {
          return;
        }

        setSections(toDraftSections(navigation));
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load navigation.",
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
    setSaving(true);
    setNotice(null);

    try {
      await saveNavigation(fromDraftSections(sections));
      setNotice({
        tone: "success",
        text: "Navigation saved successfully.",
      });
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not save navigation.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading navigation…" />;
  }

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Navigation</h1>
            <p className="text-sm text-neutral-500">Edit sections and ordered navigation links.</p>
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
              {saving ? "Saving…" : "Save Navigation"}
            </button>
          </div>
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Navigation Sections</p>
            <button
              type="button"
              onClick={() =>
                setSections((current) => [
                  ...current,
                  {
                    key: createClientId("nav-section"),
                    title: "New Section",
                    path: "/new-section",
                    hidden: false,
                    items: [],
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((section, sectionIndex) => (
              <div key={section.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">Section {sectionIndex + 1}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sectionIndex === 0}
                      onClick={() =>
                        setSections((current) => moveArrayItem(current, sectionIndex, "up"))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move section up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={sectionIndex === sections.length - 1}
                      onClick={() =>
                        setSections((current) => moveArrayItem(current, sectionIndex, "down"))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move section down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSections((current) =>
                          current.filter((entry) => entry.key !== section.key),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelClass}>Section Label</label>
                    <input
                      className={inputClassName}
                      value={section.title}
                      onChange={(event) =>
                        patchSection(setSections, section.key, {
                          title: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Section URL</label>
                    <input
                      className={inputClassName}
                      value={section.path}
                      onChange={(event) =>
                        patchSection(setSections, section.key, {
                          path: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3">
                      <span className="text-sm font-medium text-neutral-700">Show Section</span>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={section.hidden}
                          onChange={(event) =>
                            patchSection(setSections, section.key, { hidden: event.target.checked })
                          }
                        />
                        <span className="h-6 w-11 rounded-full bg-neutral-200 transition peer-checked:bg-emerald-500" />
                        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">Items</p>
                  {section.items.map((item, itemIndex) => (
                    <div key={item.id} className="mb-2 rounded-xl border border-neutral-200 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <GripVertical className="h-4 w-4 text-neutral-300" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row">
                          <input
                            className={`${inputClassName} flex-1`}
                            value={item.label}
                            onChange={(event) =>
                              patchItem(setSections, section.key, item.id, {
                                label: event.target.value,
                              })
                            }
                            placeholder="Label"
                          />
                          <input
                            className={`${inputClassName} flex-1`}
                            value={item.path}
                            onChange={(event) =>
                              patchItem(setSections, section.key, item.id, {
                                path: event.target.value,
                              })
                            }
                            placeholder="URL"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            patchSection(setSections, section.key, {
                              items: section.items.filter((entry) => entry.id !== item.id),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
                        <button
                          type="button"
                          disabled={itemIndex === 0}
                          onClick={() =>
                            patchSection(setSections, section.key, {
                              items: moveArrayItem(section.items, itemIndex, "up"),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move item up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={itemIndex === section.items.length - 1}
                          onClick={() =>
                            patchSection(setSections, section.key, {
                              items: moveArrayItem(section.items, itemIndex, "down"),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move item down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <input
                          className="h-8 w-24 rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                          type="number"
                          min="0"
                          value={item.iconIndex}
                          onChange={(event) =>
                            patchItem(setSections, section.key, item.id, {
                              iconIndex: Number(event.target.value || 0),
                            })
                          }
                        />
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-600">Hidden</span>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={item.hidden}
                              onChange={(event) =>
                                patchItem(setSections, section.key, item.id, {
                                  hidden: event.target.checked,
                                })
                              }
                            />
                            <span className="h-6 w-11 rounded-full bg-neutral-200 transition peer-checked:bg-emerald-500" />
                            <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      patchSection(setSections, section.key, {
                        items: [
                          ...section.items,
                          {
                            id: createClientId("nav-item"),
                            label: "New Item",
                            path: "/new-item",
                            iconIndex: 0,
                            hidden: false,
                          },
                        ],
                      })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 p-3 text-center text-sm text-neutral-400 transition hover:bg-neutral-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add new item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function toDraftSections(navigation: NavigationTree): NavigationSectionDraft[] {
  return Object.entries(navigation).map(([key, section]) => ({
    key,
    title: section.title ?? key,
    path: section.path ?? "/",
    hidden: Boolean(section.hidden),
    items: (section.columns ?? []).flatMap((column) =>
      column.items.map((item, index) => ({
        id: createClientId(`nav-item-${key}-${index}`),
        label: item.name ?? "",
        path: item.path ?? "",
        iconIndex: item.iconIndex ?? 0,
        hidden: Boolean(item.hidden),
      })),
    ),
  }));
}

function fromDraftSections(sections: NavigationSectionDraft[]): NavigationTree {
  return Object.fromEntries(
    sections.map((section) => {
      const key = section.key || slugify(section.title) || createClientId("nav-section");
      return [
        key,
        {
          title: section.title,
          path: section.path,
          hidden: section.hidden,
          hasDropdown: section.items.length > 0,
          columns: section.items.length
            ? [
                {
                  title: section.title,
                  items: section.items.map((item) => ({
                    name: item.label,
                    path: item.path,
                    iconIndex: item.iconIndex,
                    hidden: item.hidden,
                  })),
                },
              ]
            : [],
        },
      ];
    }),
  );
}

function patchSection(
  onChange: Dispatch<SetStateAction<NavigationSectionDraft[]>>,
  sectionKey: string,
  patch: Partial<NavigationSectionDraft>,
) {
  onChange((current) =>
    current.map((section) =>
      section.key === sectionKey ? { ...section, ...patch } : section,
    ),
  );
}

function patchItem(
  onChange: Dispatch<SetStateAction<NavigationSectionDraft[]>>,
  sectionKey: string,
  itemId: string,
  patch: Partial<NavigationItemDraft>,
) {
  onChange((current) =>
    current.map((section) =>
      section.key === sectionKey
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          }
        : section,
    ),
  );
}

function moveArrayItem<T>(items: T[], index: number, direction: "up" | "down") {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}
