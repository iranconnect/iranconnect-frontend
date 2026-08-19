// frontend/components/BusinessCard.jsx
import Link from "next/link";
import { useRef } from "react";

export default function BusinessCard({
  b,
  variant = "default",
}) {
  const imgErrored = useRef(false);

  const isSearchVariant =
    variant === "search";

  const safeText = (
    value,
    maxLength = 200
  ) =>
    typeof value === "string"
      ? value.slice(0, maxLength)
      : "";

  const isSafeHttpUrl = (value) => {
    try {
      const url = new URL(value);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const reviewCount = Number(
    b?.review_count || 0
  );

  const averageRating = Number(
    b?.avg_rating
  );

  const hasApprovedRating =
    reviewCount > 0 &&
    Number.isFinite(averageRating) &&
    averageRating > 0;

  const shortDescription = safeText(
    b?.short_description,
    160
  );

  const serviceModeLabels = {
    on_site: "On-site",
    at_home: "At home",
    hybrid: "Hybrid",
    online: "Online",
  };

  const serviceMode =
    serviceModeLabels[b?.service_mode] ||
    safeText(b?.service_mode, 40);

  const categoryLabel = [
    safeText(b?.category),
    safeText(b?.sub_category),
  ]
    .filter(Boolean)
    .join(" • ");

  const locationLabel = [
    safeText(b?.city),
    safeText(b?.country),
  ]
    .filter(Boolean)
    .join(", ");

  let imageSrc = "/logo-light.png";

  if (
    b?.image_url &&
    isSafeHttpUrl(b.image_url)
  ) {
    imageSrc = b.image_url;
  } else if (
    b?.logo_url &&
    isSafeHttpUrl(b.logo_url)
  ) {
    imageSrc = b.logo_url;
  }

  if (isSearchVariant) {
    return (
      <Link
        href={`/business/${b.slug || b.id}`}
        className="block group w-full"
        prefetch={false}
      >
        <article
          className="
            admin-card
            relative
            w-full
            rounded-3xl
            border
            border-slate-200
            dark:border-cyan-900/40
            group-hover:border-cyan-500/30
            p-4
            sm:p-5
            md:p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-stretch
              md:gap-6
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
                md:block
                md:shrink-0
              "
            >
              <img
                src={imageSrc}
                alt={`${safeText(b?.name)} logo`}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  if (imgErrored.current) {
                    return;
                  }

                  imgErrored.current = true;
                  event.currentTarget.src =
                    "/logo-light.png";
                }}
                className="
                  w-20
                  h-20
                  md:w-28
                  md:h-28
                  rounded-2xl
                  object-cover
                  border
                  border-slate-200
                  dark:border-cyan-800/40
                  bg-white
                  p-1
                  shrink-0
                "
              />

              <div className="min-w-0 flex-1 md:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="
                      min-w-0
                      text-[var(--text)]
                      font-bold
                      text-lg
                      leading-tight
                      transition-colors
                      duration-300
                      group-hover:text-turquoise
                    "
                  >
                    {safeText(b?.name)}
                  </h3>

                  {b?.owner_verified === true && (
                    <span
                      className="
                        inline-flex
                        items-center
                        rounded-full
                        bg-emerald-500/10
                        border
                        border-emerald-400/20
                        px-2
                        py-0.5
                        text-[11px]
                        font-semibold
                        text-emerald-400
                        whitespace-nowrap
                      "
                      title="Verified business owner"
                    >
                      ✓ Verified
                    </span>
                  )}
                </div>

                {categoryLabel && (
                  <p className="mt-2 text-sm text-muted">
                    {categoryLabel}
                  </p>
                )}

                {locationLabel && (
                  <p className="mt-1 text-sm text-muted">
                    {locationLabel}
                  </p>
                )}
              </div>
            </div>

            <div
              className="
                min-w-0
                flex-1
                flex
                flex-col
                justify-between
                gap-4
              "
            >
              <div>
                <div
                  className="
                    hidden
                    md:flex
                    md:items-start
                    md:justify-between
                    md:gap-5
                  "
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="
                          text-[var(--text)]
                          font-bold
                          text-xl
                          leading-tight
                          transition-colors
                          duration-300
                          group-hover:text-turquoise
                        "
                      >
                        {safeText(b?.name)}
                      </h3>

                      {b?.owner_verified === true && (
                        <span
                          className="
                            inline-flex
                            items-center
                            rounded-full
                            bg-emerald-500/10
                            border
                            border-emerald-400/20
                            px-2
                            py-0.5
                            text-[11px]
                            font-semibold
                            text-emerald-400
                            whitespace-nowrap
                          "
                          title="Verified business owner"
                        >
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {categoryLabel && (
                      <p className="mt-2 text-sm text-muted">
                        {categoryLabel}
                      </p>
                    )}
                  </div>

                  {hasApprovedRating && (
                    <span
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-1
                        rounded-full
                        border
                        border-cyan-400/20
                        bg-cyan-500/10
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-turquoise
                      "
                    >
                      ⭐ {averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                {shortDescription && (
                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-muted
                    "
                  >
                    {shortDescription}
                  </p>
                )}
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-x-4
                  gap-y-2
                  text-sm
                  text-muted
                "
              >
                {locationLabel && (
                  <span className="hidden md:inline">
                    📍 {locationLabel}
                  </span>
                )}

                {serviceMode && (
                  <span>
                    ◉ {serviceMode}
                  </span>
                )}

                <span>
                  {hasApprovedRating && (
                    <span className="md:hidden">
                      ⭐ {averageRating.toFixed(1)} ·{" "}
                    </span>
                  )}

                  {reviewCount === 1
                    ? "1 review"
                    : `${reviewCount} reviews`}
                </span>

                <span
                  className="
                    ml-auto
                    font-semibold
                    text-[var(--text)]
                    transition-colors
                    group-hover:text-turquoise
                  "
                >
                  View profile →
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={`/business/${b.slug || b.id}`}
      className="block group w-full h-full"
      prefetch={false}
    >
      <div
        className="
          admin-card
          relative
          flex
          flex-col
          justify-between
          min-h-[280px]
          h-full
          rounded-3xl
          p-6
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl
          border
          border-slate-200
          dark:border-cyan-900/40
          group-hover:border-cyan-500/30
        "
      >
        <div className="flex items-start justify-between gap-4">
          <img
            src={imageSrc}
            alt={`${safeText(b?.name)} logo`}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              if (imgErrored.current) {
                return;
              }

              imgErrored.current = true;
              event.currentTarget.src =
                "/logo-light.png";
            }}
            className="
              w-20
              h-20
              rounded-2xl
              object-cover
              border
              border-slate-200
              dark:border-cyan-800/40
              bg-white
              p-1
              shrink-0
            "
          />
        </div>

        <div className="mt-5 flex flex-col">
          <h3
            className="
              text-[var(--text)]
              font-bold
              text-xl
              leading-tight
              transition-colors
              duration-300
              group-hover:text-turquoise
              flex
              items-center
              gap-2
              flex-wrap
            "
          >
            <span>{safeText(b?.name)}</span>

            {b?.owner_verified === true && (
              <span
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-500/10
                  border
                  border-emerald-400/20
                  px-2
                  py-0.5
                  text-[11px]
                  font-semibold
                  text-emerald-400
                  whitespace-nowrap
                "
                title="Verified business owner"
              >
                ✓ Verified
              </span>
            )}
          </h3>

          <p className="mt-3 text-sm text-muted leading-6">
            {categoryLabel}
          </p>

          <p className="mt-1 text-sm text-muted">
            {locationLabel}
          </p>
        </div>

        <div
          className="
            mt-6
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          {reviewCount === 1
            ? "1 review"
            : `${reviewCount} reviews`}
        </div>

        {hasApprovedRating && (
          <div
            className="
              absolute
              top-4
              right-4
              flex
              items-center
              gap-1
              rounded-full
              border
              border-cyan-400/20
              bg-cyan-500/10
              px-3
              py-1
              text-sm
              font-semibold
              text-turquoise
              backdrop-blur-sm
            "
          >
            ⭐ {averageRating.toFixed(1)}
          </div>
        )}
      </div>
    </Link>
  );
}
