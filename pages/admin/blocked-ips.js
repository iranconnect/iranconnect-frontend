// frontend/pages/admin/blocked-ips.js
import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import BlockedIPDetailsModal from "../../components/admin/BlockedIPDetailsModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminBlockedIPs() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedIP, setSelectedIP] = useState(null);

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
  
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );
  
  const [draftFilters, setDraftFilters] = useState({
    ip: "",
    status: "",
  });
  
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
  } = usePaginationQuery({
    filterKeys: ["ip", "status"],
    defaultLimit: 10,
  });
  
  const [authChecked, setAuthChecked] = useState(false);

  const [adminRole, setAdminRole] = useState("");

  const isSuperAdmin =
    adminRole === "superadmin";


  /* ===========================================================
     🔐 مرحله 1: احراز هویت ادمین با کوکی HttpOnly (ایمن)
     =========================================================== */
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!res.data?.ok) {
          if (mounted) window.location.href = "/auth/login";
          return;
        }

        if (res.data.role !== "superadmin") {
          if (mounted) window.location.href = "/403";
          return;
        }
        
        if (mounted) {
          setAdminRole(res.data.role);
          setAuthChecked(true);
        }
      } catch (err) {
        if (mounted) window.location.href = "/auth/login";
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  /* ===========================================================
     📥 مرحله 2: دریافت رکوردها — فقط بعد از احراز هویت
     =========================================================== */
  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    setDraftFilters({
      ip: filters.ip || "",
      status: filters.status || "",
    });
  }, [
    isReady,
    filters.ip,
    filters.status,
  ]);
  
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }
  
    fetchBlockedIPs();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.ip,
    filters.status,
  ]);

  async function fetchBlockedIPs() {
    setLoading(true);
  
    try {
      const res = await apiClient.get(
        "/admin/blocked-ips",
        {
          params: {
            page,
            limit,
            ip: filters.ip?.trim() || undefined,
            status: filters.status || undefined,
          },
          withCredentials: true,
        }
      );
  
      setList(res.data?.rows || []);
  
      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error(
        "Failed to fetch blocked IPs:",
        err
      );
  
      setList([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }

  /* ===========================================================
     📁 Export
     =========================================================== */
  async function handleExport(format) {
    if (!isSuperAdmin) {
      window.location.href = "/403";
      return;
    }
  
    try {
      const res = await apiClient.get(
        `/admin/blocked-ips/export/${format}`,
        {
          params: {
            ip: filters.ip?.trim() || undefined,
            status: filters.status || undefined,
          },
          responseType: "blob",
          withCredentials: true,
        }
      );
  
      const blob = new Blob([res.data]);
  
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
  
      link.href = url;
  
      link.download =
        format === "xlsx"
          ? "IranConnect_BlockedIPs_Report.xlsx"
          : "IranConnect_BlockedIPs_Report.pdf";
  
      document.body.appendChild(link);
  
      link.click();
  
      link.remove();
  
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "❌ Blocked IP export failed:",
        err
      );
  
      if (err.response?.status === 403) {
        window.location.href = "/403";
        return;
      }
  
      alert(
        err.response?.data?.error ||
          `Failed to export ${format.toUpperCase()}.`
      );
    }
  }

  function handleSearch(event) {
    event.preventDefault();
  
    applyFilters({
      ip: draftFilters.ip,
      status: draftFilters.status,
    });
  }
  
  function handleClear() {
    setDraftFilters({
      ip: "",
      status: "",
    });
  
    applyFilters({
      ip: "",
      status: "",
    });
  }

  /* ===========================================================
     ⏳ حالت لودینگ قبل از احراز نقش
     =========================================================== */
  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="p-6 text-center opacity-70">
          Checking authentication...
        </div>
      </AdminLayout>
    );
  }

  /* ===========================================================
     🎉 صفحه اصلی
     =========================================================== */
  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">

          <h2 className="admin-title mb-5">🚫 Blocked IP Addresses</h2>

          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <input
              className="admin-input w-48"
              placeholder="Filter by IP"
              value={draftFilters.ip}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  ip: event.target.value,
                }))
              }
            />

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
              <option value="">All Status</option>
              <option value="blocked">Blocked</option>
              <option value="unblocked">Unblocked</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Search
            </button>
            
            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Clear
            </button>

            {/* Export Buttons */}
            {isSuperAdmin && (
              <div className="flex flex-row gap-2 ml-auto">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExport("xlsx")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Export XLSX
                </button>
            
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExport("pdf")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Export PDF
                </button>
              </div>
            )}
          </form>

          {/* Table */}
          {loading ? (
            <p className="text-sm opacity-70">Loading blocked IPs...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>IP</th>
                      <th>Status</th>
                      <th>Blocked At</th>
                      <th>Blocked By</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.length ? (
                      list.map((item) => (
                        <tr key={item.id}>
                          <td className="truncate max-w-[150px]">
                            {item.ip_address}
                          </td>
                          <td className="truncate max-w-[100px]">
                            {item.status}
                          </td>
                          <td className="truncate max-w-[160px]">
                            {item.blocked_at
                              ? new Date(item.blocked_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="truncate max-w-[150px]">
                            {item.automatic
                              ? "🤖 Automatic system"
                              : item.blocked_by_email || "—"}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedIP(item)}
                              className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center opacity-70 p-4">
                          No record found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                disabled={loading}
              />
            </>
          )}

          {selectedIP && (
            <BlockedIPDetailsModal
              ipRecord={selectedIP}
              onClose={() => setSelectedIP(null)}
              refreshList={() => fetchBlockedIPs(page)}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
