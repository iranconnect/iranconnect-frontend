// components/admin/BusinessWizard/StepMediaReview.jsx
import { useState } from "react";
import apiClient from "../../../utils/apiClient";

async function uploadMedia(file, type) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await apiClient.post(
    "/admin/business-media/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
}

export default function StepMediaReview({ data, setData, onNext, onBack }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  /* ─────────────────────────────
     Generic single upload (logo / cover)
  ───────────────────────────── */
  async function handleSingleUpload(e, type) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 🔴 critical fix

    if (!file) return;

    try {
      setError("");
      setUploading(true);

      const res = await uploadMedia(file, type);

      setData((prev) => ({
        ...prev,
        [type]: {
          url: res.url,
          public_id: res.public_id,
          name: file.name,
        },
      }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          `Failed to upload ${type}.`
      );
    } finally {
      setUploading(false);
    }
  }

  /* ─────────────────────────────
     Gallery multi-upload (max 10)
  ───────────────────────────── */
  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // 🔴 critical fix

    if (!files.length) return;

    const existing = data.gallery || [];
    const remaining = 10 - existing.length;

    if (remaining <= 0) return;

    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError("");

    try {
      for (const file of toUpload) {
        const res = await uploadMedia(file, "gallery");

        setData((prev) => ({
          ...prev,
          gallery: [
            ...(prev.gallery || []),
            {
              url: res.url,
              public_id: res.public_id,
              name: file.name,
              order: prev.gallery?.length || 0,
            },
          ],
        }));
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "One or more gallery images failed to upload."
      );
    } finally {
      setUploading(false);
    }
  }

  const canProceed =
    data.logo &&
    data.owner_confirmed &&
    !uploading;

  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 4 of 4 — Media, Visibility & Compliance
      </p>

      {/* Logo */}
      <div className="mb-6">
        <label className="admin-label">Business logo *</label>

        {data.logo && (
          <div className="mb-2 flex items-center gap-3">
            <img
              src={data.logo.url}
              className="h-16 w-16 rounded border"
            />
            <span className="text-sm opacity-70">
              {data.logo.name}
            </span>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) =>
            handleSingleUpload(e, "logo")
          }
        />
      </div>

      {/* Cover */}
      <div className="mb-6">
        <label className="admin-label">
          Cover image (optional)
        </label>

        {data.cover && (
          <div className="mb-2">
            <img
              src={data.cover.url}
              className="h-24 rounded border"
            />
            <div className="text-sm opacity-70">
              {data.cover.name}
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) =>
            handleSingleUpload(e, "cover")
          }
        />
      </div>

      {/* Gallery */}
      <div className="mb-6">
        <label className="admin-label">
          Gallery images (max 10)
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {(data.gallery || []).map((img, i) => (
            <img
              key={i}
              src={img.url}
              className="h-28 w-full object-cover rounded border"
            />
          ))}
        </div>

        {(data.gallery?.length || 0) < 10 && (
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleGalleryUpload}
          />
        )}
      </div>

      {/* Visibility */}
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

      {/* Compliance */}
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
          I confirm I am authorized to manage this business.
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="flex justify-between">
        <button
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
          disabled={uploading}
        >
          Back
        </button>

        <button
          className="admin-btn admin-btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}
