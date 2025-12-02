//pages/admin/index.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function AdminPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔐 مرحله ۱: احراز هویت + چک نقش با HttpOnly Cookie
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        // ✔ درخواست امن → فقط با کوکی HttpOnly
        const me = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!me.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        // ✔ فقط Admin و SuperAdmin
        if (me.data.role !== "admin" && me.data.role !== "superadmin") {
          window.location.href = "/";
          return;
        }

        setAuthChecked(true);
        fetchBusinesses();
      } catch (err) {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();
  }, []);

  // 🔍 مرحله ۲: دریافت لیست بیزینس‌ها از بک‌اند ایمن‌شده
  async function fetchBusinesses() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get("/admin/businesses", {
        withCredentials: true,
      });
      setList(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching businesses:", err);
      setError(err.response?.data?.error || "Failed to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  // ⛔ جلوگیری از رندر تا زمانی که دسترسی بررسی شود
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Header />

      <main className="container-mobile flex-1 px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--navy)]">
            Admin Panel
          </h2>

          <Link
            href="/admin/new"
            className="px-4 py-2 rounded-lg bg-turquoise text-white font-medium shadow-[4px_4px_10px_#b8e0dd,-4px_-4px_10px_#ffffff] hover:bg-turquoise/90 transition"
          >
            + Add Business
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm mt-4">Loading businesses...</p>
        ) : error ? (
          <p className="text-red-600 text-sm mt-4">{error}</p>
        ) : (
          <div className="space-y-3">
            {list.length > 0 ? (
              list.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]
                  shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)]
                  flex items-center justify-between hover:shadow-[3px_3px_10px_var(--shadow-dark),-3px_-3px_10px_var(--shadow-light)] transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.logo_url || "/logo.png"}
                      alt={b.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-[var(--text)] leading-tight">
                        {b.name}
                      </h3>
                      <p className="text-sm opacity-80">
                        {b.category} • {b.city}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/edit/${b.id}`}
                    className="text-turquoise font-medium hover:underline text-sm"
                  >
                    Edit
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm mt-4">No businesses found.</p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
