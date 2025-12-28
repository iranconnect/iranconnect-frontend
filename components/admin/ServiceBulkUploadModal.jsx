//frontend/components/admin/ServiceBulkUploadModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import apiClient from "../../utils/apiClient";

export default function ServiceBulkUploadModal({
  subcategories,
  onClose,
  onSuccess,
}) {
  const [subcategoryId, setSubcategoryId] = useState("");
  const [services, setServices] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* -----------------------------------
     📄 Parse Excel file
  ----------------------------------- */
  function handleFile(e) {
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      setError("Only .xlsx Excel files are supported.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
          setError("Excel file is empty.");
          return;
        }

        if (rows.length > 500) {
          setError("Maximum 500 services allowed per upload.");
          return;
        }

        const parsed = rows.map((r, i) => {
          if (
            !r.name ||
            !r.slug ||
            !r.description ||
            !r.seo_title ||
            !r.seo_description
          ) {
            throw new Error(`Missing required field at row ${i + 2}`);
          }

          return {
            name: String(r.name).trim(),
            slug: String(r.slug).trim(),
            description: String(r.description).trim(),
            seo_title: String(r.seo_title).trim(),
            seo_description: String(r.seo_description).trim(),
          };
        });

        setServices(parsed);
      } catch (err) {
        setError(err.message || "Failed to parse Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /* -----------------------------------
     🚀 Submit bulk upload
  ----------------------------------- */
  async function handleSubmit() {
    setError("");

    if (!subcategoryId) {
      setError("Please select a subcategory.");
      return;
    }

    if (!services.length) {
      setError("No services to upload.");
      return;
    }

    if (!comment.trim()) {
      setError("Bulk import comment is required.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/admin/services/bulk", {
        subcategory_id: subcategoryId,
        comment,
        services,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="admin-card max-w-xl w-full p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-lg font-semibold mb-4 text-turquoise">
          Bulk Upload Services
        </h2>

        {error && (
          <div className="text-red-600 text-sm mb-3">{error}</div>
        )}

        {/* Subcategory select */}
        <select
          className="admin-input mb-3"
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
        >
          <option value="">Select subcategory</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Excel upload */}
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          className="admin-input mb-3"
        />

        {services.length > 0 && (
          <div className="admin-muted text-sm mb-3">
            {services.length} services ready to be imported
          </div>
        )}

        {/* Comment */}
        <textarea
          className="admin-input mb-4"
          rows={3}
          placeholder="Bulk import comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Action */}
        <div className="flex justify-end">
          <button
            className="admin-btn admin-btn-primary"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Importing…" : "Import Services"}
          </button>
        </div>
      </div>
    </div>
  );
}
