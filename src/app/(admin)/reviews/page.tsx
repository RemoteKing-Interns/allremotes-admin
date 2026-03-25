"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  PageTransition,
  Toggle,
  inputClassName,
  textareaClassName,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { deleteReview, getReviews, saveReviews } from "@/lib/admin/api";
import { createClientId } from "@/lib/admin/utils";
import type { Review } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextReviews = await getReviews();
        if (!active) {
          return;
        }

        setReviews(nextReviews);
        setSelectedId((current) => current ?? nextReviews[0]?.id ?? null);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load reviews.",
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

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? null,
    [reviews, selectedId],
  );

  const pendingDeleteReview = useMemo(
    () => reviews.find((review) => review.id === pendingDeleteId) ?? null,
    [pendingDeleteId, reviews],
  );

  function patchReview(reviewId: string, patch: Partial<Review>) {
    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId ? { ...review, ...patch } : review,
      ),
    );
  }

  function addReview() {
    const nextReview: Review = {
      id: createClientId("draft_review"),
      rating: 5,
      text: "",
      author: "",
      verified: true,
      date: new Date().toISOString().slice(0, 10),
    };

    setReviews((current) => [nextReview, ...current]);
    setSelectedId(nextReview.id);
    setNotice({
      tone: "info",
      text: "New review added locally. Save to push the reviews list.",
    });
  }

  async function onSave() {
    setSaving(true);
    setNotice(null);

    try {
      await saveReviews(reviews);
      setNotice({
        tone: "success",
        text: "Reviews saved successfully.",
      });
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save reviews.",
      });
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(reviewId: string) {
    setPendingDeleteId(reviewId);
  }

  async function onDeleteConfirmed() {
    if (!pendingDeleteId) {
      return;
    }

    const review = reviews.find((entry) => entry.id === pendingDeleteId);
    if (!review) {
      setPendingDeleteId(null);
      return;
    }

    if (review.id.startsWith("draft_review")) {
      const nextReviews = reviews.filter((entry) => entry.id !== review.id);
      setReviews(nextReviews);
      setSelectedId((current) =>
        current === review.id ? nextReviews[0]?.id ?? null : current,
      );
      setPendingDeleteId(null);
      return;
    }

    setDeletingId(review.id);
    setNotice(null);

    try {
      await deleteReview(review.id);
      const nextReviews = reviews.filter((entry) => entry.id !== review.id);
      setReviews(nextReviews);
      setSelectedId((current) =>
        current === review.id ? nextReviews[0]?.id ?? null : current,
      );
      setNotice({
        tone: "success",
        text: "Review deleted successfully.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not delete review.",
      });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Loading reviews…" />;
  }

  return (
    <PageTransition>
      <PageHeader
        title="Reviews"
        description="Curate rating, text, author, verified status, and date for storefront reviews."
        actions={
          <>
            <Button type="button" variant="secondary" size="lg" onClick={addReview}>
              <Plus className="h-4 w-4" />
              Add Review
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void onSave()}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Reviews"}
            </Button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card
          title="Review Moderation"
          description="Approve/reject review visibility and open a card to edit full details."
          actions={
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        >
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews found"
              description="Use Add Review to create the first review."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    review.id === selectedId
                      ? "border-neutral-400 bg-neutral-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(review.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-neutral-900">
                          {review.author || "Unnamed author"}
                        </p>
                        <p className="text-xs text-neutral-500">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${review.id}-${index}`}
                            className={`h-4 w-4 ${
                              index < Number(review.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">{review.text || "No review text"}</p>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => patchReview(review.id, { verified: true })}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => patchReview(review.id, { verified: false })}
                    >
                      <XCircle className="h-4 w-4 text-rose-600" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={() => requestDelete(review.id)}
                      disabled={deletingId === review.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === review.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card title="Edit Review" description="Update review content before saving.">
          {selectedReview ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Rating">
                <input
                  className={inputClassName}
                  type="number"
                  min="1"
                  max="5"
                  value={selectedReview.rating}
                  onChange={(event) =>
                    patchReview(selectedReview.id, {
                      rating: Number(event.target.value || 5),
                    })
                  }
                />
              </Field>
              <Field label="Author">
                <input
                  className={inputClassName}
                  value={selectedReview.author}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { author: event.target.value })
                  }
                />
              </Field>
              <Field label="Date">
                <input
                  className={inputClassName}
                  type="date"
                  value={selectedReview.date}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { date: event.target.value })
                  }
                />
              </Field>
              <Field label="Verified">
                <Toggle
                  checked={selectedReview.verified}
                  onChange={(checked) =>
                    patchReview(selectedReview.id, { verified: checked })
                  }
                  label="Verified"
                />
              </Field>
              <Field label="Text" full>
                <textarea
                  className={textareaClassName}
                  value={selectedReview.text}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { text: event.target.value })
                  }
                />
              </Field>
            </div>
          ) : (
            <EmptyState
              title="Select a review"
              description="Choose a review card to edit it here."
            />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteReview)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
        title="Delete review"
        description={
          pendingDeleteReview
            ? `Delete review by ${pendingDeleteReview.author || "this author"}?`
            : "Delete this review?"
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          void onDeleteConfirmed();
        }}
      />
    </PageTransition>
  );
}
