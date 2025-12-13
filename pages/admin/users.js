// frontend/pages/admin/users.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import UserDetailsModal from "../../components/admin/UserDetailsModal";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  /* ================================
     🔐 Initial Load
     - Auth handled by HttpOnly Cookie
     - verifyAdminSecure (backend)
  ================================= */
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (filterRole) params.role = filterRole;
      if (filterVerified !== "") params.verified = filterVerified;

      const res = await apiClient.get("/admin/users", { params });
      setUsers(res.data || []);
    } catch (err) {
      console.error("❌ Fetch users error:", err);
      setError(err.response?.data?.error || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setFilterRole("");
    setFilterVerified("");
    fetchUsers();
  }

  function handleExport(format) {
    window.open(
      `${process.env.NEXT_PUBLIC_API_BASE}/admin/users/export/${format}`,
      "_blank"
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5">
            👥 User Management
          </h2>

          {/* 🔍 Filters */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <input
              type="text"
              placeholder="Search by email..."
              className="admin-input w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="admin-input w-40"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>

            <select
              className="admin-input w-40"
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
            >
              <option value="">All Users</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={fetchUsers}
                className="admin-btn admin-btn-primary text-sm px-5 py-2"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="admin-btn admin-btn-secondary text-sm px-4 py-2"
              >
                Clear
              </button>
            </div>

            {/* 📤 Export */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => handleExport("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export PDF
              </button>
            </div>
          </div>

          {msg && (
            <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
              {msg}
            </p>
          )}
          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {/* 📋 Table */}
          {loading ? (
            <p className="text-sm opacity-70">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-[var(--text)]">
                <thead className="opacity-80">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-center p-3">Verified</th>
                    <th className="text-center p-3">Blocked</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                    >
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 capitalize">{u.role}</td>
                      <td className="p-3 text-center">
                        {u.is_verified ? "✅" : "❌"}
                      </td>
                      <td className="p-3 text-center">
                        {u.is_blocked ? "🚫" : "🟢"}
                      </td>
                      <td className="p-3">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!users.length && (
                    <tr>
                      <td colSpan="6" className="text-center opacity-70 p-4">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* 🔍 User Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AdminLayout>
  );
}
