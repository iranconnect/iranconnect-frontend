//components/admin/CategoryDetailsModal.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function CategoryDetailsModal({
  categoryId,
  onClose,
  onUpdated,
}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/admin/categories/${categoryId}`)
      .then((res) => setData(res.data));
  }, [categoryId]);

  async function toggleStatus() {
    await apiClient.patch(`/admin/categories/${categoryId}/status`);
    onUpdated();
    onClose();
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="admin-card w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-3">
          ✖
        </button>

        <h3 className="admin-title mb-4">Category Details</h3>

        <div className="space-y-2 text-sm">
          <div><b>Name:</b> {data.name}</div>
          <div><b>Slug:</b> {data.slug}</div>
          <div><b>Status:</b> {data.is_active ? "Active" : "Inactive"}</div>
          <div><b>Created By:</b> {data.created_by_email}</div>
          <div><b>Created At:</b> {new Date(data.created_at).toLocaleString()}</div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={toggleStatus}
            className="admin-btn admin-btn-secondary"
          >
            {data.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
