"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Card, LoadingState, Notice, PageHeader, Toggle } from "@/components/admin/ui";
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
    <div className="stack">
      <PageHeader
        title="Navigation"
        description="Edit nav sections and the items inside each section."
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
              {saving ? "Saving…" : "Save Navigation"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Card
        title="Navigation Sections"
        description="Sections are edited as a flat list of items for the admin workflow."
        actions={
          <button
            type="button"
            className="button button--ghost"
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
          >
            Add Section
          </button>
        }
      >
        <div className="repeatable-list">
          {sections.map((section) => (
            <div key={section.key} className="repeatable-item">
              <div className="section-head">
                <span className="section-label">Section</span>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() =>
                    setSections((current) =>
                      current.filter((entry) => entry.key !== section.key),
                    )
                  }
                >
                  Delete Section
                </button>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Title</span>
                  <input
                    className="input"
                    value={section.title}
                    onChange={(event) =>
                      patchSection(setSections, section.key, {
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Path</span>
                  <input
                    className="input"
                    value={section.path}
                    onChange={(event) =>
                      patchSection(setSections, section.key, {
                        path: event.target.value,
                      })
                    }
                  />
                </label>
                <Toggle
                  checked={section.hidden}
                  onChange={(checked) =>
                    patchSection(setSections, section.key, { hidden: checked })
                  }
                  label="Show / hide section"
                />
              </div>

              <div className="repeatable-list">
                {section.items.map((item) => (
                  <div key={item.id} className="repeatable-item">
                    <div className="section-head">
                      <span className="section-label">Item</span>
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() =>
                          patchSection(setSections, section.key, {
                            items: section.items.filter((entry) => entry.id !== item.id),
                          })
                        }
                      >
                        Delete Item
                      </button>
                    </div>

                    <div className="form-grid">
                      <label className="field">
                        <span>Label</span>
                        <input
                          className="input"
                          value={item.label}
                          onChange={(event) =>
                            patchItem(setSections, section.key, item.id, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Path</span>
                        <input
                          className="input"
                          value={item.path}
                          onChange={(event) =>
                            patchItem(setSections, section.key, item.id, {
                              path: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Icon index</span>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={item.iconIndex}
                          onChange={(event) =>
                            patchItem(setSections, section.key, item.id, {
                              iconIndex: Number(event.target.value || 0),
                            })
                          }
                        />
                      </label>
                      <Toggle
                        checked={item.hidden}
                        onChange={(checked) =>
                          patchItem(setSections, section.key, item.id, {
                            hidden: checked,
                          })
                        }
                        label="Show / hide item"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="button button--ghost"
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
              >
                Add Item
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
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
