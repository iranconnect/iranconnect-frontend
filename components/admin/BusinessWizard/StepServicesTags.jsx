//components/admin/BusinessWizard/StepServicesTags.jsx
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

export default function StepServicesTags({ data, setData, onNext, onBack }) {
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  const selectedServices = data.services || [];
  const selectedTags = data.tags || [];
  const subcategoryIds = data.subcategory_ids || [];

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
        params: { subcategory_ids: subcategoryIds.join(",") },
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
      .get("/admin/tags")
      .then((res) => setTags(res.data?.data || []))
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false));
  }, []);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  function toggleService(id) {
    setData((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((x) => x !== id)
        : [...prev.services, id],
    }));
  }

  function toggleTag(id) {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.includes(id)
        ? prev.tags.filter((x) => x !== id)
        : [...prev.tags, id],
    }));
  }

  const canProceed = selectedServices.length > 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
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
                {t.name}
              </label>
            ))}
          </div>
        )}
      </div>

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
