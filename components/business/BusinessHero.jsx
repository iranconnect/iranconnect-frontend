import { formatPublicRating } from "../../utils/formatPublicRating.js";
//frontend/components/business/BusinessHero.jsx
import { useEffect, useMemo, useState } from "react";
import { Phone, Globe, Pencil } from "lucide-react";
import SocialBrandIcon from "./contact/SocialBrandIcon";
import LogoFrame from "./LogoFrame";
import BusinessMediaCropEditor from "./BusinessMediaCropEditor";
import apiClient from "../../utils/apiClient";
import { getMediaCropStyle } from "../../utils/businessMediaCropStyle";

function toPlainText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BusinessHero({
  biz,
  contactModel,
  isLoggedIn,
  primaryCTARef,
  canCheckOwner = false,
  adminMediaEntry = false,
}) {
  const [ownedBusiness, setOwnedBusiness] = useState(null);
  const [adminCropBusiness, setAdminCropBusiness] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropSaving, setCropSaving] = useState(false);
  const [cropError, setCropError] = useState("");
  const [cropNotice, setCropNotice] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);

  const [displayCrop, setDisplayCrop] = useState({
    logo: biz.logo_crop_config ?? null,
    cover: biz.cover_crop_config ?? null,
  });

  // Stable signatures track crop values, not object references.
  const logoCropSignature = JSON.stringify(
    biz.logo_crop_config ?? null
  );
  const coverCropSignature = JSON.stringify(
    biz.cover_crop_config ?? null
  );

  useEffect(() => {
    setDisplayCrop({
      logo: biz.logo_crop_config ?? null,
      cover: biz.cover_crop_config ?? null,
    });
  }, [
    biz.id,
    biz.logo_url,
    biz.cover_image_url,
    logoCropSignature,
    coverCropSignature,
  ]);

  useEffect(() => {
    setCoverFailed(false);
    setCropTarget(null);
  }, [biz.id, biz.logo_url, biz.cover_image_url]);

  useEffect(() => {
    let active = true;
    setOwnedBusiness(null);

    if (!canCheckOwner || !biz.id) return undefined;

    apiClient.get("/owner/me/businesses", {
      withCredentials: true,
    }).then((response) => {
      if (!active) return;
      const owned = (response.data?.rows || []).find(
        (item) =>
          Number(item.id) === Number(biz.id) &&
          item.is_deleted !== true
      );
      setOwnedBusiness(owned || null);
    }).catch(() => {
      if (active) setOwnedBusiness(null);
    });

    return () => { active = false; };
  }, [canCheckOwner, biz.id]);

  useEffect(() => {
    let active = true;
    setAdminCropBusiness(null);

    if (!adminMediaEntry || !biz.id) return undefined;

    apiClient.get(
      `/admin/businesses/${biz.id}/prefill-v2`,
      { withCredentials: true }
    ).then((response) => {
      if (!active) return;
      const item = response.data;
      setAdminCropBusiness(
        Number(item?.id) === Number(biz.id) &&
        item?.is_deleted !== true
          ? item
          : null
      );
    }).catch(() => {
      if (active) setAdminCropBusiness(null);
    });

    return () => { active = false; };
  }, [adminMediaEntry, biz.id]);

  function openCrop(role) {
    const owned = adminMediaEntry
      ? adminCropBusiness
      : ownedBusiness;
    const sourcePublicId =
      role === "logo"
        ? owned?.logo_public_id
        : owned?.cover_public_id;
    const src =
      role === "logo" ? biz.logo_url : biz.cover_image_url;

    // Public profile and owner listing must refer to
    // the same approved source before editing.
    const ownedUrl =
      role === "logo" ? owned?.logo_url : owned?.cover_image_url;

    if (!sourcePublicId || !src || ownedUrl !== src) {
      setCropError("Image details have changed. Reload the profile.");
      return;
    }

    setCropError("");
    setCropNotice("");
    setCropTarget({ role, src, sourcePublicId });
  }

  async function saveCrop(config) {
    if (
      !cropTarget ||
      !(adminMediaEntry ? adminCropBusiness : ownedBusiness) ||
      cropSaving
    ) return;

    const { role, sourcePublicId } = cropTarget;
    setCropSaving(true);
    setCropError("");

    try {
      const response = await apiClient.put(
        adminMediaEntry
          ? `/admin/businesses/${biz.id}/media-crop/${role}`
          : `/owner/businesses/${biz.id}/media-crop/${role}`,
        {
          source_public_id: sourcePublicId,
          crop_config: config,
        },
        { withCredentials: true }
      );

      const saved = response.data?.crop_config || config;
      setDisplayCrop((previous) => ({
        ...previous,
        [role]: saved,
      }));
      setCropTarget(null);
      setCropNotice("Image display settings saved.");
    } catch (error) {
      const data = error.response?.data;
      if (data?.code === "MEDIA_CROP_RATE_LIMITED") {
        setCropError(
          "You have reached the limit of five saved image " +
          "adjustments for this business in the last 24 hours."
        );
      } else {
        setCropError(
          data?.error || "Unable to save image display settings."
        );
      }
    } finally {
      setCropSaving(false);
    }
  }

  const editableBusiness = adminMediaEntry
    ? adminCropBusiness
    : ownedBusiness;

  const canEditLogo =
    Boolean(editableBusiness?.logo_public_id) &&
    editableBusiness?.logo_url === biz.logo_url &&
    Boolean(biz.logo_url);

  const canEditCover =
    Boolean(editableBusiness?.cover_public_id) &&
    editableBusiness?.cover_image_url === biz.cover_image_url &&
    Boolean(biz.cover_image_url);

  const fallbackLogo = "/logo-light.png";

  const fallbackCover =
    "/images/iranconnect-default-business-cover.webp";

  const coverImage =
    biz.cover_image_url || fallbackCover;

  const subcategoryLabel = useMemo(() => {
    const relationSubcategories = Array.isArray(biz.subcategories)
      ? biz.subcategories
          .map((item) => item?.name)
          .filter(Boolean)
          .slice(0, 2)
      : [];

    if (relationSubcategories.length > 0) {
      return relationSubcategories.join(", ");
    }

    return biz.sub_category || null;
  }, [biz.subcategories, biz.sub_category]);

  const shortDescription = toPlainText(
    biz.short_description
  );

  const reviewCount = Number(biz.review_count || 0);
  const averageRating = Number(biz.avg_rating);

  const hasApprovedRating =
    reviewCount > 0 &&
    Number.isFinite(averageRating) &&
    averageRating > 0;

  return (
    <section className="card mt-6">
      <div className="w-full aspect-[3/1] relative overflow-hidden rounded">
        <img
          src={coverImage}
          alt={`Cover image for ${biz.name}`}
          className="w-full h-full object-cover"
          style={getMediaCropStyle(
            biz.cover_image_url && !coverFailed
              ? displayCrop.cover
              : null
          )}
          onError={(event) => {
            event.currentTarget.onerror = null;
            setCoverFailed(true);
            event.currentTarget.src = fallbackCover;
          }}
        />
        {canEditCover && (
          <button
            type="button"
            onClick={() => openCrop("cover")}
            aria-label="Adjust cover image"
            title="Adjust cover image"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-navy shadow-md hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            <Pencil size={17} />
          </button>
        )}
      </div>

      {cropNotice && (
        <p role="status" className="px-4 pt-3 text-sm text-green-700">
          {cropNotice}
        </p>
      )}
      {cropError && (
        <p role="alert" className="px-4 pt-3 text-sm text-red-600">
          {cropError}
        </p>
      )}
      {cropTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adjust business image"
            className="mx-auto my-6 w-full max-w-2xl"
          >
            <BusinessMediaCropEditor
              key={`${biz.id}-${cropTarget.role}`}
              src={cropTarget.src}
              mediaRole={cropTarget.role}
              initialConfig={displayCrop[cropTarget.role]}
              saving={cropSaving}
              onSave={saveCrop}
              onCancel={() => {
                if (!cropSaving) setCropTarget(null);
              }}
            />
            {cropError && (
              <p role="alert" className="mt-2 rounded bg-white p-3 text-sm text-red-600">
                {cropError}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="pb-6 md:pb-8 pt-14 md:pt-24 relative space-y-4">
        <div className="absolute -top-8 left-6 md:-top-14 md:left-8">
          {canEditLogo && (
            <button
              type="button"
              onClick={() => openCrop("logo")}
              aria-label="Adjust logo"
              title="Adjust logo"
              className="absolute -right-2 -top-2 z-20 rounded-full bg-white p-2 text-navy shadow-md hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
            >
              <Pencil size={15} />
            </button>
          )}
          <LogoFrame
            src={biz.logo_url || fallbackLogo}
            fallbackSrc={fallbackLogo}
            cropConfig={displayCrop.logo}
            alt={`${biz.name} logo`}
            className="w-20 h-20 md:w-28 md:h-28 shadow"
          />
        </div>

        <div className="space-y-2 max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {biz.name}

            {biz.owner_verified && (
              <span
                className="ml-2 text-turquoise text-xl md:text-2xl align-middle"
                title="Verified business owner"
                aria-label="Verified business owner"
                role="img"
              >
                🎖️
              </span>
            )}
          </h1>

          <p className="text-sm text-justify-pro">
            {[
              biz.category,
              subcategoryLabel,
              [biz.city, biz.country]
                .filter(Boolean)
                .join(", "),
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {shortDescription && (
            <p className="text-sm text-justify-pro">
              {shortDescription}
            </p>
          )}

          {hasApprovedRating && (
            <p className="text-lg font-medium">
              ⭐ {formatPublicRating(
                averageRating
              )}{" "}
              ({reviewCount}{" "}
              {reviewCount === 1 ? "review" : "reviews"})
            </p>
          )}
        </div>

        {isLoggedIn &&
          (contactModel.phone.available ||
            contactModel.whatsapp.available ||
            contactModel.website.available) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {(contactModel.phone.available ||
              contactModel.whatsapp.available) && (
              <div
                ref={primaryCTARef}
                data-hero-primary-cta
                className="flex flex-wrap gap-3"
              >
                {contactModel.phone.available && (
                  <a
                    href={contactModel.phone.href}
                    className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <Phone size={16} />
                    Call
                  </a>
                )}

                {contactModel.whatsapp.available && (
                  <a
                    href={contactModel.whatsapp.href}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <SocialBrandIcon
                      platform="whatsapp"
                      size={16}
                    />
                    WhatsApp
                  </a>
                )}
              </div>
            )}

            {contactModel.website.available && (
              <a
                href={contactModel.website.href}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost !w-auto flex items-center gap-2 text-sm px-4 py-2"
              >
                <Globe size={16} />
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
