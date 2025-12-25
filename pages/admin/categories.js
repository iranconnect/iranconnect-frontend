// frontend/pages/admin/categories.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import CategoryDetailsModal from "../../components/admin/CategoryDetailsModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    icon: "",
    comment: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await apiClient.get("/admin/categories");
    setCategories(res.data.data);
  }

  async function handleCreate(e) {
    e.preventDefault();
    await apiClient.post("/admin/categories", form);
    setForm({
      name: "",
      slug: "",
      seo_title: "",
      seo_description: "",
      icon: "",
      comment: "",
    });
    fetchCategories();
  }

  return (
    <AdminLayout>
      <section className="admin-section">
        <h2 className="admin-title mb-6">📁 Categories</h2>

        <form
          onSubmit={handleCreate}
          className="admin-card grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
        >
          <input className="admin-input" placeholder="Name" required
            value={form.name}
            onChange={(e)=>setForm({...form,name:e.target.value})}
          />
          <input className="admin-input" placeholder="Slug (optional)"
            value={form.slug}
            onChange={(e)=>setForm({...form,slug:e.target.value})}
          />
          <input className="admin-input" placeholder="Icon key (optional)"
            value={form.icon}
            onChange={(e)=>setForm({...form,icon:e.target.value})}
          />
          <input className="admin-input" placeholder="SEO title" required
            value={form.seo_title}
            onChange={(e)=>setForm({...form,seo_title:e.target.value})}
          />
          <textarea className="admin-input" placeholder="SEO description" required
            value={form.seo_description}
            onChange={(e)=>setForm({...form,seo_description:e.target.value})}
          />
          <textarea className="admin-input" placeholder="Creation comment (required)" required
            value={form.comment}
            onChange={(e)=>setForm({...form,comment:e.target.value})}
          />
          <button className="admin-btn admin-btn-primary">Add Category</button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Created By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c=>(
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{c.is_active ? "Active":"Inactive"}</td>
                <td>{c.created_by_email || "—"}</td>
                <td className="text-right">
                  <button
                    onClick={()=>setSelected(c.id)}
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
          <CategoryDetailsModal
            categoryId={selected}
            onClose={()=>setSelected(null)}
            onUpdated={fetchCategories}
          />
        )}
      </section>
    </AdminLayout>
  );
}
