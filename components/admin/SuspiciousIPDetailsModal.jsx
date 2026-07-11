/* frontend/components/admin/SuspiciousIPDetailsModal.jsx */
import { useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient.js";

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
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const latestRequestIdRef = useRef(0);

  /* --------------------------------------------------
     Load details
  -------------------------------------------------- */
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
        `/admin/suspicious-ips/details/ip/${ipAddress}`,
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

  /* --------------------------------------------------
     Block / Unblock
  -------------------------------------------------- */
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

  /* --------------------------------------------------
     Close + cleanup
  -------------------------------------------------- */
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
  const from =
    total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to =
    total === 0
      ? 0
      : Math.min(from + incidents.length - 1, total);

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

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          Suspicious IP: {ipAddress}
        </h2>

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
            {/* Incident Table */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h3 className="font-bold">
                  🚨 Incident Log
                </h3>

                <span className="text-xs opacity-70">
                  Showing {from}–{to} of {total}
                </span>
              </div>

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

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <p className="text-xs opacity-70">
                    Page {page} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || loading}
                      onClick={() => goToPage(page - 1)}
                      className="admin-btn admin-btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages || loading}
                      onClick={() => goToPage(page + 1)}
                      className="admin-btn admin-btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
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

            {/* Admin Note */}
            <textarea
              placeholder="Admin note (required)"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              className="admin-input w-full"
              rows={3}
            />

            {/* Actions */}
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
