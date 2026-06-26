//frontend/components/business/BusinessReviews.jsx
import { useCallback, useEffect, useState } from "react";
import RatingStars from "../RatingStars";
import apiClient from "../../utils/apiClient";

function formatReviewDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getReviewStatusMeta(status) {
  const labels = {
    pending: {
      label: "Pending approval",
      className: "text-amber-600",
      message:
        "Your review has been submitted and is waiting for admin approval.",
    },
    approved: {
      label: "Published",
      className: "text-emerald-600",
      message: "Your review is currently visible on this business profile.",
    },
    rejected: {
      label: "Needs revision",
      className: "text-red-600",
      message:
        "Your review was not approved. You can update it and submit it again.",
    },
    hidden: {
      label: "Hidden",
      className: "text-gray-500",
      message:
        "Your review is currently hidden from the public profile.",
    },
  };

  return labels[status] || null;
}

function ReviewStars({ rating }) {
  const safeRating = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );

  return (
    <span
      className="tracking-wide text-[var(--turquoise)]"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {"★".repeat(safeRating)}
      <span className="text-muted">
        {"★".repeat(5 - safeRating)}
      </span>
    </span>
  );
}

export default function BusinessReviews({
  businessId,
  isLoggedIn = false,
  allowReviews = true,
}) {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [needsDisplayName, setNeedsDisplayName] = useState(false);
  const [reviewDisplayName, setReviewDisplayName] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.get(
        `/businesses/${businessId}/reviews`
      );

      const publicReviews = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const ownReview = response.data?.user_review || null;

      setReviews(publicReviews);
      setUserReview(ownReview);

      setRating(Number(ownReview?.rating) || 0);
      setComment(ownReview?.comment || "");
    } catch {
      setReviews([]);
      setUserReview(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function submitReview() {
    if (!isLoggedIn || !allowReviews || !rating || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await apiClient.post(
        `/businesses/${businessId}/reviews`,
        {
          rating,
          comment: comment.trim() || null,
        }
      );

      const submittedReview = response.data?.review || null;

      if (submittedReview) {
        setUserReview((current) => ({
          ...current,
          ...submittedReview,
        }));
      }

      setNeedsDisplayName(false);

      setMessage(
        response.data?.message ||
          "Your review has been submitted and is pending approval."
      );

      await loadReviews();
    } catch (error) {
      const errorCode = error.response?.data?.code;

      if (errorCode === "REVIEW_DISPLAY_NAME_REQUIRED") {
        setNeedsDisplayName(true);
        setMessage("");
        return;
      }

      setMessage(
        error.response?.data?.error ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function saveReviewDisplayName() {
    const normalizedName = reviewDisplayName
      .replace(/\s+/g, " ")
      .trim();

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 80
    ) {
      setMessage(
        "Your review display name must be between 2 and 80 characters."
      );
      return;
    }

    try {
      setSavingDisplayName(true);
      setMessage("");

      await apiClient.put(
        "/auth/review-display-name",
        {
          review_display_name: normalizedName,
        }
      );

      setReviewDisplayName(normalizedName);
      setNeedsDisplayName(false);

      await submitReview();
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Unable to save your review display name. Please try again."
      );
    } finally {
      setSavingDisplayName(false);
    }
  }

  const averageRating = reviews.length
    ? reviews.reduce(
        (total, review) => total + Number(review.rating || 0),
        0
      ) / reviews.length
    : 0;

  const statusMeta = getReviewStatusMeta(
    userReview?.status
  );

  if (loading) {
    return (
      <section className="card mt-6">
        <h2 className="mb-4 text-xl font-semibold">
          Reviews
        </h2>

        <p className="text-sm text-justify-pro">
          Loading reviews...
        </p>
      </section>
    );
  }

  return (
    <section className="card mt-6">
      <h2 className="mb-5 text-xl font-semibold">
        Reviews
      </h2>

      <div className="mb-7 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-6">
        <div className="text-3xl font-bold">
          {averageRating.toFixed(1)}
        </div>

        <ReviewStars rating={Math.round(averageRating)} />

        <div className="text-sm text-justify-pro">
          {reviews.length === 1
            ? "(1 approved review)"
            : `(${reviews.length} approved reviews)`}
        </div>
      </div>

      {allowReviews && isLoggedIn && (
        <div className="mb-8 rounded-xl border border-[var(--border)] p-4">
          <h3 className="mb-3 font-semibold">
            {userReview
              ? "Update your review"
              : "Share your experience"}
          </h3>

          {statusMeta && (
            <div className="mb-4 text-sm">
              <p className={`font-medium ${statusMeta.className}`}>
                {statusMeta.label}
              </p>

              <p className="mt-1 text-justify-pro opacity-75">
                {statusMeta.message}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">
              Your rating
            </p>

            <RatingStars
              value={rating}
              onChange={setRating}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor={`review-comment-${businessId}`}
              className="mb-2 block text-sm font-medium"
            >
              Your review{" "}
              <span className="font-normal opacity-60">
                (optional)
              </span>
            </label>

            <textarea
              id={`review-comment-${businessId}`}
              value={comment}
              onChange={(event) =>
                setComment(event.target.value.slice(0, 3000))
              }
              maxLength={3000}
              rows={5}
              placeholder="Tell others about your experience with this business."
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-3 text-sm outline-none transition focus:border-turquoise"
            />

            <p className="mt-1 text-right text-xs opacity-60">
              {comment.length}/3000
            </p>
          </div>

          {needsDisplayName ? (
            <div className="mb-4 rounded-xl border border-turquoise/40 bg-[var(--surface)] p-4">
              <h4 className="mb-2 text-sm font-semibold">
                Choose your public review name
              </h4>

              <p className="mb-3 text-sm text-justify-pro opacity-75">
                This name will be shown publicly next to your review.
                You can use a shortened name such as “Sara M.”
              </p>

              <label
                htmlFor={`review-display-name-${businessId}`}
                className="mb-2 block text-sm font-medium"
              >
                Review display name
              </label>

              <input
                id={`review-display-name-${businessId}`}
                type="text"
                value={reviewDisplayName}
                onChange={(event) =>
                  setReviewDisplayName(
                    event.target.value.slice(0, 80)
                  )
                }
                maxLength={80}
                placeholder="Example: Sara M."
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-3 text-sm outline-none transition focus:border-turquoise"
              />

              <p className="mt-1 text-right text-xs opacity-60">
                {reviewDisplayName.length}/80
              </p>

              <button
                type="button"
                disabled={savingDisplayName}
                onClick={saveReviewDisplayName}
                className="btn-primary mt-3 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingDisplayName
                  ? "Saving..."
                  : "Save name and submit review"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!rating || submitting}
              onClick={submitReview}
              className="btn-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : userReview
                  ? "Update review"
                  : "Submit review"}
            </button>
          )}

          {message && (
            <p className="mt-3 text-sm text-justify-pro">
              {message}
            </p>
          )}
        </div>
      )}

      {!allowReviews && (
        <p className="mb-8 text-sm text-justify-pro opacity-70">
          Reviews are currently unavailable for this business.
        </p>
      )}

      {allowReviews && !isLoggedIn && (
        <p className="mb-8 text-sm text-justify-pro opacity-70">
          Sign in to leave a rating and review.
        </p>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-justify-pro opacity-70">
            No approved reviews have been published yet.
          </p>
        )}

        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-xl border border-[var(--border)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="mb-1 text-sm font-semibold">
                  {review.reviewer_display_name ||
                    "IranConnect member"}
                </p>

                <div className="flex items-center gap-3">
                  <ReviewStars rating={review.rating} />

                  <span className="text-sm font-medium">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              <time className="text-xs opacity-60">
                {formatReviewDate(review.created_at)}
              </time>
            </div>

            {review.comment && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-justify-pro">
                {review.comment}
              </p>
            )}

            {review.reply?.reply_text && (
              <div className="mt-4 rounded-xl border-l-4 border-turquoise bg-[var(--surface)] px-4 py-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Response from the business
                  </p>

                  <time className="text-xs opacity-60">
                    {formatReviewDate(
                      review.reply.updated_at ||
                        review.reply.created_at
                    )}
                  </time>
                </div>

                <p className="whitespace-pre-line text-sm leading-6 text-justify-pro">
                  {review.reply.reply_text}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
