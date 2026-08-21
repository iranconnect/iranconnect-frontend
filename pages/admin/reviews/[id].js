import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import apiClient from "../../../utils/apiClient";
import AdminLayout from "../../../components/admin/AdminLayout";

const STATUS_META = {
  pending: {
    label: "Pending",
    icon: "◷",
  },
  approved: {
    label: "Approved",
    icon: "✓",
  },
  rejected: {
    label: "Rejected",
    icon: "✕",
  },
  hidden: {
    label: "Hidden",
    icon: "◉",
  },
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatBoolean(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function formatActionType(value) {
  if (!value) return "Event";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatReason(value) {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function statusBadgeClass(status) {
  switch (status) {
    case "approved":
      return "border-green-500/40 bg-green-500/10";
    case "rejected":
      return "border-red-500/40 bg-red-500/10";
    case "hidden":
      return "border-amber-500/40 bg-amber-500/10";
    default:
      return "border-blue-500/40 bg-blue-500/10";
  }
}

function DetailField({
  label,
  children,
  mono = false,
}) {
  return (
    <div>
      <div className="admin-muted text-xs mb-1">
        {label}
      </div>

      <div
        className={`text-sm break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {children ?? "—"}
      </div>
    </div>
  );
}

export default function AdminReviewDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [notFound, setNotFound] =
    useState(false);

  const review = data?.review || null;
  const business = data?.business || null;
  const reviewer = data?.reviewer || null;
  const moderator = data?.moderator || null;
  const history = Array.isArray(data?.history)
    ? data.history
    : [];

  const reviewId = useMemo(() => {
    const raw = String(id || "").trim();

    if (!/^[1-9]\d*$/.test(raw)) {
      return null;
    }

    const parsed = Number(raw);

    return Number.isSafeInteger(parsed)
      ? parsed
      : null;
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!reviewId) {
      setLoading(false);
      setError("Invalid review ID.");
      setNotFound(false);
      return;
    }

    let mounted = true;

    async function loadReview() {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const res = await apiClient.get(
          `/admin/reviews/${reviewId}`
        );

        if (!mounted) return;

        setData(res.data);
      } catch (err) {
        if (!mounted) return;

        const status =
          err.response?.status;

        if (status === 403) {
          router.replace("/403");
          return;
        }

        if (status === 404) {
          setNotFound(true);
          setData(null);
          return;
        }

        setError(
          err.response?.data?.error ||
            "Unable to load review details."
        );
        setData(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      mounted = false;
    };
  }, [
    router.isReady,
    router,
    reviewId,
  ]);

  const statusMeta =
    STATUS_META[review?.status] ||
    {
      label:
        review?.status || "Unknown",
      icon: "•",
    };

  return (
    <AdminLayout>
      <main className="admin-container">
        <div className="mb-5">
          <button
            type="button"
            className="
              admin-btn
              admin-btn-secondary
              mb-4
            "
            onClick={() =>
              router.push("/admin/reviews")
            }
          >
            ← Back to Review Moderation
          </button>

          <h2 className="admin-title">
            Review Details
            {review?.id
              ? ` #${review.id}`
              : ""}
          </h2>

          <p className="admin-hint mt-2">
            Inspect the review, reviewer,
            business context, moderation
            metadata, and immutable history.
          </p>
        </div>

        {loading ? (
          <section className="admin-section">
            <p className="admin-muted">
              Loading review details...
            </p>
          </section>
        ) : notFound ? (
          <section className="admin-section">
            <p
              className="
                text-red-600
                border
                border-red-500/30
                bg-red-500/10
                rounded-lg
                p-3
                text-sm
              "
            >
              Review not found.
            </p>
          </section>
        ) : error ? (
          <section className="admin-section">
            <p
              className="
                text-red-600
                border
                border-red-500/30
                bg-red-500/10
                rounded-lg
                p-3
                text-sm
              "
            >
              {error}
            </p>
          </section>
        ) : !review ? (
          <section className="admin-section">
            <p className="admin-muted">
              No review details were returned.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <section
              className="
                admin-card
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-4
              "
            >
              <DetailField label="Current Status">
                <span
                  className={`
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    px-3
                    py-1
                    ${statusBadgeClass(
                      review.status
                    )}
                  `}
                >
                  <span>
                    {statusMeta.icon}
                  </span>
                  <span>
                    {statusMeta.label}
                  </span>
                </span>
              </DetailField>

              <DetailField label="Rating">
                ★ {review.rating}/5
              </DetailField>

              <DetailField label="Submitted">
                {formatDate(
                  review.created_at
                )}
              </DetailField>

              <DetailField label="Last Updated">
                {formatDate(
                  review.updated_at
                )}
              </DetailField>
            </section>

            <section className="admin-section">
              <h3 className="font-semibold mb-4">
                Review
              </h3>

              <div
                className="
                  admin-card
                  whitespace-pre-wrap
                  break-words
                  leading-7
                "
              >
                {review.comment ||
                  "No written comment was submitted."}
              </div>
            </section>

            <section
              className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-6
              "
            >
              <div className="admin-section">
                <h3 className="font-semibold mb-4">
                  Business
                </h3>

                <div
                  className="
                    admin-card
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-4
                  "
                >
                  <DetailField label="Name">
                    {business?.name || "—"}
                  </DetailField>

                  <DetailField label="Business ID">
                    {business?.id ?? "—"}
                  </DetailField>

                  <DetailField label="Category">
                    {business?.category || "—"}
                  </DetailField>

                  <DetailField label="Location">
                    {[
                      business?.city,
                      business?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </DetailField>

                  <DetailField label="Public">
                    {formatBoolean(
                      business?.is_public
                    )}
                  </DetailField>

                  <DetailField label="Deleted">
                    {business?.is_deleted
                      ? "⚠ Yes"
                      : "No"}
                  </DetailField>

                  <DetailField label="Slug">
                    {business?.slug || "—"}
                  </DetailField>
                </div>
              </div>

              <div className="admin-section">
                <h3 className="font-semibold mb-4">
                  Reviewer
                </h3>

                <div
                  className="
                    admin-card
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-4
                  "
                >
                  <DetailField label="Display Name">
                    {review.reviewer_display_name ||
                      "—"}
                  </DetailField>

                  <DetailField label="User ID">
                    {reviewer?.id ??
                      review.user_id ??
                      "—"}
                  </DetailField>

                  <DetailField label="Email">
                    {reviewer?.email || "—"}
                  </DetailField>

                  <DetailField label="Role">
                    {reviewer?.role || "—"}
                  </DetailField>
                </div>
              </div>
            </section>

            <section className="admin-section">
              <h3 className="font-semibold mb-4">
                Moderation
              </h3>

              <div
                className="
                  admin-card
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-4
                "
              >
                <DetailField label="Moderated At">
                  {formatDate(
                    review.moderated_at
                  )}
                </DetailField>

                <DetailField label="Moderated By">
                  {moderator?.email ||
                    (review.moderated_by
                      ? `User #${review.moderated_by}`
                      : "—")}
                </DetailField>

                <DetailField label="Moderator Role">
                  {moderator?.role || "—"}
                </DetailField>

                <DetailField label="Moderator User ID">
                  {moderator?.id ??
                    review.moderated_by ??
                    "—"}
                </DetailField>

                <div className="md:col-span-2">
                  <DetailField label="Message shown to reviewer">
                    <div
                      className="
                        whitespace-pre-wrap
                        break-words
                      "
                    >
                      {review.moderation_note ||
                        "—"}
                    </div>
                  </DetailField>
                </div>
              </div>
            </section>

            <section className="admin-section">
              <div
                className="
                  flex
                  flex-col
                  gap-1
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  mb-4
                "
              >
                <h3 className="font-semibold">
                  Moderation History
                </h3>

                <span className="admin-muted text-sm">
                  {history.length} event
                  {history.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="admin-card">
                  <p className="admin-muted">
                    No moderation history
                    was found.
                  </p>
                </div>
              ) : (
                <ol className="space-y-4">
                  {history.map(
                    (event, index) => (
                      <li
                        key={event.id}
                        className="
                          admin-card
                          relative
                        "
                      >
                        <div
                          className="
                            flex
                            flex-col
                            gap-2
                            sm:flex-row
                            sm:items-start
                            sm:justify-between
                            mb-4
                          "
                        >
                          <div>
                            <div className="font-semibold">
                              {index + 1}.{" "}
                              {formatActionType(
                                event.action_type
                              )}
                            </div>

                            <div className="admin-muted text-xs mt-1">
                              Event #{event.id}
                            </div>
                          </div>

                          <div className="admin-muted text-xs">
                            {formatDate(
                              event.created_at
                            )}
                          </div>
                        </div>

                        <div
                          className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                          "
                        >
                          <DetailField label="Performed By">
                            {event.actor?.review_display_name ||
                              event.actor?.email ||
                              (event.performed_by
                                ? `User #${event.performed_by}`
                                : "System")}
                          </DetailField>

                          <DetailField label="Actor Role">
                            {event.actor?.role ||
                              "—"}
                          </DetailField>

                          <DetailField label="Reason">
                            {formatReason(
                              event.reason
                            )}
                          </DetailField>

                          <DetailField label="Actor User ID">
                            {event.actor?.id ??
                              event.performed_by ??
                              "—"}
                          </DetailField>

                          <div>
                            <div className="admin-muted text-xs mb-1">
                              Previous Value
                            </div>

                            <pre
                              className="
                                text-xs
                                whitespace-pre-wrap
                                break-words
                                overflow-x-auto
                                rounded-lg
                                border
                                border-[var(--border)]
                                p-3
                              "
                            >
                              {renderValue(
                                event.old_value
                              )}
                            </pre>
                          </div>

                          <div>
                            <div className="admin-muted text-xs mb-1">
                              New Value
                            </div>

                            <pre
                              className="
                                text-xs
                                whitespace-pre-wrap
                                break-words
                                overflow-x-auto
                                rounded-lg
                                border
                                border-[var(--border)]
                                p-3
                              "
                            >
                              {renderValue(
                                event.new_value
                              )}
                            </pre>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ol>
              )}
            </section>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
