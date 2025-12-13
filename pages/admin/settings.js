// pages/admin/settings.js
import { useState, useEffect, useRef } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";

export default function SettingsPage() {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("user");

  // 🛡️ شمارنده خطا برای جلوگیری از brute-force سمت کلاینت
  const errorCountRef = useRef(0);

  /* =====================================================
     🔐 بررسی دسترسی ادمین (UX-level)
  ===================================================== */
  useEffect(() => {
    const token = localStorage.getItem("iran_token");
    const userRole = localStorage.getItem("iran_role");

    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    if (!["admin", "superadmin"].includes(userRole)) {
      window.location.href = "/";
      return;
    }

    setRole(userRole);
  }, []);

  /* =====================================================
     🔐 تغییر رمز عبور
  ===================================================== */
  async function handlePasswordChange(e) {
    e.preventDefault();
    setMsg("");
    setError("");

    const { current, new: newPass, confirm } = passwords;

    // ⛔ جلوگیری از brute-force سمت کلاینت
    if (errorCountRef.current >= 3) {
      setError("Too many failed attempts. Please refresh the page and try again.");
      return;
    }

    if (!current || !newPass || !confirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPass !== confirm) {
      setError("New passwords do not match.");
      errorCountRef.current += 1;
      return;
    }

    // 🔐 Regex قوی (هماهنگ با استاندارد امنیتی)
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;

    if (!strongRegex.test(newPass)) {
      setError(
        "Password must include uppercase, lowercase, number, and special character (min 8 chars)."
      );
      errorCountRef.current += 1;
      return;
    }

    try {
      setLoading(true);

      await apiClient.post(`/admin/change-password`, {
        currentPassword: current,
        newPassword: newPass,
      });

      setMsg("✅ Password updated successfully. You will be logged out.");
      setPasswords({ current: "", new: "", confirm: "" });
      errorCountRef.current = 0;

      // 🔒 Logout اجباری بعد از تغییر رمز
      setTimeout(() => {
        localStorage.removeItem("iran_token");
        localStorage.removeItem("iran_role");
        window.location.href = "/auth/login";
      }, 1500);

    } catch (err) {
      console.error("❌ Password change error:", err);
      errorCountRef.current += 1;
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-6">
          ⚙️ Settings
        </h2>

        {/* ================== Change Password ================== */}
        <section
          className="mb-8 p-5 rounded-2xl border border-[var(--border)]
          bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),
          -5px_-5px_15px_var(--shadow-light)] transition"
        >
          <h3 className="text-base font-medium mb-3">🔐 Change Password</h3>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            {/* Current password */}
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Current password"
                value={passwords.current}
                autoComplete="current-password"
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                className="w-full p-3 border border-[var(--border)] rounded
                bg-[var(--bg)] text-[var(--text)] pr-10
                focus:outline-none focus:ring-2 focus:ring-turquoise transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-turquoise"
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* New password */}
            <input
              type="password"
              placeholder="New password"
              value={passwords.new}
              autoComplete="new-password"
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
              className="w-full p-3 border border-[var(--border)] rounded
              bg-[var(--bg)] text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-turquoise transition"
            />

            {/* Confirm password */}
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwords.confirm}
              autoComplete="new-password"
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              className="w-full p-3 border border-[var(--border)] rounded
              bg-[var(--bg)] text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-turquoise transition"
            />

            <p className="text-xs text-gray-500 mt-1">
              Password must contain uppercase, lowercase, number, and symbol (min 8 characters).
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 px-4 py-2 bg-turquoise text-navy font-medium rounded
              shadow hover:bg-turquoise/90 transition
              disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {msg && (
              <p className="text-sm mt-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {msg}
              </p>
            )}
            {error && (
              <p className="text-sm mt-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </p>
            )}
          </form>
        </section>

        {/* ================== System Info ================== */}
        <section
          className="p-5 rounded-2xl border border-[var(--border)]
          bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),
          -5px_-5px_15px_var(--shadow-light)] transition"
        >
          <h3 className="text-base font-medium mb-3">🖥️ System Info</h3>
          <ul className="text-sm opacity-80 space-y-2">
            <li>
              Logged in as: <b>{role}</b>
            </li>
            <li>
              Frontend Version: <b>v1.0</b>
            </li>
            <li>
              Backend API: <b>Connected</b>
            </li>
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
