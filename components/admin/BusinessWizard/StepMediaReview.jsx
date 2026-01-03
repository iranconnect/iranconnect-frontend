// components/admin/BusinessWizard/StepMediaReview.jsx
import { useState } from "react";
import apiClient from "../../../utils/apiClient";

/* ======================================================
   Helper: Upload file to backend
====================================================== */
async function uploadMedia(file, type, onProgress) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await apiClient.post(
    "/admin/business-media/upload",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );

  return res.data;
}

/* ======================================================
   Component
====================================================== */
export default function StepMediaReview({
  data,
  setData,
  onNext,
  onBack,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  async function handleUpload(file, type) {
    try {
      setError("");
      setUploading(true);
      setProgress(0);

      const result = await uploadMedia(file, type, setProgress);

      setData((prev) => {
        if (type === "gallery") {
          const gallery = prev.gallery || [];
          if (gallery.length >= 10) return prev;

          return {
            ...prev,
            gallery: [
              ...gallery,
              {
                url: result.url,
                public_id: result.public_id,
                order: gallery.length,
              },
            ],
          };
        }

        return {
          ...prev,
          [type]: {
            url: result.url,
            public_id: result.public_id,
          },
        };
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function removeGalleryItem(index) {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  }

  /* ─────────────────────────────
     Validation
  ───────────────────────────── */
  const canProceed =
    data.logo &&
    data.owner_confirmed &&
    !uploading;

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 4 of 4 — Media, Visibility & Compliance
      </p>

      {/* ─────────────────────────────
         Logo (Required)
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">
          Business logo *
        </label>

        {data.logo ? (
          <div className="flex items-center gap-4">
            <img
              src={data.logo.url}
              alt="Logo preview"
              className="h-20 w-20 rounded border"
            />
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() =>
                setData((p) => ({ ...p, logo: null }))
              }
            >
              Replace
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) =>
              e.target.files &&
              handleUpload(e.target.files[0], "logo")
            }
          />
        )}
      </div>

      {/* ─────────────────────────────
         Cover (Optional)
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">
          Cover image (optional)
        </label>

        {data.cover ? (
          <div className="flex items-center gap-4">
            <img
              src={data.cover.url}
              alt="Cover preview"
              className="h-24 rounded border"
            />
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() =>
                setData((p) => ({ ...p, cover: null }))
              }
            >
              Replace
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) =>
              e.target.files &&
              handleUpload(e.target.files[0], "cover")
            }
          />
        )}
      </div>

      {/* ─────────────────────────────
         Gallery
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">
          Gallery images (optional)
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {(data.gallery || []).map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img.url}
                alt=""
                className="h-28 w-full object-cover rounded border"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded"
                onClick={() => removeGalleryItem(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {(data.gallery?.length || 0) < 10 && (
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) =>
              e.target.files &&
              handleUpload(e.target.files[0], "gallery")
            }
          />
        )}
      </div>

      {/* ─────────────────────────────
         Visibility
      ───────────────────────────── */}
      <div className="mb-6 flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.is_public ?? true}
            onChange={(e) =>
              setData((p) => ({
                ...p,
                is_public: e.target.checked,
              }))
            }
          />
          Public profile
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.allow_reviews ?? true}
            onChange={(e) =>
              setData((p) => ({
                ...p,
                allow_reviews: e.target.checked,
              }))
            }
          />
          Allow reviews
        </label>
      </div>

      {/* ─────────────────────────────
         Compliance
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.owner_confirmed || false}
            onChange={(e) =>
              setData((p) => ({
                ...p,
                owner_confirmed: e.target.checked,
              }))
            }
          />
          I confirm that I am authorized to manage this
          business information.
        </label>
      </div>

      {/* ─────────────────────────────
         Upload progress / error
      ───────────────────────────── */}
      {uploading && (
        <p className="text-sm opacity-70">
          Uploading… {progress}%
        </p>
      )}

      {error && (
        <p className="admin-error">
          {error}
        </p>
      )}

      {/* ─────────────────────────────
         Navigation
      ───────────────────────────── */}
      <div className="flex justify-between">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
          disabled={uploading}
        >
          Back
        </button>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={!canProceed}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
