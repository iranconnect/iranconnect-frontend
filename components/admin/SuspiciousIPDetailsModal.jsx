/* frontend/components/admin/SuspiciousIPDetailsModal.jsx */
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function SuspiciousIPDetailsModal({
  ipRecord,
  onClose,
  currentUserRole,
  refreshList,
}) {
  const [incidents, setIncidents] = useState([]);
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  // ⭐ جلوگیری از React Hook Conditional Error
  const ipAddress = ipRecord?.ip_address || null;

  useEffect(() => {
    if (ipAddress) {
      fetchDetails(1);
    }
  }, [ipAddress]);

  async function fetchDetails(newPage) {
    if (!ipAddress) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        `/admin/suspicious-ips/details/ip/${ipAddress}`,
        {
          params: {
            page: newPage,
            pageSize: 10,
          },
        }
      );

      setIncidents(res.data.incidents || []);
      setPagination((prev) => res.data.pagination || prev);
      setPage(newPage);

      const meta = res.data.meta || {};
      setDetails(meta);

      if (meta.block_status === "blocked") {
        setShowNoteInput(false);
      }
    } catch (err) {
      console.error("❌ Error fetching suspicious IP details:", err);
      setError("Failed to load details.");
    } finally {
      setLoading(false);
    }
  }

  function goToPage(newPage) {
    if (
      newPage < 1 ||
      newPage > (pagination.totalPages || 1) ||
      newPage === page
    )
      return;

    fetchDetails(newPage);
  }

  async function handleAction(type) {
    if (!note.trim()) {
      alert("⚠️ Admin note is required.");
      return;
    }

    setActionLoading(true);

    try {
      const payload = {
        ip_address: ipAddress,
        reason: note,
      };

      await apiClient.post(`/admin/suspicious-ips/${type}`, payload);

      alert(
        type === "block"
          ? "IP successfully blocked."
          : "IP successfully unblocked."
      );

      setShowNoteInput(false);

      if (refreshList) refreshList();
      onClose();
    } catch (err) {
      console.error("❌ Action error:", err);
      alert("Failed to perform action.");
    } finally {
      setActionLoading(false);
    }
  }

  // ⭐ اگر ipRecord در لحظه null شود، modal به‌صورت کنترل‌شده نمایش می‌دهد
  if (!ipAddress) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="admin-card max-w-xl w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-turquoise text-lg font-bold"
          >
            ✖
          </button>
          <p className="text-center text-gray-300 py-6">
            No IP selected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-4xl w-full relative p-6 overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          Suspicious IP: {ipAddress}
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="space-y-5 text-sm">

            {/* 🚨 Incident Log */}
            <div>
              <h3 className="font-bold mb-2">🚨 Incident Log</h3>

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
                      incidents.map((item) => (
                        <tr key={item.id}>
                          <td>{item.suspicious_type}</td>
                          <td>{item.severity_level}</td>
                          <td>{item.count_attempts}</td>
                          <td>{new Date(item.first_seen).toLocaleString()}</td>
                          <td>{new Date(item.last_seen).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center opacity-70">
                          No incidents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div>
                  Page {pagination.page} of {pagination.totalPages}{" "}
                  {pagination.total > 0 && (
                    <span className="opacity-70">
                      ({pagination.total} records)
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="admin-btn admin-btn-secondary px-3 py-1"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    ◀ Prev
                  </button>

                  <button
                    className="admin-btn admin-btn-secondary px-3 py-1"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= (pagination.totalPages || 1)}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>

            {/* 🛡️ Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong>{" "}
                {details?.block_status === "blocked"
                  ? "🚫 Blocked"
                  : details?.block_status === "unblocked"
                  ? "🟢 Unblocked"
                  : "⚪ Not Blocked"}
              </div>

              <div>
                <strong>Resolved:</strong>{" "}
                {details?.resolved ? "✅ Yes" : "❌ No"}
              </div>

              {details?.block_reason && (
                <div>
                  <strong>Block Reason:</strong> {details.block_reason}
                </div>
              )}

              {details?.block_status === "blocked" && (
                <div>
                  <strong>Blocked By:</strong>{" "}
                  {details?.automatic
                    ? "🤖 Automatic system"
                    : details?.blocked_by_email || "Unknown"}
                </div>
              )}

              {details?.blocked_at && (
                <div>
                  <strong>Blocked At:</strong>{" "}
                  {new Date(details.blocked_at).toLocaleString()}
                </div>
              )}

              {details?.unblocked_reason && (
                <div>
                  <strong>Unblock Reason:</strong> {details.unblocked_reason}
                </div>
              )}

              {details?.unblocked_by_email && (
                <div>
                  <strong>Unblocked By:</strong>{" "}
                  {details.unblocked_by_email}
                </div>
              )}

              {details?.unblocked_at && (
                <div>
                  <strong>Unblocked At:</strong>{" "}
                  {new Date(details.unblocked_at).toLocaleString()}
                </div>
              )}

              {details?.resolved_at && (
                <div>
                  <strong>Resolved At:</strong>{" "}
                  {new Date(details.resolved_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* 📝 Note input */}
            {showNoteInput && (
              <div>
                <textarea
                  placeholder="Admin note (required)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="admin-input w-full mt-2"
                  rows={3}
                />
              </div>
            )}

            {/* 🎯 Actions */}
            <div className="flex gap-3 justify-end mt-2">
              {details?.block_status !== "blocked" && (
                <button
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                  onClick={() => handleAction("block")}
                  disabled={actionLoading}
                >
                  Block IP
                </button>
              )}

              {currentUserRole === "superadmin" &&
                details?.block_status === "blocked" && (
                  <button
                    className="admin-btn admin-btn-secondary px-4 py-2 text-sm"
                    onClick={() => handleAction("unblock")}
                    disabled={actionLoading}
                  >
                    Unblock IP
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
