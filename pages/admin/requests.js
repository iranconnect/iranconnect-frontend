// pages/admin/requests.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import RequestDetailsModal from "../../components/admin/RequestDetailsModal";

export default function AdminBusinessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // auth state
  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Auth Check — admin / superadmin only
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

        if (me.data.role !== "admin" && me.data.role !== "superadmin") {
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
     📦 Fetch requests (runs after auth + on filters change)
  ============================================================ */
  useEffect(() => {
    if (!authChecked) return;
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, statusFilter, typeFilter]);

  async function fetchRequests(p = 1) {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: p,
        limit,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        q: searchTerm.trim() || undefined,
      };

      const res = await apiClient.get("/admin/requests", {
        params,
        withCredentials: true,
      });

      setRequests(res.data?.rows || []);
      setTotal(res.data?.total || 0);
      setPage(res.data?.page || p);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setError(err.response?.data?.error || "Failed to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     📤 Export XLSX / PDF (SuperAdmin only)
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

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "xlsx"
          ? "IranConnect_Requests_Report.xlsx"
          : "IranConnect_Requests_Report.pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting file.");
    }
  }

  /* ============================================================
     🛑 Block render until auth confirmed
  ============================================================ */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access…
      </div>
    );
  }

  /* ============================================================
     🎨 UI
  ============================================================ */
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

          {/* Filters */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchRequests(1);
            }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search business, email, or ticket..."
              className="admin-input w-56"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-input w-40"
            >
              <option value="">All Types</option>
              <option value="new">New</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-input w-40"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="submit"
              className="admin-btn admin-btn-primary text-sm px-5 py-2"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("");
                setStatusFilter("");
                fetchRequests(1);
              }}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2"
            >
              Clear
            </button>

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={() => handleExport("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export PDF
              </button>
            </div>
          </form>

          {/* Table */}
          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="admin-muted">No matching requests found.</p>
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
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="truncate max-w-[120px]">
                        {r.business_name || "—"}
                      </td>
                      <td className="truncate max-w-[150px]">
                        {r.user_email || "—"}
                      </td>
                      <td className="capitalize">{r.request_type}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            r.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : r.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="font-mono">{r.ticket_code}</td>
                      <td>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {r.processed_at
                          ? new Date(r.processed_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          onClick={() => setSelected(r)}
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
        </div>
      </div>

      {selected && (
        <RequestDetailsModal
          request={selected}
          onClose={() => setSelected(null)}
          refresh={() => fetchRequests(page)}
        />
      )}
    </AdminLayout>
  );
}
