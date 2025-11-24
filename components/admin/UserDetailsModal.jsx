//frontend/components/admin/UserDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function UserDetailsModal({ user, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState("");

  /* 🔐 دریافت نقش کاربر جاری از /auth/me */
  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await apiClient.get("/auth/me", { withCredentials: true });
        if (res.data?.role) {
          setCurrentRole(res.data.role);
        }
      } catch (err) {
        console.warn("⚠️ Could not fetch user role", err);
        setCurrentRole(""); // fallback
      }
    }
    fetchRole();
  }, []);

  /* 🧩 دریافت جزئیات کاربر */
  useEffect(() => {
    if (user?.id) fetchDetails();
  }, [user]);

  async function fetchDetails() {
    setLoading(true);
    setForbidden(false);

    try {
      const res = await apiClient.get(`/admin/users/${user.id}`, {
        withCredentials: true,
      });
      setDetails(res.data);
    } catch (err) {
      console.error("❌ Error fetching user details:", err);

      if (err.response?.status === 403) {
        setForbidden(true);
        setErrorMsg("⚠️ You are not authorized to view this user's details.");
      } else {
        setErrorMsg("Failed to load user details.");
      }

      setDetails(null);
    } finally {
      setLoading(false);
    }
  }

  /* 🔒 بلاک / آنبلاک کاربر */
  async function toggleBlock() {
    try {
      await apiClient.patch(
        `/admin/users/${user.id}/block`,
        {},
        { withCredentials: true }
      );

      await apiClient.post(
        `/admin/users/logs`,
        {
          action_type: details.is_blocked ? "UNBLOCK_USER" : "BLOCK_USER",
          target_user_id: user.id,
          description: `${details.is_blocked ? "Unblocked" : "Blocked"} user ${
            user.email
          }`,
        },
        { withCredentials: true }
      );

      fetchDetails();
      alert(
        `✅ User ${details.is_blocked ? "unblocked" : "blocked"} successfully`
      );
    } catch (err) {
      if (err.response?.status === 403) {
        alert("⛔ You are not authorized to perform this action.");
        setForbidden(true);
      } else {
        alert("❌ Failed to update user status");
      }
      console.error(err);
    }
  }
  /* 👑 تغییر نقش (فقط سوپرادمین) */
  async function handleRoleChange(newRole) {
    if (currentRole !== "superadmin") {
      alert("⛔ Only Super Admins can change user roles.");
      return;
    }

    try {
      await apiClient.patch(
        `/admin/users/${user.id}/role`,
        { role: newRole },
        { withCredentials: true }
      );

      await apiClient.post(
        `/admin/users/logs`,
        {
          action_type: "CHANGE_ROLE",
          target_user_id: user.id,
          description: `Changed role of ${user.email} to ${newRole}`,
        },
        { withCredentials: true }
      );

      alert(`✅ Role changed to ${newRole}`);
      fetchDetails();
    } catch (err) {
      if (err.response?.status === 403) {
        alert("⛔ You are not authorized to perform this action.");
        setForbidden(true);
      } else {
        alert("❌ Failed to change role");
      }
      console.error(err);
    } finally {
      setRoleMenuOpen(false);
    }
  }

  /* 🗑 حذف کاربر (فقط سوپرادمین) */
  async function handleDelete() {
    if (currentRole !== "superadmin") {
      alert("⛔ Only Super Admins can delete users.");
      return;
    }

    const confirmEmail = prompt(`Type "${user.email}" to confirm deletion:`);
    if (confirmEmail !== user.email) return alert("Email mismatch — canceled.");

    try {
      await apiClient.delete(`/admin/users/${user.id}`, {
        withCredentials: true,
      });

      await apiClient.post(
        `/admin/users/logs`,
        {
          action_type: "DELETE_USER",
          target_user_id: user.id,
          description: `Deleted user ${user.email}`,
        },
        { withCredentials: true }
      );

      alert("🗑️ User deleted successfully");
      onClose();
    } catch (err) {
      if (err.response?.status === 403) {
        alert("⛔ You are not authorized to delete this account.");
        setForbidden(true);
      } else {
        alert("❌ Failed to delete user");
      }
      console.error(err);
    }
  }

  /* ✉️ ارسال ایمیل */
  async function handleSendEmail(e) {
    e.preventDefault();

    if (!emailSubject || !emailBody.trim()) {
      alert("Please enter a subject and message.");
      return;
    }

    setSendingEmail(true);

    try {
      await apiClient.post(
        `/admin/users/${user.id}/send-email`,
        {
          subject: emailSubject,
          message: emailBody,
        },
        { withCredentials: true }
      );

      await apiClient.post(
        `/admin/users/logs`,
        {
          action_type: "SEND_EMAIL",
          target_user_id: user.id,
          description: `Sent email to ${user.email} with subject "${emailSubject}"`,
        },
        { withCredentials: true }
      );

      alert("✅ Email sent successfully!");
      setEmailBody("");
      setEmailSubject("");
      setEmailModalOpen(false);
    } catch (err) {
      if (err.response?.status === 403) {
        alert("⛔ You are not authorized to send email to this user.");
        setForbidden(true);
      } else {
        alert("❌ Failed to send email");
      }
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">

        {/* ✖ دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        {/* عنوان مودال */}
        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          User Details
        </h2>

        {/* وضعیت‌ها */}
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : errorMsg ? (
          <p className="text-center text-red-500">{errorMsg}</p>
        ) : !details ? (
          <p className="text-center text-gray-400">User not found.</p>
        ) : (
          <div className="space-y-4 text-sm">

            {/* جزئیات کاربر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <span className="font-medium text-turquoise">Email:</span>
                <p className="opacity-80">{details.email}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Role:</span>
                <p className="opacity-80 capitalize">{details.role}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Verified:</span>
                <p>{details.is_verified ? "✅ Yes" : "❌ No"}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Blocked:</span>
                <p>{details.is_blocked ? "🚫 Blocked" : "🟢 Active"}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Created At:</span>
                <p>{new Date(details.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Last Login:</span>
                <p>
                  {details.last_login_at
                    ? new Date(details.last_login_at).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <span className="font-medium text-turquoise">
                  Verified Business Claims:
                </span>
                <p>{details.business_count ?? 0}</p>
              </div>
              <div>
                <span className="font-medium text-turquoise">Ratings:</span>
                <p>{details.rating_count ?? 0}</p>
              </div>
            </div>

            {/* 🎛 دکمه‌های مدیریتی */}
            {!forbidden ? (
              <div className="flex flex-wrap gap-3 mt-6 justify-end">

                {/* فقط سوپرادمین */}
                {currentRole === "superadmin" && (
                  <div className="relative">
                    <button
                      onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      Change Role
                    </button>

                    {roleMenuOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-md z-50">
                        {["user", "admin", "superadmin"]
                          .filter((r) => r !== details.role)
                          .map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(r)}
                              className="block w-full text-left px-3 py-2 hover:bg-[var(--bg)]"
                            >
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* بلاک / آنبلاک */}
                <button
                  onClick={toggleBlock}
                  className="admin-btn admin-btn-secondary text-sm"
                >
                  {details.is_blocked ? "Unblock" : "Block"}
                </button>

                {/* ارسال ایمیل */}
                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="admin-btn admin-btn-secondary text-sm"
                >
                  Send Email
                </button>

                {/* حذف (فقط سوپرادمین) */}
                {currentRole === "superadmin" && (
                  <button
                    onClick={handleDelete}
                    className="admin-btn admin-btn-primary bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-yellow-500 italic mt-4">
                ⚠️ You are not authorized to perform any action on this account.
              </p>
            )}
          </div>
        )}

        {/* ✉️ مودال ارسال ایمیل */}
        {emailModalOpen && details && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="admin-card max-w-lg w-full relative">
              <h3 className="text-lg font-semibold mb-3 text-turquoise">
                Send Email to {details.email}
              </h3>

              <form onSubmit={handleSendEmail} className="space-y-3">
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject"
                  className="admin-input"
                />

                <textarea
                  rows="5"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Message body..."
                  className="admin-input"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="admin-btn admin-btn-primary"
                  >
                    {sendingEmail ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
