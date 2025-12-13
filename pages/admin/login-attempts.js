// frontend/pages/admin/login-attempts.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import LoginAttemptDetailsModal from "../../components/admin/LoginAttemptDetailsModal";

export default function AdminLoginAttemptsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [error, setError] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Auth Check (HttpOnly Cookie)
     + Hardening against unmount / race conditions
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
     📥 Fetch Login Attempts (Secure)
  ============================================================ */
  async function fetchLogs() {
    if (!authChecked) return;

    setLoading(true);
    setError("");

    try {
      const params = {};
      if (status) params.status = status;
      if (email) params.email = email;
      if (blockedOnly) params.blocked = "true";

      const res = await apiClient.get("/admin/login-attempts/all", {
        params,
        withCredentials: true,
      });

      setLogs(res.data?.data || []);
    } catch (err) {
      console.error("❌ Fetch login attempts error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load login attempts."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     📤 Secure Export (SuperAdmin only – Cookie based)
  ============================================================ */
  async function exportLoginAttempts(type) {
    try {
      const res = await apiClient.get(
        `/admin/login-attempts/export/${type}`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "xlsx"
          ? "IranConnect_Login_Attempts.xlsx"
          : "IranConnect_Login_Attempts.pdf";

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

  /* ============================================================
     ⛔ Prevent render before auth check
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
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5">
            🔐 User Login Attempts
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <select
              className="admin-input w-40"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>

            <input
              type="text"
              placeholder="Search by email..."
              className="admin-input w-60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={blockedOnly}
                onChange={(e) => setBlockedOnly(e.target.checked)}
              />
              <span className="text-sm text-[var(--text)]">
                Only Blocked Users
              </span>
            </label>

            <button
              onClick={fetchLogs}
              className="admin-btn admin-btn-primary text-sm px-4 py-2"
            >
              Search
            </button>

            <button
              onClick={() => {
                setEmail("");
                setStatus("");
                setBlockedOnly(false);
                fetchLogs();
              }}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2"
            >
              Clear
            </button>

            {/* Secure Export */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => exportLoginAttempts("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>
              <button
                onClick={() => exportLoginAttempts("pdf")}
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
            <p className="text-sm opacity-70">Loading login logs...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>IP</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.length ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="truncate max-w-[200px]">
                          {log.email}
                        </td>
                        <td className="truncate max-w-[150px]">
                          {log.ip_address}
                        </td>
                        <td>
                          {log.success ? (
                            <span className="text-green-600 font-medium">
                              Success
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Failed
                            </span>
                          )}
                        </td>
                        <td>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => setSelectedAttempt(log)}
                            className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center opacity-70 p-4">
                        No login attempts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedAttempt && (
            <LoginAttemptDetailsModal
              attempt={selectedAttempt}
              onClose={() => setSelectedAttempt(null)}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
