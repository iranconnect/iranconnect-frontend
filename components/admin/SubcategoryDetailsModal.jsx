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
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/admin/subcategories/${subcategoryId}/details`, {
        headers: {
          "x-iranconnect-admin": "true",
        },
      })
      .then((res) => {
        setSubcategory(res.data.subcategory);
        setLogs(res.data.logs || []);
      })
      .catch(() => {
        setSubcategory(null);
      });
  }, [subcategoryId]);

  async function action(type) {
    if (!comment.trim()) {
      alert("Action comment is required.");
      return;
    }

    if (type === "delete") {
      const ok = confirm("Are you sure you want to delete this subcategory?");
      if (!ok) return;
    }

    setActionLoading(true);

    try {
      await apiClient.post(
        `/admin/subcategories/${subcategoryId}/${type}`,
        { comment: comment.trim() },
        {
          headers: {
            "x-iranconnect-admin": "true",
          },
        }
      );

      onUpdated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!subcategory) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full relative p-6">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          Subcategory Details
        </h2>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div><strong>Category:</strong> {subcategory.category_name}</div>
          <div><strong>Name:</strong> {subcategory.name}</div>
          <div><strong>Slug:</strong> {subcategory.slug}</div>
          <div><strong>SEO Title:</strong> {subcategory.seo_title}</div>
          <div><strong>SEO Description:</strong> {subcategory.seo_description}</div>
          <div><strong>Sort Order:</strong> {subcategory.sort_order}</div>

          <div>
            <strong>Status:</strong>{" "}
            {subcategory.is_active ? "🟢 Active" : "🔴 Inactive"}
          </div>

          <div>
            <strong>Created:</strong>{" "}
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
        <div className="flex justify-between items-center gap-3 mt-5">

          {/* Delete */}
          <button
            onClick={() => action("delete")}
            className="admin-btn admin-btn-danger px-4 py-2 text-sm"
            disabled={actionLoading}
          >
            🗑 Delete
          </button>

          {/* Activate / Deactivate */}
          <button
            onClick={() =>
              action(subcategory.is_active ? "deactivate" : "activate")
            }
            className="admin-btn admin-btn-primary px-4 py-2 text-sm"
            disabled={actionLoading}
          >
            {subcategory.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>

        {/* Audit log */}
        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          <h4 className="font-semibold mb-2 text-turquoise">Audit log</h4>

          {logs.length ? (
            logs.map((l) => (
              <div key={l.id} className="mb-3">
                <strong>{l.action}</strong> — {l.performed_by_email || "system"}
                <br />
                <span className="opacity-80">{l.comment}</span>
              </div>
            ))
          ) : (
            <div className="opacity-60">No audit records.</div>
          )}
        </div>

      </div>
    </div>
  );
}
