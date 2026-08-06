// frontend/pages/admin/requests.js

import { useEffect, useState } from "react";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";
import RequestDetailsModal from "../../components/admin/RequestDetailsModal";

import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
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

function getStatusClass(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

function getStatusLabel(status) {
  if (
    status === "pending" ||
    status === "pending_review"
  ) {
    return "Pending review";
  }

  return status || "—";
}

export default function AdminBusinessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [draftFilters, setDraftFilters] = useState({
    q: "",
    type: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const { status: authStatus, role } = useAuthSession();
  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: ["q", "type", "status"],
    defaultLimit: 20,
  });

  /* ============================================================
     Sync URL filters -> UI inputs
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      q: filters.q || "",
      type: filters.type || "",
      status: filters.status || "",
    });
  }, [
    isReady,
    filters.q,
    filters.type,
    filters.status,
  ]);

  /* ============================================================
     Fetch paginated requests
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
    filters.q,
    filters.type,
    filters.status,
  ]);

  async function fetchRequests() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        "/admin/requests",
        {
          params: {
            page,
            limit,
            q: filters.q || undefined,
            type: filters.type || undefined,
            status: filters.status || undefined,
          },
          withCredentials: true,
        }
      );

      /*
        Backward compatibility:
        تا قبل از Deploy بک‌اند جدید،
        پاسخ موجود { rows, total } است.
      */
      if (!res.data?.pagination) {
        const legacyRows = res.data?.rows || [];
        const legacyTotal =
          Number(res.data?.total) || legacyRows.length;

        setRequests(legacyRows);

        setPagination({
          page: 1,
          limit: legacyRows.length || 20,
          total: legacyTotal,
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
        "❌ Error fetching requests:",
        err
      );

      setRequests([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Failed to load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     Search / Clear
  ============================================================ */
  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      q: draftFilters.q,
      type: draftFilters.type,
      status: draftFilters.status,
    });
  }

  async function handleClear() {
    setDraftFilters({
      q: "",
      type: "",
      status: "",
    });
  
    await clearFilters();
  }

  /* ============================================================
     Export
  ============================================================ */
  async function handleExport(type) {
    try {
      const res = await apiClient.get(
        `/admin/requests/export/${type}`,
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      const url = window.URL.createObjectURL(
        res.data
      );

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download =
        type === "xlsx"
          ? "IranConnect_Requests_Report.xlsx"
          : "IranConnect_Requests_Report.pdf";

      document.body.appendChild(anchor);

      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting file.");
    }
  }

  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Checking access…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-section">
          <h2 className="admin-title mb-4">
            🧾 Business Requests (New / Update / Delete)
          </h2>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <input
              type="text"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              placeholder="Search business, email, or ticket..."
              className="admin-input w-56"
            />

            <select
              value={draftFilters.type}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              className="admin-input w-40"
            >
              <option value="">All Types</option>
              <option value="new">New</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>

            <select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="admin-input w-40"
            >
              <option value="">All Statuses</option>
              <option value="pending_review">
                Pending review
              </option>
              <option value="approved">
                Approved
              </option>
              <option value="rejected">
                Rejected
              </option>
            </select>

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

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={() =>
                  handleExport("xlsx")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExport("pdf")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export PDF
              </button>
            </div>
          </form>

          {loading ? (
            <p className="admin-muted">
              Loading...
            </p>
          ) : requests.length === 0 ? (
            <p className="admin-muted">
              No matching requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Ticket</th>
                    <th>Created</th>
                    <th>Processed</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="truncate max-w-[120px]">
                        {request.business_name || "—"}
                      </td>

                      <td className="truncate max-w-[150px]">
                        {request.user_email || "—"}
                      </td>

                      <td className="capitalize">
                        {request.request_type}
                      </td>

                      <td>
                        <span
                          className={
                            "px-2 py-1 rounded text-xs font-semibold " +
                            getStatusClass(request.status)
                          }
                        >
                          {getStatusLabel(
                            request.status
                          )}
                        </span>
                      </td>

                      <td className="font-mono">
                        {request.ticket_code}
                      </td>

                      <td>
                        {formatDate(
                          request.created_at
                        )}
                      </td>

                      <td>
                        {formatDate(
                          request.processed_at
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          onClick={() =>
                            setSelected(request)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
        </div>
      </div>

      {selected && (
        <RequestDetailsModal
          request={selected}
          onClose={() => setSelected(null)}
          refresh={fetchRequests}
        />
      )}
    </AdminLayout>
  );
}
