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
      href={`/business/${b.id}`}
      className="block group w-full"
      prefetch={false}
    >
      <div className="admin-card flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
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
          className="w-24 h-24 rounded-xl object-cover border mb-2 sm:mb-0"
        />

        <div className="flex flex-col flex-1 min-w-0 items-center sm:items-start">
          <h3 className="text-[var(--text)] font-semibold text-base truncate">
            {safeText(b?.name)}
          </h3>

          <p className="text-sm text-muted text-center sm:text-left truncate">
            {safeText(b?.category)} • {safeText(b?.city)},{" "}
            {safeText(b?.country)}
          </p>
        </div>

        <div className="text-turquoise font-semibold text-sm">
          ⭐ {typeof b?.avg_rating === "number" ? b.avg_rating : "—"}
        </div>
      </div>
    </Link>
  );
}

