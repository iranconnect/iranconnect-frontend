// pages/admin/dashboard.js
import { useEffect, useMemo, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/admin/StatCard";

export default function AdminDashboard({ toggleTheme, currentTheme }) {
  const [businesses, setBusinesses] = useState([]);
  const [totalBusinesses, setTotalBusinesses] =
    useState(0);
  
  const [averageRating, setAverageRating] =
    useState("—");
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [loadingBiz, setLoadingBiz] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Auth Check (HttpOnly Cookie)
     + Hardening against race conditions
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

        if (mounted) {
          setAuthChecked(true);
          fetchBusinesses();
          fetchUsers();
        }
      } catch (err) {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     📦 Fetch Businesses (Secure + Guarded)
  ============================================================ */
  async function fetchBusinesses() {
    setLoadingBiz(true);
  
    try {
      const r = await apiClient.get(
        "/admin/businesses",
        {
          withCredentials: true,
  
          params: {
            page: 1,
            limit: 10,
            status: "active",
          },
        }
      );
  
      /*
        پاسخ قدیمی:
        Array
  
        پاسخ جدید:
        {
          rows: [],
          pagination: { total },
          summary: { averageRating }
        }
      */
      if (Array.isArray(r.data)) {
        const legacyRows = r.data;
  
        setBusinesses(legacyRows);
        setTotalBusinesses(legacyRows.length);
  
        const ratings = legacyRows
          .map((business) =>
            Number(business.avg_rating)
          )
          .filter(
            (rating) => !Number.isNaN(rating)
          );
  
        setAverageRating(
          ratings.length
            ? (
                ratings.reduce(
                  (sum, rating) => sum + rating,
                  0
                ) / ratings.length
              ).toFixed(2)
            : "—"
        );
  
        return;
      }
  
      setBusinesses(r.data?.rows || []);
  
      setTotalBusinesses(
        Number(r.data?.pagination?.total) || 0
      );
  
      setAverageRating(
        r.data?.summary?.averageRating || "—"
      );
    } catch (e) {
      console.error(
        "❌ Error fetching businesses:",
        e
      );
  
      setBusinesses([]);
      setTotalBusinesses(0);
      setAverageRating("—");
    } finally {
      setLoadingBiz(false);
    }
  }

  /* ============================================================
     👥 Fetch Users (Secure + Guarded)
  ============================================================ */
  async function fetchUsers() {
    setLoadingUsers(true);
  
    try {
      const r = await apiClient.get("/admin/users", {
        withCredentials: true,
  
        params: {
          page: 1,
          limit: 10,
        },
      });
  
      /*
        Pagination API جدید:
        {
          rows: [...],
          pagination: { total: ... }
        }
  
        Fallback برای سازگاری با پاسخ قدیمی Array.
      */
      if (Array.isArray(r.data)) {
        setUsers(r.data);
        setTotalUsers(r.data.length);
        return;
      }
  
      setUsers(r.data?.rows || []);
  
      setTotalUsers(
        Number(r.data?.pagination?.total) || 0
      );
    } catch (e) {
      console.error("❌ Error fetching users:", e);
  
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  }

  /* ============================================================
     📊 Compute Statistics (Memoized)
  ============================================================ */
  const stats = useMemo(() => {
    
    return {
      totalBusinesses,
      avgRatings: averageRating,
      totalUsers,
    };
  }, [
    totalBusinesses,
    averageRating,
    totalUsers,
  ]);

  /* ============================================================
     ⛔ Prevent UI rendering before auth check
  ============================================================ */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access...
      </div>
    );
  }

  /* ============================================================
     📋 Reusable Secure Table Component
  ============================================================ */
  const Table = ({ title, headers, data, loading }) => (
    <section
      className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]
      text-[var(--text)] shadow-[5px_5px_15px_var(--shadow-dark),
      -5px_-5px_15px_var(--shadow-light)] transition"
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {loading ? (
        <p className="text-sm opacity-70">Loading...</p>
      ) : data.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="opacity-80 border-b border-[var(--border)]">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="text-left p-3 font-medium uppercase text-xs tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr
                  key={item.id || i}
                  className="border-b border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                >
                  {Object.values(item).map((val, j) => (
                    <td
                      key={j}
                      className="p-3 truncate max-w-[180px]"
                      title={val}
                    >
                      {val || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm opacity-70">No records found.</p>
      )}
    </section>
  );

  /* ============================================================
     🖥️ Render Dashboard
  ============================================================ */
  return (
    <AdminLayout toggleTheme={toggleTheme} currentTheme={currentTheme}>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Businesses" value={stats.totalBusinesses} />

        <StatCard
          title="Average Ratings"
          value={stats.avgRatings}
          subtitle="Across all businesses"
        />

        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered Users"
        />
      </section>

      <Table
        title="Latest Businesses"
        headers={["Name", "Category", "Country", "City"]}
        loading={loadingBiz}
        data={[...businesses]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map((b) => ({
            id: b.id,
            Name: b.name,
            Category: b.category,
            Country: b.country,
            City: b.city,
          }))}
      />

      <div className="mt-8">
        <Table
          title="Latest Users"
          headers={["Email", "Role", "Verified", "Created At"]}
          loading={loadingUsers}
          data={[...users]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map((u) => ({
              id: u.id,
              Email: u.email,
              Role: u.role || "User",
              Verified: u.is_verified ? "✅" : "❌",
              "Created At": new Date(u.created_at).toLocaleDateString(),
            }))}
        />
      </div>
    </AdminLayout>
  );
}
