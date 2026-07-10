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
  
    const confirmations = {
      archive:
        "Archive this subcategory? It will remain stored but will no longer be selectable.",
      restore:
        "Restore this subcategory? It will return as inactive and remain unavailable until reactivated.",
      deactivate:
        "Deactivate this subcategory? It will no longer be selectable.",
      reactivate:
        "Reactivate this subcategory? It will become selectable again.",
    };
  
    if (confirmations[type] && !confirm(confirmations[type])) {
      return;
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
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onMouseDown={onClose}
      >
        <div
          className="admin-card max-w-xl w-full relative p-6 max-h-[90vh] overflow-y-auto"
          onMouseDown={(e) => e.stopPropagation()}
        >

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
            {subcategory.is_deleted
              ? "⚫ Archived"
              : subcategory.is_active
                ? "🟢 Active"
                : "🟡 Inactive"}
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
        <div className="flex flex-wrap justify-between items-center gap-3 mt-5">
          {subcategory.is_deleted ? (
            <button
              onClick={() => action("restore")}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm"
              disabled={actionLoading}
            >
              Restore as Inactive
            </button>
          ) : (
            <>
              <button
                onClick={() => action("archive")}
                className="admin-btn admin-btn-danger px-4 py-2 text-sm"
                disabled={actionLoading}
              >
                Archive
              </button>
        
              {subcategory.is_active ? (
                <button
                  onClick={() => action("deactivate")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                  disabled={actionLoading}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => action("reactivate")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                  disabled={actionLoading}
                >
                  Reactivate
                </button>
              )}
            </>
          )}
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
