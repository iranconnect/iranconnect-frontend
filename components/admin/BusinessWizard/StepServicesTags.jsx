//components/admin/BusinessWizard/StepServicesTags.jsx
import { useEffect, useRef, useState } from "react";
import apiClient from "../../../utils/apiClient";

const FIELD_RULES = {

  // REQUIRED
  services: {
    required: true,
    type: "array",
    minItems: 1,
  },

  // OPTIONAL BUT TRACKED
  tags: {
    required: false,
    type: "array",
  },

};

export default function StepServicesTags({ data, setData, onNext, onBack, mode, initialData, }) {
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [confirmNoTags, setConfirmNoTags] = useState(false);

  const selectedServices = data.services || [];
  const selectedTags = data.tags || [];
  const subcategoryIds = data.subcategory_ids || [];

  const initialTagsRef = useRef(data.tags || []);

  const hadInitialTags =
    initialTagsRef.current.length > 0;
  
  const removedAllTags =
    selectedTags.length === 0;
  
  const shouldConfirmTagRemoval =
    mode === "user-update" &&
    hadInitialTags &&
    removedAllTags;

  

  /* ─────────────────────────────
     Load services (by subcategories)
  ───────────────────────────── */
  useEffect(() => {
    if (!subcategoryIds.length) {
      setServices([]);
      return;
    }

    setLoadingServices(true);

    apiClient
      .get("/admin/services", {
        params: {
          subcategory_ids: subcategoryIds, // ✅ ارسال Array
        },
      })
      .then((res) => setServices(res.data?.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [subcategoryIds]);

  /* ─────────────────────────────
     Load tags (global)
  ───────────────────────────── */
  useEffect(() => {
    setLoadingTags(true);

    apiClient
      .get("/admin/tags/for-business")
      .then((res) => setTags(res.data?.data || []))
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false));

  }, []);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  function toggleService(id) {
    setData((prev) => {
  
      const current = prev.services || [];
  
      return {
        ...prev,
        services: current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
  
    });
  }
  
  function toggleTag(id) {
    setData((prev) => {
  
      const current = prev.tags || [];
  
      const nextTags = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
  
      if (nextTags.length > 0) {
        setConfirmNoTags(false);
      }
  
      return {
        ...prev,
        tags: nextTags,
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
          field === "tags"
            ? initialTagsRef.current
            : initialData?.[field];
  
        const hadOriginalValue =
          Array.isArray(original)
            ? original.length > 0
            : (
                original !== undefined &&
                original !== null &&
                original !== ""
              );
  
        const removedNow =
          Array.isArray(value)
            ? value.length === 0
            : (
                value === undefined ||
                value === null ||
                value === ""
              );
  
        if (
          hadOriginalValue &&
          removedNow
        ) {
          validationErrors.add(field);
        }
  
      }
  
    }
  );
  
  const canProceed =
    validationErrors.size === 0 &&
    (
      !shouldConfirmTagRemoval ||
      confirmNoTags
    );

  
  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 2 of 4 — Services & Tags
      </p>

      {/* SERVICES */}
      <div className="mb-8">
        <h4 className="font-semibold mb-2">
          Services offered *
        </h4>

        {loadingServices ? (
          <p className="text-sm opacity-70">
            Loading services…
          </p>
        ) : services.length === 0 ? (
          <p className="text-sm opacity-70">
            No services available for selected subcategories.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {services.map((s) => (
                <div key={s.id} className="text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
        
                    <span title={s.description}>
                      {s.name}
                    </span>
                  </label>
        
                  {s.service_tags?.length > 0 && (
                    <div className="ml-6 mt-1 flex flex-wrap gap-2">
                      {s.service_tags.map((tag) => (
                        <span
                          key={tag.id}
                          title={tag.description}
                          className="text-xs bg-slate-100 px-2 py-0.5 rounded"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
        
            {validationErrors.has("services") && (
              <p className="text-red-500 text-sm mt-2">
                Please complete this field.
              </p>
            )}
          </>
        )}
      </div>

      {/* TAGS */}
      <div className="mb-8">
        <h4 className="font-semibold mb-2">
          Tags (optional)
        </h4>

        {loadingTags ? (
          <p className="text-sm opacity-70">
            Loading tags…
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {tags.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                  />
                  <span title={t.seo_description}>
                    {t.name}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {shouldConfirmTagRemoval && (
        <div className="mt-4 mb-6 border border-red-500 bg-red-50 rounded-lg p-4">
      
          <p className="text-sm text-red-700 font-medium mb-3">
            You are about to remove all business tags.
            Tags help users discover your business more easily.
            Do you want to continue without any tags?
          </p>
      
          <label className="flex items-start gap-2 text-sm text-red-700 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmNoTags}
              onChange={(e) =>
                setConfirmNoTags(e.target.checked)
              }
              className="mt-1"
            />
      
            <span>
              I understand that removing all tags may reduce business discoverability.
            </span>
          </label>
      
        </div>
      )}

      {/* NAVIGATION */}
      <div className="flex justify-between">
        <button
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className="admin-btn admin-btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}
