//frontend/components/business/BusinessReviews.jsx
import { useCallback, useEffect, useState } from "react";
import RatingStars from "../RatingStars";
import apiClient from "../../utils/apiClient";

const REVIEW_PAGE_SIZE = 5;

const EMPTY_SUMMARY = {
  average_rating: 0,
  approved_review_count: 0,
  rating_breakdown: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

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
      message:
        "Your review is currently visible on this business profile.",
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

  const [summary, setSummary] = useState(
    EMPTY_SUMMARY
  );

  const [selectedRatingFilter, setSelectedRatingFilter] =
    useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [needsDisplayName, setNeedsDisplayName] =
    useState(false);

  const [reviewDisplayName, setReviewDisplayName] =
    useState("");

  const [savingDisplayName, setSavingDisplayName] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchReviewPage = useCallback(
    async ({
      append = false,
      requestedPage = 1,
      ratingFilter = null,
    } = {}) => {
      if (!businessId) {
        setLoading(false);
        return null;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = {
          page: requestedPage,
          limit: REVIEW_PAGE_SIZE,
        };

        if (ratingFilter) {
          params.rating = ratingFilter;
        }

        const response = await apiClient.get(
          `/businesses/${businessId}/reviews`,
          {
            params,
          }
        );

        const publicReviews = Array.isArray(
          response.data?.data
        )
          ? response.data.data
          : [];

        const nextPagination =
          response.data?.pagination || {};

        const nextSummary =
          response.data?.summary || EMPTY_SUMMARY;

        const ownReview =
          response.data?.user_review || null;

        setReviews((currentReviews) => {
          if (!append) {
            return publicReviews;
          }

          const mergedReviews = [
            ...currentReviews,
            ...publicReviews,
          ];

          return Array.from(
            new Map(
              mergedReviews.map((review) => [
                review.id,
                review,
              ])
            ).values()
          );
        });

        setSummary({
          average_rating: Number(
            nextSummary.average_rating || 0
          ),
          approved_review_count: Number(
            nextSummary.approved_review_count || 0
          ),
          rating_breakdown: {
            5: Number(
              nextSummary.rating_breakdown?.[5] || 0
            ),
            4: Number(
              nextSummary.rating_breakdown?.[4] || 0
            ),
            3: Number(
              nextSummary.rating_breakdown?.[3] || 0
            ),
            2: Number(
              nextSummary.rating_breakdown?.[2] || 0
            ),
            1: Number(
              nextSummary.rating_breakdown?.[1] || 0
            ),
          },
        });

        setUserReview(ownReview);

        setRating(Number(ownReview?.rating) || 0);
        setComment(ownReview?.comment || "");

        const receivedPage =
          Number(nextPagination.page) ||
          requestedPage;

        setCurrentPage(receivedPage);

        setHasMore(
          Boolean(nextPagination.hasNextPage)
        );

        return {
          page: receivedPage,
          hasMore: Boolean(
            nextPagination.hasNextPage
          ),
        };
      } catch {
        if (!append) {
          setReviews([]);
          setUserReview(null);
          setSummary(EMPTY_SUMMARY);
          setCurrentPage(1);
          setHasMore(false);
        }

        return null;
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [businessId]
  );

  useEffect(() => {
    setSelectedRatingFilter(null);
    setReviews([]);
    setSummary(EMPTY_SUMMARY);
    setCurrentPage(1);
    setHasMore(false);

    fetchReviewPage({
      append: false,
      requestedPage: 1,
      ratingFilter: null,
    });
  }, [businessId, fetchReviewPage]);

  async function handleRatingFilterChange(nextRating) {
    if (loading || loadingMore) {
      return;
    }

    setSelectedRatingFilter(nextRating);

    await fetchReviewPage({
      append: false,
      requestedPage: 1,
      ratingFilter: nextRating,
    });
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    await fetchReviewPage({
      append: true,
      requestedPage: currentPage + 1,
      ratingFilter: selectedRatingFilter,
    });
  }

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

      const submittedReview =
        response.data?.review || null;

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

      await fetchReviewPage({
        append: false,
        requestedPage: 1,
        ratingFilter: selectedRatingFilter,
      });
    } catch (error) {
      const errorCode =
        error.response?.data?.code;

      if (
        errorCode === "REVIEW_DISPLAY_NAME_REQUIRED"
      ) {
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

  const statusMeta = getReviewStatusMeta(
    userReview?.status
  );

  const hasApprovedReviews =
    summary.approved_review_count > 0;

  const ratingFilterOptions = [
    {
      value: null,
      label: "All",
      count: summary.approved_review_count,
    },
    {
      value: 5,
      label: "5★",
      count: summary.rating_breakdown[5],
    },
    {
      value: 4,
      label: "4★",
      count: summary.rating_breakdown[4],
    },
    {
      value: 3,
      label: "3★",
      count: summary.rating_breakdown[3],
    },
    {
      value: 2,
      label: "2★",
      count: summary.rating_breakdown[2],
    },
    {
      value: 1,
      label: "1★",
      count: summary.rating_breakdown[1],
    },
  ];

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

      {hasApprovedReviews && (
        <div className="mb-7 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-6">
          <div className="text-3xl font-bold">
            {summary.average_rating.toFixed(1)}
          </div>

          <ReviewStars
            rating={Math.round(
              summary.average_rating
            )}
          />

          <div className="text-sm text-justify-pro">
            {summary.approved_review_count === 1
              ? "(1 approved review)"
              : `(${summary.approved_review_count} approved reviews)`}
          </div>
        </div>
      )}

      {allowReviews && isLoggedIn && (
        <div className="mb-8 rounded-xl border border-[var(--border)] p-4">
          <h3 className="mb-3 font-semibold">
            {userReview
              ? "Update your review"
              : "Share your experience"}
          </h3>

          {statusMeta && (
            <div className="mb-4 text-sm">
              <p
                className={`font-medium ${statusMeta.className}`}
              >
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
                setComment(
                  event.target.value.slice(0, 3000)
                )
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
                This name will be shown publicly next to your
                review. You can use a shortened name such as
                “Sara M.”
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

      <div className="rounded-xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">
              Customer reviews
            </h3>

            <span className="text-xs opacity-65">
              {selectedRatingFilter
                ? `${selectedRatingFilter}-star reviews`
                : "All approved reviews"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ratingFilterOptions.map((filterOption) => {
              const isActive =
                selectedRatingFilter ===
                filterOption.value;

              return (
                <button
                  key={
                    filterOption.value === null
                      ? "all"
                      : filterOption.value
                  }
                  type="button"
                  disabled={loading || loadingMore}
                  onClick={() =>
                    handleRatingFilterChange(
                      filterOption.value
                    )
                  }
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? "rounded-full border border-turquoise bg-turquoise px-3 py-1.5 text-xs font-semibold text-navy transition disabled:cursor-not-allowed disabled:opacity-50"
                      : "rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold transition hover:border-turquoise disabled:cursor-not-allowed disabled:opacity-50"
                  }
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[560px] overflow-y-auto p-4 pr-2">
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-justify-pro opacity-70">
                {selectedRatingFilter
                  ? `No ${selectedRatingFilter}-star reviews have been published yet.`
                  : "No approved reviews have been published yet."}
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
                      <ReviewStars
                        rating={review.rating}
                      />

                      <span className="text-sm font-medium">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  <time className="text-xs opacity-60">
                    {formatReviewDate(
                      review.created_at
                    )}
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

            {hasMore && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className="btn-primary min-w-[160px] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore
                    ? "Loading..."
                    : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
