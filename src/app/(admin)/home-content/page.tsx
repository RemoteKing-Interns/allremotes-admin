"use client";

import { useEffect, useState } from "react";
import { Card, LoadingState, Notice, PageHeader } from "@/components/admin/ui";
import { getHomeContent, saveHomeContent } from "@/lib/admin/api";
import type { HomeContent } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

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
    <div className="stack">
      <PageHeader
        title="Home Content"
        description="Manage hero content, feature cards, trust blocks, and the closing CTA."
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
              {saving ? "Saving…" : "Save Home Content"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Card title="Hero" description="Homepage hero text, buttons, and image slides.">
        <div className="form-grid">
          <label className="field">
            <span>Title</span>
            <input
              className="input"
              value={content.hero.title}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, title: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Subtitle</span>
            <input
              className="input"
              value={content.hero.subtitle}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, subtitle: event.target.value },
                })
              }
            />
          </label>
          <label className="field field--full">
            <span>Description</span>
            <textarea
              className="textarea"
              value={content.hero.description}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, description: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Primary CTA text</span>
            <input
              className="input"
              value={content.hero.primaryCta}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, primaryCta: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Primary CTA path</span>
            <input
              className="input"
              value={content.hero.primaryCtaPath}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, primaryCtaPath: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Secondary CTA text</span>
            <input
              className="input"
              value={content.hero.secondaryCta}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, secondaryCta: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Secondary CTA path</span>
            <input
              className="input"
              value={content.hero.secondaryCtaPath}
              onChange={(event) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, secondaryCtaPath: event.target.value },
                })
              }
            />
          </label>
        </div>

        <div className="repeatable-list">
          {content.heroImages.map((image, index) => (
            <div key={`${image}_${index}`} className="repeatable-item">
              <div className="section-head">
                <div>
                  <span className="section-label">Hero Slide {index + 1}</span>
                </div>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() =>
                    setContent({
                      ...content,
                      heroImages: content.heroImages.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <label className="field">
                <span>Image URL</span>
                <input
                  className="input"
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
              </label>
              <div className="card-surface hero-preview">
                <div
                  className="media-thumb"
                  style={
                    image
                      ? { width: "100%", height: "100%", backgroundImage: `url(${image})` }
                      : { width: "100%", height: "100%" }
                  }
                >
                  {!image ? <span className="media-fallback">Preview</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              setContent({
                ...content,
                heroImages: [...content.heroImages, ""],
              })
            }
          >
            Add Hero Image
          </button>
        </div>
      </Card>

      <Card title="Feature Cards" description="Repeatable feature blocks shown below the hero.">
        <div className="repeatable-list">
          {content.features.map((feature, index) => (
            <div key={`${feature.title}_${index}`} className="repeatable-item">
              <div className="section-head">
                <span className="section-label">Feature {index + 1}</span>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() =>
                    setContent({
                      ...content,
                      features: content.features.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                >
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Icon</span>
                  <input
                    className="input"
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
                </label>
                <label className="field">
                  <span>Title</span>
                  <input
                    className="input"
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
                </label>
                <label className="field field--full">
                  <span>Description</span>
                  <textarea
                    className="textarea"
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
                </label>
                <label className="field">
                  <span>Link path</span>
                  <input
                    className="input"
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
                </label>
                <label className="field">
                  <span>Link text</span>
                  <input
                    className="input"
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
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button button--ghost"
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
        >
          Add Feature Card
        </button>
      </Card>

      <div className="section-grid">
        <Card title="Why Buy" description="Repeatable trust points shown on the homepage.">
          <div className="repeatable-list">
            {content.whyBuy.map((item, index) => (
              <div key={`${item.title}_${index}`} className="repeatable-item">
                <div className="section-head">
                  <span className="section-label">Why Buy {index + 1}</span>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() =>
                      setContent({
                        ...content,
                        whyBuy: content.whyBuy.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Icon</span>
                    <input
                      className="input"
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
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      className="input"
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
                  </label>
                  <label className="field field--full">
                    <span>Description</span>
                    <textarea
                      className="textarea"
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
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
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
          >
            Add Why Buy Item
          </button>
        </Card>

        <Card title="CTA Section" description="Closing call-to-action section at the end of the page.">
          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input
                className="input"
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
            </label>
            <label className="field">
              <span>Button text</span>
              <input
                className="input"
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
            </label>
            <label className="field field--full">
              <span>Description</span>
              <textarea
                className="textarea"
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
            </label>
            <label className="field">
              <span>Button path</span>
              <input
                className="input"
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
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}
