// frontend/components/BusinessCard.jsx
import Link from "next/link";
import { useRef } from "react";

export default function BusinessCard({ b }) {
  const imgErrored = useRef(false);

  const safeText = (value) =>
    typeof value === "string"
      ? value.slice(0, 200)
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

  const reviewCount = Number(b?.review_count || 0);
  const averageRating = Number(b?.avg_rating);

  const hasApprovedRating =
    reviewCount > 0 &&
    Number.isFinite(averageRating) &&
    averageRating > 0;

  let imageSrc = "/logo-light.png";

  if (b?.image_url && isSafeHttpUrl(b.image_url)) {
    imageSrc = b.image_url;
  } else if (
    b?.logo_url &&
    isSafeHttpUrl(b.logo_url)
  ) {
    imageSrc = b.logo_url;
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
              event.currentTarget.src = "/logo-light.png";
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

          <p
            className="
              mt-3
              text-sm
              text-muted
              leading-6
            "
          >
            {safeText(b?.category)}
            {b?.sub_category
              ? ` • ${safeText(b.sub_category)}`
              : ""}
          </p>

          <p
            className="
              mt-1
              text-sm
              text-muted
            "
          >
            {[safeText(b?.city), safeText(b?.country)]
              .filter(Boolean)
              .join(", ")}
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
