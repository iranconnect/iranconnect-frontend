// components/admin/BusinessWizard/StepBasicInfo.jsx
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

export default function StepBasicInfo({ formData, setFormData }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);

  /* ----------------------------------------------------
     📥 Load categories
  ---------------------------------------------------- */
  useEffect(() => {
    apiClient.get("/categories").then((res) => {
      setCategories(res.data?.data || []);
    });
  }, []);

  /* ----------------------------------------------------
     📥 Load subcategories when category changes
  ---------------------------------------------------- */
  useEffect(() => {
    if (!formData.category_id) return;

    setSubcategories([]);
    setFormData((prev) => ({
      ...prev,
      subcategory_ids: [],
      service_ids: [],
    }));

    apiClient
      .get("/subcategories", {
        params: { category_id: formData.category_id },
      })
      .then((res) => setSubcategories(res.data?.data || []));
  }, [formData.category_id]);

  /* ----------------------------------------------------
     📥 Load services when subcategories change
  ---------------------------------------------------- */
  useEffect(() => {
    if (!formData.subcategory_ids?.length) return;

    apiClient
      .get("/services", {
        params: {
          subcategory_ids: formData.subcategory_ids.join(","),
        },
      })
      .then((res) => setServices(res.data?.data || []));
  }, [formData.subcategory_ids]);

  /* ----------------------------------------------------
     📥 Load tags
  ---------------------------------------------------- */
  useEffect(() => {
    apiClient
      .get("/tags", { params: { type: "business" } })
      .then((res) => setTags(res.data?.data || []));
  }, []);

  function toggle(id, list, key) {
    setFormData((prev) => ({
      ...prev,
      [key]: list.includes(id)
        ? list.filter((i) => i !== id)
        : [...list, id],
    }));
  }

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">
        🏷️ Business Classification
      </h3>

      {/* Category */}
      <div className="mb-6">
        <label className="block text-sm mb-2">Category *</label>
        <select
          className="admin-input w-80"
          value={formData.category_id || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              category_id: e.target.value,
            }))
          }
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
      {subcategories.length > 0 && (
        <div className="admin-card mb-6">
          <h4 className="text-sm font-semibold mb-3">
            Subcategories *
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {subcategories.map((s) => (
              <label key={s.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    formData.subcategory_ids?.includes(s.id) || false
                  }
                  onChange={() =>
                    toggle(
                      s.id,
                      formData.subcategory_ids || [],
                      "subcategory_ids"
                    )
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div className="admin-card mb-6">
          <h4 className="text-sm font-semibold mb-3">
            Services
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {services.map((srv) => (
              <label key={srv.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    formData.service_ids?.includes(srv.id) || false
                  }
                  onChange={() =>
                    toggle(
                      srv.id,
                      formData.service_ids || [],
                      "service_ids"
                    )
                  }
                />
                {srv.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="admin-card">
          <h4 className="text-sm font-semibold mb-3">Tags</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tags.map((t) => (
              <label key={t.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    formData.tag_ids?.includes(t.id) || false
                  }
                  onChange={() =>
                    toggle(
                      t.id,
                      formData.tag_ids || [],
                      "tag_ids"
                    )
                  }
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
