// components/admin/BusinessWizard/StepBasicInfo.jsx
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

const BUSINESS_TYPES = [
  { value: "freelancer", label: "Freelancer / Self-employed" },
  { value: "company", label: "Registered Company" },
  { value: "clinic", label: "Clinic / Office" },
  { value: "shop", label: "Physical Shop" },
  { value: "online", label: "Online Business" },
];

export default function StepBasicInfo({ data, setData, onNext }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const categoryId = data?.category_id || "";
  const selectedSubcategories = data?.subcategory_ids || [];

  /* ─────────────────────────────
     Load categories (no pagination)
  ───────────────────────────── */
  useEffect(() => {
    apiClient
      .get("/admin/categories/all")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  /* ─────────────────────────────
     Load subcategories by category
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
     Generic setter
  ───────────────────────────── */
  function setField(key, value) {
    setData((prev) => ({
      ...prev,
      [key]: value,
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

  const canProceed =
    data?.name?.trim() &&
    categoryId &&
    selectedSubcategories.length > 0;

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-card">
      <h2 className="admin-card-title">
        Basic Business Information
      </h2>

      {/* Business display name */}
      <div className="mb-5">
        <label className="admin-label">
          Business name *
        </label>
        <input
          type="text"
          className="admin-input"
          value={data?.name || ""}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. Tehran Legal Services"
          required
        />
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="admin-label">
          Business category *
        </label>
        <select
          className="admin-input"
          value={categoryId}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              category_id: e.target.value,
              subcategory_ids: [],
            }))
          }
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
          <label className="admin-label">
            Subcategories *
          </label>

          {loadingSubs ? (
            <p className="admin-hint">Loading…</p>
          ) : subcategories.length === 0 ? (
            <p className="admin-hint">
              No subcategories available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subcategories.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 text-sm"
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

      {/* Legal name */}
      <div className="mb-5">
        <label className="admin-label">
          Legal name
        </label>
        <input
          type="text"
          className="admin-input"
          value={data?.legal_name || ""}
          onChange={(e) =>
            setField("legal_name", e.target.value)
          }
          placeholder="Registered legal entity name"
        />
      </div>

      {/* Business type */}
      <div className="mb-5">
        <label className="admin-label">
          Business type
        </label>
        <select
          className="admin-input"
          value={data?.business_type || ""}
          onChange={(e) =>
            setField("business_type", e.target.value)
          }
        >
          <option value="">Select type</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Year established */}
      <div className="mb-5">
        <label className="admin-label">
          Year established
        </label>
        <input
          type="number"
          min="1900"
          max={new Date().getFullYear()}
          className="admin-input"
          value={data?.year_established || ""}
          onChange={(e) =>
            setField("year_established", e.target.value)
          }
        />
      </div>

      {/* Short description */}
      <div className="mb-5">
        <label className="admin-label">
          Short description (SEO)
        </label>
        <textarea
          className="admin-input"
          maxLength={160}
          rows={2}
          value={data?.short_description || ""}
          onChange={(e) =>
            setField("short_description", e.target.value)
          }
          placeholder="Max 160 characters"
        />
      </div>

      {/* Full description */}
      <div className="mb-6">
        <label className="admin-label">
          Full description
        </label>
        <textarea
          className="admin-input"
          rows={4}
          value={data?.description || ""}
          onChange={(e) =>
            setField("description", e.target.value)
          }
          placeholder="Detailed description of services and expertise"
        />
      </div>

      {/* Next */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="admin-btn admin-btn-primary"
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}
