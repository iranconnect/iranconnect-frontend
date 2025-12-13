// pages/admin/file-logs.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import FileLogDetailsModal from "../../components/admin/FileLogDetailsModal";

export default function AdminFileLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure access check (HttpOnly Cookie)
     + Hardening against unmount
  ============================================================ */
  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const me = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!me.data?.ok) return (window.location.href = "/auth/login");
        if (me.data.role !== "admin" && me.data.role !== "superadmin")
          return (window.location.href = "/");

        if (mounted) {
          setAuthChecked(true);
          fetchLogs();
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
     📂 Fetch logs (secure)
  ============================================================ */
  async function fetchLogs() {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (status) params.status = status;
      if (source) params.source = source;

      const res = await apiClient.get("/admin/files/logs", {
        params,
        withCredentials: true,
      });

      setLogs(res.data || []);
    } catch (err) {
      console.error("❌ Fetch logs error:", err);
      setError(err.response?.data?.error || "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     📥 Secure Export (Admin/SuperAdmin – Cookie based)
  ============================================================ */
  async function exportFileLogs(type) {
    try {
      const res = await apiClient.get(`/admin/files/export/${type}`, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "xlsx"
          ? "IranConnect_File_Logs.xlsx"
          : "IranConnect_File_Logs.pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();

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
        Checking access…
      </div>
    );
  }

  /* ============================================================
     🖼️ UI
  ============================================================ */
  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5">
            🧾 File Upload Logs
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <select
              className="admin-input w-40"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="clean">Clean</option>
              <option value="error">Error</option>
              <option value="infected">Infected</option>
            </select>

            <input
              type="text"
              placeholder="Search by source..."
              className="admin-input w-60"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />

            <button
              onClick={fetchLogs}
              className="admin-btn admin-btn-primary text-sm px-4 py-2"
            >
              Search
            </button>

            <button
              onClick={() => {
                setSource("");
                setStatus("");
                fetchLogs();
              }}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2"
            >
              Clear
            </button>

            {/* Secure Export */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => exportFileLogs("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>
              <button
                onClick={() => exportFileLogs("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export PDF
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm opacity-70">Loading logs...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>User</th>
                    <th>Scanned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.file_name}</td>
                        <td
                          className={`font-medium ${
                            log.scan_status === "clean"
                              ? "text-green-600"
                              : log.scan_status === "infected"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {log.scan_status}
                        </td>
                        <td>{log.upload_source || "—"}</td>
                        <td>{log.user_email || "—"}</td>
                        <td>
                          {new Date(log.scanned_at).toLocaleDateString()}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center opacity-70 p-4">
                        No logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedLog && (
        <FileLogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </AdminLayout>
  );
}
