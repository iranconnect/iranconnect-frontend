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

const MEDIA_BOX_SIZE = 160;

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
    
      const removingCurrentLogo =
        isRemoved("logo", {
          url: data.logo_url,
        });
    
      const hasReplacementLogo =
        !!data.logo_file;
    
      const removingCurrentCover =
        isRemoved("cover", {
          url: data.cover_image_url,
        });
    
      const hasReplacementCover =
        !!data.cover_file;
    
      if (
        removingCurrentLogo &&
        !hasReplacementLogo
      ) {
        return false;
      }
    
      if (
        removingCurrentCover &&
        !hasReplacementCover
      ) {
        return false;
      }
    
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

  const activeGalleryCount =
    (
      Array.isArray(data.gallery)
        ? data.gallery.filter(
            (img) =>
              !isRemoved("gallery", img)
          ).length
        : 0
    ) +
    (
      Array.isArray(data.gallery_files)
        ? data.gallery_files.length
        : 0
    );
  
  const remainingGallerySlots =
    MAX_GALLERY_IMAGES -
    activeGalleryCount;
  
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
  <div
    style={{
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      padding: 20,
      background: "rgba(255,255,255,.02)",
      marginBottom: 24,
    }}
  > 
  {/* LOGO */}
  <div className="mb-8">
    <label className="admin-label">Business logo *</label>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 220px))"
        gap: 24,
        alignItems: "start",
        marginBottom: 12,
      }}
    >
      {mode === "user-update" &&
        data.logo_url && (
        <div>
          <p
            className="admin-hint"
            style={{
              marginBottom: 10,
              fontWeight: 600,
              opacity: .9,
            }}
          >
            Current logo
          </p>
      
          <div
            style={{
              position: "relative",
              width: MEDIA_BOX_SIZE,
              height: MEDIA_BOX_SIZE,
            }}
          >
            <img
              src={data.logo_url}
              alt=""
              onClick={() =>
                setZoomImage(data.logo_url)
              }
              style={{
                width: "100%",
                height: "100%",
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
                position: "absolute",
                top: 8,
                right: 8,
                fontSize: 11,
                padding: "4px 8px",
                backdropFilter: "blur(6px)",
                background: "rgba(15,23,42,.92)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.18)",
                boxShadow: "0 4px 10px rgba(0,0,0,.22)",
                fontWeight: 600,
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
                ? "Undo"
                : "Remove"}
            </button>
          </div>
        </div>
      )}
      
      <div>

        <p
          className="admin-hint"
          style={{
            marginBottom: 10,
            fontWeight: 600,
            opacity: .9,
          }}
        >
          Upload new logo
        </p>
      
        <label
          style={{
            width: MEDIA_BOX_SIZE,
            height: MEDIA_BOX_SIZE,
            border:
              "2px dashed rgba(255,255,255,.15)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background:
              "rgba(255,255,255,.025)",
            transition: "all .18s ease",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.03)",
          }}
        >
          <span style={{ fontSize: 28 }}>
            +
          </span>
      
          <span
            style={{
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            Upload image
          </span>
      
          <input
            hidden
            type="file"
            accept={ACCEPT_ATTR}
            onChange={(e) =>
              handleSingleMediaUpload(
                e.target.files?.[0],
                "logo"
              )
            }
          />
        </label>

        <div
          style={{
            minHeight: 24,
            marginBottom: 10,
          }}
        >
          {isRemoved(
            "logo",
            { url: data.logo_url }
          ) &&
            !data.logo_file && (
              <p
                className="admin-error"
                style={{
                  color: "#ef4444",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Please upload a new logo.
              </p>
            )}
        </div>
      
      </div>
      {logoPreview && (
        <div>
          <p
            className="admin-hint"
            style={{
              marginBottom: 10,
              fontWeight: 600,
              opacity: .9,
            }}
          >
            New logo
          </p>
      
          <div
            style={{
              position: "relative",
              width: MEDIA_BOX_SIZE,
              height: MEDIA_BOX_SIZE,
            }}
          >
            <img
              src={logoPreview}
              alt=""
              onClick={() =>
                setZoomImage(logoPreview)
              }
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 12,
                cursor: "zoom-in",
                border:
                  "2px solid var(--border)",
              }}
            />
      
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={() => {
                revokeIfBlob(logoPreview);
      
                setLogoPreview(null);
      
                setField("logo_file", null);
      
                bumpInputKey("logo");
              }}
            >
              Remove
            </button>
      
            <label
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                borderRadius: 6,
                background: "rgba(0,0,0,.6)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Change
      
              <input
                className="admin-input"
                type="file"
                accept={ACCEPT_ATTR}
                hidden
                onChange={(e) =>
                  handleSingleMediaUpload(
                    e.target.files?.[0],
                    "logo"
                  )
                }
              />
            </label>
          </div>
        </div>
      )}
    </div>
  </div>
  </div>

  <div
    style={{
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      padding: 20,
      background: "rgba(255,255,255,.02)",
      marginBottom: 24,
    }}
  >    
  {/* COVER */}
  <div className="mb-8">
    <label className="admin-label">
      Cover image
    </label>
  
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 220px))"
        gap: 24,
        alignItems: "start",
        marginBottom: 12,
      }}
    >
  
      {/* CURRENT COVER */}
      {mode === "user-update" &&
        data.cover_image_url && (
        <div>
          <p
            className="admin-hint"
            style={{
              marginBottom: 10,
              fontWeight: 600,
              opacity: .9,
            }}
          >
            Current cover
          </p>
  
          <div
            style={{
              position: "relative",
              width: MEDIA_BOX_SIZE,
              height: MEDIA_BOX_SIZE,
            }}
          >
            <img
              src={data.cover_image_url}
              alt=""
              onClick={() =>
                setZoomImage(
                  data.cover_image_url
                )
              }
              style={{
                width: "100%",
                height: "100%",
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
              className="admin-btn admin-btn-secondary"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                fontSize: 11,
                padding: "4px 8px",
                backdropFilter: "blur(6px)",
                background: "rgba(15,23,42,.92)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.18)",
                boxShadow: "0 4px 10px rgba(0,0,0,.22)",
                fontWeight: 600,
              }}
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
                ? "Undo"
                : "Remove"}
            </button>
          </div>
        </div>
      )}
  
      {/* FILE INPUT */}
      <div>
        <p
          className="admin-hint"
          style={{
            marginBottom: 10,
            fontWeight: 600,
            opacity: .9,
          }}
        >
          Upload new cover
        </p>

        
        
        <label
          style={{
            width: MEDIA_BOX_SIZE,
            height: MEDIA_BOX_SIZE,
            border: "2px dashed rgba(255,255,255,.15)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "rgba(255,255,255,.025)",
            transition: "all .18s ease",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)",
          }}
        >
          <span style={{ fontSize: 28 }}>
            +
          </span>
        
          <span
            style={{
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            Upload image
          </span>
        
          <input
            hidden
            type="file"
            accept={ACCEPT_ATTR}
            onChange={(e) =>
              handleSingleMediaUpload(
                e.target.files?.[0],
                "cover"
              )
            }
          />
        </label>

        <div
          style={{
            minHeight: 24,
            marginBottom: 10,
          }}
        >
          {isRemoved(
            "cover",
            {
              url: data.cover_image_url,
            }
          ) &&
            !data.cover_file && (
              <p
                className="admin-error"
                style={{
                  color: "#ef4444",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Please upload a new cover image.
              </p>
            )}
        </div>  
      </div>
  
      {/* NEW COVER */}
      {coverPreview && (
        <div>
          <p className="admin-hint mb-2">
            New cover
          </p>
  
          <div
            style={{
              position: "relative",
              width: MEDIA_BOX_SIZE,
              height: MEDIA_BOX_SIZE,
            }}
          >
            <img
              src={coverPreview}
              alt=""
              onClick={() =>
                setZoomImage(
                  coverPreview
                )
              }
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 12,
                cursor: "zoom-in",
                border:
                  "2px solid var(--border)",
              }}
            />
  
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={() => {
  
                revokeIfBlob(
                  coverPreview
                );
  
                setCoverPreview(null);
  
                setField(
                  "cover_file",
                  null
                );
  
                bumpInputKey("cover");
  
              }}
            >
              Remove
            </button>
  
            <label
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                borderRadius: 6,
                background:
                  "rgba(0,0,0,.6)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Change
  
              <input
                className="admin-input"
                type="file"
                accept={ACCEPT_ATTR}
                hidden
                onChange={(e) =>
                  handleSingleMediaUpload(
                    e.target.files?.[0],
                    "cover"
                  )
                }
              />
            </label>
          </div>
        </div>
      )}

        
    </div>
  </div>
  </div>

  <div
    style={{
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      padding: 20,
      background: "rgba(255,255,255,.02)",
      marginBottom: 24,
    }}
  >    
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
                  height: 140,
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
                  top: 8,
                  right: 8,
                  fontSize: 11,
                  padding: "4px 8px",
                  backdropFilter: "blur(6px)",
                  background: "rgba(15,23,42,.92)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.18)",
                  boxShadow: "0 4px 10px rgba(0,0,0,.22)",
                  fontWeight: 600,
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

    <p className="admin-hint mb-3">
      Upload gallery images (
      {remainingGallerySlots}{" "}
      slots remaining)
    </p>
    
    {remainingGallerySlots > 0 && (
      <label
        style={{
          width: MEDIA_BOX_SIZE,
          height: MEDIA_BOX_SIZE,
          border: "2px dashed rgba(255,255,255,.15)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: "rgba(255,255,255,.025)",
          transition: "all .18s ease",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)",
        }}
      >
        <span style={{ fontSize: 28 }}>
          +
        </span>
      
        <span
          style={{
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          Upload image
        </span>
      
        <input
          hidden
          multiple
          type="file"
          accept={ACCEPT_ATTR}
          onChange={(e) =>
            handleGalleryUpload(
              Array.from(
                e.target.files || []
              )
            )
          }
        />
      </label>
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
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  cursor: "zoom-in", 
                  border: "2px solid var(--border)",
                  borderRadius: 10,
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
                  padding: "5px 9px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 8,
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
                  padding: "5px 9px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 8,
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

  </div>
  </div>  

  <div
    style={{
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      padding: 20,
      background: "rgba(255,255,255,.02)",
      marginBottom: 24,
    }}
  >    

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
