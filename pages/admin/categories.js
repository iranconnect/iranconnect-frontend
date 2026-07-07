// frontend/pages/admin/categories.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import CategoryDetailsModal from "../../components/admin/CategoryDetailsModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
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
  
  const [form, setForm] = useState({
    name: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    icon: "",
    comment: "",
  });

  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    fetchCategories();
  }, [
    isReady,
    page,
    limit,
    statusFilter,
  ]);

  async function fetchCategories() {
    setError("");
  
    try {
      const res = await apiClient.get("/admin/catalog/categories", {
        params: {
          status: statusFilter,
          page,
          limit,
        },
      });
  
      setCategories(res.data.rows || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setCategories([]);
      setPagination(null);
  
      setError(
        err.response?.data?.error ||
        "Failed to load categories."
      );
    }
  }


  async function handleCreate(e) {
    e.preventDefault();
  
    setSubmitting(true);
    setMessage("");
    setError("");
  
    try {
      await apiClient.post("/admin/categories", form, {
        headers: { "x-iranconnect-admin": "true" },
        withCredentials: true,
      });
  
      setMessage("✅ Category successfully created.");
  
      setForm({
        name: "",
        slug: "",
        seo_title: "",
        seo_description: "",
        icon: "",
        comment: "",
      });
  
      await applyFilters({
        status: statusFilter === "all"
          ? ""
          : statusFilter,
      });
    } catch (err) {
      setError(err.response?.data?.error || "❌ Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <AdminLayout>
      <section className="admin-section">
        <h2 className="admin-title mb-6">📁 Categories</h2>
        {message && (
          <div className="mb-4 text-green-600 text-sm font-medium">{message}</div>
        )}
        {error && (
          <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>
        )}


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
          <button
            className="admin-btn admin-btn-primary"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Add Category"}
          </button>

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
                <td>
                  {c.is_deleted
                    ? "⚫ Archived"
                    : c.is_active
                      ? "🟢 Active"
                      : "🟡 Inactive"}
                </td>
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

        {!error && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={submitting}
          />
        )}

        {selected && (
          <CategoryDetailsModal
            categoryId={selected}
            onClose={()=>setSelected(null)}
            onUpdated={() => fetchCategories()}
          />
        )}
      </section>
    </AdminLayout>
  );
}
