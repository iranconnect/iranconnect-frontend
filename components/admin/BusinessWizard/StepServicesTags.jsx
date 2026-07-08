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

  const generalTags = tags.filter(
    (tag) => tag.scope === "global"
  );
  
  const categoryTags = tags.filter(
    (tag) => tag.scope === "category"
  );
  
  const serviceTags = tags.filter(
    (tag) => tag.scope === "service"
  );

  const initialTagsRef = useRef(data.tags || []);

  const hadInitialTags =
    initialTagsRef.current.length > 0;
  
  const removedAllTags =
    selectedTags.length === 0;
  
  const shouldConfirmTagRemoval =
    mode === "user-update" &&
    hadInitialTags &&
    removedAllTags;

  const isAdminEdit = mode === "admin-edit";
  const isUserUpdate = mode === "user-update";
  const isUserNew = mode === "user-new";

  const isUserCatalogMode =
    isUserUpdate || isUserNew;

  const stepCopy = isAdminEdit
    ? {
        title: "Edit Business",
        subtitle: "Step 2 of 5 — Update services and tags",
        servicesTitle: "Services offered *",
        tagsTitle: "Tags (optional)",
        nextLabel: "Continue to Location & Contact",
      }
    : isUserUpdate
      ? {
          title: "Update Your Business",
          subtitle: "Step 2 of 5 — Review and update services and tags",
          servicesTitle: "Services offered *",
          tagsTitle: "Tags (optional)",
          nextLabel: "Continue to Location & Contact",
        }
      : {
          title: "Add New Business",
          subtitle: "Step 2 of 5 — Select services and tags",
          servicesTitle: "Services offered *",
          tagsTitle: "Tags (optional)",
          nextLabel: "Continue to Location & Contact",
        };

  

  /* ─────────────────────────────
     Load services (by subcategories)
  ───────────────────────────── */
  useEffect(() => {
    if (!subcategoryIds.length) {

      setServices([]);
    
      // =====================================
      // Reset invalid selected services
      // =====================================
    
      setData((prev) => ({
    
        ...prev,
    
        services: [],
    
      }));
    
      return;
    }

    setLoadingServices(true);

    apiClient
      .get(
        "/businesses/services",
        {
          params: {
            subcategory_ids:
              subcategoryIds.join(","),
          },
        }
      )
      .then((res) => setServices(res.data?.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [
    JSON.stringify(subcategoryIds),
    isUserCatalogMode,
  ]);

  /* ─────────────────────────────
     Load tags (global)
  ───────────────────────────── */
  useEffect(() => {

    const categoryId =
      data.category_id;
  
    const serviceIds =
      data.services || [];
  
    if (!categoryId) {
      setTags([]);
      return;
    }
  
    setLoadingTags(true);
  
    apiClient
      .get(
        "/businesses/tags",
        {
          params: {
            category_id: categoryId,
            service_ids: serviceIds.join(","),
          },
        }
      )
      .then((res) => {

        const fetchedTags =
          res.data?.data || [];
      
        setTags(fetchedTags);
      
        // =====================================
        // Remove invalid selected tags
        // =====================================
      
        setData((prev) => ({
      
          ...prev,
      
          tags: (prev.tags || []).filter(
            (tagId) =>
              fetchedTags.some(
                (t) => t.id === tagId
              )
          ),
      
        }));
      
      })
      .catch(() => setTags([]))
      .finally(() =>
        setLoadingTags(false)
      );
  
  }, [
    data.category_id,
    JSON.stringify(data.services || []),
    isUserCatalogMode,
  ]);
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
        {stepCopy.title}
      </h2>
      
      <p className="admin-muted mb-6">
        {stepCopy.subtitle}
      </p>

      {/* SERVICES */}
      <div className="mb-8">
        <h4 className="font-semibold mb-2">
          {stepCopy.servicesTitle}
        </h4>

        {loadingServices ? (
          <p className="text-sm opacity-70">
            Loading services…
          </p>
        ) : !subcategoryIds.length ? (
          <p className="text-sm opacity-70">
            Please go back and select at least one subcategory.
          </p>
        ) : services.length === 0 ? (
          <p className="text-sm opacity-70">
            No active services are available for the selected subcategory.
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
          {stepCopy.tagsTitle}
        </h4>

        {loadingTags ? (
  <p className="text-sm opacity-70">
    Loading tags…
      </p>
    ) : tags.length === 0 ? (
      <p className="text-sm opacity-70">
        No tags available for the selected category and services.
      </p>
    ) : (
      <div className="space-y-6">
    
        <TagGroup
          title="General tags"
          description="Broad tags that can apply to many businesses."
          tags={generalTags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
    
        <TagGroup
          title="Category tags"
          description="Tags related to your selected business category."
          tags={categoryTags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
    
        <TagGroup
          title="Service-specific tags"
          description="Tags suggested from the services you selected."
          tags={serviceTags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
    
      </div>
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
          {stepCopy.nextLabel}
        </button>
      </div>
    </div>
  );
}
function TagGroup({
  title,
  description,
  tags,
  selectedTags,
  onToggle,
}) {
  if (!tags.length) {
    return null;
  }

  return (
    <div>
      <div className="mb-2">
        <h5 className="font-semibold text-sm">
          {title}
        </h5>

        <p className="text-xs opacity-70 mt-1">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedTags.includes(tag.id)}
              onChange={() => onToggle(tag.id)}
            />

            <span title={tag.seo_description}>
              {tag.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
