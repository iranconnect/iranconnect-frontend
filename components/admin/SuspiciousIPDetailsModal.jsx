/* frontend/components/admin/SuspiciousIPDetailsModal.jsx */
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function SuspiciousIPDetailsModal({
  ipRecord,
  onClose,
  refreshList,
  securityConfig,
}) {
  const ipAddress = ipRecord?.ip_address || null;

  const [incidents, setIncidents] = useState([]);
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  /* --------------------------------------------------
     🔄 Load details (safe)
  -------------------------------------------------- */
  useEffect(() => {
    if (ipAddress) fetchDetails(1);
  }, [ipAddress]);

  async function fetchDetails(newPage) {
    if (!ipAddress) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        `/admin/suspicious-ips/details/ip/${ipAddress}`,
        { params: { page: newPage, pageSize: 10 } }
      );

      setIncidents(res.data.incidents || []);
      setPagination(res.data.pagination || pagination);
      setDetails(res.data.meta || {});
      setPage(newPage);
    } catch (err) {
      console.error("❌ Failed to load suspicious IP details:", err);
      setError("Failed to load IP details.");
    } finally {
      setLoading(false);
    }
  }

  function goToPage(newPage) {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages ||
      newPage === page
    )
      return;

    fetchDetails(newPage);
  }

  /* --------------------------------------------------
     🚫 Block / Unblock (backend enforced)
  -------------------------------------------------- */
  async function handleAction(type) {
    if (actionLoading) return;

    if (!note.trim()) {
      alert("⚠️ Admin note is required.");
      return;
    }

    setActionLoading(true);

    try {
      await apiClient.post(`/admin/suspicious-ips/${type}`, {
        ip_address: ipAddress,
        reason: note,
      });

      alert(
        type === "block"
          ? "IP successfully blocked."
          : "IP successfully unblocked."
      );

      refreshList?.();
      handleClose();
    } catch (err) {
      console.error("❌ Action failed:", err);
      alert(
        err.response?.data?.error ||
          "Operation failed. Permission denied or invalid state."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* --------------------------------------------------
     🧹 Secure close (cleanup sensitive state)
  -------------------------------------------------- */
  function handleClose() {
    setIncidents([]);
    setDetails(null);
    setNote("");
    setPage(1);
    setError("");
    onClose();
  }

  if (!ipAddress) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-4xl w-full relative p-6 overflow-y-auto max-h-[90vh]">
        <button
          onClick={handleClose}
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

            {/* Incident Table */}
            <div>
              <h3 className="font-bold mb-2">🚨 Incident Log</h3>
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
                    incidents.map((i) => (
                      <tr key={i.id}>
                        <td>{i.suspicious_type}</td>
                        <td>{i.severity_level}</td>
                        <td>{i.count_attempts}</td>
                        <td>{new Date(i.first_seen).toLocaleString()}</td>
                        <td>{new Date(i.last_seen).toLocaleString()}</td>
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

            {/* Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong>{" "}
                {details.block_status === "blocked"
                  ? "🚫 Blocked"
                  : details.block_status === "unblocked"
                  ? "🟢 Unblocked"
                  : "⚪ Not Blocked"}
              </div>

              {details.blocked_at && (
                <div>
                  <strong>Blocked At:</strong>{" "}
                  {new Date(details.blocked_at).toLocaleString()}
                </div>
              )}

              {details.unblocked_at && (
                <div>
                  <strong>Unblocked At:</strong>{" "}
                  {new Date(details.unblocked_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Admin Note */}
            {(details.block_status !== "blocked" ||
              details.block_status === "blocked") && (
              <textarea
                placeholder="Admin note (required)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="admin-input w-full"
                rows={3}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {details.block_status !== "blocked" && (
                <button
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                  onClick={() => handleAction("block")}
                >
                  Block IP
                </button>
              )}

              {details.block_status === "blocked" && (
                <button
                  className="admin-btn admin-btn-secondary"
                  disabled={actionLoading}
                  onClick={() => handleAction("unblock")}
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
