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
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState("idle"); 
  // idle | validating | validated | error | importing

  const [error, setError] = useState("");
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [validationRows, setValidationRows] = useState(null);


  /* -----------------------------------
     📄 Parse Excel
  ----------------------------------- */
  function handleFile(e) {
    setError("");
    setReportId(null);
    setStatus("idle");

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
          setError("Excel file has no data rows. Please add at least one service.");
          return;
        }

        if (rows.length > 500) {
          setError("Maximum 500 services allowed per upload.");
          return;
        }

        const parsed = rows.map((r, i) => {
          const obj = {
            category_slug: String(r.category_slug || "").trim(),
            subcategory_slug: String(r.subcategory_slug || "").trim(),
            name: String(r.name || "").trim(),
            slug: String(r.slug || "").trim(),
            description: String(r.description || "").trim(),
            seo_title: String(r.seo_title || "").trim(),
            seo_description: String(r.seo_description || "").trim(),
          };
        
          if (
            !obj.category_slug ||
            !obj.subcategory_slug ||
            !obj.name ||
            !obj.slug ||
            !obj.description ||
            !obj.seo_title ||
            !obj.seo_description
          ) {
            throw new Error(`Missing required field at row ${i + 2}`);
          }
        
          return obj;
        });
        
        setServices(parsed);

      } catch (err) {
        setError("Failed to read Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /* -----------------------------------
     ✅ VALIDATE
  ----------------------------------- */
  async function handleValidate() {
    setError("");
    setReportId(null);

    if (!services.length) {
      setError("No services loaded from Excel.");
      return;
    }

    setStatus("validating");

    try {
      const res = 
        await apiClient.post("/admin/services/bulk/validate", {
          services,
      });


      if (res.data.ok) {
        setStatus("validated");
      } else {
        setStatus("error");
        setValidationRows(res.data.rows);
      }
    } catch (err) {
      setStatus("error");
      setError("Validation failed.");
    }
  }

  /* -----------------------------------
     ⬇️ Download validation report
  ----------------------------------- */
  function downloadReport() {
    if (!validationRows) return;
  
    const ws = XLSX.utils.json_to_sheet(validationRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "validation");
  
    XLSX.writeFile(wb, "bulk-validation-report.xlsx");
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

        {status === "error" && reportId && (
          <div className="text-yellow-600 text-sm mb-3">
            ⚠️ Validation failed.
            <button
              onClick={downloadReport}
              className="underline ml-1"
            >
              Download report
            </button>
          </div>
        )}

        <textarea
          className="admin-input mb-4"
          rows={3}
          placeholder="Bulk import comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />


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
