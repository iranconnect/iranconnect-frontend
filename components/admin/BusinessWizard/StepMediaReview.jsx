// components/admin/BusinessWizard/StepMediaReview.jsx
import { useCallback, useMemo, useRef, useState } from "react";
import apiClient from "../../../utils/apiClient";

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
   هدف: جلوگیری از crash و رفتار غیرقابل پیش‌بینی
====================================================== */

/**
 * Normalize boolean values coming from:
 * - undefined
 * - null
 * - string ("true"/"false")
 * - legacy payloads
 */
function normalizeBool(value, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;

  if (value === "true") return true;
  if (value === "false") return false;

  return fallback;
}

/**
 * Always return a safe gallery array
 */
function normalizeGallery(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (img) =>
      img &&
      typeof img === "object" &&
      typeof img.url === "string"
  );
}

/**
 * Normalize single media object (logo / cover)
 */
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
   📡 UPLOAD API HELPER
   - Centralized
   - Progress-aware
====================================================== */
async function uploadMediaToServer({
  file,
  type,
  onProgress,
}) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const response = await apiClient.post(
    "/admin/business-media/upload",
    form,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (
          !onProgress ||
          !event.total ||
          event.total === 0
        )
          return;

        const percent = Math.round(
          (event.loaded * 100) / event.total
        );
        onProgress(percent);
      },
    }
  );

  return response.data;
}

/* ======================================================
   🧩 COMPONENT — STATE ONLY (NO JSX YET)
====================================================== */
export default function StepMediaReview({
  data,
  setData,
  onNext,
  onBack,
}) {
  /* --------------------------------------------------
     🔐 NORMALIZED DATA (READ-ONLY DERIVED)
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
     🧠 UI / UX STATE
  -------------------------------------------------- */
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  /* --------------------------------------------------
     🖼 PREVIEW STATE (LOCAL, NOT BUSINESS DATA)
     - This is intentional
     - Prevents corrupting wizard data on failed upload
  -------------------------------------------------- */
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  /**
   * galleryPreview items:
   * {
   *   id: string,
   *   url: string (blob or final),
   *   name: string,
   *   status: "uploading" | "done" | "failed"
   * }
   */
  const [galleryPreview, setGalleryPreview] =
    useState([]);

  /* --------------------------------------------------
     🔄 FILE INPUT HARD RESET (critical UX fix)
     - Browser keeps filename unless remounted
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
     🧱 SAFE DATA MUTATORS
     - Single entry point for wizard state writes
  -------------------------------------------------- */
  const setField = useCallback(
    (key, value) => {
      setData((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setData]
  );
  /* ======================================================
     🧪 INTERNAL HELPERS
  ====================================================== */

  function resetBusyState() {
    setBusy(false);
    setBusyLabel("");
    setProgress(0);
  }

  function failWithError(message) {
    resetBusyState();
    setError(message);
  }

  function revokeIfBlob(url) {
    try {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    } catch {
      /* noop */
    }
  }

  /* ======================================================
     🖼 SINGLE MEDIA UPLOAD — LOGO / COVER
  ====================================================== */

  const handleSingleMediaUpload = useCallback(
    async ({ file, type }) => {
      if (!file || !type) return;

      // Reset file input UI immediately
      bumpInputKey(type);

      // Clear previous error
      setError("");

      // Create local preview first (UX-first)
      const localPreviewUrl = URL.createObjectURL(file);

      if (type === "logo") {
        revokeIfBlob(logoPreview);
        setLogoPreview(localPreviewUrl);
      }

      if (type === "cover") {
        revokeIfBlob(coverPreview);
        setCoverPreview(localPreviewUrl);
      }

      try {
        setBusy(true);
        setBusyLabel(
          type === "logo"
            ? "Uploading logo…"
            : "Uploading cover image…"
        );
        setProgress(0);

        const result = await uploadMediaToServer({
          file,
          type,
          onProgress: setProgress,
        });

        // Commit to wizard data ONLY after success
        setField(type, {
          url: result.url,
          public_id: result.public_id,
          name: file.name,
        });

        // Replace local preview with final CDN url
        revokeIfBlob(localPreviewUrl);

        if (type === "logo") {
          setLogoPreview(result.url);
        }

        if (type === "cover") {
          setCoverPreview(result.url);
        }

        resetBusyState();
      } catch (err) {
        // Rollback preview but keep previous saved media (if any)
        revokeIfBlob(localPreviewUrl);

        if (type === "logo") {
          setLogoPreview(normalized.logo?.url || null);
        }

        if (type === "cover") {
          setCoverPreview(normalized.cover?.url || null);
        }

        failWithError(
          err?.response?.data?.error ||
            `Failed to upload ${type}. Please try again.`
        );
      }
    },
    [
      bumpInputKey,
      logoPreview,
      coverPreview,
      normalized.logo,
      normalized.cover,
      setField,
    ]
  );

  /* ======================================================
     🖼 GALLERY MULTI-UPLOAD (MAX 10)
  ====================================================== */

  const handleGalleryUpload = useCallback(
    async (files) => {
      if (!Array.isArray(files) || files.length === 0)
        return;

      // Reset file input UI
      bumpInputKey("gallery");
      setError("");

      const currentGallery = normalized.gallery;
      const remainingSlots =
        MAX_GALLERY_IMAGES - currentGallery.length;

      if (remainingSlots <= 0) {
        setError(
          `Maximum of ${MAX_GALLERY_IMAGES} images allowed.`
        );
        return;
      }

      const uploadBatch = files.slice(0, remainingSlots);

      // Create preview placeholders immediately
      const previewBatch = uploadBatch.map((file) => ({
        id:
          crypto.randomUUID?.() ||
          `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        status: "uploading",
      }));

      setGalleryPreview((prev) => [
        ...prev,
        ...previewBatch,
      ]);

      try {
        setBusy(true);
        setProgress(0);

        for (let i = 0; i < uploadBatch.length; i++) {
          const file = uploadBatch[i];

          setBusyLabel(
            `Uploading gallery image ${i + 1} of ${
              uploadBatch.length
            }…`
          );

          const result = await uploadMediaToServer({
            file,
            type: "gallery",
            onProgress: setProgress,
          });

          // Commit to wizard data
          setData((prev) => ({
            ...prev,
            gallery: [
              ...normalizeGallery(prev.gallery),
              {
                url: result.url,
                public_id: result.public_id,
                name: file.name,
              },
            ],
          }));

          // Mark preview as done and replace URL
          setGalleryPreview((prev) =>
            prev.map((item) => {
              if (
                item.name === file.name &&
                item.status === "uploading"
              ) {
                revokeIfBlob(item.url);
                return {
                  ...item,
                  url: result.url,
                  status: "done",
                };
              }
              return item;
            })
          );
        }

        resetBusyState();
      } catch (err) {
        // Mark all still-uploading previews as failed
        setGalleryPreview((prev) =>
          prev.map((item) =>
            item.status === "uploading"
              ? { ...item, status: "failed" }
              : item
          )
        );

        failWithError(
          err?.response?.data?.error ||
            "One or more gallery images failed to upload."
        );
      }
    },
    [
      bumpInputKey,
      normalized.gallery,
      setData,
    ]
  );

  /* ======================================================
     🗑 GALLERY REMOVE (LOCAL + BUSINESS DATA)
  ====================================================== */

  const removeGalleryItem = useCallback(
    (index) => {
      setData((prev) => {
        const safeGallery = normalizeGallery(prev.gallery);
        if (
          index < 0 ||
          index >= safeGallery.length
        )
          return prev;

        return {
          ...prev,
          gallery: safeGallery.filter(
            (_, i) => i !== index
          ),
        };
      });
    },
    [setData]
  );

  /* ======================================================
     🧠 STEP VALIDATION (USED BY PART 3)
  ====================================================== */

  const canProceed = useMemo(() => {
    return (
      !!normalized.logo?.url &&
      normalized.owner_confirmed === true &&
      busy === false
    );
  }, [
    normalized.logo,
    normalized.owner_confirmed,
    busy,
  ]);

    /* ======================================================
     🧱 RENDER — UI ONLY (NO LOGIC)
  ====================================================== */

  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 4 of 4 — Media, Visibility & Compliance
      </p>

      {/* ==================================================
         LOGO
      ================================================== */}
      <div className="mb-8">
        <label className="admin-label">
          Business logo *
        </label>

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
            {logoPreview || normalized.logo?.url ? (
              <img
                src={logoPreview || normalized.logo.url}
                alt="Logo preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="admin-hint text-xs">
                No logo
              </span>
            )}
          </div>

          <div className="flex-1">
            <p className="admin-hint mb-2">
              PNG / JPG / WEBP. Minimum recommended size:
              512×512.
            </p>

            <input
              key={`logo-${inputKey.logo}`}
              type="file"
              accept={ACCEPT_ATTR}
              disabled={busy}
              onChange={(e) =>
                handleSingleMediaUpload({
                  file: e.target.files?.[0],
                  type: "logo",
                })
              }
            />
          </div>
        </div>
      </div>

      {/* ==================================================
         COVER IMAGE
      ================================================== */}
      <div className="mb-8">
        <label className="admin-label">
          Cover image (optional)
        </label>

        <div className="flex items-start gap-4 mb-3">
          <div
            style={{
              width: 200,
              height: 96,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-soft)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {coverPreview || normalized.cover?.url ? (
              <img
                src={coverPreview || normalized.cover.url}
                alt="Cover preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="admin-hint text-xs">
                No cover
              </span>
            )}
          </div>

          <div className="flex-1">
            <p className="admin-hint mb-2">
              Recommended ratio 16:9. Shown at the top of
              the business profile.
            </p>

            <input
              key={`cover-${inputKey.cover}`}
              type="file"
              accept={ACCEPT_ATTR}
              disabled={busy}
              onChange={(e) =>
                handleSingleMediaUpload({
                  file: e.target.files?.[0],
                  type: "cover",
                })
              }
            />
          </div>
        </div>
      </div>

      {/* ==================================================
         GALLERY
      ================================================== */}
      <div className="mb-8">
        <label className="admin-label">
          Gallery images (max {MAX_GALLERY_IMAGES})
        </label>

        <p className="admin-hint mb-3">
          You can select multiple images at once.
        </p>

        {(normalized.gallery.length > 0 ||
          galleryPreview.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {normalized.gallery.map((img, index) => (
              <div
                key={`saved-${index}`}
                style={{ position: "relative" }}
              >
                <img
                  src={img.url}
                  alt=""
                  className="rounded border"
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                  }}
                />

                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    padding: "4px 6px",
                    fontSize: 11,
                  }}
                  disabled={busy}
                  onClick={() =>
                    removeGalleryItem(index)
                  }
                >
                  Remove
                </button>
              </div>
            ))}

            {galleryPreview.map((item) => (
              <div
                key={item.id}
                style={{ position: "relative" }}
              >
                <img
                  src={item.url}
                  alt=""
                  className="rounded border"
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    opacity:
                      item.status === "failed" ? 0.5 : 1,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 6,
                    fontSize: 11,
                    padding: "4px 6px",
                    borderRadius: 8,
                    background:
                      item.status === "failed"
                        ? "rgba(220,38,38,.85)"
                        : "rgba(0,0,0,.6)",
                    color: "#fff",
                  }}
                >
                  {item.status === "uploading"
                    ? "Uploading…"
                    : item.status === "failed"
                    ? "Failed"
                    : "Uploaded"}
                </div>
              </div>
            ))}
          </div>
        )}

        {normalized.gallery.length <
          MAX_GALLERY_IMAGES && (
          <input
            key={`gallery-${inputKey.gallery}`}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            disabled={busy}
            onChange={(e) =>
              handleGalleryUpload(
                Array.from(e.target.files || [])
              )
            }
          />
        )}
      </div>

      {/* ==================================================
         VISIBILITY
      ================================================== */}
      <div className="mb-8">
        <label className="admin-label">
          Profile visibility
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={normalized.is_public}
              onChange={(e) =>
                setField(
                  "is_public",
                  e.target.checked
                )
              }
            />
            Public profile
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={normalized.allow_reviews}
              onChange={(e) =>
                setField(
                  "allow_reviews",
                  e.target.checked
                )
              }
            />
            Allow reviews
          </label>
        </div>
      </div>

      {/* ==================================================
         COMPLIANCE
      ================================================== */}
      <div className="mb-8">
        <label className="admin-label">
          Confirmation
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={normalized.owner_confirmed}
            onChange={(e) =>
              setField(
                "owner_confirmed",
                e.target.checked
              )
            }
          />
          I confirm that I am authorized to manage this
          business information.
        </label>
      </div>

      {/* ==================================================
         STATUS
      ================================================== */}
      {busy && (
        <p className="admin-hint mb-3">
          {busyLabel}{" "}
          {progress > 0 && `(${progress}%)`}
        </p>
      )}

      {error && (
        <p className="admin-error mb-3">
          {error}
        </p>
      )}

      {/* ==================================================
         NAVIGATION
      ================================================== */}
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
 



