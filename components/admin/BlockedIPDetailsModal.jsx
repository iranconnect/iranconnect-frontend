// frontend/components/admin/BlockedIPDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function BlockedIPDetailsModal({
  ipRecord,
  onClose,
  refreshList,
}) {
  const ipAddress = ipRecord?.ip_address || null;

  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ipAddress) {
      return;
    }

    fetchDetails();
  }, [ipAddress]);

  async function fetchDetails() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        `/admin/blocked-ips/details/${encodeURIComponent(
          ipAddress
        )}`,
        {
          withCredentials: true,
        }
      );

      setDetails(res.data || {});
    } catch (err) {
      console.error(
        "❌ Error fetching blocked IP details:",
        err
      );

      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }

      setError(
        err.response?.data?.error ||
          "Failed to load details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock() {
    if (actionLoading) {
      return;
    }

    if (!note.trim()) {
      alert("⚠️ Unblock reason is required.");
      return;
    }

    setActionLoading(true);

    try {
      await apiClient.post(
        "/admin/blocked-ips/unblock",
        {
          ip_address: ipAddress,
          reason: note.trim(),
        },
        {
          withCredentials: true,
        }
      );

      alert("🟢 IP successfully unblocked.");

      refreshList?.();
      handleClose();
    } catch (err) {
      console.error("❌ Unblock error:", err);

      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }

      alert(
        err.response?.data?.error ||
          "Failed to unblock IP."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleClose() {
    setDetails(null);
    setNote("");
    setError("");
    onClose();
  }

  if (!ipAddress) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="admin-card max-w-xl w-full relative p-6"
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
          Blocked IP Details
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">
            Loading...
          </p>
        ) : error ? (
          <p className="text-center text-red-500">
            {error}
          </p>
        ) : details ? (
          <div className="space-y-3 text-sm">
            <div>
              <strong>IP Address:</strong>{" "}
              {details.ip_address || ipAddress}
            </div>

            <div>
              <strong>Status:</strong>{" "}
              {details.status === "blocked"
                ? "🚫 Blocked"
                : "🟢 Unblocked"}
            </div>

            <div>
              <strong>Blocked At:</strong>{" "}
              {details.blocked_at
                ? new Date(details.blocked_at).toLocaleString()
                : "—"}
            </div>

            <div>
              <strong>Block Reason:</strong>{" "}
              {details.reason || "—"}
            </div>

            <div>
              <strong>Blocked By:</strong>{" "}
              {details.automatic
                ? "🤖 Automatic system"
                : details.blocked_by_email || "—"}
            </div>

            {details.unblocked_at && (
              <>
                <div>
                  <strong>Unblocked At:</strong>{" "}
                  {new Date(
                    details.unblocked_at
                  ).toLocaleString()}
                </div>

                <div>
                  <strong>Unblock Reason:</strong>{" "}
                  {details.unblocked_reason || "—"}
                </div>

                <div>
                  <strong>Unblocked By:</strong>{" "}
                  {details.unblocked_by_email || "—"}
                </div>
              </>
            )}

            {details.status === "blocked" && (
              <textarea
                placeholder="Unblock reason (required)"
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                className="admin-input w-full mt-2"
                rows={3}
              />
            )}

            <div className="flex justify-end mt-4">
              {details.status === "blocked" ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                  onClick={handleUnblock}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : "Unblock IP"}
                </button>
              ) : (
                <span className="text-green-500 font-medium">
                  Already Unblocked
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-red-500">
            Failed to load details.
          </p>
        )}
      </div>
    </div>
  );
}
