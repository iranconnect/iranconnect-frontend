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
          sm:flex-row
          items-center
          justify-between
          gap-5
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
            w-16
            h-16
            rounded-2xl
            object-cover
            border
            border-slate-200
            dark:border-cyan-800/40
            mb-2
            sm:mb-0
            shrink-0
            bg-white
            p-1
          "
        />

        <div className="flex flex-col flex-1 min-w-0 items-center sm:items-start">
          <h3
            className="
              text-[var(--text)]
              font-bold
              text-lg
              truncate
              transition-colors
              duration-300
              group-hover:text-turquoise
            "
          >
            {safeText(b?.name)}
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-muted
              text-center
              sm:text-left
              leading-6
              truncate
            "
          >
            {safeText(b?.category)} • {safeText(b?.city)},{" "}
            {safeText(b?.country)}
          </p>
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

