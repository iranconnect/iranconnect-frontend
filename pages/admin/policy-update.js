//pages/admin/policy-update.js
'use client';

import { useState, useEffect } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";

export default function PolicyUpdatePage() {
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Auth Check — admin / superadmin only
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

        if (mounted) setAuthChecked(true);
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
     🚀 Send bulk policy update email
  ============================================================ */
  const handleSend = async () => {
    if (loading) return;

    setLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await apiClient.post(
        "/admin/send-policy-update",
        { lang },
        { withCredentials: true }
      );

      setMsg(
        res.data?.message ||
          "✅ Policy update emails sent successfully!"
      );
    } catch (err) {
      console.error("❌ Error sending policy update emails:", err);
      setError(
        err.response?.data?.error ||
          "Failed to send policy update emails."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     🛑 Block render until auth confirmed
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
      <main className="flex flex-col items-center justify-center py-12 px-6">
        <div
          className="w-full max-w-lg border border-[var(--border)] bg-[var(--card-bg)]
          rounded-2xl shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)]
          p-8 transition"
        >
          <h2 className="text-xl font-semibold text-[var(--text)] text-center mb-6">
            📬 Send Policy Update Email
          </h2>

          {/* Language selector */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-[var(--text)] opacity-80">
              Select email language:
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg p-2
              bg-[var(--bg)] text-[var(--text)]
              focus:ring-2 focus:ring-turquoise"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="fa">فارسی</option>
            </select>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-3 bg-turquoise text-navy font-semibold
            rounded-lg shadow hover:bg-turquoise/90 transition
            disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Policy Update"}
          </button>

          {/* Messages */}
          {msg && (
            <p className="mt-4 text-green-600 bg-green-50 border border-green-200
              rounded-md p-2 text-sm text-center">
              {msg}
            </p>
          )}

          {error && (
            <p className="mt-4 text-red-600 bg-red-50 border border-red-200
              rounded-md p-2 text-sm text-center">
              {error}
            </p>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}
