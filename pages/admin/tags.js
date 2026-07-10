//frontend/pages/admin/tags.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import TagDetailsModal from "../../components/admin/TagDetailsModal";
import TagBulkUploadModal from "../../components/admin/TagBulkUploadModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const TAG_TYPES = [
  "feature",
  "location",
  "language",
  "specialty",
];

const TAG_SCOPES = ["global", "category", "service"];

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const [pagination, setPagination] = useState(null);
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
  } = usePaginationQuery({
    filterKeys: ["status"],
    defaultLimit: 10,
  });
  
  const statusFilter = filters.status || "all";
  const [showBulk, setShowBulk] = useState(false);

  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogSubcategories, setCatalogSubcategories] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);
  
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "",
    scope: "global",
    language_code: "en",
    seo_title: "",
    seo_description: "",
    is_selectable: true,
    search_weight: 1,
    category_id: "",
    subcategory_id: "",
    service_id: "",
    comment: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ===============================
     📥 Download Excel Template
  =============================== */
  async function downloadTemplate() {
    try {
      const res = await apiClient.get(
        "/admin/tags/bulk/template",
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tags_bulk_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download Excel template.");
    }
  }

  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    fetchTags();
  }, [
    isReady,
    page,
    limit,
    statusFilter,
  ]);

    useEffect(() => {
      if (
        form.scope === "category" ||
        form.scope === "service"
      ) {
        fetchTagCatalogCategories();
        return;
      }
  
      setCatalogCategories([]);
      setCatalogSubcategories([]);
      setCatalogServices([]);
    }, [form.scope]);

  async function fetchTags() {
    setError("");
  
    try {
      const res = await apiClient.get("/admin/catalog/tags", {
        params: {
          status: statusFilter,
          page,
          limit,
        },
      });
  
      setTags(res.data.rows || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setTags([]);
      setPagination(null);
  
      setError(
        err.response?.data?.error ||
        "Failed to load tags."
      );
    }
  }

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      type: "",
      scope: "global",
      language_code: "en",
      seo_title: "",
      seo_description: "",
      is_selectable: true,
      search_weight: 1,
      category_id: "",
      subcategory_id: "",
      service_id: "",
      comment: "",
    });
  
    setCatalogCategories([]);
    setCatalogSubcategories([]);
    setCatalogServices([]);
  }

  async function fetchTagCatalogCategories() {
    setCatalogLoading(true);
    setError("");
  
    try {
      const res = await apiClient.get(
        "/admin/tags/catalog/categories"
      );
  
      setCatalogCategories(res.data.data || []);
    } catch (err) {
      setCatalogCategories([]);
      setError(
        err.response?.data?.error ||
        "Failed to load tag categories."
      );
    } finally {
      setCatalogLoading(false);
    }
  }
  
  async function fetchTagCatalogSubcategories(categoryId) {
    if (!categoryId) {
      setCatalogSubcategories([]);
      return;
    }
  
    setCatalogLoading(true);
    setError("");
  
    try {
      const res = await apiClient.get(
        "/admin/tags/catalog/subcategories",
        {
          params: {
            category_id: categoryId,
          },
        }
      );
  
      setCatalogSubcategories(res.data.data || []);
    } catch (err) {
      setCatalogSubcategories([]);
      setError(
        err.response?.data?.error ||
        "Failed to load tag subcategories."
      );
    } finally {
      setCatalogLoading(false);
    }
  }
  
  async function fetchTagCatalogServices(subcategoryId) {
    if (!subcategoryId) {
      setCatalogServices([]);
      return;
    }
  
    setCatalogLoading(true);
    setError("");
  
    try {
      const res = await apiClient.get(
        "/admin/tags/catalog/services",
        {
          params: {
            subcategory_id: subcategoryId,
          },
        }
      );
  
      setCatalogServices(res.data.data || []);
    } catch (err) {
      setCatalogServices([]);
      setError(
        err.response?.data?.error ||
        "Failed to load tag services."
      );
    } finally {
      setCatalogLoading(false);
    }
  }

    async function handleCreate(e) {
      e.preventDefault();
      setMessage("");
      setError("");
  
      const payload = {
        ...form,
        search_weight: Number(form.search_weight) || 1,
      };
  
      if (payload.scope === "global") {
        delete payload.category_id;
        delete payload.subcategory_id;
        delete payload.service_id;
      }
  
      if (payload.scope === "category") {
        payload.category_id = Number(payload.category_id);
        delete payload.subcategory_id;
        delete payload.service_id;
      }
  
      if (payload.scope === "service") {
        payload.category_id = Number(payload.category_id);
        payload.subcategory_id = Number(payload.subcategory_id);
        payload.service_id = Number(payload.service_id);
      }
  
      try {
        await apiClient.post("/admin/tags", payload);
  
        setMessage("✅ Tag created successfully.");
        resetForm();
  
        await applyFilters({
          status: statusFilter === "all"
            ? ""
            : statusFilter,
        });
      } catch (err) {
        setError(
          err.response?.data?.error ||
          "Failed to create tag."
        );
      }
    }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">

          <div className="flex items-center justify-between mb-6">
            <h2 className="admin-title">🏷️ Tags</h2>

            <button
              type="button"
              onClick={downloadTemplate}
              className="admin-btn admin-btn-secondary text-sm"
            >
              📥 Download Excel Template
            </button>
          </div>

          {message && <div className="text-green-600 mb-3">{message}</div>}
          {error && <div className="text-red-600 mb-3">{error}</div>}

          {/* CREATE FORM */}
          <form
            onSubmit={handleCreate}
            className="admin-card grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
          >
            <input
              className="admin-input"
              placeholder="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="admin-input"
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <select
              className="admin-input"
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="">Select type</option>
              {TAG_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              className="admin-input"
              value={form.scope}
              onChange={(e) => {
                setForm({
                  ...form,
                  scope: e.target.value,
                  category_id: "",
                  subcategory_id: "",
                  service_id: "",
                });
            
                setCatalogSubcategories([]);
                setCatalogServices([]);
              }}
            >
              {TAG_SCOPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {(form.scope === "category" ||
              form.scope === "service") && (
              <select
                className="admin-input"
                required
                value={form.category_id}
                onChange={(e) => {
                  const categoryId = e.target.value;

                  setForm({
                    ...form,
                    category_id: categoryId,
                    subcategory_id: "",
                    service_id: "",
                  });

                  setCatalogSubcategories([]);
                  setCatalogServices([]);

                  if (form.scope === "service") {
                    fetchTagCatalogSubcategories(categoryId);
                  }
                }}
              >
                <option value="">
                  {catalogLoading
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {catalogCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            )}

            {form.scope === "service" && (
              <select
                className="admin-input"
                required
                value={form.subcategory_id}
                disabled={!form.category_id}
                onChange={(e) => {
                  const subcategoryId = e.target.value;

                  setForm({
                    ...form,
                    subcategory_id: subcategoryId,
                    service_id: "",
                  });

                  setCatalogServices([]);
                  fetchTagCatalogServices(subcategoryId);
                }}
              >
                <option value="">
                  {!form.category_id
                    ? "Select category first"
                    : "Select subcategory"}
                </option>

                {catalogSubcategories.map((subcategory) => (
                  <option
                    key={subcategory.id}
                    value={subcategory.id}
                  >
                    {subcategory.name}
                  </option>
                ))}
              </select>
            )}

            {form.scope === "service" && (
              <select
                className="admin-input"
                required
                value={form.service_id}
                disabled={!form.subcategory_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    service_id: e.target.value,
                  })
                }
              >
                <option value="">
                  {!form.subcategory_id
                    ? "Select subcategory first"
                    : "Select service"}
                </option>

                {catalogServices.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>
            )}  

            <input
              className="admin-input"
              placeholder="Language code (en)"
              value={form.language_code}
              onChange={(e) =>
                setForm({ ...form, language_code: e.target.value })
              }
            />

            <input
              className="admin-input"
              placeholder="SEO title"
              value={form.seo_title}
              onChange={(e) =>
                setForm({ ...form, seo_title: e.target.value })
              }
            />

            <textarea
              className="admin-input"
              placeholder="SEO description"
              value={form.seo_description}
              onChange={(e) =>
                setForm({ ...form, seo_description: e.target.value })
              }
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_selectable}
                onChange={(e) =>
                  setForm({ ...form, is_selectable: e.target.checked })
                }
              />
              Selectable
            </label>

            <input
              type="number"
              min={1}
              className="admin-input"
              placeholder="Search weight"
              value={form.search_weight}
              onChange={(e) =>
                setForm({ ...form, search_weight: Number(e.target.value) })
              }
            />

            <textarea
              className="admin-input md:col-span-3"
              placeholder="Creation comment (required)"
              required
              value={form.comment}
              onChange={(e) =>
                setForm({ ...form, comment: e.target.value })
              }
            />

            <div className="md:col-span-3 flex justify-start">
              <button className="admin-btn admin-btn-primary">
                Add Tag
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary ml-2"
                onClick={() => setShowBulk(true)}
              >
                Bulk Upload
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between gap-3 mb-4">
            <label className="text-sm font-medium">
              Status
            </label>
          
            <select
              className="admin-input max-w-xs"
              value={statusFilter}
              onChange={(e) =>
                applyFilters({
                  status:
                    e.target.value === "all"
                      ? ""
                      : e.target.value,
                })
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* TABLE */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.type}</td>
                  <td>{t.scope}</td>
                  <td>
                    {t.is_deleted
                      ? "⚫ Archived"
                      : t.is_active
                        ? "🟢 Active"
                        : "🟡 Inactive"}
                  </td>
                  <td>{t.created_by_email || "—"}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelected(t.id)}
                      className="admin-btn admin-btn-secondary text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            
              {!tags.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-sm text-gray-500"
                  >
                    No tags found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Central Pagination */}
          {!error && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
            />
          )}

          {selected && (
            <TagDetailsModal
              tagId={selected}
              onClose={() => setSelected(null)}
              onUpdated={() => fetchTags()}
            />
          )}
        </section>
      </div>

      {showBulk && (
        <TagBulkUploadModal
          onClose={() => setShowBulk(false)}
          onSuccess={() =>
            applyFilters({
              status: statusFilter === "all"
                ? ""
                : statusFilter,
            })
          }
        />
      )}
    </AdminLayout>
  );
}
