"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, LoadingState, Notice, PageHeader, Toggle } from "@/components/admin/ui";
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
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save reviews.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(review: Review) {
    if (!window.confirm(`Delete review by ${review.author || "this author"}?`)) {
      return;
    }

    if (review.id.startsWith("draft_review")) {
      const nextReviews = reviews.filter((entry) => entry.id !== review.id);
      setReviews(nextReviews);
      setSelectedId((current) =>
        current === review.id ? nextReviews[0]?.id ?? null : current,
      );
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
    }
  }

  if (loading) {
    return <LoadingState label="Loading reviews…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Reviews"
        description="Curate rating, text, author, verified status, and date for storefront reviews."
        actions={
          <>
            <button type="button" className="button button--ghost" onClick={addReview}>
              Add Review
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Reviews"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card
          title="Review List"
          description="Select a review row to edit it in the side panel."
          actions={
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Refresh
            </button>
          }
        >
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews found"
              description="Use Add Review to create the first review."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rating</th>
                    <th>Text</th>
                    <th>Author</th>
                    <th>Verified</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className={review.id === selectedId ? "table-row--active" : ""}
                    >
                      <td onClick={() => setSelectedId(review.id)}>{review.rating}</td>
                      <td onClick={() => setSelectedId(review.id)}>{review.text}</td>
                      <td onClick={() => setSelectedId(review.id)}>{review.author}</td>
                      <td onClick={() => setSelectedId(review.id)}>
                        {review.verified ? "Yes" : "No"}
                      </td>
                      <td onClick={() => setSelectedId(review.id)}>{review.date}</td>
                      <td>
                        <button
                          type="button"
                          className="button button--danger"
                          onClick={() => void onDelete(review)}
                          disabled={deletingId === review.id}
                        >
                          {deletingId === review.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Edit Review" description="Update review content before saving.">
          {selectedReview ? (
            <div className="form-grid">
              <label className="field">
                <span>Rating</span>
                <input
                  className="input"
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
              </label>
              <label className="field">
                <span>Author</span>
                <input
                  className="input"
                  value={selectedReview.author}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { author: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Date</span>
                <input
                  className="input"
                  type="date"
                  value={selectedReview.date}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { date: event.target.value })
                  }
                />
              </label>
              <Toggle
                checked={selectedReview.verified}
                onChange={(checked) =>
                  patchReview(selectedReview.id, { verified: checked })
                }
                label="Verified"
              />
              <label className="field field--full">
                <span>Text</span>
                <textarea
                  className="textarea"
                  value={selectedReview.text}
                  onChange={(event) =>
                    patchReview(selectedReview.id, { text: event.target.value })
                  }
                />
              </label>
            </div>
          ) : (
            <EmptyState
              title="Select a review"
              description="Choose a review row to edit it here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
