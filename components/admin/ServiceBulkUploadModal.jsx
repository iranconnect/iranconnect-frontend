// frontend/components/admin/ServiceBulkUploadModal.jsx
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
  const [preview, setPreview] = useState([]);
  const [validation, setValidation] = useState(null);

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  /* -----------------------------------
     📄 Parse Excel file
  ----------------------------------- */
  function handleFile(e) {
    setError("");
    setValidation(null);
    setServices([]);
    setPreview([]);

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

        if (!workbook.SheetNames.includes("services")) {
          throw new Error("Missing 'services' sheet in Excel file.");
        }

        const sheet = workbook.Sheets["services"];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
          throw new Error("Excel file is empty.");
        }

        if (rows.length > 500) {
          throw new Error("Maximum 500 services allowed per upload.");
        }

        const parsed = rows.map((r, i) => {
          if (!r.name || !r.slug) {
            throw new Error(`Row ${i + 2}: name and slug are required.`);
          }

          return {
            name: String(r.name).trim(),
            slug: String(r.slug).trim(),
            description: String(r.description || "").trim(),
            seo_title: String(r.seo_title || "").trim(),
            seo_description: String(r.seo_description || "").trim(),
          };
        });

        setServices(parsed);

        setPreview(
          parsed.map((s, idx) => ({
            row: idx + 2,
            ...s,
            status: "pending",
            message: "Waiting for validation",
          }))
        );
      } catch (err) {
        setError(err.message || "Failed to parse Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /* -----------------------------------
     🔍 Backend validation (C4)
  ----------------------------------- */
  async function validateBulk() {
    setError("");
    setValidating(true);

    if (!subcategoryId) {
      setError("Please select a subcategory before validation.");
      setValidating(false);
      return;
    }

    try {
      const res = await apiClient.post(
        "/admin/services/bulk/validate",
        {
          subcategory_id: subcategoryId,
          services,
        }
      );

      const result = res.data;
      setValidation(result);

      if (!result.valid) {
        setPreview((prev) =>
          prev.map((row) => {
            const err = result.errors.find(
              (e) => e.row === row.row
            );
            return err
              ? { ...row, status: "error", message: err.message }
              : { ...row, status: "ok", message: "OK" };
          })
        );
      } else {
        setPreview((prev) =>
          prev.map((row) => ({
            ...row,
            status: "ok",
            message: "OK",
          }))
        );
      }
    } catch (err) {
      setError("Validation failed.");
    } finally {
      setValidating(false);
    }
  }

  /* -----------------------------------
     🚀 Submit bulk upload (ONLY if valid)
  ----------------------------------- */
  async function handleSubmit() {
    setError("");

    if (!validation || validation.valid !== true) {
      setError("Please validate data before importing.");
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
      <div className="admin-card max-w-3xl w-full p-6 relative">

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

        {/* Preview Table */}
        {preview.length > 0 && (
          <div className="mb-4 max-h-60 overflow-auto border rounded">
            <table className="admin-table text-xs">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p) => (
                  <tr key={p.row}>
                    <td>{p.row}</td>
                    <td>{p.name}</td>
                    <td>{p.slug}</td>
                    <td>
                      {p.status === "ok" && (
                        <span className="text-green-600">OK</span>
                      )}
                      {p.status === "error" && (
                        <span className="text-red-600">{p.message}</span>
                      )}
                      {p.status === "pending" && (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={validating || !services.length}
            onClick={validateBulk}
          >
            {validating ? "Validating…" : "Validate"}
          </button>

          <button
            className="admin-btn admin-btn-primary"
            disabled={loading || !validation || validation.valid !== true}
            onClick={handleSubmit}
          >
            {loading ? "Importing…" : "Import Services"}
          </button>
        </div>
      </div>
    </div>
  );
}
