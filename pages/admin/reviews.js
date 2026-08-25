// frontend/pages/admin/reviews.js

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";

import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const DEFAULT_COUNTS = {
  pending: 0,
  approved: 0,
  rejected: 0,
  hidden: 0,
};

const STATUS_TABS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "hidden",
    label: "Hidden",
  },
  {
    value: "all",
    label: "All",
  },
];

const VALID_STATUSES =
  new Set(
    STATUS_TABS.map(
      (item) => item.value
    )
  );

const VALID_SORTS =
  new Set([
    "newest",
    "oldest",
    "updated",
  ]);

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatQueueDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateQueueValue(
  value,
  maxLength = 20
) {
  const normalized =
    String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(
    0,
    Math.max(1, maxLength - 1)
  )}…`;
}

function getStatusClasses(status) {
  switch (status) {
    case "approved":
      return "border-green-500/30 bg-green-500/10";
    case "rejected":
      return "border-red-500/30 bg-red-500/10";
    case "hidden":
      return "border-amber-500/30 bg-amber-500/10";
    case "pending":
    default:
      return "border-blue-500/30 bg-blue-500/10";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "approved":
      return "✓ Approved";
    case "rejected":
      return "✕ Rejected";
    case "hidden":
      return "◉ Hidden";
    case "pending":
      return "◷ Pending";
    default:
      return status || "Unknown";
  }
}

export default function AdminReviewsPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState(
    DEFAULT_PAGINATION
  );

  const [
    counts,
    setCounts,
  ] = useState(
    DEFAULT_COUNTS
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const latestRequestIdRef =
    useRef(0);

  const {
    status: authStatus,
    role,
  } = useAuthSession();

  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(
      role
    );

  const isSuperAdmin =
    role === "superadmin";

  const [
    draftFilters,
    setDraftFilters,
  ] = useState({
    q: "",
    rating: "",
    sort: "newest",
  });

  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: [
      "status",
      "q",
      "rating",
      "sort",
    ],
    defaultLimit: 25,
  });

  const activeStatus =
    VALID_STATUSES.has(
      filters.status
    )
      ? filters.status
      : "pending";

  const activeSort =
    VALID_SORTS.has(filters.sort)
      ? filters.sort
      : "newest";

  /*
   * Sync URL-backed filters into the editable form.
   */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      q:
        filters.q || "",

      rating:
        filters.rating || "",

      sort:
        VALID_SORTS.has(
          filters.sort
        )
          ? filters.sort
          : "newest",
    });
  }, [
    isReady,
    filters.q,
    filters.rating,
    filters.sort,
  ]);

  /*
   * Load the moderation queue only after the centralized
   * Admin session and role checks have succeeded.
   */
  useEffect(() => {
    if (
      !authChecked ||
      !isReady
    ) {
      return;
    }

    fetchReviews();
  }, [
    authChecked,
    isReady,
    activeStatus,
    activeSort,
    page,
    limit,
    filters.q,
    filters.rating,
  ]);

  async function fetchReviews() {
    const requestId =
      latestRequestIdRef.current + 1;

    latestRequestIdRef.current =
      requestId;

    setLoading(true);
    setError("");

    try {
      const response =
        await apiClient.get(
          "/admin/reviews",
          {
            params: {
              page,
              limit,

              status:
                activeStatus,

              q:
                filters.q ||
                undefined,

              rating:
                filters.rating ||
                undefined,

              sort:
                activeSort,
            },
          }
        );

      if (
        requestId !==
        latestRequestIdRef.current
      ) {
        return;
      }

      setRows(
        response.data?.rows || []
      );

      setPagination(
        response.data?.pagination ||
          DEFAULT_PAGINATION
      );

      setCounts({
        ...DEFAULT_COUNTS,
        ...(response.data?.counts ||
          {}),
      });
    } catch (err) {
      if (
        requestId !==
        latestRequestIdRef.current
      ) {
        return;
      }

      const status =
        err.response?.status;

      /*
       * apiClient owns authentication/session failures.
       * A 403 here is a page-level authorization failure.
       */
      if (status === 403) {
        router.replace("/403");
        return;
      }

      console.error(
        "Failed to load review moderation queue:",
        err
      );

      setRows([]);
      setPagination(
        DEFAULT_PAGINATION
      );

      setError(
        err.response?.data?.error ||
          "Failed to load reviews."
      );
    } finally {
      if (
        requestId ===
        latestRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      status:
        activeStatus === "pending"
          ? ""
          : activeStatus,

      q:
        draftFilters.q,

      rating:
        draftFilters.rating,

      sort:
        draftFilters.sort ===
        "newest"
          ? ""
          : draftFilters.sort,
    });
  }

  async function handleClear() {
    latestRequestIdRef.current += 1;

    setRows([]);
    setPagination(
      DEFAULT_PAGINATION
    );

    setDraftFilters({
      q: "",
      rating: "",
      sort: "newest",
    });

    await clearFilters();
  }

  async function handleStatusChange(
    nextStatus
  ) {
    if (
      !VALID_STATUSES.has(
        nextStatus
      ) ||
      nextStatus === activeStatus
    ) {
      return;
    }

    latestRequestIdRef.current += 1;

    setRows([]);
    setPagination(
      DEFAULT_PAGINATION
    );

    await applyFilters({
      status:
        nextStatus === "pending"
          ? ""
          : nextStatus,

      q:
        draftFilters.q,

      rating:
        draftFilters.rating,

      sort:
        draftFilters.sort ===
        "newest"
          ? ""
          : draftFilters.sort,
    });
  }

  function getStatusCount(
    status
  ) {
    if (status === "all") {
      return (
        counts.pending +
        counts.approved +
        counts.rejected +
        counts.hidden
      );
    }

    return counts[status] || 0;
  }

  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-[var(--text)] opacity-60">
          Checking access...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <div className="mb-6">
            <h2 className="admin-title mb-2">
              ⭐ Review Moderation
            </h2>

            <p className="admin-muted">
              Review submitted ratings and comments,
              inspect moderation states, and open a
              review for moderation.
            </p>
          </div>

          {/* Status queue */}
          <div
            className="
              flex flex-wrap gap-2
              mb-6 pb-4
              border-b
              border-[var(--border)]
            "
            role="group"
            aria-label="Review status filter"
          >
            {STATUS_TABS.map(
              (tab) => {
                const active =
                  tab.value ===
                  activeStatus;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        tab.value
                      )
                    }
                    disabled={loading}
                    aria-pressed={active}
                    className={`
                      admin-btn
                      px-4 py-2
                      text-sm
                      transition-transform
                      disabled:opacity-60
                      ${
                        active
                          ? "admin-btn-primary scale-[1.06] brightness-[0.92] font-semibold"
                          : "admin-btn-secondary"
                      }
                    `}
                  >
                    {tab.label}
                    {" "}
                    ({getStatusCount(
                      tab.value
                    )})
                  </button>
                );
              }
            )}
          </div>

          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="
              admin-card
              mb-6
              flex flex-wrap
              items-end gap-3
            "
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="review-search"
                className="text-sm font-medium"
              >
                Search
              </label>

              <input
                id="review-search"
                type="search"
                value={
                  draftFilters.q
                }
                onChange={(event) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      q:
                        event.target
                          .value,
                    })
                  )
                }
                className="admin-input w-64 max-w-full"
                placeholder="Reviewer, business, comment…"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="review-rating"
                className="text-sm font-medium"
              >
                Rating
              </label>

              <select
                id="review-rating"
                value={
                  draftFilters.rating
                }
                onChange={(event) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      rating:
                        event.target
                          .value,
                    })
                  )
                }
                className="admin-input w-40"
              >
                <option value="">
                  All ratings
                </option>
                <option value="5">
                  5 stars
                </option>
                <option value="4">
                  4 stars
                </option>
                <option value="3">
                  3 stars
                </option>
                <option value="2">
                  2 stars
                </option>
                <option value="1">
                  1 star
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="review-sort"
                className="text-sm font-medium"
              >
                Sort
              </label>

              <select
                id="review-sort"
                value={
                  draftFilters.sort
                }
                onChange={(event) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      sort:
                        event.target
                          .value,
                    })
                  )
                }
                className="admin-input w-44"
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>

                <option value="updated">
                  Recently updated
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                admin-btn
                admin-btn-primary
                px-5 py-2
                text-sm
                disabled:opacity-60
              "
            >
              Apply Filters
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="
                admin-btn
                admin-btn-secondary
                px-4 py-2
                text-sm
                disabled:opacity-60
              "
            >
              Clear
            </button>
          </form>

          {error && (
            <div
              role="alert"
              className="
                mb-5 rounded-lg
                border border-red-500/30
                bg-red-500/10
                px-4 py-3
                text-sm
              "
            >
              {error}
            </div>
          )}

          <div
            className="
              mb-4
              flex flex-wrap
              items-center
              justify-between
              gap-3
            "
          >
            <p className="admin-muted text-sm">
              {loading
                ? "Loading reviews…"
                : `${pagination.total} review${
                    pagination.total ===
                    1
                      ? ""
                      : "s"
                  } in this queue`}
            </p>
          </div>

          {/* Queue table */}
          <div className="w-full max-w-full overflow-x-hidden">
            <table className="admin-table w-full max-w-full table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[9%]" />
                <col className="w-[31%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>
                    Submitted / Updated
                  </th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8"
                    >
                      Loading review queue…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8"
                    >
                      No reviews match the current filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((review) => (
                    <tr key={review.id}>
                      <td className="overflow-hidden">
                        <div
                          className="block max-w-full overflow-hidden whitespace-nowrap font-medium"
                          title={
                            review.reviewer_display_name ||
                            "Unnamed reviewer"
                          }
                        >
                          {truncateQueueValue(
                            review.reviewer_display_name ||
                              "Unnamed reviewer",
                            20
                          )}
                        </div>

                        {isSuperAdmin && (
                          <div
                            className="admin-muted mt-1 block max-w-full overflow-hidden whitespace-nowrap text-xs"
                            title={
                              review.reviewer_email ||
                              "No email"
                            }
                          >
                            {truncateQueueValue(
                              review.reviewer_email ||
                                "No email",
                              20
                            )}
                          </div>
                        )}
                      </td>

                      <td className="overflow-hidden">
                        <span
                          aria-label={`${review.rating} out of 5 stars`}
                          className="whitespace-nowrap"
                        >
                          ★ {review.rating}/5
                        </span>
                      </td>

                      <td className="overflow-hidden">
                        <div
                          className="block max-w-full overflow-hidden whitespace-nowrap"
                          title={
                            review.comment ||
                            "No written comment"
                          }
                        >
                          {truncateQueueValue(
                            review.comment ||
                              "No written comment",
                            20
                          )}
                        </div>
                      </td>

                      <td className="overflow-hidden">
                        <span
                          className={`
                            inline-flex
                            whitespace-nowrap
                            rounded-full
                            border
                            px-2.5 py-1
                            text-xs
                            font-medium
                            ${getStatusClasses(
                              review.status
                            )}
                          `}
                        >
                          {getStatusLabel(
                            review.status
                          )}
                        </span>
                      </td>

                      <td className="overflow-hidden">
                        <div
                          className="truncate whitespace-nowrap"
                          title={formatDateTime(
                            review.created_at
                          )}
                        >
                          {formatQueueDate(
                            review.created_at
                          )}
                        </div>

                        {review.updated_at &&
                          review.updated_at !==
                            review.created_at && (
                            <div
                              className="admin-muted mt-1 truncate whitespace-nowrap text-xs"
                              title={`Updated ${formatDateTime(
                                review.updated_at
                              )}`}
                            >
                              Updated{" "}
                              {formatQueueDate(
                                review.updated_at
                              )}
                            </div>
                          )}
                      </td>

                      <td className="overflow-hidden">
                        <Link
                          href={`/admin/reviews/${encodeURIComponent(
                            review.id
                          )}`}
                          className="
                            admin-btn
                            admin-btn-secondary
                            inline-block
                            px-3 py-1
                            text-sm
                          "
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={loading}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
