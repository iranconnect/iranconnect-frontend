//pages/admin/new.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";

export default function NewBusiness() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "",
    city: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  /* ============================================================
     🔐 Secure Admin Auth Check (HttpOnly Cookie)
  ============================================================ */
  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!res.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        if (res.data.role !== "admin" && res.data.role !== "superadmin") {
          window.location.href = "/";
          return;
        }

        if (mounted) {
          setAuthChecked(true);
        }
      } catch {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     ✏️ Handle Input Changes
  ============================================================ */
  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  /* ============================================================
     💾 Submit Form (Admin-only, cookie based)
  ============================================================ */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/admin/businesses", form, {
        withCredentials: true,
      });

      alert("✅ Business added successfully!");
      router.push("/admin");
    } catch (err) {
      console.error("❌ Error creating business:", err);
      setError(
        err.response?.data?.error || "Failed to create business."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     ⛔ Prevent render before auth check
  ============================================================ */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access…
      </div>
    );
  }

  /* ============================================================
     🎨 UI
  ============================================================ */
  return (
    <AdminLayout>
      <section className="section-gap max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-6 text-[var(--text)]">
          ➕ Add New Business
        </h1>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]
          shadow-[5px_5px_15px_var(--shadow-dark),-5px_-5px_15px_var(--shadow-light)] space-y-4"
        >
          <div>
            <label className="block mb-1 text-sm font-medium">
              Business Name
            </label>
            <input
              name="name"
              placeholder="Enter business name..."
              className="admin-input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Category
            </label>
            <input
              name="category"
              placeholder="Enter category..."
              className="admin-input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              City
            </label>
            <input
              name="city"
              placeholder="Enter city..."
              className="admin-input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Write a short description..."
              rows="4"
              className="admin-input w-full"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary w-full mt-4"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Business"}
          </button>
        </form>
      </section>
    </AdminLayout>
  );
}
