// pages/admin/security-logs.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

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
     📦 Fetch logs — after auth + when filter changes
  ============================================================ */
  useEffect(() => {
    if (!authChecked) return;
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, filter]);

  async function fetchLogs() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get("/admin/security-logs", {
        params: { status: filter || undefined },
        withCredentials: true,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      console.error("❌ Error loading logs:", err);
      setError(err.response?.data?.error || "Failed to load security logs.");
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     🔍 Client-side search
  ============================================================ */
  useEffect(() => {
    let list = logs;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.email?.toLowerCase().includes(q)
      );
    }

    setFilteredLogs(list);
  }, [search, logs]);

  /* ============================================================
     📤 Export CSV
  ============================================================ */
  function exportToCSV() {
    if (!filteredLogs.length) return;

    const headers = [
      "Email",
      "Status",
      "IP",
      "User Agent",
      "Expires At",
      "Used At",
      "Created At",
    ];

    const rows = filteredLogs.map((l) => [
      l.email,
      l.status,
      l.ip_address || "",
      l.user_agent ? `"${l.user_agent.replace(/"/g, "'")}"` : "",
      l.expires_at ? new Date(l.expires_at).toISOString() : "",
      l.used_at ? new Date(l.used_at).toISOString() : "",
      new Date(l.created_at).toISOString(),
    ]);

    const csv =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `IranConnect_Security_Logs_${Date.now()}.csv`;
    a.click();
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
          <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
            <h2 className="admin-title">🔐 Password Reset Logs</h2>
            <button
              onClick={exportToCSV}
              className="admin-btn admin-btn-primary"
              disabled={!filteredLogs.length}
            >
              ⬇️ Export CSV
            </button>
          </div>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-60"
            />

            <button
              className="admin-btn admin-btn-secondary"
              onClick={fetchLogs}
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="admin-muted">No records found.</p>
          ) : (
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
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="cursor-pointer"
                    >
                      <td>{log.email}</td>
                      <td className="capitalize">{log.status}</td>
                      <td>{log.ip_address || "—"}</td>
                      <td>
                        {log.expires_at
                          ? new Date(log.expires_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        {log.used_at
                          ? new Date(log.used_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
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
