/*frontend/components/admin/LoginAttemptDetailsModal.jsx*/
'use client';
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function LoginAttemptDetailsModal({ attempt, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------
     ⌨️ Close modal with ESC
  --------------------------------------------------------- */
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ---------------------------------------------------------
     📦 Load login attempt details
  --------------------------------------------------------- */
  useEffect(() => {
    if (attempt?.id) fetchDetails();
  }, [attempt]);

  async function fetchDetails() {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/admin/login-attempts/details/${attempt.id}`,
        {
          withCredentials: true,
          headers: {
            "x-iranconnect-admin": "true",
          },
        }
      );
      setDetails(res.data);
    } catch (err) {
      console.error("❌ Error fetching login attempt details:", err);
      // fallback به داده اولیه برای جلوگیری از UI خالی
      setDetails(attempt);
    } finally {
      setLoading(false);
    }
  }

  if (!attempt) return null;

  /* ---------------------------------------------------------
     🖼 UI
  --------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="admin-card max-w-lg w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-3 text-center text-turquoise">
          Login Attempt Details
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : details ? (
          <div className="space-y-2 text-sm">
            <div>
              <strong>Email:</strong> {details.email || "—"}
            </div>
            <div>
              <strong>IP Address:</strong> {details.ip_address || "—"}
            </div>
            <div>
              <strong>Success:</strong>{" "}
              {details.success ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>User Agent:</strong>{" "}
              {details.user_agent || "—"}
            </div>
            <div>
              <strong>Created At:</strong>{" "}
              {details.created_at
                ? new Date(details.created_at).toLocaleString()
                : "—"}
            </div>
            {details.location && (
              <div>
                <strong>Location:</strong> {details.location}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400">No details available.</p>
        )}
      </div>
    </div>
  );
}
