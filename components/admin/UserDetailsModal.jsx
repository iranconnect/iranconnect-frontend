// frontend/components/admin/UserDetailsModal.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../../utils/apiClient";

export default function UserDetailsModal({ user, onClose }) {
  const mountedRef = useRef(true);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [currentRole, setCurrentRole] = useState("");

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* ----------------------------------------------------
     🧹 Prevent state update after unmount
  ---------------------------------------------------- */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ----------------------------------------------------
     🔐 Fetch current admin role
  ---------------------------------------------------- */
  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });
        if (mountedRef.current) {
          setCurrentRole(res.data?.role || "");
        }
      } catch {
        // fallback: least privilege
        if (mountedRef.current) setCurrentRole("");
      }
    }
    fetchRole();
  }, []);

  /* ----------------------------------------------------
     🧩 Fetch user details
  ---------------------------------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    fetchDetails();
  }, [user]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setErrorMsg("");

    try {
      const res = await apiClient.get(`/admin/users/${user.id}`, {
        withCredentials: true,
      });
      if (mountedRef.current) setDetails(res.data);
    } catch (err) {
      if (!mountedRef.current) return;

      if (err.response?.status === 403) {
        setForbidden(true);
        setErrorMsg("⚠️ You are not authorized to view this user's details.");
      } else {
        setErrorMsg("Failed to load user details.");
      }
      setDetails(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  /* ----------------------------------------------------
     🔒 Block / Unblock User
  ---------------------------------------------------- */
  const toggleBlock = useCallback(async () => {
    if (actionLoading || forbidden) return;

    setActionLoading(true);
    try {
      await apiClient.patch(
        `/admin/users/${user.id}/block`,
        {},
        { withCredentials: true }
      );

      alert(`✅ User ${details.is_blocked ? "unblocked" : "blocked"} successfully`);
      fetchDetails();
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
        alert("⛔ Not authorized.");
      } else {
        alert("❌ Failed to update user status");
      }
    } finally {
      if (mountedRef.current) setActionLoading(false);
    }
  }, [actionLoading, forbidden, details, user, fetchDetails]);
  /* ----------------------------------------------------
     👑 Change Role (SuperAdmin Only)
  ---------------------------------------------------- */
  const handleRoleChange = useCallback(
    async (newRole) => {
      if (currentRole !== "superadmin" || actionLoading || forbidden) {
        alert("⛔ Only Super Admins can change roles.");
        return;
      }

      setActionLoading(true);
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
          setForbidden(true);
          alert("⛔ Not authorized.");
        } else {
          alert("❌ Failed to change role");
        }
      } finally {
        if (mountedRef.current) setActionLoading(false);
        setRoleMenuOpen(false);
      }
    },
    [currentRole, actionLoading, forbidden, user, fetchDetails]
  );

  /* ----------------------------------------------------
     🗑 Delete User (SuperAdmin Only)
  ---------------------------------------------------- */
  const handleDelete = useCallback(async () => {
    if (currentRole !== "superadmin" || actionLoading || forbidden) {
      alert("⛔ Only Super Admins can delete users.");
      return;
    }

    const confirmEmail = prompt(`Type "${user.email}" to confirm deletion:`);
    if (confirmEmail !== user.email) return;

    setActionLoading(true);
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
        setForbidden(true);
        alert("⛔ Not authorized.");
      } else {
        alert("❌ Failed to delete user");
      }
    } finally {
      if (mountedRef.current) setActionLoading(false);
    }
  }, [currentRole, actionLoading, forbidden, user, onClose]);

  /* ----------------------------------------------------
     ✉️ Send Email
  ---------------------------------------------------- */
  async function handleSendEmail(e) {
    e.preventDefault();
    if (sendingEmail || forbidden) return;

    if (!emailSubject || !emailBody.trim()) {
      alert("Please enter subject and message.");
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
          description: `Sent email to ${user.email}`,
        },
        { withCredentials: true }
      );

      alert("✅ Email sent successfully");
      setEmailModalOpen(false);
      setEmailSubject("");
      setEmailBody("");
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
        alert("⛔ Not authorized.");
      } else {
        alert("❌ Failed to send email");
      }
    } finally {
      if (mountedRef.current) setSendingEmail(false);
    }
  }

  /* ----------------------------------------------------
     🧠 ESC handling (safe)
  ---------------------------------------------------- */
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        if (emailModalOpen) setEmailModalOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [emailModalOpen, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          User Details
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : errorMsg ? (
          <p className="text-center text-red-500">{errorMsg}</p>
        ) : !details ? (
          <p className="text-center text-gray-400">User not found.</p>
        ) : (
          <>
            {/* User Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><strong>Email:</strong> {details.email}</div>
              <div><strong>Role:</strong> {details.role}</div>
              <div><strong>Verified:</strong> {details.is_verified ? "Yes" : "No"}</div>
              <div><strong>Blocked:</strong> {details.is_blocked ? "Blocked" : "Active"}</div>
              <div><strong>Created:</strong> {new Date(details.created_at).toLocaleString()}</div>
              <div><strong>Last Login:</strong> {details.last_login_at ? new Date(details.last_login_at).toLocaleString() : "—"}</div>
            </div>

            {!forbidden && (
              <div className="flex flex-wrap gap-3 mt-6 justify-end">
                {currentRole === "superadmin" && (
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="admin-btn admin-btn-secondary"
                    disabled={actionLoading}
                  >
                    Change Role
                  </button>
                )}

                <button
                  onClick={toggleBlock}
                  className="admin-btn admin-btn-secondary"
                  disabled={actionLoading}
                >
                  {details.is_blocked ? "Unblock" : "Block"}
                </button>

                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="admin-btn admin-btn-secondary"
                >
                  Send Email
                </button>

                {currentRole === "superadmin" && (
                  <button
                    onClick={handleDelete}
                    className="admin-btn admin-btn-primary bg-red-600 text-white"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {emailModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="admin-card max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3 text-turquoise">
                Send Email
              </h3>
              <form onSubmit={handleSendEmail} className="space-y-3">
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="admin-input"
                  placeholder="Subject"
                />
                <textarea
                  rows="5"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="admin-input"
                  placeholder="Message"
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
                    className="admin-btn admin-btn-primary"
                    disabled={sendingEmail}
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
