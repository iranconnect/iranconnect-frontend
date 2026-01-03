// components/admin/BusinessWizard/StepMediaReview.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../../utils/apiClient";

/* ======================================================
   Upload helper (backend: /api/admin/business-media/*)
   - apiClient should already include /api prefix in baseURL
====================================================== */
async function uploadMedia(file, type, onProgress) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await apiClient.post("/admin/business-media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!onProgress) return;
      if (!e.total) return;
      const pct = Math.round((e.loaded * 100) / e.total);
      onProgress(pct);
    },
    withCredentials: true,
  });

  return res.data;
}

/* ======================================================
   Small helper: coerce boolean safely
====================================================== */
function asBool(v, fallback) {
  if (v === true) return true;
  if (v === false) return false;

  // tolerate legacy string values if ever present
  if (v === "true") return true;
  if (v === "false") return false;

  return fallback;
}

/* ======================================================
   Component
====================================================== */
export default function StepMediaReview({ data, setData, onNext, onBack }) {
  // --- Ensure defaults only once for this step
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      is_public: asBool(prev.is_public, true),
      allow_reviews: asBool(prev.allow_reviews, true),
      owner_confirmed: asBool(prev.owner_confirmed, false),
      gallery: Array.isArray(prev.gallery) ? prev.gallery : [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Visual/UX state
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("");
  const [progress, setProgress] = useState(0);

  // --- Input reset keys (hard reset file chooser UI)
  const [inputKey, setInputKey] = useState({
    logo: 0,
    cover: 0,
    gallery: 0,
  });

  // --- Local previews (instant feedback)
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreview, setGalleryPreview] = useState([]); // [{id, url, name, status}]

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
        if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
        galleryPreview.forEach((g) => {
          if (g?.url?.startsWith("blob:")) URL.revokeObjectURL(g.url);
        });
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* ─────────────────────────────
     Robust toggles (fix: not clickable / not changing)
  ───────────────────────────── */
  const isPublic = asBool(data?.is_public, true);
  const allowReviews = asBool(data?.allow_reviews, true);
  const ownerConfirmed = asBool(data?.owner_confirmed, false);

  function setField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  /* ─────────────────────────────
     Reset a file input reliably
  ───────────────────────────── */
  function bumpKey(which) {
    setInputKey((p) => ({ ...p, [which]: (p[which] || 0) + 1 }));
  }

  /* ─────────────────────────────
     Single upload: logo / cover
  ───────────────────────────── */
  async function handleSingleUpload(e, type) {
    const file = e.target.files?.[0];

    // Always reset input UI (fix bug: filename remains even if upload fails)
    bumpKey(type);

    if (!file) return;

    setError("");
    setProgress(0);

    const localUrl = URL.createObjectURL(file);

    // show preview immediately
    if (type === "logo") {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(localUrl);
    }
    if (type === "cover") {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
      setCoverPreview(localUrl);
    }

    try {
      setBusy(true);
      setBusyText(`Uploading ${type}…`);

      const res = await uploadMedia(file, type, setProgress);

      setData((prev) => ({
        ...prev,
        [type]: {
          url: res.url,
          public_id: res.public_id,
          name: file.name,
        },
      }));

      // replace local preview with final url
      if (type === "logo") {
        if (localUrl?.startsWith("blob:")) URL.revokeObjectURL(localUrl);
        setLogoPreview(res.url);
      }
      if (type === "cover") {
        if (localUrl?.startsWith("blob:")) URL.revokeObjectURL(localUrl);
        setCoverPreview(res.url);
      }
    } catch (err) {
      setBusy(false);
      setBusyText("");
      setProgress(0);

      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        `Upload failed (${type}). Please try again.`;

      setError(msg);

      // keep preview visible (user sees what was selected), but do not set data[type]
      setData((prev) => ({ ...prev, [type]: prev[type] || null }));
      return;
    } finally {
      setBusy(false);
      setBusyText("");
      setProgress(0);
    }
  }

  /* ─────────────────────────────
     Gallery multi-upload (max 10 in one selection)
  ───────────────────────────── */
  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files || []);

    bumpKey("gallery");

    if (!files.length) return;

    setError("");
    setProgress(0);

    const existing = Array.isArray(data.gallery) ? data.gallery : [];
    const remaining = 10 - existing.length;

    if (remaining <= 0) {
      setError("You already reached the maximum of 10 gallery images.");
      return;
    }

    const toUpload = files.slice(0, remaining);

    // instant previews
    const previewBatch = toUpload.map((f) => ({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      url: URL.createObjectURL(f),
      name: f.name,
      status: "uploading",
    }));

    setGalleryPreview((prev) => [...prev, ...previewBatch]);

    try {
      setBusy(true);
      setBusyText(`Uploading gallery (${toUpload.length})…`);

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        setBusyText(`Uploading gallery (${i + 1}/${toUpload.length})…`);
        setProgress(0);

        const res = await uploadMedia(file, "gallery", setProgress);

        setData((prev) => {
          const g = Array.isArray(prev.gallery) ? prev.gallery : [];
          if (g.length >= 10) return prev;

          return {
            ...prev,
            gallery: [
              ...g,
              {
                url: res.url,
                public_id: res.public_id,
                name: file.name,
                order: g.length,
              },
            ],
          };
        });

        // mark preview as done and swap to cloud url (optional)
        setGalleryPreview((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.name === file.name && x.status === "uploading");
          if (idx >= 0) {
            try {
              if (next[idx].url?.startsWith("blob:")) URL.revokeObjectURL(next[idx].url);
            } catch {}
            next[idx] = {
              ...next[idx],
              url: res.url,
              status: "done",
            };
          }
          return next;
        });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "One or more gallery uploads failed. Please try again.";

      setError(msg);

      // keep previews but mark as failed (do not add to data.gallery unless success)
      setGalleryPreview((prev) =>
        prev.map((x) => (x.status === "uploading" ? { ...x, status: "failed" } : x))
      );
    } finally {
      setBusy(false);
      setBusyText("");
      setProgress(0);
    }
  }

  function removeGalleryAt(index) {
    setData((prev) => {
      const g = Array.isArray(prev.gallery) ? prev.gallery : [];
      const next = g.filter((_, i) => i !== index).map((it, i) => ({ ...it, order: i }));
      return { ...prev, gallery: next };
    });
  }

  const canProceed = !!data?.logo?.url && ownerConfirmed && !busy;
  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">Add New Business (Advanced)</h2>
      <p className="admin-muted mb-6">Step 4 of 4 — Media, Visibility & Compliance</p>

      {/* LOGO */}
      <div className="mb-6">
        <label className="admin-label">Business logo *</label>

        <div className="mb-3 flex items-center gap-4">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {logoPreview || data?.logo?.url ? (
              <img
                src={logoPreview || data.logo.url}
                alt="Logo preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span className="admin-hint" style={{ fontSize: 12 }}>
                No logo
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p className="admin-hint" style={{ marginBottom: 8 }}>
              PNG/JPG/WEBP recommended. This will be shown as the primary brand icon.
            </p>

            <input
              key={`logo-${inputKey.logo}`}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => handleSingleUpload(e, "logo")}
            />
          </div>
        </div>
      </div>

      {/* COVER */}
      <div className="mb-6">
        <label className="admin-label">Cover image (optional)</label>

        <div className="mb-3 flex items-start gap-4">
          <div
            style={{
              width: 180,
              height: 72,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {coverPreview || data?.cover?.url ? (
              <img
                src={coverPreview || data.cover.url}
                alt="Cover preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span className="admin-hint" style={{ fontSize: 12 }}>
                No cover
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p className="admin-hint" style={{ marginBottom: 8 }}>
              Recommended aspect ratio: 16:9. This appears at the top of the business profile.
            </p>

            <input
              key={`cover-${inputKey.cover}`}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => handleSingleUpload(e, "cover")}
            />
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <div className="mb-6">
        <label className="admin-label">Gallery images (optional, max 10)</label>

        <p className="admin-hint mb-3">
          You can select multiple images in one upload. The system will keep only the first {Math.max(
            0,
            10 - (data?.gallery?.length || 0)
          )} images if you exceed the limit.
        </p>

        {(data?.gallery?.length || 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {data.gallery.map((img, i) => (
              <div key={`${img.public_id || img.url}-${i}`} style={{ position: "relative" }}>
                <img
                  src={img.url}
                  alt=""
                  className="rounded border"
                  style={{ width: "100%", height: 112, objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => removeGalleryAt(i)}
                  className="admin-btn admin-btn-secondary"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    padding: "6px 8px",
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview batch (uploads in progress / failed) */}
        {galleryPreview.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {galleryPreview.slice(-10).map((g) => (
              <div key={g.id} style={{ position: "relative" }}>
                <img
                  src={g.url}
                  alt=""
                  className="rounded border"
                  style={{ width: "100%", height: 112, objectFit: "cover", opacity: g.status === "failed" ? 0.5 : 1 }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 6,
                    fontSize: 11,
                    padding: "4px 6px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                  }}
                >
                  {g.status === "uploading" ? "Uploading…" : g.status === "failed" ? "Failed" : "Uploaded"}
                </div>
              </div>
            ))}
          </div>
        )}

        {(data?.gallery?.length || 0) < 10 && (
          <input
            key={`gallery-${inputKey.gallery}`}
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={handleGalleryUpload}
          />
        )}
      </div>

      {/* VISIBILITY */}
      <div className="mb-6">
        <label className="admin-label">Visibility</label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setField("is_public", e.target.checked)}
            />
            Public profile
          </label>

          <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={allowReviews}
              onChange={(e) => setField("allow_reviews", e.target.checked)}
            />
            Allow reviews
          </label>
        </div>
      </div>

      {/* COMPLIANCE */}
      <div className="mb-6">
        <label className="admin-label">Compliance</label>

        <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={ownerConfirmed}
            onChange={(e) => setField("owner_confirmed", e.target.checked)}
          />
          I confirm that I am authorized to manage this business information.
        </label>
      </div>

      {/* STATUS */}
      {busy && (
        <p className="admin-hint" style={{ marginBottom: 10 }}>
          {busyText} {progress ? `(${progress}%)` : ""}
        </p>
      )}

      {error && <p className="admin-error">{error}</p>}

      {/* NAVIGATION */}
      <div className="flex justify-between">
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onBack} disabled={busy}>
          Back
        </button>

        <button type="button" className="admin-btn admin-btn-primary" onClick={onNext} disabled={!canProceed}>
          Next
        </button>
      </div>
    </div>
  );
}
