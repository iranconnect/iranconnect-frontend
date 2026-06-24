// frontend/pages/admin/businesses.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import apiClientAdmin from "../../utils/apiClientAdmin";
import AdminLayout from "../../components/admin/AdminLayout";

import Link from "next/link";

export default function BusinessesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");

  // ✂️ کوتاه‌سازی متن
  function truncate(text, length = 20) {
    if (!text) return "—";
    return text.length > length ? text.slice(0, length) + "..." : text;
  }

  /* ================================================================
     🔐 مرحله 1: احراز هویت ادمین با HttpOnly Cookie
     ================================================================ */
  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!res.data?.ok) {
          if (mounted) window.location.href = "/auth/login";
          return;
        }

        const role = res.data.role;
        if (role !== "admin" && role !== "superadmin") {
          if (mounted) window.location.href = "/";
          return;
        }

        if (mounted) {
          setAuthChecked(true);
          fetchBusinesses();
        }
      } catch (err) {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();
    return () => (mounted = false);
  }, []);

  /* ================================================================
     📦 مرحله 2: دریافت لیست بیزینس‌ها با ارسال Credentials
     ================================================================ */
  async function fetchBusinesses(search = "") {
    setLoading(true);
    setError("");
  
    try {
      const res = await apiClientAdmin.get("/admin/businesses", {
        params: {
          q: search.trim() || undefined,
        },
      });
  
      const rows = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.rows)
        ? res.data.rows
        : [];
  
      setList(rows);
    } catch (err) {
      console.error(
        "❌ Error fetching businesses:",
        err.response?.status,
        err.response?.data || err.message
      );
  
      setList([]);
  
      setError(
        err.response?.data?.error ||
          "Unable to load businesses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================================================================
     🔍 جستجو
     ================================================================ */
  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    await fetchBusinesses(query);
    setSearching(false);
  }

  /* ================================================================
     ❌ حذف بیزینس (با ارسال کوکی)
     ================================================================ */
  async function deleteBusiness(id) {
    const ok = confirm("Delete this business?");
    if (!ok) return;

    try {
      await apiClientAdmin.delete(`/admin/businesses/${id}`);

      setList((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete.");
    }
  }

  /* ================================================================
     ⏳ نمایش قبل از احراز هویت
     ================================================================ */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access...
      </div>
    );
  }

  /* ================================================================
     🎨 رابط کاربری بدون تغییر
     ================================================================ */
  return (
    <AdminLayout>
      {/* 🏷 عنوان و نوار جستجو */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Businesses Management
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name, city or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--bg)] text-[var(--text)]
            focus:outline-none focus:ring-2 focus:ring-turquoise sm:w-64"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-turquoise text-navy font-medium rounded shadow
            hover:bg-turquoise/90 transition disabled:opacity-60"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* 📋 جدول اطلاعات */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-[var(--text)] text-sm opacity-70">
          Loading businesses...
        </p>
      ) : (
        <section
          className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]
          shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] transition overflow-x-auto"
        >
          <table className="min-w-full text-sm">
            <thead className="opacity-80">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Country</th>
                <th className="text-left p-3">City</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {list.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                >
                  <td className="p-3 opacity-70">{b.id}</td>
                  <td className="p-3">
                    <span title={b.name}>{truncate(b.name, 25)}</span>
                  </td>
                  <td className="p-3">
                    <span title={b.category}>{truncate(b.category, 20)}</span>
                  </td>
                  <td className="p-3">
                    <span title={b.country}>{truncate(b.country, 10)}</span>
                  </td>
                  <td className="p-3">
                    <span title={b.city}>{truncate(b.city, 12)}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/edit/${b.id}`}
                        className="text-turquoise hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteBusiness(b.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!list.length && (
                <tr>
                  <td colSpan="6" className="text-center p-4 opacity-70">
                    No businesses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </AdminLayout>
  );
}
