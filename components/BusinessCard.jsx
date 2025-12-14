// frontend/components/BusinessCard.jsx
import Link from "next/link";

/**
 * 🧩 BusinessCard — IranConnect (Hardened)
 * - Safe image handling
 * - XSS-safe text rendering
 * - CDN guarded
 */

export default function BusinessCard({ b }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE || "";

  /* ----------------------------------------------------
     🔐 Helpers
  ---------------------------------------------------- */

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

  /* ----------------------------------------------------
     🖼️ Resolve image source safely
  ---------------------------------------------------- */

  let original = "/logo.png";

  if (b?.image_url && isSafeHttpUrl(b.image_url)) {
    original = b.image_url;
  } else if (b?.logo_url && isSafeHttpUrl(b.logo_url)) {
    original = b.logo_url;
  } else if (b?.image_url && b.image_url.startsWith("/")) {
    original = `${apiBase.replace("/api", "")}${b.image_url}`;
  } else if (b?.logo_url && b.logo_url.startsWith("/")) {
    original = `${apiBase.replace("/api", "")}${b.logo_url}`;
  }

  let imageSrc = original;

  // فقط اگر CDN معتبر داریم و URL امن است
  if (cdnBase && isSafeHttpUrl(original)) {
    const filename = original.split("/").pop().split("?")[0];
    imageSrc = `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(original)}`;
  }

  /* ----------------------------------------------------
     🧱 Render
  ---------------------------------------------------- */

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
            e.currentTarget.src = "/logo.png";
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
