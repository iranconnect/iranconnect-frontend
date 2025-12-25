// frontend/components/admin/SubcategoryDetailsModal.jsx
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-3 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        {/* Title */}
        <h3 className="admin-title mb-4 text-center">
          Subcategory Details
        </h3>

        {/* Details */}
        <div className="text-sm space-y-2">
          <div><b>Category:</b> {subcategory.category_name}</div>
          <div><b>Name:</b> {subcategory.name}</div>
          <div><b>Slug:</b> {subcategory.slug}</div>
          <div><b>SEO Title:</b> {subcategory.seo_title}</div>
          <div><b>SEO Description:</b> {subcategory.seo_description}</div>
          <div><b>Sort Order:</b> {subcategory.sort_order}</div>

          <div>
            <b>Status:</b>{" "}
            {subcategory.is_active ? (
              <span className="inline-flex items-center gap-1 text-green-400">
                ● Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-400">
                ● Inactive
              </span>
            )}
          </div>

          <div>
            <b>Created:</b>{" "}
            {new Date(subcategory.created_at).toLocaleString()}
          </div>
        </div>

        {/* Comment */}
        <textarea
          className="admin-input w-full mt-4"
          rows={3}
          placeholder="Action comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-between items-center mt-5">
          <button
            onClick={() => action("delete")}
            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
            disabled={loading}
          >
            🗑 Delete
          </button>

          <button
            onClick={() =>
              action(subcategory.is_active ? "deactivate" : "activate")
            }
            className="admin-btn admin-btn-primary"
            disabled={loading}
          >
            {subcategory.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>

        {/* Audit log */}
        <div className="mt-6 border-t pt-4 text-xs">
          <h4 className="font-semibold mb-2 text-turquoise">
            Audit log
          </h4>
          {logs.map((l) => (
            <div key={l.id} className="mb-2">
              <b>{l.action}</b> — {l.performed_by_email}
              <br />
              {l.comment}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
