// frontend/pages/admin/users.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import UserDetailsModal from "../../components/admin/UserDetailsModal";
import { useAuthSession } from "../../hooks/useAuthSession";

import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

export default function UsersPage() {
  return (
    <AdminLayout allowedRoles={["admin", "superadmin"]}>
      <UsersPageContent />
    </AdminLayout>
  );
}

function UsersPageContent() {
  const router = useRouter();

  const {
    role,
  } = useAuthSession();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [draftFilters, setDraftFilters] = useState({
    q: "",
    role: "",
    verified: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] =
    useState(null);

  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: [
      "q",
      "role",
      "verified",
      "status",
    ],
    defaultLimit: 10,
  });

  /* ============================================================
     Sync URL filters -> form inputs
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      q: filters.q || "",
      role: filters.role || "",
      verified: filters.verified || "",
      status: filters.status || "",
    });
  }, [
    isReady,
    filters.q,
    filters.role,
    filters.verified,
    filters.status,
  ]);

  /* ============================================================
     Fetch users after URL/query state changes
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    fetchUsers();
  }, [
    isReady,
    page,
    limit,
    filters.q,
    filters.role,
    filters.verified,
    filters.status,
  ]);

  async function fetchUsers() {
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await apiClient.get(
        "/admin/users",
        {
          params: {
            page,
            limit,
            q: filters.q || undefined,
            role: filters.role || undefined,
            verified:
              filters.verified || undefined,
            status:
              filters.status || undefined,
          },
          withCredentials: true,
        }
      );

      /*
        Backward compatibility:
        تا قبل از Deploy Backend جدید،
        endpoint فعلی یک Array برمی‌گرداند.
      */
      if (Array.isArray(res.data)) {
        const legacyRows = res.data;

        setUsers(legacyRows);

        setPagination({
          page: 1,
          limit: legacyRows.length || 20,
          total: legacyRows.length,
          totalPages: 1,
          from: legacyRows.length ? 1 : 0,
          to: legacyRows.length,
          hasPreviousPage: false,
          hasNextPage: false,
        });

        return;
      }

      setUsers(res.data?.rows || []);

      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error("❌ Fetch users error:", err);

      if (err.response?.status === 403) {
        router.replace("/403");
        return;
      }

      setUsers([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      q: draftFilters.q,
      role: draftFilters.role,
      verified: draftFilters.verified,
      status: draftFilters.status,
    });
  }

  async function handleClear() {
    setDraftFilters({
      q: "",
      role: "",
      verified: "",
      status: "",
    });
  
    await clearFilters();
  }

  async function handleExport(format) {
    if (role !== "superadmin") {
      return;
    }

    try {
      const res = await apiClient.get(
        `/admin/users/export/${format}`,
        {
          params: {
            q: filters.q || undefined,
            role: filters.role || undefined,
            verified:
              filters.verified || undefined,
          },
          withCredentials: true,
          responseType: "blob",
        }
      );
  
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
  
      link.href = url;
      link.download =
        format === "xlsx"
          ? "IranConnect_Users.xlsx"
          : "IranConnect_Users.pdf";
  
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ User export failed:", err);
  
      if (err.response?.status === 403) {
        alert(
          "You do not have permission to export users."
        );
        return;
      }
  
      alert(
        err.response?.data?.error ||
          `Failed to export users as ${format.toUpperCase()}.`
      );
    }
  }
  return (
    <>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5">
            👥 User Management
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <input
              type="text"
              placeholder="Search by email..."
              className="admin-input w-60"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
            />

            <select
              className="admin-input w-40"
              value={draftFilters.role}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  role: event.target.value,
                }))
              }
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">
                Super Admin
              </option>
            </select>

            <select
              className="admin-input w-40"
              value={draftFilters.verified}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  verified: event.target.value,
                }))
              }
            >
              <option value="">All Users</option>
              <option value="true">Verified</option>
              <option value="false">
                Not Verified
              </option>
            </select>

            <select
              className="admin-input w-40"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="">
                All Statuses
              </option>
              <option value="active">
                Active
              </option>
              <option value="blocked">
                Blocked
              </option>
              <option value="deleted">
                Deleted
              </option>
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="admin-btn admin-btn-primary text-sm px-5 py-2 disabled:opacity-60"
              >
                Search
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleClear}
                className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
              >
                Clear
              </button>
            </div>

            {role === "superadmin" && (
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleExport("xlsx")
                  }
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  Export XLSX
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleExport("pdf")
                  }
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  Export PDF
                </button>
              </div>
            )}
          </form>

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

          {loading ? (
            <p className="text-sm opacity-70">
              Loading users...
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-[var(--text)]">
                  <thead className="opacity-80">
                    <tr>
                      <th className="text-left p-3">
                        Email
                      </th>
                      <th className="text-left p-3">
                        Role
                      </th>
                      <th className="text-center p-3">
                        Verified
                      </th>
                      <th className="text-center p-3">
                        Account Status
                      </th>
                      <th className="text-left p-3">
                        Created
                      </th>
                      <th className="text-left p-3">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                      >
                        <td className="p-3 whitespace-nowrap">
                          <span
                            title={
                              user.display_email ||
                              user.email
                            }
                          >
                            {(user.display_email ||
                              user.email)?.length >
                            25
                              ? `${(
                                  user.display_email ||
                                  user.email
                                ).slice(0, 22)}...`
                              : user.display_email ||
                                user.email}
                          </span>
                        </td>

                        <td className="p-3 capitalize">
                          {user.role}
                        </td>

                        <td className="p-3 text-center">
                          {user.is_verified ? "✅" : "❌"}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          {user.is_deleted
                            ? "Deleted"
                            : user.is_blocked
                              ? "Blocked"
                              : "Active"}
                        </td>

                        <td className="p-3">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUser(user)
                            }
                            className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!users.length && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center opacity-70 p-4"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!error && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={loading}
                />
              )}
            </>
          )}
        </section>
      </div>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={fetchUsers}
        />
      )}
    </>
  );
}
