// pages/admin/file-logs.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import FileLogDetailsModal from "../../components/admin/FileLogDetailsModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminFileLogsPage() {
  return (
    <AdminLayout allowedRoles={["superadmin"]}>
      <AdminFileLogsContent />
    </AdminLayout>
  );
}

function AdminFileLogsContent() {
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

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
    source: "",
  });
  
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
  } = usePaginationQuery({
    filterKeys: ["status", "source"],
    defaultLimit: 10,
  });

  /* ============================================================
     🔄 Sync URL filters -> form state
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      status: filters.status || "",
      source: filters.source || "",
    });
  }, [
    isReady,
    filters.status,
    filters.source,
  ]);

  /* ============================================================
     📥 Fetch paginated logs
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    fetchLogs();
  }, [
    isReady,
    page,
    limit,
    filters.status,
    filters.source,
  ]);

  async function fetchLogs() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        "/admin/files/logs",
        {
          params: {
            page,
            limit,
            status: filters.status || undefined,
            source: filters.source?.trim() || undefined,
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
      console.error("❌ Fetch logs error:", err);

      if (err.response?.status === 403) {
        router.replace("/403");
        return;
      }

      setLogs([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Failed to load logs."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      status: draftFilters.status,
      source: draftFilters.source,
    });
  }

  function handleClear() {
    setDraftFilters({
      status: "",
      source: "",
    });

    applyFilters({
      status: "",
      source: "",
    });
  }

  

  /* ============================================================
     📥 Secure Export (Admin/SuperAdmin – Cookie based)
  ============================================================ */
  async function exportFileLogs(type) {
    try {
      const res = await apiClient.get(
        `/admin/files/export/${type}`,
        {
          params: {
            status: filters.status || undefined,
            source: filters.source?.trim() || undefined,
          },
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
          ? "IranConnect_File_Logs.xlsx"
          : "IranConnect_File_Logs.pdf";
  
      document.body.appendChild(a);
  
      a.click();
  
      a.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);
  
      if (err.response?.status === 403) {
        alert(
          "You do not have permission to export file logs."
        );
        return;
      }
  
      alert(
        err.response?.data?.error ||
          "Failed to export file logs."
      );
    }
  }

  /* ============================================================
     🖼️ UI
  ============================================================ */
  return (
    <>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5">
            🧾 File Upload Logs
          </h2>

          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
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
              <option value="">All Status</option>
              <option value="clean">Clean</option>
              <option value="error">Error</option>
              <option value="infected">Infected</option>
            </select>
          
            <input
              type="text"
              placeholder="Search by source..."
              className="admin-input w-60"
              value={draftFilters.source}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  source: event.target.value,
                }))
              }
            />
          
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary text-sm px-4 py-2 disabled:opacity-60"
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
                disabled={loading}
                onClick={() => exportFileLogs("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                Export XLSX
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => exportFileLogs("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
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
              Loading logs...
            </p>
          ) : (
            <>
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
                            {log.scanned_at
                              ? new Date(
                                  log.scanned_at
                                ).toLocaleDateString()
                              : "—"}
                          </td>
          
                          <td className="text-right">
                            <button
                              type="button"
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
                        <td
                          colSpan="6"
                          className="text-center opacity-70 p-4"
                        >
                          No logs found.
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

      {selectedLog && (
        <FileLogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}
