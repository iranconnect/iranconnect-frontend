// frontend/pages/admin/businesses.js
import { useEffect, useState } from "react";
import Link from "next/link";

import apiClient from "../../utils/apiClient";
import apiClientAdmin from "../../utils/apiClientAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "deleted", label: "Deleted" },
  { value: "all", label: "All" },
];

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function truncate(text, length = 24) {
  if (!text) return "—";

  const value = String(text);

  return value.length > length
    ? `${value.slice(0, length)}...`
    : value;
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function BusinessesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { status: authStatus, role } = useAuthSession();
  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const [query, setQuery] = useState("");
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );
  
  const [error, setError] = useState("");
  
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: ["q", "status"],
    defaultLimit: 10,
  });
  
  const status = filters.status || "active";

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSourceType, setDeleteSourceType] = useState("");
  const [deleteTicketCode, setDeleteTicketCode] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    setQuery(filters.q || "");
  }, [
    isReady,
    filters.q,
  ]);
  
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }
  
    fetchBusinesses();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.q,
    filters.status,
  ]);

  

  async function fetchBusinesses() {
    setLoading(true);
    setError("");
  
    try {
      const res = await apiClientAdmin.get(
        "/admin/businesses",
        {
          params: {
            page,
            limit,
            q: filters.q || undefined,
            status,
          },
        }
      );
  
      /*
        تا قبل از Deploy Backend جدید،
        API هنوز Array برمی‌گرداند.
      */
      if (Array.isArray(res.data)) {
        const legacyRows = res.data;
  
        setList(legacyRows);
  
        setPagination({
          page: 1,
          limit: legacyRows.length || 10,
          total: legacyRows.length,
          totalPages: 1,
          from: legacyRows.length ? 1 : 0,
          to: legacyRows.length,
          hasPreviousPage: false,
          hasNextPage: false,
        });
  
        return;
      }
  
      setList(res.data?.rows || []);
  
      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error(
        "❌ Error fetching businesses:",
        err.response?.status,
        err.response?.data || err.message
      );
  
      setList([]);
      setPagination(DEFAULT_PAGINATION);
  
      setError(
        err.response?.data?.error ||
          "Unable to load businesses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
  
    applyFilters({
      q: query,
      status,
    });
  }

  function handleStatusChange(nextStatus) {
    applyFilters({
      q: query,
      status: nextStatus,
    });
  }

  async function handleClear() {
    setQuery("");
    await clearFilters();
  }

  function openSoftDeleteModal(business) {
    setDeleteTarget(business);
    setDeleteReason("");
    setDeleteSourceType("");
    setDeleteTicketCode("");
    setError("");
  }

  function closeSoftDeleteModal() {
    if (deleteSubmitting) return;

    setDeleteTarget(null);
    setDeleteReason("");
    setDeleteSourceType("");
    setDeleteTicketCode("");
  }

  async function submitSoftDelete() {
    if (!deleteTarget) return;

    const normalizedReason = deleteReason.trim();

    if (normalizedReason.length < 10) {
      setError(
        "Deletion reason must be at least 10 characters."
      );
      return;
    }

    if (normalizedReason.length > 1000) {
      setError(
        "Deletion reason must not exceed 1000 characters."
      );
      return;
    }

    if (
      deleteSourceType !== "ticket" &&
      deleteSourceType !== "admin_note"
    ) {
      setError(
        "Select a deletion authorization method."
      );
      return;
    }

    const normalizedTicketCode =
      deleteTicketCode.trim();

    if (
      deleteSourceType === "ticket" &&
      !normalizedTicketCode
    ) {
      setError(
        "Ticket code is required for ticket-based deletion."
      );
      return;
    }

    setDeleteSubmitting(true);
    setError("");

    try {
      await apiClientAdmin.post(
        `/admin/businesses/${deleteTarget.id}/soft-delete`,
        {
          reason: normalizedReason,
          change_source_type:
            deleteSourceType,
          ticket_code:
            deleteSourceType === "ticket"
              ? normalizedTicketCode
              : "",
        }
      );

      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteSourceType("");
      setDeleteTicketCode("");

      await fetchBusinesses();
    } catch (err) {
      console.error(
        "❌ Soft delete failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.error ||
          "Unable to soft delete business."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function openRestoreModal(business) {
    setRestoreTarget(business);
    setError("");
  }

  function closeRestoreModal() {
    if (restoreSubmitting) return;

    setRestoreTarget(null);
  }

  async function submitRestore() {
    if (!restoreTarget) return;

    setRestoreSubmitting(true);
    setError("");

    try {
      await apiClientAdmin.post(
        `/admin/businesses/${restoreTarget.id}/restore`
      );

      setRestoreTarget(null);

      await fetchBusinesses();
    } catch (err) {
      console.error(
        "❌ Restore failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.error ||
          "Unable to restore business."
      );
    } finally {
      setRestoreSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Checking access...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Businesses Management
            </h2>

            <p className="mt-1 text-sm opacity-70">
              Manage active, deleted and private business listings.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 lg:w-auto"
          >
            <input
              type="text"
              placeholder="Search name, city, category or slug..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="
                min-w-0 flex-1 border border-[var(--border)]
                rounded-lg px-3 py-2 bg-[var(--bg)]
                text-[var(--text)] focus:outline-none
                focus:ring-2 focus:ring-turquoise
                lg:w-72
              "
            />

            <button
              type="submit"
              disabled={loading}
              className="
                px-4 py-2 bg-turquoise text-navy
                font-medium rounded shadow
                hover:bg-turquoise/90 transition
                disabled:opacity-60
              "
            >
              Search
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="
                px-4 py-2 border border-[var(--border)]
                bg-[var(--card-bg)] text-[var(--text)]
                font-medium rounded shadow
                hover:bg-[var(--bg)] transition
                disabled:opacity-60
              "
            >
              Clear
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleStatusChange(option.value)
                }
                className={`
                  rounded-lg px-4 py-2 text-sm font-medium
                  transition
                  ${
                    isActive
                      ? "bg-turquoise text-navy"
                      : "border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--bg)]"
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm opacity-70">
            Loading businesses...
          </p>
        ) : (
          <>
            <section
              className="
                overflow-x-auto rounded-2xl border
                border-[var(--border)] bg-[var(--card-bg)]
                p-5 text-[var(--text)]
                shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)]
              "
            >
              <table className="min-w-full text-sm">
                <thead className="opacity-80">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Visibility</th>
                    <th className="p-3 text-left">Lifecycle</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
  
                <tbody>
                  {list.map((business) => (
                    <tr
                      key={business.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40"
                    >
                      <td className="p-3 opacity-70">
                        {business.id}
                      </td>
  
                      <td className="p-3">
                        <div className="font-medium">
                          {truncate(business.name, 28)}
                        </div>
  
                        <div className="mt-1 text-xs opacity-60">
                          {business.slug || "—"}
                        </div>
                      </td>
  
                      <td className="p-3">
                        <div>
                          {truncate(business.category, 20)}
                        </div>
  
                        <div className="mt-1 text-xs opacity-60">
                          {truncate(
                            business.sub_category,
                            20
                          )}
                        </div>
                      </td>
  
                      <td className="p-3">
                        <div>
                          {truncate(business.city, 16)}
                        </div>
  
                        <div className="mt-1 text-xs opacity-60">
                          {truncate(business.country, 16)}
                        </div>
                      </td>
  
                      <td className="p-3">
                        {business.is_public ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            Private
                          </span>
                        )}
                      </td>
  
                      <td className="p-3">
                        {business.is_deleted ? (
                          <div className="space-y-1">
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              Deleted
                            </span>
  
                            <div className="text-xs opacity-70">
                              {formatDate(business.deleted_at)}
                            </div>
  
                            <div
                              className="max-w-[220px] text-xs opacity-70"
                              title={business.deleted_reason || ""}
                            >
                              {truncate(
                                business.deleted_reason,
                                45
                              )}
                            </div>
  
                            <div className="text-xs opacity-60">
                              By:{" "}
                              {business.deleted_by_email ||
                                business.deleted_source ||
                                "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Active
                          </span>
                        )}
                      </td>
  
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {!business.is_deleted && (
                            <>
                              <Link
                                href={`/admin/edit/${business.id}`}
                                className="text-turquoise hover:underline"
                              >
                                Edit
                              </Link>
  
                              <button
                                type="button"
                                onClick={() =>
                                  openSoftDeleteModal(business)
                                }
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
  
                          {business.is_deleted && (
                            <>
                              <Link
                                href={`/admin/edit/${business.id}`}
                                className="text-turquoise hover:underline"
                              >
                                View
                              </Link>
  
                              <button
                                type="button"
                                onClick={() =>
                                  openRestoreModal(business)
                                }
                                className="text-green-700 hover:underline"
                              >
                                Restore
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
  
                  {!list.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-5 text-center opacity-70"
                      >
                        No businesses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
            {!error && (
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                disabled={loading}
              />
            )}
          </> 
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#0A1D37]">
              Delete business listing?
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This immediately removes{" "}
              <strong>{deleteTarget.name}</strong> from
              public search, public profile pages, reviews,
              claims, ranking and SEO surfaces.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Historical data is retained. The listing can be
              restored later, but it will remain private until
              published again.
            </p>

            <div className="mt-5">
              <p className="text-sm font-medium text-[#0A1D37]">
                Delete Authorization
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Was this deletion requested through an existing ticket?
              </p>

              <label className="mt-3 flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delete_change_source_type"
                  value="ticket"
                  checked={deleteSourceType === "ticket"}
                  onChange={() => {
                    setDeleteSourceType("ticket");
                  }}
                />

                <span className="text-sm text-slate-700">
                  Yes, I have a pending delete ticket.
                </span>
              </label>

              <label className="mt-3 flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delete_change_source_type"
                  value="admin_note"
                  checked={deleteSourceType === "admin_note"}
                  onChange={() => {
                    setDeleteSourceType("admin_note");
                    setDeleteTicketCode("");
                  }}
                />

                <span className="text-sm text-slate-700">
                  No, this is an admin-initiated deletion.
                </span>
              </label>

              {deleteSourceType === "ticket" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#0A1D37]">
                    Ticket code *
                  </label>

                  <input
                    type="text"
                    value={deleteTicketCode}
                    onChange={(event) =>
                      setDeleteTicketCode(
                        event.target.value
                      )
                    }
                    placeholder="e.g. IC-BD-000123"
                    autoComplete="off"
                    className="
                      mt-2 w-full rounded-lg border border-slate-300
                      px-3 py-2 text-sm text-slate-900
                      focus:outline-none focus:ring-2
                      focus:ring-turquoise
                    "
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Only a pending delete ticket for this business can be used.
                  </p>
                </div>
              )}
            </div>

            <label className="mt-5 block text-sm font-medium text-[#0A1D37]">
              Reason for deletion
            </label>

            <textarea
              rows={5}
              value={deleteReason}
              onChange={(event) =>
                setDeleteReason(event.target.value)
              }
              placeholder="Example: Duplicate listing created in error."
              className="
                mt-2 w-full rounded-lg border border-slate-300
                px-3 py-2 text-sm text-slate-900
                focus:outline-none focus:ring-2
                focus:ring-turquoise
              "
            />

            <p className="mt-1 text-xs text-slate-500">
              Minimum 10 characters. Maximum 1000 characters.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeSoftDeleteModal}
                disabled={deleteSubmitting}
                className="
                  rounded-lg border border-slate-300 px-4 py-2
                  text-sm font-medium text-slate-700
                  hover:bg-slate-50 disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitSoftDelete}
                disabled={deleteSubmitting}
                className="
                  rounded-lg bg-red-600 px-4 py-2
                  text-sm font-medium text-white
                  hover:bg-red-700 disabled:opacity-60
                "
              >
                {deleteSubmitting
                  ? "Deleting..."
                  : "Soft delete business"}
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#0A1D37]">
              Restore business listing?
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              <strong>{restoreTarget.name}</strong> will be
              restored internally.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              It will remain private and will not return to
              public search, business pages, reviews, claims,
              ranking or SEO until a separate Publish action is
              performed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRestoreModal}
                disabled={restoreSubmitting}
                className="
                  rounded-lg border border-slate-300 px-4 py-2
                  text-sm font-medium text-slate-700
                  hover:bg-slate-50 disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitRestore}
                disabled={restoreSubmitting}
                className="
                  rounded-lg bg-green-700 px-4 py-2
                  text-sm font-medium text-white
                  hover:bg-green-800 disabled:opacity-60
                "
              >
                {restoreSubmitting
                  ? "Restoring..."
                  : "Restore business"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
