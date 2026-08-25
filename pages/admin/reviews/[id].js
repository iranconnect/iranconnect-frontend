import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import apiClient from "../../../utils/apiClient";
import AdminLayout from "../../../components/admin/AdminLayout";
import ReviewModerationDialog from "../../../components/admin/ReviewModerationDialog";
import { useAuthSession } from "../../../hooks/useAuthSession";

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

  const [
    moderationHistoryOpen,
    setModerationHistoryOpen,
  ] = useState(false);

  const [
    moderationHistory,
    setModerationHistory,
  ] = useState([]);

  const [
    moderationHistoryLoading,
    setModerationHistoryLoading,
  ] = useState(false);

  const [
    moderationHistoryError,
    setModerationHistoryError,
  ] = useState("");

  const [
    moderationHistoryPagination,
    setModerationHistoryPagination,
  ] = useState({
    has_more: false,
    next_cursor: null,
  });

  const [
    administrativeHistoryOpen,
    setAdministrativeHistoryOpen,
  ] = useState(false);

  const [
    administrativeHistory,
    setAdministrativeHistory,
  ] = useState([]);

  const [
    administrativeHistoryLoading,
    setAdministrativeHistoryLoading,
  ] = useState(false);

  const [
    administrativeHistoryError,
    setAdministrativeHistoryError,
  ] = useState("");

  const [
    administrativeHistoryPagination,
    setAdministrativeHistoryPagination,
  ] = useState({
    has_more: false,
    next_cursor: null,
  });

  const [moderationAction, setModerationAction] =
    useState(null);
  const [moderationLoading, setModerationLoading] =
    useState(false);
  const [moderationError, setModerationError] =
    useState("");
  const [moderationFeedback, setModerationFeedback] =
    useState("");
  const [refreshNonce, setRefreshNonce] =
    useState(0);

  const {
    status: authStatus,
    role,
  } = useAuthSession();

  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const isSuperAdmin =
    role === "superadmin";

  const review = data?.review || null;
  const business = data?.business || null;
  const reviewer = data?.reviewer || null;

  const moderator =
    data?.moderator || null;

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
    if (!router.isReady || !authChecked) {
      return;
    }

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
    authChecked,
    refreshNonce,
  ]);

  /*
   * History is deliberately lazy-loaded.
   *
   * Opening Review Detail must not trigger either history
   * endpoint. Each stream owns its own pagination lifecycle.
   */
  async function loadModerationHistory({
    reset = false,
  } = {}) {
    if (
      !isSuperAdmin ||
      !reviewId ||
      moderationHistoryLoading
    ) {
      return;
    }

    const cursor =
      reset
        ? null
        : moderationHistoryPagination
            .next_cursor;

    setModerationHistoryLoading(true);
    setModerationHistoryError("");

    try {
      const params = {
        limit: 20,
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const res = await apiClient.get(
        `/admin/reviews/${reviewId}/moderation-history`,
        {
          params,
        }
      );

      const rows =
        Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setModerationHistory(
        (current) =>
          reset
            ? rows
            : [...current, ...rows]
      );

      setModerationHistoryPagination({
        has_more:
          Boolean(
            res.data?.pagination?.has_more
          ),
        next_cursor:
          res.data?.pagination
            ?.next_cursor || null,
      });
    } catch (err) {
      const status =
        err.response?.status;

      if (status === 404) {
        setModerationHistoryError(
          "Review history was not found."
        );
      } else if (status === 403) {
        setModerationHistoryError(
          "SuperAdmin audit access was denied."
        );
      } else {
        setModerationHistoryError(
          err.response?.data?.error ||
            "Unable to load moderation history."
        );
      }
    } finally {
      setModerationHistoryLoading(false);
    }
  }

  async function loadAdministrativeHistory({
    reset = false,
  } = {}) {
    if (
      !isSuperAdmin ||
      !reviewId ||
      administrativeHistoryLoading
    ) {
      return;
    }

    const cursor =
      reset
        ? null
        : administrativeHistoryPagination
            .next_cursor;

    setAdministrativeHistoryLoading(true);
    setAdministrativeHistoryError("");

    try {
      const params = {
        limit: 20,
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const res = await apiClient.get(
        `/admin/reviews/${reviewId}/administrative-history`,
        {
          params,
        }
      );

      const rows =
        Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setAdministrativeHistory(
        (current) =>
          reset
            ? rows
            : [...current, ...rows]
      );

      setAdministrativeHistoryPagination({
        has_more:
          Boolean(
            res.data?.pagination?.has_more
          ),
        next_cursor:
          res.data?.pagination
            ?.next_cursor || null,
      });
    } catch (err) {
      const status =
        err.response?.status;

      if (status === 404) {
        setAdministrativeHistoryError(
          "Administrative history was not found."
        );
      } else if (status === 403) {
        setAdministrativeHistoryError(
          "SuperAdmin audit access was denied."
        );
      } else {
        setAdministrativeHistoryError(
          err.response?.data?.error ||
            "Unable to load administrative history."
        );
      }
    } finally {
      setAdministrativeHistoryLoading(false);
    }
  }

  async function toggleModerationHistory() {
    if (moderationHistoryOpen) {
      setModerationHistoryOpen(false);
      return;
    }

    setModerationHistoryOpen(true);

    if (
      moderationHistory.length === 0
    ) {
      await loadModerationHistory({
        reset: true,
      });
    }
  }

  async function toggleAdministrativeHistory() {
    if (administrativeHistoryOpen) {
      setAdministrativeHistoryOpen(false);
      return;
    }

    setAdministrativeHistoryOpen(true);

    if (
      administrativeHistory.length === 0
    ) {
      await loadAdministrativeHistory({
        reset: true,
      });
    }
  }

  /*
   * A different Review must never inherit cached history from
   * the previous Review.
   */
  useEffect(() => {
    setModerationHistoryOpen(false);
    setModerationHistory([]);
    setModerationHistoryError("");
    setModerationHistoryPagination({
      has_more: false,
      next_cursor: null,
    });

    setAdministrativeHistoryOpen(false);
    setAdministrativeHistory([]);
    setAdministrativeHistoryError("");
    setAdministrativeHistoryPagination({
      has_more: false,
      next_cursor: null,
    });
  }, [reviewId]);

  const statusMeta =
    STATUS_META[review?.status] ||
    {
      label:
        review?.status || "Unknown",
      icon: "•",
    };

  const availableActions = useMemo(() => {
    if (!review) {
      return [];
    }

    switch (review.status) {
      case "pending":
        return ["approve", "reject"];

      case "approved":
        return isSuperAdmin
          ? ["hide"]
          : [];

      case "hidden":
        return isSuperAdmin
          ? ["restore"]
          : [];

      default:
        return [];
    }
  }, [review, isSuperAdmin]);

  function openModerationDialog(action) {
    if (!availableActions.includes(action)) {
      return;
    }

    setModerationError("");
    setModerationFeedback("");
    setModerationAction(action);
  }

  function closeModerationDialog() {
    if (moderationLoading) {
      return;
    }

    setModerationAction(null);
    setModerationError("");
  }

  async function submitModeration({
    reasonCode,
    note,
    adminNote,
  }) {
    if (
      !review ||
      !reviewId ||
      !moderationAction
    ) {
      return;
    }

    setModerationLoading(true);
    setModerationError("");
    setModerationFeedback("");

    try {
      const response =
        await apiClient.patch(
          `/admin/reviews/${reviewId}/moderation`,
          {
            action: moderationAction,
            expected_status:
              review.status,
            reason_code:
              reasonCode,
            note,
            admin_note:
              adminNote,
          }
        );

      const nextStatus =
        response.data?.transition?.status ||
        response.data?.review?.status ||
        "";

      setModerationAction(null);

      setModerationFeedback(
        nextStatus
          ? `Review moderation succeeded. Current status: ${formatActionType(
              nextStatus
            )}.`
          : "Review moderation succeeded."
      );

      /*
       * Always refresh authoritative Review Detail.
       *
       * History streams remain lazy: refresh only the streams
       * the SuperAdmin is actively viewing.
       */
      setRefreshNonce(
        (value) => value + 1
      );

      if (moderationHistoryOpen) {
        void loadModerationHistory({
          reset: true,
        });
      }

      if (administrativeHistoryOpen) {
        void loadAdministrativeHistory({
          reset: true,
        });
      }

      /*
       * Sidebar owns the pending count and re-reads it
       * from the server when this event is emitted.
       */
      if (
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new Event(
            "iranconnect:review-moderation-changed"
          )
        );
      }
    } catch (err) {
      const status =
        err.response?.status;

      const code =
        err.response?.data?.code;

      const serverMessage =
        err.response?.data?.error;

      if (status === 403) {
        setModerationError(
          serverMessage ||
            "You do not have permission to perform this moderation action."
        );
        return;
      }

      if (status === 409) {
        setModerationAction(null);

        setModerationFeedback(
          "This review changed before your moderation action could be completed. The latest review state has been reloaded."
        );

        setRefreshNonce(
          (value) => value + 1
        );

        /*
         * A stale conflict means the authoritative review state
         * changed elsewhere. Pending queue count may therefore
         * have changed as well.
         */
        if (
          typeof window !== "undefined"
        ) {
          window.dispatchEvent(
            new Event(
              "iranconnect:review-moderation-changed"
            )
          );
        }

        return;
      }

      setModerationError(
        serverMessage ||
          (code
            ? `Moderation failed (${code}).`
            : "Unable to moderate this review.")
      );
    } finally {
      setModerationLoading(false);
    }
  }

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
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  mb-4
                "
              >
                <div>
                  <h3 className="font-semibold">
                    Moderation Actions
                  </h3>

                  <p className="admin-muted text-sm mt-1">
                    Available actions are determined by the current review status and your Admin role.
                  </p>
                </div>
              </div>

              {moderationFeedback && (
                <div
                  role="status"
                  className="
                    mb-4
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--card-bg)]
                    p-3
                    text-sm
                  "
                >
                  {moderationFeedback}
                </div>
              )}

              {availableActions.length === 0 ? (
                <div className="admin-card">
                  <p className="admin-muted text-sm">
                    No moderation actions are available for this review.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    admin-card
                    flex
                    flex-wrap
                    gap-3
                  "
                >
                  {availableActions.includes(
                    "approve"
                  ) && (
                    <button
                      type="button"
                      className="
                        admin-btn
                        admin-btn-primary
                        px-4
                        py-2
                        text-sm
                      "
                      disabled={moderationLoading}
                      onClick={() =>
                        openModerationDialog(
                          "approve"
                        )
                      }
                    >
                      Approve Review
                    </button>
                  )}

                  {availableActions.includes(
                    "reject"
                  ) && (
                    <button
                      type="button"
                      className="
                        admin-btn
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        px-4
                        py-2
                        text-sm
                      "
                      disabled={moderationLoading}
                      onClick={() =>
                        openModerationDialog(
                          "reject"
                        )
                      }
                    >
                      Reject Review
                    </button>
                  )}

                  {availableActions.includes(
                    "hide"
                  ) && (
                    <button
                      type="button"
                      className="
                        admin-btn
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        px-4
                        py-2
                        text-sm
                      "
                      disabled={moderationLoading}
                      onClick={() =>
                        openModerationDialog(
                          "hide"
                        )
                      }
                    >
                      Hide Review
                    </button>
                  )}

                  {availableActions.includes(
                    "restore"
                  ) && (
                    <button
                      type="button"
                      className="
                        admin-btn
                        admin-btn-primary
                        px-4
                        py-2
                        text-sm
                      "
                      disabled={moderationLoading}
                      onClick={() =>
                        openModerationDialog(
                          "restore"
                        )
                      }
                    >
                      Restore Review
                    </button>
                  )}
                </div>
              )}
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

                {isSuperAdmin && (
                  <>
                    <DetailField label="Moderated By">
                      {moderator?.email || "—"}
                    </DetailField>

                    <DetailField label="Moderator Role">
                      {moderator?.role || "—"}
                    </DetailField>

                    <DetailField label="Moderator User ID">
                      {moderator?.id ?? "—"}
                    </DetailField>
                  </>
                )}

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

            {isSuperAdmin && (
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
                  <div>
                    <h3 className="font-semibold">
                      Moderation History
                    </h3>

                    <p className="admin-muted text-sm mt-1">
                      Immutable review lifecycle events. Loaded only when requested.
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    {moderationHistoryOpen &&
                      !moderationHistoryLoading &&
                      !moderationHistoryError && (
                        <span className="admin-muted text-sm">
                          {moderationHistory.length} event
                          {moderationHistory.length === 1
                            ? ""
                            : "s"}
                        </span>
                      )}

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={toggleModerationHistory}
                      disabled={moderationHistoryLoading}
                    >
                      {moderationHistoryOpen
                        ? "Hide history"
                        : "Show history"}
                    </button>
                  </div>
                </div>

                {!moderationHistoryOpen ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      History is not loaded until you request it.
                    </p>
                  </div>
                ) : moderationHistoryLoading ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      Loading moderation history...
                    </p>
                  </div>
                ) : moderationHistoryError ? (
                  <div className="admin-card">
                    <p
                      className="
                        text-red-600
                        text-sm
                      "
                    >
                      {moderationHistoryError}
                    </p>
                  </div>
                ) : moderationHistory.length === 0 ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      No moderation history
                      was found.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {moderationHistory.map(
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

                {moderationHistoryOpen &&
                  !moderationHistoryLoading &&
                  !moderationHistoryError &&
                  moderationHistoryPagination.has_more && (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() =>
                          loadModerationHistory()
                        }
                      >
                        Load more
                      </button>
                    </div>
                  )}

              </section>
            )}

            {isSuperAdmin && (
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
                  <div>
                    <h3 className="font-semibold">
                      Administrative History
                    </h3>

                    <p className="admin-muted text-sm mt-1">
                      Private administrative audit trail. Loaded only when requested.
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    {administrativeHistoryOpen &&
                      !administrativeHistoryLoading &&
                      !administrativeHistoryError && (
                        <span className="admin-muted text-sm">
                          {administrativeHistory.length} event
                          {administrativeHistory.length === 1
                            ? ""
                            : "s"}
                        </span>
                      )}

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={toggleAdministrativeHistory}
                      disabled={administrativeHistoryLoading}
                    >
                      {administrativeHistoryOpen
                        ? "Hide history"
                        : "Show history"}
                    </button>
                  </div>
                </div>

                {!administrativeHistoryOpen ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      Administrative history is not loaded until you request it.
                    </p>
                  </div>
                ) : administrativeHistoryLoading ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      Loading administrative history...
                    </p>
                  </div>
                ) : administrativeHistoryError ? (
                  <div className="admin-card">
                    <p
                      className="
                        text-red-600
                        text-sm
                      "
                    >
                      {administrativeHistoryError}
                    </p>
                  </div>
                ) : administrativeHistory.length === 0 ? (
                  <div className="admin-card">
                    <p className="admin-muted">
                      No administrative history was found.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {administrativeHistory.map(
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
                                Audit #{event.id}
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
                            <DetailField label="Result">
                              {event.action_result || "—"}
                            </DetailField>

                            <DetailField label="Performed By">
                              {event.actor?.email ||
                                (event.admin_id
                                  ? `Admin #${event.admin_id}`
                                  : "—")}
                            </DetailField>

                            <DetailField label="Actor Role">
                              {event.actor?.role || "—"}
                            </DetailField>

                            <DetailField label="Actor User ID">
                              {event.actor?.id ??
                                event.admin_id ??
                                "—"}
                            </DetailField>

                            <div className="md:col-span-2">
                              <DetailField label="Administrative Note">
                                <div
                                  className="
                                    whitespace-pre-wrap
                                    break-words
                                  "
                                >
                                  {event.admin_note || "—"}
                                </div>
                              </DetailField>
                            </div>

                            <div className="md:col-span-2">
                              <DetailField label="Failure Reason">
                                <div
                                  className="
                                    whitespace-pre-wrap
                                    break-words
                                  "
                                >
                                  {event.failure_reason || "—"}
                                </div>
                              </DetailField>
                            </div>

                            <div className="md:col-span-2">
                              <DetailField label="Request ID">
                                <div
                                  className="
                                    font-mono
                                    text-xs
                                    break-all
                                  "
                                >
                                  {event.request_id || "—"}
                                </div>
                              </DetailField>
                            </div>
                          </div>
                        </li>
                      )
                    )}
                  </ol>
                )}

                {administrativeHistoryOpen &&
                  !administrativeHistoryLoading &&
                  !administrativeHistoryError &&
                  administrativeHistoryPagination.has_more && (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() =>
                          loadAdministrativeHistory()
                        }
                      >
                        Load more
                      </button>
                    </div>
                  )}

              </section>
            )}
          </div>
        )}
      </main>

      <ReviewModerationDialog
        open={Boolean(moderationAction)}
        action={moderationAction}
        loading={moderationLoading}
        error={moderationError}
        onClose={closeModerationDialog}
        onSubmit={submitModeration}
      />
    </AdminLayout>
  );
}
