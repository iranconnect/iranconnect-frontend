import { formatPublicRating } from "../../utils/formatPublicRating.js";
//frontend/components/business/BusinessHero.jsx
import { useEffect, useMemo, useState } from "react";
import { Phone, Globe, MessageCircle } from "lucide-react";

function toPlainText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BusinessHero({
  biz,
  phoneWithCode,
  isLoggedIn,
}) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const syncTheme = () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";

      setTheme(currentTheme);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const fallbackLogo =
    theme === "dark"
      ? "/logo-dark.png"
      : "/logo-light.png";

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

  const callHref = phoneWithCode
    ? `tel:${phoneWithCode.replace(/\s+/g, "")}`
    : null;

  return (
    <section className="card mt-6">
      <div className="h-48 md:h-64 w-full relative overflow-hidden rounded">
        <img
          src={coverImage}
          alt={`Cover image for ${biz.name}`}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackCover;
          }}
        />
      </div>

      <div className="pb-6 md:pb-8 pt-20 md:pt-24 relative space-y-4">
        <div className="absolute -top-14 left-6 md:left-8">
          <img
            src={biz.logo_url || fallbackLogo}
            alt={`${biz.name} logo`}
            className="w-28 h-28 rounded-xl border-[var(--bg)] object-cover shadow"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackLogo;
            }}
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
          (callHref || biz.whatsapp_number || biz.website) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {callHref && (
              <a
                href={callHref}
                className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
              >
                <Phone size={16} />
                Call
              </a>
            )}

            {biz.whatsapp_number && (
              <a
                href={`https://wa.me/${biz.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            )}

            {biz.website && (
              <a
                href={biz.website}
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
