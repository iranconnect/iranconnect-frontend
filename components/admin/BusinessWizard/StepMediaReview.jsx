// components/admin/BusinessWizard/StepMediaReview.jsx

import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import LogoFrame from "../../business/LogoFrame";
import apiClient from "../../../utils/apiClient";
import { Pencil } from "lucide-react";
import BusinessMediaCropEditor from "../../business/BusinessMediaCropEditor";
import { getMediaCropStyle } from "../../../utils/businessMediaCropStyle";

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
  canEditMedia = () => true,
  canEditField = () => true,
  isRequestedField = () => false,
  ticketMediaReview = null,
  sharedTicketPreview = null,
}) {

  const isExistingBusinessMode =
    mode === "user-update" ||
    mode === "admin-edit" ||
    mode === "admin-edit-request";

  const isAdminEditMode =
    mode === "admin-edit" ||
    mode === "admin-edit-request";

  // B-03-I02 / Owner NEW and UPDATE crop integration.
  // Direct Admin and Owner use the shared Crop V2 editor.
  // Admin ticket fulfillment modes remain excluded.
  const supportsWizardCrop =
    mode === "admin-create" ||
    mode === "admin-edit" ||
    mode === "user-new" ||
    mode === "user-update";

  const canEditLogo =
    canEditMedia("logo");

  const canEditCover =
    canEditMedia("cover");

  const canEditGallery =
    canEditMedia("gallery");

  const isUserUpdateMode =
    mode === "user-update";

  // Only Direct Admin Edit; never request-bound ticket fulfillment.
  const [wizardCropTarget, setWizardCropTarget] = useState(null);


  const isTicketCreateMode =
    mode === "admin-create-ticket";

  const isTicketReview =
    mode === "admin-create-ticket" ||
    mode === "admin-edit-request";

  /*
   * Ticket previews are display-only.
   * They never enter Business Wizard form state.
   */
  const ticketPreviewState = sharedTicketPreview ?? {
    ticketId: null,
    identity: null,
    images: [],
    loading: false,
    error: "",
    verified: false,
  };

  const ticketPreviewAssets =
    (mode === "admin-edit-request" ||
      mode === "admin-create-ticket") &&
    Array.isArray(ticketMediaReview?.media)
      ? ticketMediaReview.media.filter(
          (asset) =>
            asset?.snapshot_group === "requested" &&
            ["logo", "cover", "gallery"].includes(asset.role) &&
            asset.preview_available === true
        )
      : [];


  const requestedTicketMedia =
    (mode === "admin-edit-request" ||
      mode === "admin-create-ticket") &&
    Array.isArray(ticketMediaReview?.media)
      ? ticketMediaReview.media.filter(
          (asset) =>
            asset?.snapshot_group === "requested" &&
            ["logo", "cover", "gallery"].includes(asset.role)
        )
      : [];

  const ticketHasLogo =
    requestedTicketMedia.some((asset) => asset.role === "logo");

  const ticketHasCover =
    requestedTicketMedia.some((asset) => asset.role === "cover");

  const ticketHasGalleryAdds =
    requestedTicketMedia.some((asset) => asset.role === "gallery");

  const currentTicketPreviewIdentity = JSON.stringify({
    ticketId: ticketMediaReview?.ticketId ?? null,
    assets: ticketPreviewAssets.map(
      (asset) => [
        asset.asset_id,
        asset.role,
        asset.display_order,
        asset.preview_available,
      ]
    ),
  });

  const safeTicketImages =
    ticketPreviewState.verified === true &&
    ticketPreviewState.ticketId === ticketMediaReview?.ticketId
      ? ticketPreviewState.images
      : [];

  const requestedLogoImage =
    safeTicketImages.find((image) => image.role === "logo");

  const requestedCoverImage =
    safeTicketImages.find((image) => image.role === "cover");

  const requestedGalleryImages =
    safeTicketImages
      .filter((image) => image.role === "gallery")
      .sort((a, b) => a.displayOrder - b.displayOrder);

  const galleryRemovalRequested =
    mode === "admin-edit-request" &&
    ticketMediaReview?.galleryRemovalRequested === true;

  const ticketPreviewIdentity = JSON.stringify({
    ticketId: ticketMediaReview?.ticketId ?? null,
    assets: ticketPreviewAssets.map(
      (asset) => [
        asset.asset_id,
        asset.role,
        asset.display_order,
        asset.preview_available,
      ]
    ),
  });

  const stepCopy = isAdminEditMode
    ? {
        title: "Edit Business",
        subtitle:
          "Step 4 of 5 — Update media and profile visibility settings",
        logoLabel: "Business logo",
        logoUploadLabel: "Upload replacement logo",
        coverUploadLabel: "Upload replacement cover",
        galleryUploadLabel: "Add gallery images",
        confirmationLabel: null,
        nextLabel: "Continue to Review & Update",
      }
    : isUserUpdateMode
      ? {
          title: "Update Your Business",
          subtitle:
            "Step 4 of 5 — Review and update media and profile visibility settings",
          logoLabel: "Business logo",
          logoUploadLabel: "Upload replacement logo",
          coverUploadLabel: "Upload replacement cover",
          galleryUploadLabel: "Add gallery images",
          confirmationLabel:
            "I confirm that I am authorized to request updates for this business.",
          nextLabel: "Continue to Review & Submit",
        }
      : isTicketCreateMode
        ? {
            title: "Add New Business",
            subtitle:
              "Step 4 of 5 — Review requested media or upload replacements",
            logoLabel: "Business logo *",
            logoUploadLabel:
              "Upload replacement logo",
            coverUploadLabel:
              "Upload replacement cover",
            galleryUploadLabel:
              "Upload replacement gallery",
            confirmationLabel:
              "I confirm that I am authorized to manage this business.",
            nextLabel:
              "Continue to Review & Create",
          }
        : {
            title: "Add New Business",
            subtitle:
              "Step 4 of 5 — Upload media and configure profile visibility",
            logoLabel: "Business logo *",
            logoUploadLabel:
              "Upload business logo",
            coverUploadLabel:
              "Upload cover image",
            galleryUploadLabel:
              "Upload gallery images",
            confirmationLabel:
              "I confirm that I am authorized to manage this business.",
            nextLabel:
              "Continue to Review & Create",
          };

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

  const ticketViewerCloseRef = useRef(null);

  useEffect(() => {
    if (!isTicketReview || !zoomImage) return;

    const previousFocus = document.activeElement;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setZoomImage(null);
      }
    };

    document.addEventListener("keydown", onEscape);
    ticketViewerCloseRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onEscape);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isTicketReview, zoomImage]);

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

          url: createTrackedPreviewUrl(file),

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
    if (!canEditMedia(type)) return;

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

  const ownedPreviewUrlsRef = useRef(new Set());

  function createTrackedPreviewUrl(file) {
    const url = URL.createObjectURL(file);
    ownedPreviewUrlsRef.current.add(url);
    return url;
  }

  function revokeIfBlob(url) {
    if (
      typeof url !== "string" ||
      !ownedPreviewUrlsRef.current.has(url)
    ) {
      return;
    }

    ownedPreviewUrlsRef.current.delete(url);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const ownedUrls = ownedPreviewUrlsRef.current;

    return () => {
      for (const url of ownedUrls) {
        URL.revokeObjectURL(url);
      }
      ownedUrls.clear();
    };
  }, []);

  /*
   * FE-03C-03F — Restore media previews after Wizard navigation.
   *
   * The parent Wizard retains original Files and crop metadata.
   * StepMediaReview is remounted whenever step === 3.
   * Recreate local Blob URLs; never upload or reset crop metadata.
   */
  useEffect(() => {
    if (
      data.logo_file instanceof File
    ) {
      setLogoPreview(
        createTrackedPreviewUrl(data.logo_file)
      );
    }

    if (
      data.cover_file instanceof File
    ) {
      setCoverPreview(
        createTrackedPreviewUrl(data.cover_file)
      );
    }

    // Intentionally mount-only:
    // subsequent replacements use handleSingleMediaUpload.
    // Existing ownership cleanup revokes URLs on unmount.
  }, []);

  const previousGalleryUrlsRef = useRef(new Set());

  useEffect(() => {
    const activeUrls = new Set(
      galleryPreview.map((item) => item.url)
    );

    for (const url of previousGalleryUrlsRef.current) {
      if (!activeUrls.has(url)) {
        revokeIfBlob(url);
      }
    }

    previousGalleryUrlsRef.current = activeUrls;
  }, [galleryPreview]);

  /* ======================================================
  🖼 SINGLE MEDIA — LOGO / COVER (NO UPLOAD)
  ====================================================== */

  function cancelWizardCrop() {
    if (!wizardCropTarget) return;

    const role = wizardCropTarget.role;

    if (role === "logo") {
      revokeIfBlob(logoPreview);
      setLogoPreview(null);
      setField("logo_file", null);
    } else if (role === "cover") {
      revokeIfBlob(coverPreview);
      setCoverPreview(null);
      setField("cover_file", null);
    }

    setField(`${role}_crop_config`, null);
    bumpInputKey(role);
    setWizardCropTarget(null);
  }

  async function handleSingleMediaUpload(
    file,
    type
  ) {

    if (!file || !type) return;

    bumpInputKey(type);

    setError("");

    const localPreviewUrl =
      createTrackedPreviewUrl(file);

    if (type === "logo") {

      revokeIfBlob(logoPreview);

      setLogoPreview(localPreviewUrl);

      setField("logo_file", file);

      if (supportsWizardCrop) {
        setField("logo_crop_config", null);
      }

    }

    if (type === "cover") {

      revokeIfBlob(coverPreview);

      setCoverPreview(localPreviewUrl);

      setField("cover_file", file);

      if (supportsWizardCrop) {
        setField("cover_crop_config", null);
      }

    }

    if (supportsWizardCrop && (type === "logo" || type === "cover")) {
      setWizardCropTarget({
        role: type,
        src: localPreviewUrl,
      });
    }

  }

  /* ======================================================
  🖼 GALLERY — PREVIEW + FILE COLLECT (NO UPLOAD)
  ====================================================== */

  const handleGalleryUpload =
    useCallback(
      async (files) => {

        if (!canEditGallery) return;

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
          isTicketCreateMode
            ? 0
            : Array.isArray(data.gallery)
              ? data.gallery.filter(
                  (img) =>
                    !isRemoved(
                      "gallery",
                      img
                    )
                ).length
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
              createTrackedPreviewUrl(file),

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
        data.gallery,
        safeSetData,
        isRemoved,
        isTicketCreateMode,
        canEditGallery,
      ]
    );

  const replaceGalleryItem =
    useCallback(
      (index, file) => {

        if (!canEditGallery) return;
        if (!file) return;

        const newPreviewUrl =
          createTrackedPreviewUrl(file);

        // Replace the selected preview; cleanup runs after commit.
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
      [safeSetData, canEditGallery]
    );

  const removeGalleryItem =
    useCallback(
      (index) => {

        if (!canEditGallery) return;

        // Remove the selected preview; cleanup runs after commit.
        setGalleryPreview((prev) =>
          prev.filter((_, i) => i !== index)
        );

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
      [safeSetData, canEditGallery]
    );

  /* ======================================================
  🧠 STEP VALIDATION
  ====================================================== */

  const canProceed = useMemo(() => {

    // =========================
    // USER UPDATE TICKET MODE
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

      // B-03-I02-IMP-02 / OWNER CROP GUARD
      const validOwnerCropV2 = (crop) =>
        crop !== null &&
        typeof crop === "object" &&
        !Array.isArray(crop) &&
        Object.keys(crop).sort().join(",") ===
          "positionX,positionY,version,zoom" &&
        crop.version === 2 &&
        typeof crop.zoom === "number" &&
        Number.isFinite(crop.zoom) &&
        crop.zoom >= 1 &&
        crop.zoom <= 3 &&
        typeof crop.positionX === "number" &&
        Number.isFinite(crop.positionX) &&
        crop.positionX >= 0 &&
        crop.positionX <= 1 &&
        typeof crop.positionY === "number" &&
        Number.isFinite(crop.positionY) &&
        crop.positionY >= 0 &&
        crop.positionY <= 1;

      const approvedOwnerCrops =
        (!data.logo_file ||
          validOwnerCropV2(data.logo_crop_config)) &&
        (!data.cover_file ||
          validOwnerCropV2(data.cover_crop_config));

      return (
        approvedOwnerCrops &&
        normalized.owner_confirmed === true &&
        busy === false
      );
    }

    // =========================
    // ADMIN EDIT MODE
    // =========================
    if (mode === "admin-edit") {
      // B-03-I03-IMP-02 / DIRECT ADMIN EDIT CROP GUARD
      const validAdminEditCropV2 = (crop) =>
        crop !== null &&
        typeof crop === "object" &&
        !Array.isArray(crop) &&
        Object.keys(crop).sort().join(",") ===
          "positionX,positionY,version,zoom" &&
        crop.version === 2 &&
        typeof crop.zoom === "number" &&
        Number.isFinite(crop.zoom) &&
        crop.zoom >= 1 &&
        crop.zoom <= 3 &&
        typeof crop.positionX === "number" &&
        Number.isFinite(crop.positionX) &&
        crop.positionX >= 0 &&
        crop.positionX <= 1 &&
        typeof crop.positionY === "number" &&
        Number.isFinite(crop.positionY) &&
        crop.positionY >= 0 &&
        crop.positionY <= 1;

      return (
        busy === false &&
        (!data.logo_file ||
          validAdminEditCropV2(data.logo_crop_config)) &&
        (!data.cover_file ||
          validAdminEditCropV2(data.cover_crop_config))
      );
    }

    if (
      mode === "admin-edit-request" ||
      mode === "admin-create-ticket"
    ) {
      const expectedTicketAssets =
        Array.isArray(ticketMediaReview?.media)
          ? ticketMediaReview.media.filter(
              (asset) =>
                asset?.snapshot_group === "requested" &&
                ["logo", "cover", "gallery"].includes(asset.role)
            )
          : [];

      const previewMatchesTicket =
        ticketPreviewState.verified === true &&
        ticketPreviewState.ticketId === ticketMediaReview?.ticketId;

      const allImagesVerified =
        Array.isArray(ticketMediaReview?.media) &&
        expectedTicketAssets.length > 0 &&
        previewMatchesTicket &&
        ticketPreviewState.loading === false &&
        !ticketPreviewState.error &&
        safeTicketImages.length === expectedTicketAssets.length;

      return busy === false && allImagesVerified;
    }

    // =========================
    // CREATE BUSINESS MODE
    // =========================

    const hasRequiredLogo =
      !!data.logo_file ||
      (
        isTicketCreateMode &&
        !!data.logo_url
      );

    // B-03-I01-T25 / MANDATORY DIRECT ADMIN CROP
    // Ticket-bound and owner flows retain their own contracts.
    const validCropV2 = (crop) =>
      crop !== null &&
      typeof crop === "object" &&
      !Array.isArray(crop) &&
      Object.keys(crop).sort().join(",") ===
        "positionX,positionY,version,zoom" &&
      crop.version === 2 &&
      typeof crop.zoom === "number" &&
      Number.isFinite(crop.zoom) &&
      crop.zoom >= 1 &&
      crop.zoom <= 3 &&
      typeof crop.positionX === "number" &&
      Number.isFinite(crop.positionX) &&
      crop.positionX >= 0 &&
      crop.positionX <= 1 &&
      typeof crop.positionY === "number" &&
      Number.isFinite(crop.positionY) &&
      crop.positionY >= 0 &&
      crop.positionY <= 1;

    const hasApprovedDirectAdminCrops =
      !["admin-create", "user-new"].includes(mode) ||
      (
        (!data.logo_file || validCropV2(data.logo_crop_config)) &&
        (!data.cover_file || validCropV2(data.cover_crop_config))
      );

    return (
      hasRequiredLogo &&
      hasApprovedDirectAdminCrops &&
      normalized.owner_confirmed ===
        true &&
      busy === false
    );

  }, [
    mode,
    data.logo_file,
    data.cover_file,
    data.logo_crop_config,
    data.cover_crop_config,
    data.logo_url,
    data.cover_image_url,
    data.removed_media,
    normalized.owner_confirmed,
    busy,
    ticketMediaReview,
    ticketPreviewState,
    currentTicketPreviewIdentity,
    safeTicketImages,
  ]);

  const activeGalleryCount =
    isTicketCreateMode
      ? (
          Array.isArray(
            data.gallery_files
          )
            ? data.gallery_files.length
            : 0
        )
      : (
          (
            Array.isArray(data.gallery)
              ? data.gallery.filter(
                  (img) =>
                    !isRemoved(
                      "gallery",
                      img
                    )
                ).length
              : 0
          ) +
          (
            Array.isArray(
              data.gallery_files
            )
              ? data.gallery_files.length
              : 0
          )
        );
  
  const remainingGallerySlots =
    MAX_GALLERY_IMAGES -
    activeGalleryCount;

  const hasGalleryOverflow =
  activeGalleryCount >
  MAX_GALLERY_IMAGES;
  
  /* ======================================================
  🧱 RENDER — UI ONLY
  ====================================================== */

  return (
    <>
      <div className="admin-section">
   
      <div className="mb-8">
        <h2 className="admin-title">
          {stepCopy.title}
        </h2>
      
        <p className="admin-hint">
          {mode === "admin-create-ticket" || mode === "admin-edit-request" ? "Step 4 of 5 — Review submitted details and media" : stepCopy.subtitle}
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
    <label className="admin-label">
      {stepCopy.logoLabel}
    </label>
     {ticketHasLogo && (
       <div className="mb-4">
         <p
           className={
             isTicketCreateMode
               ? "mb-2 text-xs font-semibold text-gray-900"
               : "mb-2 text-xs font-semibold text-red-600"
           }
         >
           {isTicketCreateMode
             ? "Requested"
             : "Changed — Requested Logo"}
         </p>
         {requestedLogoImage ? (
           <button
             type="button"
             aria-label="View original requested logo"
             onClick={() => setZoomImage(requestedLogoImage.url)}
             style={{
               display: "block",
               width: MEDIA_BOX_SIZE,
               height: MEDIA_BOX_SIZE,
               padding: 0,
               border: 0,
               background: "transparent",
               cursor: "zoom-in",
             }}
           >
             <LogoFrame
               src={requestedLogoImage.url}
               alt="Requested logo"
               cropConfig={ticketMediaReview?.crop?.logo ?? null}
               style={{ width: "100%", height: "100%" }}
             />
           </button>
         ) : (
           <p className="admin-error text-red-600">
             {ticketPreviewState.loading
               ? "Loading requested logo..."
               : "Requested logo unavailable."}
           </p>
         )}
       </div>
     )}


    <div
      style={{
        display: isTicketReview ? "none" : "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: 24,
        alignItems: "start",
        marginBottom: 12,
      }}
    >
      {isTicketCreateMode &&
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
              Requested logo
            </p>

            <button
              type="button"
              aria-label="View requested logo"
              onClick={() => setZoomImage(data.logo_url)}
              style={{
                display: "block",
                width: MEDIA_BOX_SIZE,
                height: MEDIA_BOX_SIZE,
                padding: 0,
                border: 0,
                borderRadius: 12,
                background: "transparent",
                cursor: "zoom-in",
              }}
            >
              <LogoFrame
                src={data.logo_url}
                alt="Requested logo"
                cropConfig={data.logo_crop_config ?? null}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </button>
          </div>
        )}

      {isExistingBusinessMode &&
        !ticketHasLogo &&
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
            <button
              type="button"
              aria-label="View current logo"
              onClick={() => setZoomImage(data.logo_url)}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: 0,
                border: isRemoved(
                  "logo",
                  { url: data.logo_url }
                )
                  ? "4px solid #ef4444"
                  : "2px solid var(--border)",
                borderRadius: 12,
                background: "transparent",
                cursor: "zoom-in",
                opacity: isRemoved(
                  "logo",
                  { url: data.logo_url }
                )
                  ? 0.55
                  : 1,
              }}
            >
              <LogoFrame
                src={data.logo_url}
                alt="Current logo"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </button>
      
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
              disabled={!canEditLogo}
              onClick={() => {
                if (!canEditLogo) return;

                toggleRemovedMedia(
                  "logo",
                  { url: data.logo_url }
                );
              }}
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
          {stepCopy.logoUploadLabel}
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
            disabled={!canEditLogo}
            onChange={(e) => {
              if (!canEditLogo) return;

              handleSingleMediaUpload(
                e.target.files?.[0],
                "logo"
              );
            }}
          />
        </label>

        <div
          style={{
            minHeight: 24,
            marginTop: 10,
          }}
        >
          {isUserUpdateMode &&
            isRemoved(
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
            <button
              type="button"
              aria-label="View new logo"
              onClick={() => setZoomImage(logoPreview)}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: 0,
                border: "2px solid var(--border)",
                borderRadius: 12,
                background: "transparent",
                cursor: "zoom-in",
              }}
            >
              <LogoFrame
                src={logoPreview}
                cropConfig={
                  supportsWizardCrop
                    ? data.logo_crop_config
                    : null
                }
                alt="New logo"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </button>
      
            {supportsWizardCrop &&
              data.logo_crop_config &&
              logoPreview && (
              <button
                type="button"
                aria-label="Edit logo crop"
                title="Adjust logo image"
                className="absolute bottom-2 left-2 z-20 rounded-full bg-white/95 p-2 text-navy shadow-md hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
                disabled={!canEditLogo}
                onClick={() => {
                  setWizardCropTarget({
                    role: "logo",
                    src: logoPreview,
                    reedit: true,
                  });
                }}
              >
                <Pencil size={15} />
              </button>
            )}
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
              disabled={!canEditLogo}
              onClick={() => {
                if (!canEditLogo) return;

                revokeIfBlob(logoPreview);
      
                setLogoPreview(null);
      
                setField("logo_file", null);
                if (supportsWizardCrop) {
                  setField("logo_crop_config", null);
                }

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
                disabled={!canEditLogo}
                onChange={(e) => {
                  if (!canEditLogo) return;

                  handleSingleMediaUpload(
                    e.target.files?.[0],
                    "logo"
                  );
                }}
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
     {ticketHasCover && (
       <div className="mb-4">
         <p
           className={
             isTicketCreateMode
               ? "mb-2 text-xs font-semibold text-gray-900"
               : "mb-2 text-xs font-semibold text-red-600"
           }
         >
           {isTicketCreateMode
             ? "Requested"
             : "Changed — Requested Cover"}
         </p>
         {requestedCoverImage ? (
           <button
             type="button"
             aria-label="View original requested cover"
             onClick={() => setZoomImage(requestedCoverImage.url)}
             style={{
               display: "block",
               width: "min(330px, 100%)",
               aspectRatio: "3 / 1",
               padding: 0,
               border: "2px solid var(--border)",
               borderRadius: 12,
               overflow: "hidden",
               background: "transparent",
               cursor: "zoom-in",
             }}
           >
             <img
               src={requestedCoverImage.url}
               alt="Requested cover"
               style={{
                 display: "block",
                 width: "100%",
                 height: "100%",
                 ...getMediaCropStyle(ticketMediaReview?.crop?.cover ?? null),
               }}
             />
           </button>
         ) : (
           <p className="admin-error text-red-600">
             {ticketPreviewState.loading
               ? "Loading requested cover..."
               : "Requested cover unavailable."}
           </p>
         )}
       </div>
     )}

  
    <div
      style={{
        display: isTicketReview ? "none" : "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: 24,
        alignItems: "start",
        marginBottom: 12,
      }}
    >
  
      {/* CURRENT COVER */}
      {isTicketCreateMode &&
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
              Requested cover
            </p>

            <div
              style={{
                width: MEDIA_BOX_SIZE,
                height: MEDIA_BOX_SIZE,
              }}
            >
              <img
                src={data.cover_image_url}
                alt="Requested cover"
                onClick={() =>
                  setZoomImage(
                    data.cover_image_url
                  )
                }
                style={{
                  width: "100%",
                  height: "100%",
                  ...getMediaCropStyle(
                    data.cover_crop_config ?? null
                  ),
                  borderRadius: 12,
                  cursor: "zoom-in",
                  border:
                    "2px solid var(--border)",
                }}
              />
            </div>
          </div>
        )}

      {isExistingBusinessMode &&
        !ticketHasCover &&
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
              disabled={!canEditCover}
              onClick={() => {
                if (!canEditCover) return;

                toggleRemovedMedia(
                  "cover",
                  {
                    url: data.cover_image_url,
                  }
                );
              }}
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
          {stepCopy.coverUploadLabel}
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
            disabled={!canEditCover}
            onChange={(e) => {
              if (!canEditCover) return;

              handleSingleMediaUpload(
                e.target.files?.[0],
                "cover"
              );
            }}
          />
        </label>

        <div
          style={{
            minHeight: 24,
            marginTop: 10,
          }}
        >
          {isUserUpdateMode &&
            isRemoved(
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
              width: "min(330px, 100%)",
              aspectRatio: "3 / 1",
              overflow: "hidden",
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
                ...getMediaCropStyle(
                  supportsWizardCrop
                    ? data.cover_crop_config
                    : null
                ),
                borderRadius: 12,
                cursor: "zoom-in",
                border:
                  "2px solid var(--border)",
              }}
            />
  
            {supportsWizardCrop &&
              data.cover_crop_config &&
              coverPreview && (
              <button
                type="button"
                aria-label="Edit cover crop"
                title="Adjust cover image"
                className="absolute bottom-2 left-2 z-20 rounded-full bg-white/95 p-2 text-navy shadow-md hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
                disabled={!canEditCover}
                onClick={() => {
                  setWizardCropTarget({
                    role: "cover",
                    src: coverPreview,
                    reedit: true,
                  });
                }}
              >
                <Pencil size={17} />
              </button>
            )}
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
              disabled={!canEditCover}
              onClick={() => {
                if (!canEditCover) return;
  
                revokeIfBlob(
                  coverPreview
                );
  
                setCoverPreview(null);
  
                setField(
                  "cover_file",
                  null
                );
                if (supportsWizardCrop) {
                  setField("cover_crop_config", null);
                }

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
                disabled={!canEditCover}
                onChange={(e) => {
                  if (!canEditCover) return;

                  handleSingleMediaUpload(
                    e.target.files?.[0],
                    "cover"
                  );
                }}
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
     {galleryRemovalRequested && (
       <p className="mb-4 text-sm font-semibold text-red-600">
         Gallery Image Removal Requested — The business owner
         requested the removal of one or more images.
         Refer to the ticket attachments for details.
       </p>
     )}

     {ticketHasGalleryAdds && (
       <div className="mb-5">
         <p
           className={
  isTicketCreateMode ? "mb-3 text-sm font-semibold text-gray-900"
               : "mb-3 text-sm font-semibold text-red-600"
           }
         >
           {isTicketCreateMode
             ? "Requested"
             : "Added — Review Required"}
         </p>
         {requestedGalleryImages.length > 0 ? (
           <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
             {requestedGalleryImages.map((image) => (
               <button
                 key={image.assetId}
                 type="button"
                 aria-label="View original requested gallery image"
                 onClick={() => setZoomImage(image.url)}
                 style={{
                   display: "block",
                   padding: 0,
                   border: "2px solid var(--border)",
                   borderRadius: 10,
                   overflow: "hidden",
                   background: "transparent",
                   cursor: "zoom-in",
                 }}
               >
                 <img
                   src={image.url}
                   alt="New gallery image"
                   style={{
                     display: "block",
                     width: "100%",
                     height: 140,
                     objectFit: "cover",
                   }}
                 />
               </button>
             ))}
           </div>
         ) : (
           <p className="admin-error text-red-600">
             {ticketPreviewState.loading
               ? "Loading requested gallery images..."
               : "Requested gallery images unavailable."}
           </p>
         )}
       </div>
     )}

     {mode === "admin-edit-request" && ticketPreviewState.error && (
       <p className="admin-error mb-4 text-red-600">
         {ticketPreviewState.error}
       </p>
     )}


    {isTicketCreateMode &&
      !isTicketReview &&
      Array.isArray(data.gallery) &&
      data.gallery.length > 0 && (

      <div className="mb-5">

        <p className="admin-hint mb-3">
          Requested gallery images
          {" "}
          ({data.gallery.length})
        </p>

        <p className="admin-hint mb-3">
          These images will be preserved unless
          you upload a replacement gallery.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {data.gallery.map(
            (img, index) => (
              <div
                key={
                  img.url ||
                  `requested-${index}`
                }
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
                    border:
                      "2px solid var(--border)",
                  }}
                />
              </div>
            )
          )}

        </div>

      </div>
    )}

    {isExistingBusinessMode &&
      !ticketHasGalleryAdds &&
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
                disabled={!canEditGallery}
                onClick={() => {
                  if (!canEditGallery) return;

                  toggleRemovedMedia(
                    "gallery",
                    img
                  );
                }}
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

    {!isTicketReview && (
    <p className="admin-hint mb-3">
      {stepCopy.galleryUploadLabel} (
      {remainingGallerySlots}{" "}
      slots remaining)
    </p>
    )}

    {hasGalleryOverflow && (
      <p
        className="admin-error mb-3"
        style={{
          color: "#ef4444",
        }}
      >
        Maximum of {MAX_GALLERY_IMAGES} gallery images allowed.
        Please remove some images before continuing.
      </p>
    )}
    
    {!isTicketReview && remainingGallerySlots > 0 && (
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
          disabled={!canEditGallery}
          onChange={(e) => {
            if (!canEditGallery) return;

            handleGalleryUpload(
              Array.from(
                e.target.files || []
              )
            );
          }}
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
                onClick={() => {
                  if (!canEditGallery) return;
                  removeGalleryItem(index);
                }}
                disabled={busy || !canEditGallery}
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
                  disabled={!canEditGallery}
                  onChange={(e) => {
                    if (!canEditGallery) return;

                    replaceGalleryItem(
                      index,
                      e.target.files?.[0]
                    );
                  }}
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
        disabled={!canEditField("is_public")}
        onChange={(e) => {
          if (!canEditField("is_public")) return;

          setField(
            "is_public",
            e.target.checked
          );
        }}
      />
      Public profile
    {mode === "admin-edit-request" && isRequestedField("is_public") && (<span className="ml-2 text-xs font-semibold text-red-600">Changed</span>)}
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={normalized.allow_reviews}
        disabled={!canEditField("allow_reviews")}
        onChange={(e) => {
          if (!canEditField("allow_reviews")) return;

          setField(
            "allow_reviews",
            e.target.checked
          );
        }}
      />
      Allow reviews
    {mode === "admin-edit-request" && isRequestedField("allow_reviews") && (<span className="ml-2 text-xs font-semibold text-red-600">Changed</span>)}
    </label>

  </div>

  

  {/* CONFIRMATION — not required for admin edit */}
  {!isAdminEditMode && (
    <div className="mb-8">
      <label className="flex items-center gap-2">
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
        {stepCopy.confirmationLabel}
      </label>
    </div>
  )}
  </div>
  {error && <p className="admin-error mb-3">{error}</p>}    

  {zoomImage && (
  
    <div
      role={isTicketReview ? "dialog" : undefined}
      aria-modal={isTicketReview ? "true" : undefined}
      aria-label={isTicketReview ? "Original ticket image" : undefined}
      onClick={(event) => {
        if (!isTicketReview || event.target === event.currentTarget) {
          setZoomImage(null);
        }
      }}
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
  
      {isTicketReview && (
        <button
          ref={ticketViewerCloseRef}
          type="button"
          className="absolute right-6 top-6 rounded bg-white px-4 py-2 text-black"
          onClick={() => setZoomImage(null)}
          aria-label="Close original image viewer"
          style={{ zIndex: 1 }}
        >
          Close
        </button>
      )}

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
      disabled={
        !canProceed ||
        hasGalleryOverflow
      }
    >
      {stepCopy.nextLabel}
    </button>
  </div>
  </div>

      {wizardCropTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adjust new business image"
            className="mx-auto my-6 w-full max-w-2xl"
          >
            <BusinessMediaCropEditor
              key={wizardCropTarget.src}
              src={wizardCropTarget.src}
              mediaRole={wizardCropTarget.role}
              initialConfig={
                 wizardCropTarget.reedit
                   ? data[`${wizardCropTarget.role}_crop_config`] ?? null
                   : null
               }
              onSave={(config) => {
                setField(
                  `${wizardCropTarget.role}_crop_config`,
                  config
                );
                setWizardCropTarget(null);
              }}
              onCancel={() => {
                 if (wizardCropTarget.reedit) {
                   setWizardCropTarget(null);
                 } else {
                   cancelWizardCrop();
                 }
               }}
            />
          </div>
        </div>
      )}
    </>
);
}
