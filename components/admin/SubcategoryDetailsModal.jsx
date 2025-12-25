//frontend/components/admin/SubcategoryDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function SubcategoryDetailsModal({
  subcategoryId,
  onClose,
  onUpdated,
}) {
  const [subcategory, setSubcategory] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/admin/subcategories/${subcategoryId}/details`)
      .then((res) => {
        setSubcategory(res.data.subcategory);
        setLogs(res.data.logs || []);
      });
  }, [subcategoryId]);

  async function action(type) {
    if (!comment.trim()) {
      alert("Action comment is required.");
      return;
    }

    if (type === "delete" && !confirm("Delete this subcategory?")) return;

    setLoading(true);

    try {
      await apiClient.post(
        `/admin/subcategories/${subcategoryId}/${type}`,
        { comment }
      );
      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!subcategory) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold text-center text-turquoise mb-4">
          Subcategory Details
        </h2>

        <div className="text-sm space-y-2">
          <div><strong>Category:</strong> {subcategory.category_name}</div>
          <div><strong>Name:</strong> {subcategory.name}</div>
          <div><strong>Slug:</strong> {subcategory.slug}</div>
          <div><strong>SEO Title:</strong> {subcategory.seo_title}</div>
          <div><strong>SEO Description:</strong> {subcategory.seo_description}</div>
          <div><strong>Status:</strong> {subcategory.is_active ? "Active" : "Inactive"}</div>
        </div>

        <textarea
          className="admin-input w-full mt-4"
          rows={3}
          placeholder="Action comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex justify-between gap-3 mt-5">
          <button
            onClick={() => action("delete")}
            className="admin-btn admin-btn-danger px-4 py-2 text-sm"
            disabled={loading}
          >
            🗑 Delete
          </button>

          <button
            onClick={() =>
              action(subcategory.is_active ? "deactivate" : "activate")
            }
            className="admin-btn admin-btn-primary px-4 py-2 text-sm"
            disabled={loading}
          >
            {subcategory.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>

        <div className="mt-6 border-t pt-4 text-xs">
          <h4 className="font-semibold mb-2 text-turquoise">Audit log</h4>
          {logs.map((l) => (
            <div key={l.id} className="mb-2">
              <strong>{l.action}</strong> — {l.performed_by_email}
              <br />
              {l.comment}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
