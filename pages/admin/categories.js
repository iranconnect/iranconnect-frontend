//pages/admin/categories.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import CategoryDetailsModal from "../../components/admin/CategoryDetailsModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    icon: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    fetchCategories(1);
  }, []);

  async function fetchCategories(page = 1) {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/categories", {
        params: { page, pageSize: 10 },
      });
      setCategories(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    await apiClient.post("/admin/categories", form);
    setForm({ name: "", slug: "", icon: "" });
    fetchCategories(1);
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="admin-title mb-6">📁 Categories Management</h2>

          {/* Create */}
          <form
            onSubmit={handleCreate}
            className="admin-card grid grid-cols-1 md:grid-cols-4 gap-3 mb-6"
          >
            <input
              className="admin-input"
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="admin-input"
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <input
              className="admin-input"
              placeholder="Icon (optional)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <button className="admin-btn admin-btn-primary">
              Add Category
            </button>
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.length ? (
                  categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.slug}</td>
                      <td>{c.is_active ? "Active" : "Inactive"}</td>
                      <td>{c.created_by_email || "—"}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelected(c.id)}
                          className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 opacity-70">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selected && (
            <CategoryDetailsModal
              categoryId={selected}
              onClose={() => setSelected(null)}
              onUpdated={() => fetchCategories(pagination.page)}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
