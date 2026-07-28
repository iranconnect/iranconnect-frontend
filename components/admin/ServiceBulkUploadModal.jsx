// frontend/components/admin/ServiceBulkUploadModal.jsx
import { useState } from "react";
import { parseAdminBulkWorkbook } from "../../utils/parseAdminBulkWorkbook";
import apiClient from "../../utils/apiClient";

const SERVICE_BULK_HEADERS = [
  "category_slug",
  "subcategory_slug",
  "name",
  "slug",
  "description",
  "seo_title",
  "seo_description",
];

export default function ServiceBulkUploadModal({
  subcategories,
  onClose,
  onSuccess,
}) {
  const [services, setServices] = useState([]);
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState("idle"); 
  // idle | validating | validated | error | importing

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [reportRows, setReportRows] = useState([]);

  const [preview, setPreview] = useState(null);


  /* -----------------------------------
     📄 Parse Excel
  ----------------------------------- */
  async function handleFile(e) {
    setError("");
    setReportRows([]);
    setStatus("idle");
    setServices([]);
    setPreview(null);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseAdminBulkWorkbook(file, {
        sheetName: "services",
        expectedHeaders: SERVICE_BULK_HEADERS,
        maxRows: 500,
      });

      const parsed = rows.map((row, index) => {
        const service = {
          category_slug: String(
            row.category_slug || ""
          ).trim(),
          subcategory_slug: String(
            row.subcategory_slug || ""
          ).trim(),
          name: String(row.name || "").trim(),
          slug: String(row.slug || "").trim(),
          description: String(
            row.description || ""
          ).trim(),
          seo_title: String(
            row.seo_title || ""
          ).trim(),
          seo_description: String(
            row.seo_description || ""
          ).trim(),
        };

        if (
          !service.category_slug ||
          !service.subcategory_slug ||
          !service.name ||
          !service.slug ||
          !service.description ||
          !service.seo_title ||
          !service.seo_description
        ) {
          throw new Error(
            `Missing required field at row ${index + 2}`
          );
        }

        return service;
      });

      setServices(parsed);

      const categories = new Set(
        parsed.map((service) => service.category_slug)
      );

      const subcategoryPairs = new Set(
        parsed.map(
          (service) =>
            `${service.category_slug} / ${service.subcategory_slug}`
        )
      );

      setPreview({
        services: parsed.length,
        categories: categories.size,
        subcategories: subcategoryPairs.size,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Failed to read Excel file."
      );
    } finally {
      e.target.value = "";
    }
  }

  /* -----------------------------------
     ✅ VALIDATE
  ----------------------------------- */
  async function handleValidate() {
    setError("");
    setReportRows([]);
    setStatus("validating");
  
    if (!services.length) {
      setError("No services loaded from Excel.");
      setStatus("idle");
      return;
    }
  
    try {
      const res = await apiClient.post(
        "/admin/services/bulk/validate",
        { services }
      );
  
      if (res.data.ok) {
        setStatus("validated");
      } else {
        setStatus("error");
        setReportRows(res.data.rows || []);
        setError("Validation failed. Please review the report below.");
      }
    } catch (err) {
      setStatus("error");
      setError("Validation request failed.");
    }
  }

  
  /* -----------------------------------
     🚀 IMPORT
  ----------------------------------- */
  async function handleImport() {
    setError("");

    if (!comment.trim()) {
      setError("Bulk import comment is required.");
      return;
    }

    setLoading(true);
    setStatus("importing");

    try {
      await apiClient.post("/admin/services/bulk", {
        services,
        comment,
      });


      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Import failed.");
      setStatus("validated");
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------
     UI
  ----------------------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="admin-card max-w-lg w-full p-6 relative">

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

        <input
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          className="admin-input mb-3"
        />

        <div className="admin-muted text-xs mb-3">
          Category and Subcategory are read from the Excel file.
          Each row can belong to a different category or subcategory.
        </div>


        {services.length > 0 && (
          <div className="admin-muted text-sm mb-3">
            {services.length} services loaded
          </div>
        )}

        {/* STATUS MESSAGES */}
        {status === "validated" && (
          <div className="text-green-600 text-sm mb-3">
            ✅ Validation successful. Ready to import.
          </div>
        )}

        {preview && (
          <div className="admin-muted text-sm mb-3">
            {preview.services} services •{" "}
            {preview.categories} categories •{" "}
            {preview.subcategories} subcategories
          </div>
        )}

        

        <textarea
          className="admin-input mb-4"
          rows={3}
          placeholder="Bulk import comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {status === "error" && reportRows.length > 0 && (
          <div className="max-h-40 overflow-auto border rounded p-2 text-sm">
            {reportRows.map((r, i) => (
              <div key={i} className="text-red-600">
                Row {r.row}: {r.reason}
              </div>
            ))}
          </div>
        )}



        <div className="flex justify-between">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={handleValidate}
            disabled={status === "validating" || !services.length}
          >
            {status === "validating" ? "Validating…" : "Validate"}
          </button>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleImport}
            disabled={status !== "validated" || loading}
          >
            {loading ? "Importing…" : "Import Services"}
          </button>
        </div>
      </div>
    </div>
  );
}
