//frontend/pages/admin/services.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import ServiceDetailsModal from "../../components/admin/ServiceDetailsModal";

export default function AdminServicesPage() {
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [form, setForm] = useState({
    subcategory_id: "",
    name: "",
    slug: "",
    description: "",
    seo_title: "",
    seo_description: "",
    comment: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get("/admin/services/subcategories/all")
      .then((res) => {
        setSubcategories(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load subcategories:", err);
        setSubcategories([]);
      });
  
    fetchServices(1);
  }, []);


  async function fetchServices(p = page) {
    const res = await apiClient.get("/admin/services", {
      params: { page: p, pageSize: 10 },
    });
    setServices(res.data.data || []);
    setPagination(res.data.pagination);
    setPage(p);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage(""); setError("");

    try {
      await apiClient.post("/admin/services", form);
      setMessage("✅ Service created successfully.");
      setForm({
        subcategory_id: "",
        name: "",
        slug: "",
        description: "",
        seo_title: "",
        seo_description: "",
        comment: "",
      });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create service.");
    }
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="admin-title mb-6">🛠 Services</h2>

          {message && <div className="text-green-600 mb-3">{message}</div>}
          {error && <div className="text-red-600 mb-3">{error}</div>}

          <form
            onSubmit={handleCreate}
            className="admin-card grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
          >
            <select
              className="admin-input"
              required
              value={form.subcategory_id}
              onChange={(e) =>
                setForm({ ...form, subcategory_id: e.target.value })
              }
            >
              <option value="">Select subcategory</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <input className="admin-input" placeholder="Name" required
              value={form.name}
              onChange={(e)=>setForm({...form,name:e.target.value})}
            />

            <input className="admin-input" placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e)=>setForm({...form,slug:e.target.value})}
            />

            <textarea className="admin-input" placeholder="Description" required
              value={form.description}
              onChange={(e)=>setForm({...form,description:e.target.value})}
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

            <div className="md:col-span-3">
              <button className="admin-btn admin-btn-primary w-full">
                Add Service
              </button>
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Name</th>
                <th>Status</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>{s.category_name}</td>
                  <td>{s.subcategory_name}</td>
                  <td>{s.name}</td>
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
            <ServiceDetailsModal
              serviceId={selected}
              onClose={() => setSelected(null)}
              onUpdated={fetchServices}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
