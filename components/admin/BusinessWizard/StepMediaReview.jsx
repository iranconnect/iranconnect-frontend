// components/admin/BusinessWizard/StepMediaReview.jsx

import {
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

/* ======================================================
🧱 CONSTANTS — Business Rules (DO NOT INLINE)
====================================================== */

const MAX_GALLERY_IMAGES = 10;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ACCEPT_ATTR =
  ACCEPTED_IMAGE_TYPES.join(",");

/* ======================================================
🧠 SAFE NORMALIZERS
====================================================== */

function normalizeBool(
  value,
  fallback = false
) {
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
  mode,
}) {

  /* --------------------------------------------------
  🔐 NORMALIZED DATA
  -------------------------------------------------- */

  const normalized = useMemo(
    () => ({
      logo: normalizeMedia(data.logo),

      cover: normalizeMedia(data.cover),

      gallery: normalizeGallery(
        data.gallery
      ),

      is_public: normalizeBool(
        data.is_public,
        true
      ),

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

  const [error, setError] =
    useState("");

  /* --------------------------------------------------
  🖼 PREVIEW STATE (LOCAL ONLY)
  -------------------------------------------------- */

  const [logoPreview, setLogoPreview] =
    useState(null);

  const [coverPreview, setCoverPreview] =
    useState(null);

  const [
    galleryPreview,
    setGalleryPreview,
  ] = useState([]);

  const [zoomImage, setZoomImage] =
    useState(null);

  useEffect(() => {

    if (
      Array.isArray(data.gallery_files) &&
      data.gallery_files.length > 0 &&
      galleryPreview.length === 0
    ) {

      setGalleryPreview(
        data.gallery_files.map((file) => ({
          id:
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random()}`,

          url: URL.createObjectURL(file),

          name: file.name,
        }))
      );

    }

  }, [
    data.gallery_files,
    galleryPreview.length,
  ]);

  /* --------------------------------------------------
  🔄 FILE INPUT HARD RESET
  -------------------------------------------------- */

  const [inputKey, setInputKey] =
    useState({
      logo: 0,
      cover: 0,
      gallery: 0,
    });

  const bumpInputKey = useCallback(
    (key) => {

      setInputKey((prev) => ({
        ...prev,
        [key]:
          (prev[key] || 0) + 1,
      }));

    },
    []
  );

  /* --------------------------------------------------
  ✅ SAFE setData
  -------------------------------------------------- */

  const safeSetData = useCallback(
    (updater) => {

      if (
        typeof setData !== "function"
      ) {

        setError(
          "Internal error. Please refresh."
        );

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

  function toggleRemovedMedia(
    type,
    media
  ) {

    if (!media) return;

    safeSetData((prev) => {

      const current =
        prev.removed_media?.[type] || [];

      const exists = current.some(
        (x) => x.url === media.url
      );

      return {
        ...prev,

        removed_media: {
          ...prev.removed_media,

          [type]: exists
            ? current.filter(
                (x) =>
                  x.url !== media.url
              )
            : [...current, media],
        },
      };

    });

  }

  function isRemoved(type, media) {

    const arr =
      data.removed_media?.[type] || [];

    return arr.some(
      (x) => x.url === media.url
    );

  }

  function revokeIfBlob(url) {

    try {

      if (
        typeof url === "string" &&
        url.startsWith("blob:")
      ) {

        URL.revokeObjectURL(url);

      }

    } catch {}

  }

  useEffect(() => {

    return () => {

      revokeIfBlob(logoPreview);

      revokeIfBlob(coverPreview);

      galleryPreview.forEach((item) =>
        revokeIfBlob(item.url)
      );

    };

  }, [
    logoPreview,
    coverPreview,
    galleryPreview,
  ]);

  /* ======================================================
  🖼 SINGLE MEDIA — LOGO / COVER (NO UPLOAD)
  ====================================================== */

  async function handleSingleMediaUpload(
    file,
    type
  ) {

    if (!file || !type) return;

    bumpInputKey(type);

    setError("");

    const localPreviewUrl =
      URL.createObjectURL(file);

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

  const handleGalleryUpload =
    useCallback(
      async (files) => {

        if (
          !Array.isArray(files) ||
          files.length === 0
        ) return;

        bumpInputKey("gallery");

        setError("");

        const currentFiles =
          Array.isArray(data.gallery_files)
            ? data.gallery_files
            : [];

        const existingCount =
          Array.isArray(data.gallery)
            ? data.gallery.length
            : 0;
        
        const remainingSlots =
          MAX_GALLERY_IMAGES -
          existingCount -
          currentFiles.length;

        if (remainingSlots <= 0) {

          setError(
            `Maximum of ${MAX_GALLERY_IMAGES} images allowed.`
          );

          return;
        }

        const uploadBatch =
          files.slice(0, remainingSlots);

        const previewBatch =
          uploadBatch.map((file) => ({
            id:
              crypto.randomUUID?.() ||
              `${Date.now()}-${Math.random()}`,

            url:
              URL.createObjectURL(file),

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
      [
        bumpInputKey,
        data.gallery_files,
        safeSetData,
      ]
    );

  const replaceGalleryItem =
    useCallback(
      (index, file) => {

        if (!file) return;

        const newPreviewUrl =
          URL.createObjectURL(file);

        // replace preview
        setGalleryPreview((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  url: newPreviewUrl,
                  name: file.name,
                }
              : item
          )
        );

        // replace actual file
        safeSetData((prev) => {

          const files =
            Array.isArray(
              prev.gallery_files
            )
              ? [...prev.gallery_files]
              : [];

          files[index] = file;

          return {
            ...prev,
            gallery_files: files,
          };

        });

      },
      [safeSetData]
    );

  const removeGalleryItem =
    useCallback(
      (index) => {

        // remove preview
        setGalleryPreview((prev) => {

          const item = prev[index];

          if (item?.url)
            revokeIfBlob(item.url);

          return prev.filter(
            (_, i) => i !== index
          );

        });

        // remove file
        safeSetData((prev) => {

          const files =
            Array.isArray(
              prev.gallery_files
            )
              ? prev.gallery_files
              : [];

          return {
            ...prev,

            gallery_files:
              files.filter(
                (_, i) => i !== index
              ),
          };

        });

      },
      [safeSetData]
    );

  /* ======================================================
  🧠 STEP VALIDATION
  ====================================================== */

  const canProceed = useMemo(() => {

    // =========================
    // UPDATE BUSINESS MODE
    // =========================

    if (mode === "user-update") {

      return (
        normalized.owner_confirmed ===
          true &&
        busy === false
      );

    }

    // =========================
    // CREATE BUSINESS MODE
    // =========================

    return (
      !!data.logo_file &&
      normalized.owner_confirmed ===
        true &&
      busy === false
    );

  }, [
    mode,
    data.logo_file,
    normalized.owner_confirmed,
    busy,
  ]);

  /* ======================================================
  🧱 RENDER — UI ONLY
  ====================================================== */

  return (
    <div className="admin-section">
   
      <div className="mb-8">
        <h2 className="admin-title">
          Media, Visibility & Compliance
        </h2>
  
        <p className="admin-hint">
          Step 4 of 4 — Upload media, configure visibility settings, and confirm business ownership.
        </p>
      </div>
   
  {/* LOGO */}
  <div className="mb-8">
    <label className="admin-label">Business logo *</label>

    <div className="flex items-start gap-4 mb-3">
      <div
        style={{
          width: 72,
          minHeight: 72,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--bg-soft)",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {logoPreview ? (
          <>

            <img
              src={logoPreview}
              alt="Logo preview"
              style={{
                width: "100%",
                height: 72,
                objectFit: "cover",
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#16a34a",
                marginTop: 4,
                paddingBottom: 4,
                textAlign: "center",
              }}
            >
              New logo selected
            </p>
          </>   
        ) : (
          <span className="admin-hint text-xs" style={{ padding: 12, textAlign: "center", width: "100%", }}>No logo</span>
        )}
      </div>

      {mode === "user-update" &&
        data.logo_url && (
     
        <div>
     
          <p className="admin-hint mb-2">
            Current logo
          </p>
     
          <div
            style={{
              position: "relative",
              width: 110,
            }}
          >
     
            <img
              src={data.logo_url}
              alt=""
              onClick={() =>
                setZoomImage(data.logo_url)
              }
              style={{
                width: 110,
                height: 110,
                objectFit: "cover",
                borderRadius: 12,
                cursor: "zoom-in",
                border: isRemoved(
                  "logo",
                  { url: data.logo_url }
                )
                  ? "4px solid #ef4444"
                  : "2px solid var(--border)",
                opacity: isRemoved(
                  "logo",
                  { url: data.logo_url }
                )
                  ? 0.55
                  : 1,
              }}
            />
      
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{
                marginTop: 8,
                width: "100%",
              }}
              onClick={() =>
                toggleRemovedMedia(
                  "logo",
                  { url: data.logo_url }
                )
              }
            >
              {isRemoved(
                "logo",
                { url: data.logo_url }
              )
                ? "Undo remove"
                : "Select for removal"}
            </button>
     
          </div>
     
        </div>
      )}           

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
          minHeight: 96,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--bg-soft)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {coverPreview ? (
          <>
            <img
              src={coverPreview}
              alt="Cover preview"
              style={{
                width: "100%",
                height: 96,
                objectFit: "cover",
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#16a34a",
                marginTop: 4,
                paddingBottom: 4,
                textAlign: "center",
              }}
            >
              New cover selected
            </p>
          </>
        ) : (
          <span className="admin-hint text-xs" style={{ padding: 12, textAlign: "center", width: "100%", }}> No cover</span>
        )}
      </div>

      {mode === "user-update" &&
        data.cover_image_url && (
      
        <div>
     
          <p className="admin-hint mb-2">
            Current cover image
          </p>
     
          <div style={{ position: "relative" }}>
     
            <img
              src={data.cover_image_url}
              alt=""
              onClick={() =>
                setZoomImage(
                  data.cover_image_url
                )
              }
              style={{
                width: 260,
                height: 140,
                objectFit: "cover",
                borderRadius: 12,
                cursor: "zoom-in",
                border: isRemoved(
                  "cover",
                  {
                    url: data.cover_image_url,
                  }
                )
                  ? "4px solid #ef4444"
                  : "2px solid var(--border)",
                opacity: isRemoved(
                  "cover",
                  {
                    url: data.cover_image_url,
                  }
                )
                  ? 0.55
                  : 1,
              }}
            />
      
            <button
              type="button"
              className="admin-btn admin-btn-secondary mt-2"
              onClick={() =>
                toggleRemovedMedia(
                  "cover",
                  {
                    url: data.cover_image_url,
                  }
                )
              }
            >
              {isRemoved(
                "cover",
                {
                  url: data.cover_image_url,
                }
              )
                ? "Undo remove"
                : "Select for removal"}
            </button>
      
          </div>
     
        </div>
      )}           

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

    {mode === "user-update" &&
      Array.isArray(data.gallery) &&
      data.gallery.length > 0 && (
  
      <div className="mb-5">
  
        <p className="admin-hint mb-3">
          Current gallery images
        </p>
  
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  
          {data.gallery.map((img, index) => (
  
            <div
              key={img.url || index}
              style={{
                position: "relative",
              }}
            >
  
              <img
                src={img.url}
                alt=""
                onClick={() =>
                  setZoomImage(img.url)
                }
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 10,
                  cursor: "zoom-in",
  
                  border: isRemoved(
                    "gallery",
                    img
                  )
                    ? "4px solid #ef4444"
                    : "2px solid var(--border)",
  
                  opacity: isRemoved(
                    "gallery",
                    img
                  )
                    ? 0.55
                    : 1,
                }}
              />
  
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  right: 6,
                  fontSize: 11,
                  padding: "4px 6px",
                }}
                onClick={() =>
                  toggleRemovedMedia(
                    "gallery",
                    img
                  )
                }
              > 
                {isRemoved(
                  "gallery",
                  img
                )
                  ? "Undo"
                  : "Remove"}
              </button>
  
            </div>
  
          ))}
  
        </div>
  
      </div>
    )}         

    {galleryPreview.length > 0 && (
      <>
        <p className="admin-hint mb-3">
          New gallery images
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {galleryPreview.map((item, index) => (
            <div
              key={item.id}
              style={{ position: "relative" }}
            >
              <img
                src={item.url}
                alt=""
                onClick={() => setZoomImage(item.url)} 
                className="rounded border"
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  cursor: "zoom-in", 
                }}
              />
           
              {/* REMOVE */}
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
                onClick={() => removeGalleryItem(index)}
                disabled={busy}
              >
                Remove
              </button>
          
              {/* CHANGE */}
              <label
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  fontSize: 11,
                  padding: "4px 6px",
                  borderRadius: 6,
                  background: "rgba(0,0,0,.6)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Change
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  hidden
                  onChange={(e) =>
                    replaceGalleryItem(index, e.target.files?.[0])
                  }
                />
              </label>
            </div>
          ))}
   
        </div>
      </>   
    )}

    {(
      (
        Array.isArray(data.gallery)
          ? data.gallery.length
          : 0
      ) +
      (
        Array.isArray(data.gallery_files)
          ? data.gallery_files.length
          : 0
      )
    ) < MAX_GALLERY_IMAGES && (
      <input
        className="mt-2" 
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
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={normalized.allow_reviews}
        onChange={(e) =>
          setField("allow_reviews", e.target.checked)
        }
      />
      Allow reviews
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

  {zoomImage && (
  
    <div
      onClick={() =>
        setZoomImage(null)
      }
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        zIndex: 9999,
  
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
  
        padding: 20,
        cursor: "zoom-out",
      }}
    >
  
      <img
        src={zoomImage}
        alt=""
        style={{
          maxWidth: "95vw",
          maxHeight: "95vh",
          borderRadius: 14,
        }}
      />
  
    </div>
  
  )}       

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
