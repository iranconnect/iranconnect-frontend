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

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await apiClient.post("/admin/tags", form);
      setMessage("✅ Tag created successfully.");
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
        comment: "",
      });
      await applyFilters({
        status: statusFilter === "all"
          ? ""
          : statusFilter,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create tag.");
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
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
            >
              {TAG_SCOPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

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
