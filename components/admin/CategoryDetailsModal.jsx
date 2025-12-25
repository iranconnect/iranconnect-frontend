import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function CategoryDetailsModal({ categoryId, onClose, onUpdated }) {
  const [category, setCategory] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    apiClient
      .get(`/admin/categories/${categoryId}/details`)
      .then(res => {
        setCategory(res.data.category);
        setLogs(res.data.logs);
      });
  }, [categoryId]);

  async function action(type) {
    if (!comment.trim()) return alert("Comment is required");
    await apiClient.post(`/admin/categories/${categoryId}/${type}`, { comment });
    onUpdated();
    onClose();
  }

  if (!category) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="admin-card max-w-xl w-full p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-3">✖</button>

        <h3 className="admin-title mb-4">Category Details</h3>

        <div className="text-sm space-y-1">
          <div><b>Name:</b> {category.name}</div>
          <div><b>Slug:</b> {category.slug}</div>
          <div><b>SEO Title:</b> {category.seo_title}</div>
          <div><b>SEO Description:</b> {category.seo_description}</div>
          <div><b>Icon:</b> {category.icon || "—"}</div>
          <div><b>Sort Order:</b> {category.sort_order}</div>
          <div><b>Status:</b> {category.is_active ? "Active":"Inactive"}</div>
          <div><b>Created:</b> {new Date(category.created_at).toLocaleString()}</div>
        </div>

        <textarea
          className="admin-input mt-4"
          placeholder="Action comment (required)"
          value={comment}
          onChange={(e)=>setComment(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          {category.is_active ? (
            <button className="admin-btn" onClick={()=>action("deactivate")}>
              Deactivate
            </button>
          ) : (
            <button className="admin-btn" onClick={()=>action("activate")}>
              Activate
            </button>
          )}
          <button className="admin-btn admin-btn-danger" onClick={()=>action("delete")}>
            Delete
          </button>
        </div>

        <div className="mt-6 border-t pt-3 text-xs">
          <h4 className="font-semibold mb-2">Audit log</h4>
          {logs.map(l=>(
            <div key={l.id} className="mb-2">
              <b>{l.action}</b> – {l.performed_by_email}<br/>
              {l.comment}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
