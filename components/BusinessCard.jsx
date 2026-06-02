// frontend/components/BusinessCard.jsx
import Link from "next/link";
import { useRef } from "react";

export default function BusinessCard({ b }) {
  const imgErrored = useRef(false);

  const safeText = (val) =>
    typeof val === "string" ? val.slice(0, 200) : "";

  const isSafeHttpUrl = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  // 🔵 Resolve image
  let imageSrc = "/logo-light.png"; // ✅ real fallback

  if (b?.image_url && isSafeHttpUrl(b.image_url)) {
    imageSrc = b.image_url;
  } else if (b?.logo_url && isSafeHttpUrl(b.logo_url)) {
    imageSrc = b.logo_url;
  }

  return (
    <Link
      href={`/business/${b.slug || b.id}`}
      className="block group w-full"
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
            onError={(e) => {
              if (imgErrored.current) return;
              imgErrored.current = true;
              e.currentTarget.src = "/logo-light.png";
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
          
            {b?.verified && (
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
            {b?.subcategory ? ` • ${safeText(b.subcategory)}` : ""}
          </p>
        
          <p
            className="
              mt-1
              text-sm
              text-muted
            "
          >
            {safeText(b?.city)}, {safeText(b?.country)}
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
          {b?.reviews_count || 0} reviews
        </div>
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
          ⭐ {typeof b?.avg_rating === "number" ? b.avg_rating : "—"}
        </div>
      </div>
    </Link>
  );
}

