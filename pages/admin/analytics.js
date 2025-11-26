//pages/admin/analytics.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // 🔐 مرحله 1: احراز هویت ادمین با HttpOnly Cookie
  useEffect(() => {
    async function check() {
      try {
        const res = await apiClient.get("/auth/me");

        if (!res.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        if (res.data.role !== "admin" && res.data.role !== "superadmin") {
          window.location.href = "/";
          return;
        }

        setAuthChecked(true);
      } catch (err) {
        window.location.href = "/auth/login";
      }
    }

    check();
  }, []);

  // 🔄 مرحله 2: دریافت آمار بعد از تأیید احراز هویت
  useEffect(() => {
    if (!authChecked) return;

    async function fetchStats() {
      try {
        const res = await apiClient.get(`/admin/stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Analytics error:", err);
        setError(err.response?.data?.error || "Failed to fetch stats");
      }
    }

    fetchStats();
  }, [authChecked]);

  // نمایش در زمان انتظار
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  if (!stats)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading analytics...
      </div>
    );

  // 🎉 رندر صفحه کامل
  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
        📊 Analytics Dashboard
      </h2>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] text-center transition-all duration-300">
          <h3 className="text-sm opacity-80 mb-2">Total Users</h3>
          <p className="text-2xl font-bold">{stats.users}</p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] text-center transition-all duration-300">
          <h3 className="text-sm opacity-80 mb-2">Total Businesses</h3>
          <p className="text-2xl font-bold text-turquoise">{stats.businesses}</p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] text-center transition-all duration-300">
          <h3 className="text-sm opacity-80 mb-2">Average Rating</h3>
          <p className="text-2xl font-bold text-yellow-500">
            {stats.avg_rating?.toFixed(2) ?? "0.00"}
          </p>
        </div>
      </section>

      <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]
        shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] transition-all duration-300">
        <h3 className="text-base font-medium mb-4 opacity-90">
          User Growth Over Time
        </h3>

        <div className="w-full h-72">
          <ResponsiveContainer>
            <LineChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="month" stroke="var(--text)" />
              <YAxis stroke="var(--text)" />
              <Tooltip contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--turquoise)"
                strokeWidth={2}
                dot={{ fill: "var(--turquoise)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AdminLayout>
  );
}

