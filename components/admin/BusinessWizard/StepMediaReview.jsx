// components/admin/BusinessWizard/StepMediaReview.jsx
import { useCallback, useMemo, useState } from "react";

/* ======================================================
   🧱 CONSTANTS — Business Rules (DO NOT INLINE)
====================================================== */
const MAX_GALLERY_IMAGES = 10;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/* ======================================================
   🧠 SAFE NORMALIZERS
====================================================== */
function normalizeBool(value, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeGallery(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (img) =>
      img &&
      typeof img === "object" &&
      typeof img.url === "string"
  );
}

function normalizeMedia(value) {
  if (
    value &&
    typeof value === "object" &&
    typeof value.url === "string"
  ) {
    return value;
  }
  return null;
}

/* ======================================================
   🧩 COMPONENT
====================================================== */
export default function StepMediaReview({
  data,
  setData,
  onNext,
  onBack,
}) {
  /* --------------------------------------------------
     🔐 NORMALIZED DATA
  -------------------------------------------------- */
  const normalized = useMemo(
    () => ({
      logo: normalizeMedia(data.logo),
      cover: normalizeMedia(data.cover),
      gallery: normalizeGallery(data.gallery),
      is_public: normalizeBool(data.is_public, true),
      allow_reviews: normalizeBool(
        data.allow_reviews,
        true
      ),
      owner_confirmed: normalizeBool(
        data.owner_confirmed,
        false
      ),
    }),
    [
      data.logo,
      data.cover,
      data.gallery,
      data.is_public,
      data.allow_reviews,
      data.owner_confirmed,
    ]
  );

  /* --------------------------------------------------
     🧠 UI STATE
  -------------------------------------------------- */
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* --------------------------------------------------
     🖼 PREVIEW STATE (LOCAL ONLY)
  -------------------------------------------------- */
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState([]);

  /* --------------------------------------------------
     🔄 FILE INPUT HARD RESET
  -------------------------------------------------- */
  const [inputKey, setInputKey] = useState({
    logo: 0,
    cover: 0,
    gallery: 0,
  });

  const bumpInputKey = useCallback((key) => {
    setInputKey((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  }, []);

  /* --------------------------------------------------
     ✅ SAFE setData
  -------------------------------------------------- */
  const safeSetData = useCallback(
    (updater) => {
      if (typeof setData !== "function") {
        setError("Internal error. Please refresh.");
        return;
      }
      setData(updater);
    },
    [setData]
  );

  const setField = useCallback(
    (key, value) => {
      safeSetData((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [safeSetData]
  );

  function revokeIfBlob(url) {
    try {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    } catch {}
  }
  /* ======================================================
     🖼 SINGLE MEDIA — LOGO / COVER (NO UPLOAD)
  ====================================================== */
  async function handleSingleMediaUpload(file, type) {
    if (!file || !type) return;

    bumpInputKey(type);
    setError("");

    const localPreviewUrl = URL.createObjectURL(file);

    if (type === "logo") {
      revokeIfBlob(logoPreview);
      setLogoPreview(localPreviewUrl);
      setField("logo_file", file);
    }

    if (type === "cover") {
      revokeIfBlob(coverPreview);
      setCoverPreview(localPreviewUrl);
      setField("cover_file", file);
    }
  }

  /* ======================================================
     🖼 GALLERY — PREVIEW + FILE COLLECT (NO UPLOAD)
  ====================================================== */
  const handleGalleryUpload = useCallback(
    async (files) => {
      if (!Array.isArray(files) || files.length === 0) return;

      bumpInputKey("gallery");
      setError("");

      const currentFiles = Array.isArray(data.gallery_files)
        ? data.gallery_files
        : [];

      const remainingSlots =
        MAX_GALLERY_IMAGES - currentFiles.length;

      if (remainingSlots <= 0) {
        setError(
          `MaximumRMaximum of ${MAX_GALLERY_IMAGES} images allowed.`
        );
        return;
      }

      const uploadBatch = files.slice(0, remainingSlots);

      const previewBatch = uploadBatch.map((file) => ({
        id:
          crypto.randomUUID?.() ||
          `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));

      setGalleryPreview((prev) => [
        ...prev,
        ...previewBatch,
      ]);

      safeSetData((prev) => ({
        ...prev,
        gallery_files: [
          ...currentFiles,
          ...uploadBatch,
        ],
      }));
    },
    [bumpInputKey, data.gallery_files, safeSetData]
  );

  /* ======================================================
     🧠 STEP VALIDATION
  ====================================================== */
  const canProceed = useMemo(() => {
    return (
      !!data.logo_file &&
      normalized.owner_confirmed === true &&
      busy === false
    );
  }, [data.logo_file, normalized.owner_confirmed, busy]);
  /* ======================================================
     🧱 RENDER — UI ONLY
  ====================================================== */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 4 of 4 — Media, Visibility & Compliance
      </p>

      {/* LOGO */}
      <div className="mb-8">
        <label className="admin-label">Business logo *</label>

        <div className="flex items-center gap-4 mb-3">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="admin-hint text-xs">No logo</span>
            )}
          </div>

          <input
            key={`logo-${inputKey.logo}`}
            type="file"
            accept={ACCEPT_ATTR}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleSingleMediaUpload(file, "logo");
            }}
          />
        </div>
      </div>

      {/* COVER */}
      <div className="mb-8">
        <label className="admin-label">Cover image</label>

        <div className="flex items-start gap-4 mb-3">
          <div
            style={{
              width: 200,
              height: 96,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-soft)",
              overflow: "hidden",
            }}
          >
            {coverPreview && (
              <img
                src={coverPreview}
                alt="Cover preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>

          <input
            key={`cover-${inputKey.cover}`}
            type="file"
            accept={ACCEPT_ATTR}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleSingleMediaUpload(file, "cover");
            }}
          />
        </div>
      </div>

      {/* GALLERY */}
      <div className="mb-8">
        <label className="admin-label">
          Gallery images (max {MAX_GALLERY_IMAGES})
        </label>

        {galleryPreview.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {galleryPreview.map((item) => (
              <img
                key={item.id}
                src={item.url}
                alt=""
                className="rounded border"
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                }}
              />
            ))}
          </div>
        )}

        {(data.gallery_files?.length || 0) <
          MAX_GALLERY_IMAGES && (
          <input
            key={`gallery-${inputKey.gallery}`}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = "";
              handleGalleryUpload(files);
            }}
          />
        )}
      </div>

      {/* VISIBILITY */}
      <div className="mb-8">
        <label className="admin-label">Profile visibility</label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={normalized.is_public}
            onChange={(e) =>
              setField("is_public", e.target.checked)
            }
          />
          Public profile
        </label>
      </div>

      {/* CONFIRMATION */}
      <div className="mb-8">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={normalized.owner_confirmed}
            onChange={(e) =>
              setField("owner_confirmed", e.target.checked)
            }
          />
          I confirm that I am authorized to manage this business.
        </label>
      </div>

      {error && <p className="admin-error mb-3">{error}</p>}

      {/* NAVIGATION */}
      <div className="flex justify-between">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
          disabled={busy}
        >
          Back
        </button>

        <button
          type="button"
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
