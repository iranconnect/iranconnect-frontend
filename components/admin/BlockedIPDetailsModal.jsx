// frontend/components/admin/BlockedIPDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function BlockedIPDetailsModal({
  ipRecord,
  onClose,
  refreshList,
}) {
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(true);

  /* -----------------------------------------------------------
     📦 Load full details from backend (role-aware)
  ----------------------------------------------------------- */
  useEffect(() => {
    if (ipRecord?.ip_address) fetchDetails();
  }, [ipRecord]);

  async function fetchDetails() {
    setLoading(true);

    try {
      const res = await apiClient.get(
        `/admin/blocked-ips/details/${ipRecord.ip_address}`,
        { withCredentials: true }
      );

      setDetails(res.data);

      // اگر قبلاً unblock شده → نوت لازم نیست
      if (res.data.status === "unblocked") {
        setShowNoteInput(false);
      }

    } catch (err) {
      console.error("❌ Error fetching blocked IP details:", err);
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------------------------------
     🔓 Unblock Action (UI guard فقط – enforce اصلی بک‌اند)
  ----------------------------------------------------------- */
  async function handleUnblock() {
    if (!note.trim()) {
      alert("⚠️ Admin note (reason) is required.");
      return;
    }

    if (details.current_admin_role !== "superadmin") {
      alert("Only superadmin can unblock IPs.");
      return;
    }

    setActionLoading(true);

    try {
      await apiClient.post(
        "/admin/blocked-ips/unblock",
        {
          ip_address: details.ip_address,
          reason: note,
        },
        { withCredentials: true }
      );

      alert("🟢 IP successfully unblocked.");

      setShowNoteInput(false);

      if (refreshList) refreshList();
      onClose();

    } catch (err) {
      console.error("❌ Unblock error:", err);
      alert("Failed to unblock IP.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!ipRecord) return null;

  /* -----------------------------------------------------------
     🖥️ UI
  ----------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full relative p-6">

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          Blocked IP Details
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : details ? (
          <div className="space-y-3 text-sm">

            <div><strong>IP Address:</strong> {details.ip_address}</div>

            <div>
              <strong>Status:</strong>{" "}
              {details.status === "blocked" ? "🚫 Blocked" : "🟢 Unblocked"}
            </div>

            <div>
              <strong>Blocked At:</strong>{" "}
              {details.blocked_at
                ? new Date(details.blocked_at).toLocaleString()
                : "—"}
            </div>

            <div>
              <strong>Block Reason:</strong> {details.reason || "—"}
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
                  {new Date(details.unblocked_at).toLocaleString()}
                </div>

                <div>
                  <strong>Unblock Reason:</strong>{" "}
                  {details.unblocked_reason || "—"}
                </div>

                {details.unblocked_by_email && (
                  <div>
                    <strong>Unblocked By:</strong> {details.unblocked_by_email}
                  </div>
                )}
              </>
            )}

            {showNoteInput &&
              details.current_admin_role === "superadmin" &&
              details.status === "blocked" && (
                <textarea
                  placeholder="Unblock reason (required)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="admin-input w-full mt-2"
                  rows={3}
                />
              )}

            <div className="flex justify-end mt-4">
              {details.current_admin_role === "superadmin" &&
                details.status === "blocked" && (
                  <button
                    className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                    onClick={handleUnblock}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Unblock IP"}
                  </button>
                )}

              {details.status === "unblocked" && (
                <span className="text-green-500 font-medium">
                  Already Unblocked
                </span>
              )}
            </div>

          </div>
        ) : (
          <p className="text-center text-red-500">Failed to load details.</p>
        )}
      </div>
    </div>
  );
}
