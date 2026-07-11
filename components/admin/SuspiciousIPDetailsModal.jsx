/* frontend/components/admin/SuspiciousIPDetailsModal.jsx */
import { useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient.js";
import Pagination from "../ui/Pagination";

const PAGE_SIZE = 10;

const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function SuspiciousIPDetailsModal({
  ipRecord,
  onClose,
  refreshList,
}) {
  const ipAddress = ipRecord?.ip_address || null;

  const [incidents, setIncidents] = useState([]);
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    if (!ipAddress) {
      return;
    }

    fetchDetails(1);
  }, [ipAddress]);

  async function fetchDetails(newPage) {
    if (!ipAddress) {
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        `/admin/suspicious-ips/details/ip/${encodeURIComponent(
          ipAddress
        )}`,
        {
          params: {
            page: newPage,
            pageSize: PAGE_SIZE,
          },
          withCredentials: true,
        }
      );

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      const nextPagination =
        res.data?.pagination || DEFAULT_PAGINATION;

      setIncidents(res.data?.incidents || []);
      setDetails(res.data?.meta || {});
      setPagination({
        page: nextPagination.page || newPage,
        pageSize: nextPagination.pageSize || PAGE_SIZE,
        total: nextPagination.total || 0,
        totalPages: Math.max(nextPagination.totalPages || 1, 1),
      });
      setPage(nextPagination.page || newPage);
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      console.error(
        "❌ Failed to load suspicious IP details:",
        err
      );

      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }

      setError(
        err.response?.data?.error ||
          "Failed to load IP details."
      );

      setIncidents([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function goToPage(newPage) {
    const totalPages = Math.max(
      pagination.totalPages || 1,
      1
    );

    if (
      loading ||
      newPage < 1 ||
      newPage > totalPages ||
      newPage === page
    ) {
      return;
    }

    fetchDetails(newPage);
  }

  async function handleExportDetailsXLSX() {
    if (!ipAddress || exportLoading) {
      return;
    }

    setExportLoading(true);

    try {
      const res = await apiClient.get(
        `/admin/suspicious-ips/details/ip/${encodeURIComponent(
          ipAddress
        )}/export/xlsx`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data]);

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      const safeIp = ipAddress.replace(/[^a-zA-Z0-9_.-]/g, "_");

      link.href = url;
      link.download = `IranConnect_SuspiciousIP_${safeIp}_Details.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "❌ Suspicious IP details export failed:",
        err
      );

      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }

      alert(
        err.response?.data?.error ||
          "Failed to export suspicious IP details."
      );
    } finally {
      setExportLoading(false);
    }
  }

  async function handleAction(type) {
    if (actionLoading) {
      return;
    }

    if (!note.trim()) {
      alert("⚠️ Admin note is required.");
      return;
    }

    setActionLoading(true);

    try {
      await apiClient.post(
        `/admin/suspicious-ips/${type}`,
        {
          ip_address: ipAddress,
          reason: note,
        },
        {
          withCredentials: true,
        }
      );

      alert(
        type === "block"
          ? "IP successfully blocked."
          : "IP successfully unblocked."
      );

      refreshList?.();
      handleClose();
    } catch (err) {
      console.error("❌ Action failed:", err);

      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }

      alert(
        err.response?.data?.error ||
          "Operation failed. Permission denied or invalid state."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleClose() {
    latestRequestIdRef.current += 1;

    setIncidents([]);
    setDetails(null);
    setNote("");
    setPage(1);
    setPagination(DEFAULT_PAGINATION);
    setError("");

    onClose();
  }

  if (!ipAddress) {
    return null;
  }

  const total = pagination.total || 0;
  const totalPages = Math.max(pagination.totalPages || 1, 1);

  const normalizedPagination = {
    page,
    limit: pagination.pageSize || PAGE_SIZE,
    total,
    totalPages,
    from:
      total === 0
        ? 0
        : (page - 1) * (pagination.pageSize || PAGE_SIZE) + 1,
    to:
      total === 0
        ? 0
        : Math.min(
            (page - 1) * (pagination.pageSize || PAGE_SIZE) +
              incidents.length,
            total
          ),
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="admin-card max-w-5xl w-full relative p-6 overflow-y-auto max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
          <div></div>

          <h2 className="text-xl font-semibold text-center text-turquoise">
            Suspicious IP: {ipAddress}
          </h2>

          <button
            type="button"
            disabled={exportLoading || loading}
            onClick={handleExportDetailsXLSX}
            className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {exportLoading ? "Exporting..." : "Export XLSX"}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">
            Loading...
          </p>
        ) : error ? (
          <p className="text-center text-red-500">
            {error}
          </p>
        ) : (
          <div className="space-y-5 text-sm">
            <div>
              <h3 className="font-bold mb-2">
                🚨 Incident Log
              </h3>

              <div className="overflow-x-auto">
                <table className="admin-table text-sm">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Attempts</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                    </tr>
                  </thead>

                  <tbody>
                    {incidents.length ? (
                      incidents.map((incident) => (
                        <tr key={incident.id}>
                          <td>{incident.suspicious_type}</td>
                          <td>{incident.severity_level}</td>
                          <td>{incident.count_attempts}</td>
                          <td>
                            {incident.first_seen
                              ? new Date(
                                  incident.first_seen
                                ).toLocaleString()
                              : "—"}
                          </td>
                          <td>
                            {incident.last_seen
                              ? new Date(
                                  incident.last_seen
                                ).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center opacity-70 p-4"
                        >
                          No incidents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagination={normalizedPagination}
                onPageChange={goToPage}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong>{" "}
                {details?.block_status === "blocked"
                  ? "🚫 Blocked"
                  : details?.block_status === "unblocked"
                  ? "🟢 Unblocked"
                  : "⚪ Not Blocked"}
              </div>

              {details?.blocked_at && (
                <div>
                  <strong>Blocked At:</strong>{" "}
                  {new Date(
                    details.blocked_at
                  ).toLocaleString()}
                </div>
              )}

              {details?.unblocked_at && (
                <div>
                  <strong>Unblocked At:</strong>{" "}
                  {new Date(
                    details.unblocked_at
                  ).toLocaleString()}
                </div>
              )}
            </div>

            <textarea
              placeholder="Admin note (required)"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              className="admin-input w-full"
              rows={3}
            />

            <div className="flex justify-end gap-3">
              {details?.block_status !== "blocked" && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                  onClick={() => handleAction("block")}
                >
                  {actionLoading ? "Processing..." : "Block IP"}
                </button>
              )}

              {details?.block_status === "blocked" && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  disabled={actionLoading}
                  onClick={() => handleAction("unblock")}
                >
                  {actionLoading
                    ? "Processing..."
                    : "Unblock IP"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
