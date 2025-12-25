// frontend/pages/admin/subcategories.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import SubcategoryDetailsModal from "../../components/admin/SubcategoryDetailsModal";

export default function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    comment: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/admin/categories").then((res) => {
      setCategories(res.data.data || []);
    });
    fetchSubcategories();
  }, []);

  async function fetchSubcategories() {
    const res = await apiClient.get("/admin/subcategories");
    setSubcategories(res.data.data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await apiClient.post("/admin/subcategories", form);
      setMessage("✅ Subcategory created successfully.");
      setForm({
        category_id: "",
        name: "",
        slug: "",
        seo_title: "",
        seo_description: "",
        comment: "",
      });
      fetchSubcategories();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create subcategory.");
    }
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="admin-title mb-6">🗂 Subcategories</h2>

          {message && <div className="text-green-600 mb-3">{message}</div>}
          {error && <div className="text-red-600 mb-3">{error}</div>}

          {/* Create */}
          <form
            onSubmit={handleCreate}
            className="admin-card grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
          >
            <select
              className="admin-input"
              required
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

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

            <input
              className="admin-input"
              placeholder="SEO title"
              required
              value={form.seo_title}
              onChange={(e) =>
                setForm({ ...form, seo_title: e.target.value })
              }
            />

            <textarea
              className="admin-input"
              placeholder="SEO description"
              required
              value={form.seo_description}
              onChange={(e) =>
                setForm({ ...form, seo_description: e.target.value })
              }
            />

            <textarea
              className="admin-input"
              placeholder="Creation comment (required)"
              required
              value={form.comment}
              onChange={(e) =>
                setForm({ ...form, comment: e.target.value })
              }
            />

            <button className="admin-btn admin-btn-primary">
              Add Subcategory
            </button>
          </form>

          {/* Table */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s) => (
                <tr key={s.id}>
                  <td>{s.category_name}</td>
                  <td>{s.name}</td>
                  <td>{s.slug}</td>
                  <td>{s.is_active ? "Active" : "Inactive"}</td>
                  <td>{s.created_by_email || "—"}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelected(s.id)}
                      className="admin-btn admin-btn-secondary text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <SubcategoryDetailsModal
              subcategoryId={selected}
              onClose={() => setSelected(null)}
              onUpdated={fetchSubcategories}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
