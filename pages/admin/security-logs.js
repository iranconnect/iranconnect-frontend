// pages/admin/security-logs.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

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
  
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );
  
  const [draftFilters, setDraftFilters] = useState({
    status: "",
    q: "",
  });
  
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
  } = usePaginationQuery({
    filterKeys: ["status", "q"],
    defaultLimit: 10,
  });

  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Auth Check — superadmin only
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

        if (me.data.role !== "superadmin") {
          window.location.href = "/403";
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
     📦 Fetch logs — after auth + when filter changes
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    setDraftFilters({
      status: filters.status || "",
      q: filters.q || "",
    });
  }, [
    isReady,
    filters.status,
    filters.q,
  ]);
  
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }
  
    fetchLogs();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.status,
    filters.q,
  ]);
  
  async function fetchLogs() {
    setLoading(true);
    setError("");
  
    try {
      const res = await apiClient.get(
        "/admin/security-logs",
        {
          params: {
            page,
            limit,
            status: filters.status || undefined,
            q: filters.q?.trim() || undefined,
          },
          withCredentials: true,
        }
      );
  
      setLogs(res.data?.rows || []);
  
      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error("❌ Error loading logs:", err);
  
      setLogs([]);
      setPagination(DEFAULT_PAGINATION);
  
      setError(
        err.response?.data?.error ||
          "Failed to load security logs."
      );
    } finally {
      setLoading(false);
    }
  }
  
  function handleSearch(event) {
    event.preventDefault();
  
    applyFilters({
      status: draftFilters.status,
      q: draftFilters.q,
    });
  }
  
  function handleClear() {
    setDraftFilters({
      status: "",
      q: "",
    });
  
    applyFilters({
      status: "",
      q: "",
    });
  }
  /* ============================================================
     📤 Export CSV
  ============================================================ */
  async function exportToCSV() {
    try {
      const res = await apiClient.get(
        "/admin/security-logs/export/csv",
        {
          params: {
            status: filters.status || undefined,
            q: filters.q?.trim() || undefined,
          },
          responseType: "blob",
          withCredentials: true,
        }
      );
  
      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;",
      });
  
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
  
      link.href = url;
      link.download = "IranConnect_Security_Logs.csv";
  
      document.body.appendChild(link);
  
      link.click();
  
      link.remove();
  
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "❌ Security Logs export failed:",
        err
      );
  
      alert(
        err.response?.data?.error ||
          "Failed to export security logs."
      );
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
          <h2 className="admin-title mb-5">
            🔐 Password Reset Logs
          </h2>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-3 mb-5"
          >
            <select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="admin-input w-48"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
              <option value="used">Used</option>
            </select>
          
            <input
              type="text"
              placeholder="Search by email..."
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              className="admin-input w-60"
            />
          
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              Search
            </button>
          
            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              Clear
            </button>
          
            <div className="ml-auto">
              <button
                type="button"
                onClick={exportToCSV}
                disabled={loading}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                Export CSV
              </button>
            </div>
          </form>

          {/* Table */}
          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="admin-muted">No records found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>IP</th>
                      <th>Expires</th>
                      <th>Used</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
          
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className="cursor-pointer"
                      >
                        <td>{log.email}</td>
          
                        <td className="capitalize">
                          {log.status}
                        </td>
          
                        <td>{log.ip_address || "—"}</td>
          
                        <td>
                          {log.expires_at
                            ? new Date(
                                log.expires_at
                              ).toLocaleString()
                            : "—"}
                        </td>
          
                        <td>
                          {log.used_at
                            ? new Date(
                                log.used_at
                              ).toLocaleString()
                            : "—"}
                        </td>
          
                        <td>
                          {new Date(
                            log.created_at
                          ).toLocaleString()}
                        </td>
          
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected(log);
                            }}
                            className="text-turquoise hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
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
        </div>

        {/* Modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
            onClick={() => setSelected(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="admin-card w-[90%] max-w-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-3 text-navy">
                Log Details
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Status:</strong> {selected.status}</p>
                <p><strong>IP:</strong> {selected.ip_address || "—"}</p>
                <p><strong>User Agent:</strong> {selected.user_agent || "—"}</p>
                <p><strong>Expires:</strong> {selected.expires_at ? new Date(selected.expires_at).toLocaleString() : "—"}</p>
                <p><strong>Used:</strong> {selected.used_at ? new Date(selected.used_at).toLocaleString() : "—"}</p>
                <p><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right mt-5">
                <button
                  onClick={() => setSelected(null)}
                  className="admin-btn admin-btn-primary px-6"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
