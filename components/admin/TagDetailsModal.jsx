//frontend/components/admin/TagDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function TagDetailsModal({ tagId, onClose, onUpdated }) {
  const [tag, setTag] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/admin/tags/${tagId}/details`)
      .then((res) => {
        setTag(res.data.tag);
        setLogs(res.data.logs || []);
      })
      .catch(() => setTag(null));
  }, [tagId]);

  async function action(type) {
    if (!comment.trim()) {
      alert("Action comment is required.");
      return;
    }
  
    const confirmations = {
      archive:
        "Archive this tag? It will remain stored but will no longer be selectable.",
      restore:
        "Restore this tag? It will return as inactive and remain unavailable until reactivated.",
      deactivate:
        "Deactivate this tag? It will no longer be selectable.",
      reactivate:
        "Reactivate this tag? It will become selectable again.",
    };
  
    if (confirmations[type] && !confirm(confirmations[type])) {
      return;
    }
  
    setLoading(true);
  
    try {
      await apiClient.post(`/admin/tags/${tagId}/${type}`, {
        comment: comment.trim(),
      });
  
      onUpdated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!tag) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full relative p-6">

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          Tag Details
        </h2>

        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {tag.name}</div>
          <div><strong>Slug:</strong> {tag.slug}</div>
          <div><strong>Type:</strong> {tag.type}</div>
          <div><strong>Scope:</strong> {tag.scope}</div>
          <div><strong>Language:</strong> {tag.language_code}</div>
          <div>
            <strong>Status:</strong>{" "}
            {tag.is_deleted
              ? "⚫ Archived"
              : tag.is_active
                ? "🟢 Active"
                : "🟡 Inactive"}
          </div>
          <div>
            <strong>Created:</strong>{" "}
            {new Date(tag.created_at).toLocaleString()}
          </div>
        </div>

        <textarea
          className="admin-input w-full mt-4"
          rows={3}
          placeholder="Action comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex flex-wrap justify-between items-center gap-3 mt-5">
          {tag.is_deleted ? (
            <button
              onClick={() => action("restore")}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm"
              disabled={loading}
            >
              Restore as Inactive
            </button>
          ) : (
            <>
              <button
                onClick={() => action("archive")}
                className="admin-btn admin-btn-danger px-4 py-2 text-sm"
                disabled={loading}
              >
                Archive
              </button>
        
              {tag.is_active ? (
                <button
                  onClick={() => action("deactivate")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                  disabled={loading}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => action("reactivate")}
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm"
                  disabled={loading}
                >
                  Reactivate
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          <h4 className="font-semibold mb-2 text-turquoise">
            Audit log
          </h4>

          {logs.length ? (
            logs.map((l) => (
              <div key={l.id} className="mb-3">
                <strong>{l.action}</strong>{" "}
                — {l.performed_by_email || "system"}
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
