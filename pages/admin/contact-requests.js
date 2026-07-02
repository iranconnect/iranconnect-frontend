// pages/admin/contact-requests.js
import { useEffect, useState } from "react";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import ContactRequestDetailsModal from "../../components/admin/ContactRequestDetailsModal";

import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

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

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function getSubjectLabel(request) {
  if (request.subject_type === "other") {
    return request.custom_subject || "Other";
  }

  return String(request.subject_type || "—").replace(
    /_/g,
    " "
  );
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [authChecked, setAuthChecked] =
    useState(false);

  const [draftFilters, setDraftFilters] = useState({
    name: "",
    email: "",
    subject: "",
    status: "pending",
    date: "",
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
      "name",
      "email",
      "subject",
      "status",
      "date",
    ],
    defaultLimit: 10,
  });

  /* ============================================================
     🔐 Admin access check
  ============================================================ */
  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const me = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!me.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        if (
          me.data.role !== "admin" &&
          me.data.role !== "superadmin"
        ) {
          window.location.href = "/";
          return;
        }

        if (mounted) {
          setAuthChecked(true);
        }
      } catch {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     Sync URL filters -> form state
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      name: filters.name || "",
      email: filters.email || "",
      subject: filters.subject || "",
      status: filters.status || "pending",
      date: filters.date || "",
    });
  }, [
    isReady,
    filters.name,
    filters.email,
    filters.subject,
    filters.status,
    filters.date,
  ]);

  /* ============================================================
     Fetch after URL/query changes
  ============================================================ */
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }

    fetchRequests();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.name,
    filters.email,
    filters.subject,
    filters.status,
    filters.date,
  ]);

  async function fetchRequests() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        "/admin/contact-requests",
        {
          params: {
            page,
            limit,
            name: filters.name || undefined,
            email: filters.email || undefined,
            subject: filters.subject || undefined,
            status: filters.status || "pending",
            date: filters.date || undefined,
          },
          withCredentials: true,
        }
      );

      /*
        Backward compatibility:
        تا قبل از Deploy Backend جدید،
        endpoint فعلی Array برمی‌گرداند.
      */
      if (Array.isArray(res.data)) {
        const legacyRows = res.data;

        setRequests(legacyRows);

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

      setRequests(res.data?.rows || []);

      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error(
        "❌ Fetch contact requests error:",
        err
      );

      setRequests([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Failed to load contact requests."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      name: draftFilters.name,
      email: draftFilters.email,
      subject: draftFilters.subject,
      status: draftFilters.status,
      date: draftFilters.date,
    });
  }

  async function handleClear() {
    setDraftFilters({
      name: "",
      email: "",
      subject: "",
      status: "pending",
      date: "",
    });

    await clearFilters();

    applyFilters({
      status: "pending",
    });
  }

  async function exportContactRequests(type) {
    try {
      const res = await apiClient.get(
        `/admin/contact-requests/export/${type}`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data]);

      const url =
        window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        type === "xlsx"
          ? "IranConnect_Contact_Requests.xlsx"
          : "IranConnect_Contact_Requests.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);

      alert(
        err.response?.data?.error ||
          "You are not authorized to export this file."
      );
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access...
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5 flex items-center gap-2">
            📩 Contact Requests
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <input
              type="text"
              placeholder="Filter by name..."
              className="admin-input w-40"
              value={draftFilters.name}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />

            <input
              type="text"
              placeholder="Filter by email..."
              className="admin-input w-48"
              value={draftFilters.email}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />

            <input
              type="text"
              placeholder="Filter by subject..."
              className="admin-input w-48"
              value={draftFilters.subject}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
            />

            <select
              className="admin-input w-40"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="pending">Pending</option>
              <option value="handled">Handled</option>
              <option value="all">All statuses</option>
            </select>

            <input
              type="date"
              className="admin-input w-40"
              value={draftFilters.date}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary text-sm px-5 py-2 disabled:opacity-60"
            >
              Search
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
            >
              Clear
            </button>

            <div className="flex flex-row gap-3 ml-auto">
              <button
                type="button"
                onClick={() =>
                  exportContactRequests("xlsx")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
              >
                Export XLSX
              </button>

              <button
                type="button"
                onClick={() =>
                  exportContactRequests("pdf")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
              >
                Export PDF
              </button>
            </div>
          </form>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm opacity-70">
              Loading contact requests...
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-[var(--text)]">
                  <thead className="opacity-80">
                    <tr>
                      <th className="text-left p-3">
                        Name
                      </th>

                      <th className="text-left p-3">
                        Email
                      </th>

                      <th className="text-left p-3">
                        Subject
                      </th>

                      <th className="text-center p-3">
                        Status
                      </th>

                      <th className="text-left p-3">
                        Date
                      </th>

                      <th className="text-center p-3">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                      >
                        <td className="p-3">
                          {request.name || "—"}
                        </td>

                        <td className="p-3">
                          {request.email || "—"}
                        </td>

                        <td className="p-3 capitalize">
                          {getSubjectLabel(request)}
                        </td>

                        <td className="p-3 text-center">
                          {request.status === "handled"
                            ? "✅ Handled"
                            : "🕓 Pending"}
                        </td>

                        <td className="p-3">
                          {formatDate(request.created_at)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRequest(request)
                            }
                            className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!requests.length && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center opacity-70 p-4"
                        >
                          No contact requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!error && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={loading}
                />
              )}
            </>
          )}
        </section>
      </div>

      {selectedRequest && (
        <ContactRequestDetailsModal
          request={selectedRequest}
          onClose={() =>
            setSelectedRequest(null)
          }
          refresh={fetchRequests}
        />
      )}
    </AdminLayout>
  );
}
