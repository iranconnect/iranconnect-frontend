//frontend/pages/admin/services.js
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import ServiceDetailsModal from "../../components/admin/ServiceDetailsModal";
import ServiceBulkUploadModal from "../../components/admin/ServiceBulkUploadModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminServicesPage() {
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
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

  /* ===============================
     📥 Download Excel Template
  =============================== */
  async function downloadTemplate() {
    try {
      const res = await apiClient.get(
        "/admin/services/bulk/template",
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "services_bulk_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download Excel template.");
    }
  }

  useEffect(() => {
    apiClient
      .get("/admin/services/subcategories/all")
      .then((res) => setSubcategories(res.data.data || []))
      .catch(() => setSubcategories([]));
  }, []);
  
  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    fetchServices();
  }, [
    isReady,
    page,
    limit,
    statusFilter,
  ]);

  async function fetchServices() {
    setError("");
  
    try {
      const res = await apiClient.get("/admin/catalog/services", {
        params: {
          status: statusFilter,
          page,
          limit,
        },
      });
  
      setServices(res.data.rows || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setServices([]);
      setPagination(null);
  
      setError(
        err.response?.data?.error ||
        "Failed to load services."
      );
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");
    setError("");

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
      await applyFilters({
        status: statusFilter === "all"
          ? ""
          : statusFilter,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create service.");
    }
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">

          <div className="flex items-center justify-between mb-6">
            <h2 className="admin-title">🛠 Services</h2>

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

            <div className="md:col-span-3 flex justify-start">
              <button className="admin-btn admin-btn-primary">Add Service</button>
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
                <th>Category</th>
                <th>Subcategory</th>
                <th>Name</th>
                <th>Status</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.category_name}</td>
                  <td>{s.subcategory_name}</td>
                  <td>{s.name}</td>
                  <td>
                    {s.is_deleted
                      ? "⚫ Archived"
                      : s.is_active
                        ? "🟢 Active"
                        : "🟡 Inactive"}
                  </td>
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

          {/* Central Pagination */}
          {!error && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
            />
          )}

          {selected && (
            <ServiceDetailsModal
              serviceId={selected}
              onClose={() => setSelected(null)}
              onUpdated={() => fetchServices()}
            />
          )}
        </section>
      </div>

      {showBulk && (
        <ServiceBulkUploadModal
          subcategories={subcategories}
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
