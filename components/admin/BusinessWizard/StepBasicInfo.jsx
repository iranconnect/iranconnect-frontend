// components/admin/BusinessWizard/StepBasicInfo.jsx
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

export default function StepBasicInfo({ data, setData, onNext }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const categoryId = data?.category_id || "";
  const selectedSubcategories = data?.subcategory_ids || [];

  /* ─────────────────────────────
     Load categories (admin-secure)
  ───────────────────────────── */
  useEffect(() => {
    apiClient
      .get("/admin/categories")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  /* ─────────────────────────────
     Load subcategories on category
  ───────────────────────────── */
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    setLoadingSubs(true);

    apiClient
      .get("/admin/subcategories", {
        params: { category_id: categoryId },
      })
      .then((res) => setSubcategories(res.data?.data || []))
      .catch(() => setSubcategories([]))
      .finally(() => setLoadingSubs(false));
  }, [categoryId]);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  function handleNameChange(e) {
    setData((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  }

  function handleCategoryChange(e) {
    const value = e.target.value;

    setData((prev) => ({
      ...prev,
      category_id: value,
      subcategory_ids: [], // reset on category change
    }));
  }

  function toggleSubcategory(id) {
    setData((prev) => {
      const current = prev.subcategory_ids || [];
      return {
        ...prev,
        subcategory_ids: current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
    });
  }

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-4">Basic Business Information</h2>

      {/* Business name */}
      <div className="mb-5">
        <label className="block text-sm mb-1">Business name *</label>
        <input
          type="text"
          className="admin-input"
          value={data?.name || ""}
          onChange={handleNameChange}
          placeholder="e.g. Tehran Legal Services"
          required
        />
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="block text-sm mb-1">Category *</label>
        <select
          className="admin-input"
          value={categoryId}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories */}
      {categoryId && (
        <div className="mb-6">
          <label className="block text-sm mb-2">
            Subcategories (multiple allowed)
          </label>

          {loadingSubs ? (
            <p className="text-xs opacity-70">Loading subcategories…</p>
          ) : subcategories.length === 0 ? (
            <p className="text-xs opacity-70">
              No subcategories available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subcategories.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubcategories.includes(sub.id)}
                    onChange={() => toggleSubcategory(sub.id)}
                  />
                  {sub.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="admin-btn admin-btn-primary"
          disabled={!data?.name || !categoryId}
        >
          Next
        </button>
      </div>
    </div>
  );
}
