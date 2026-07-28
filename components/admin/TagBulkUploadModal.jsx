// frontend/components/admin/TagBulkUploadModal.jsx
import { useState } from "react";
import { parseAdminBulkWorkbook } from "../../utils/parseAdminBulkWorkbook";
import apiClient from "../../utils/apiClient";

const TAG_BULK_HEADERS = [
  "name",
  "slug",
  "type",
  "scope",
  "language_code",
  "seo_title",
  "seo_description",
  "is_selectable",
  "search_weight",
  "category_slug",
  "subcategory_slug",
  "service_slug",
];

export default function TagBulkUploadModal({ onClose, onSuccess }) {
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState("idle");
  // idle | validating | validated | error | importing

  const [error, setError] = useState("");
  const [reportRows, setReportRows] = useState([]);

  /* -----------------------------------
     📄 Parse Excel
  ----------------------------------- */
  async function handleFile(e) {
    setError("");
    setReportRows([]);
    setStatus("idle");
    setTags([]);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseAdminBulkWorkbook(file, {
        sheetName: "tags",
        expectedHeaders: TAG_BULK_HEADERS,
        maxRows: 500,
      });

      const parsed = rows.map((row, index) => {
        const tag = {
          name: String(row.name || "").trim(),
          slug: String(row.slug || "").trim(),
          type: String(row.type || "").trim(),
          scope: String(row.scope || "global").trim(),
          language_code: String(
            row.language_code || "en"
          )
            .trim()
            .toLowerCase(),
          seo_title: String(
            row.seo_title || ""
          ).trim(),
          seo_description: String(
            row.seo_description || ""
          ).trim(),
          is_selectable:
            row.is_selectable === false ||
            String(row.is_selectable).toLowerCase() === "false"
              ? false
              : true,
          search_weight:
            Number.isFinite(Number(row.search_weight))
              ? Number(row.search_weight)
              : 1,
          category_slug: String(
            row.category_slug || ""
          ).trim(),
          subcategory_slug: String(
            row.subcategory_slug || ""
          ).trim(),
          service_slug: String(
            row.service_slug || ""
          ).trim(),
        };

        if (
          !tag.name ||
          !tag.slug ||
          !tag.type ||
          !tag.scope ||
          !tag.language_code ||
          !tag.seo_title ||
          !tag.seo_description
        ) {
          throw new Error(
            `Missing required field at row ${index + 2}`
          );
        }

        return tag;
      });

      setTags(parsed);
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

    if (!tags.length) {
      setError("No tags loaded from Excel.");
      setStatus("idle");
      return;
    }

    try {
      const res = await apiClient.post(
        "/admin/tags/bulk/validate",
        { tags }
      );

      if (res.data.ok) {
        setStatus("validated");
      } else {
        setStatus("error");
        setReportRows(res.data.rows || []);
        setError("Validation failed. Please review the report below.");
      }
    } catch {
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

    setStatus("importing");

    try {
      await apiClient.post("/admin/tags/bulk", {
        tags,
        comment,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Import failed.");
      setStatus("validated");
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
          Bulk Upload Tags
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

        {tags.length > 0 && (
          <div className="admin-muted text-sm mb-3">
            {tags.length} tags loaded
          </div>
        )}

        {/* STATUS MESSAGES */}
        {status === "validated" && (
          <div className="text-green-600 text-sm mb-3">
            ✅ Validation successful. Ready to import.
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
            disabled={status === "validating" || !tags.length}
          >
            {status === "validating" ? "Validating…" : "Validate"}
          </button>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleImport}
            disabled={status !== "validated"}
          >
            {status === "importing" ? "Importing…" : "Import Tags"}
          </button>
        </div>
      </div>
    </div>
  );
}
