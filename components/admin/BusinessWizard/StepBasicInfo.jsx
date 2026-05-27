// components/admin/BusinessWizard/StepBasicInfo.jsx
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

const FIELD_RULES = {

  // REQUIRED
  name: {
    required: true,
    type: "string",
  },

  category_id: {
    required: true,
    type: "number",
  },

  subcategory_ids: {
    required: true,
    type: "array",
    minItems: 1,
  },

  short_description: {
    required: true,
    type: "string",
    min: 20,
    max: 160,
  },

  full_description: {
    required: true,
    type: "string",
    min: 50,
  },

  // OPTIONAL BUT TRACKED
  legal_name: {
    required: false,
    type: "string",
    trackRemoval: true,
  },

  business_type: {
    required: true,
    type: "string",
    trackRemoval: true,
  },

  year_established: {
    required: false,
    type: "number",
    trackRemoval: true,
  },

};

const BUSINESS_TYPES = [
  { value: "freelancer", label: "Freelancer / Self-employed" },
  { value: "company", label: "Registered Company" },
  { value: "clinic", label: "Clinic / Office" },
  { value: "shop", label: "Physical Shop" },
  { value: "online", label: "Online Business" },
];

export default function StepBasicInfo({ data, setData, onNext, mode, initialData,}) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const categoryId = Number(data?.category_id) || "";
  const selectedSubcategories = data?.subcategory_ids || [];


  /* ─────────────────────────────
     Load categories (no pagination)
  ───────────────────────────── */
  useEffect(() => {

    const endpoint =
    mode === "user-update"
    ? "/businesses/categories"
    : "/admin/categories/all";
    
    const request =
    mode === "user-update"
    ? apiClient.get(endpoint, {
    params: {
    country: data?.country,
    city: data?.city,
    },
    })
    : apiClient.get(endpoint);
    
    request
    .then((res) => {
    
    
      const rows =
        res.data?.data ||
        res.data ||
        [];
    
      setCategories(rows);
    
    })
    .catch(() => {
      setCategories([]);
    });
    
    
    }, [
    mode,
    data?.country,
    data?.city,
    ]);


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
      .get(
        mode === "user-update"
          ? "/businesses/subcategories"
          : "/admin/subcategories",
        {
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

  const validationErrors = new Set();

  /* ==================================================
     UNIVERSAL FIELD VALIDATION
  ================================================== */
  Object.entries(FIELD_RULES).forEach(
    ([field, rules]) => {
  
      const value = data?.[field];
  
      /* =========================
         REQUIRED VALIDATION
      ========================= */
      if (rules.required) {
  
        // STRING
        if (rules.type === "string") {
  
          const trimmed =
            String(value || "").trim();
  
          if (!trimmed) {
            validationErrors.add(field);
            return;
          }
  
          if (
            rules.min &&
            trimmed.length < rules.min
          ) {
            validationErrors.add(field);
            return;
          }
  
          if (
            rules.max &&
            trimmed.length > rules.max
          ) {
            validationErrors.add(field);
            return;
          }
  
        }
  
        // NUMBER
        if (rules.type === "number") {
  
          if (
            value === undefined ||
            value === null ||
            value === "" ||
            Number(value) <= 0
          ) {
            validationErrors.add(field);
            return;
          }
  
        }
  
        // ARRAY
        if (rules.type === "array") {
  
          if (
            !Array.isArray(value) ||
            value.length <
              (rules.minItems || 1)
          ) {
            validationErrors.add(field);
            return;
          }
  
        }
  
      }
  
      /* =========================
         REMOVAL TRACKING
      ========================= */
      if (
        mode === "user-update" &&
        rules.trackRemoval
      ) {
  
        const original =
          initialData?.[field];
  
        const hadOriginalValue =
          original !== undefined &&
          original !== null &&
          original !== "";
  
        const removedNow =
          value === undefined ||
          value === null ||
          value === "";
  
        if (
          hadOriginalValue &&
          removedNow
        ) {
          validationErrors.add(field);
        }
  
      }
  
    }
  );

    const canProceed = (() => {
    
      // =========================
      // USER UPDATE MODE
      // =========================
      if (mode === "user-update") {
        return validationErrors.size === 0;
      }
    
      // =========================
      // ADMIN CREATE MODE
      // =========================
      return (
        data?.name?.trim() &&
        categoryId &&
        selectedSubcategories.length > 0 &&
        data?.business_type?.trim() &&
        data?.short_description &&
        data.short_description.trim().length >= 20 &&
        data.short_description.trim().length <= 160 &&
        data?.full_description &&
        data.full_description.trim().length >= 50
      );
    
    })();

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 1 of 4 — Basic Business Information
      </p>


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
        {validationErrors.has("name") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="admin-label">
          Business category *
        </label>
        <select
          className="admin-input"
          value={categoryId}
          onChange={(e) => {
            const newCategoryId = Number(e.target.value);
          
            setData((prev) => ({
              ...prev,
              category_id: newCategoryId,
              subcategory_ids: [],
            }));
          }}

          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        
        {validationErrors.has("category_id") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}
        
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
            <>
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
          
              {validationErrors.has("subcategory_ids") && (
                <p className="text-red-500 text-sm mt-2">
                  Please complete this field.
                </p>
              )}
            </>
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

        {validationErrors.has("legal_name") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}

        
      </div>

      {/* Business type */}
      <div className="mb-5">
        <label className="admin-label">
          Business type *
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

        {validationErrors.has("business_type") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}
        
      </div>

      {/* Year established */}
      <div className="mb-5">
        <label className="admin-label">
          Year established
        </label>
        <input
          type="number"
          min="1900"
          inputMode="numeric"
          pattern="[0-9]*"
          max={new Date().getFullYear()}
          className="admin-input"
          value={data?.year_established || ""}
          onChange={(e) => {
            const value = e.target.value;
          
            if (/^\d*$/.test(value)) {
              setField("year_established", value);
            }
          }}
        />

        {validationErrors.has("year_established") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}
        
      </div>

      {/* Short description */}
      <div className="mb-5">
        <label className="admin-label">
          Short description *
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
        
        <p className="text-xs text-gray-400 mt-1">
          {(data?.short_description?.length || 0)} / 160 characters
        </p>
        {data?.short_description?.trim()?.length > 0 &&
          data.short_description.trim().length < 20 && (
            <p className="text-red-500 text-sm mt-1">
              Minimum 20 characters required
            </p>
        )}

        {validationErrors.has("short_description") && (
          <p className="text-red-500 text-sm mt-1">
            Please complete this field.
          </p>
        )}
        
      </div>

      {/* Full description */}
      <div className="mb-6">
        <label className="admin-label">
          Full description *
        </label>
        
        <textarea
          className="admin-input"
          rows={4}
          value={data?.full_description || ""}
          onChange={(e) =>
            setField("full_description", e.target.value)
          }
          placeholder="Write at least 50 characters about the business, services, and expertise"
          required
        />
        
        {/* 🔴 Validation */}
        {data?.full_description?.trim()?.length > 0 &&
          data.full_description.trim().length < 50 && (
            <p className="text-red-500 text-sm mt-1">
              Minimum 50 characters required
            </p>
        )}

        {validationErrors.has("full_description") &&
          !data?.full_description?.trim() && (
            <p className="text-red-500 text-sm mt-1">
              Please complete this field.
            </p>
        )}
        
        {/* 🔵 Character counter */}
        <p className="text-xs text-gray-400 mt-1">
          {(data?.full_description?.length || 0)} characters entered
        </p>
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
