//frontend/components/BusinessCard.jsxی
import Link from 'next/link';

export default function BusinessCard({ b }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;      // برای APIها
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE;      // برای کش تصاویر

  // مرحله 1: URL اصلی تصویر
  const original =
    b.image_url
      ? (b.image_url.startsWith("http") ? b.image_url : `${apiBase.replace('/api','')}${b.image_url}`)
      : b.logo_url
      ? (b.logo_url.startsWith("http") ? b.logo_url : `${apiBase.replace('/api','')}${b.logo_url}`)
      : "/logo.png";

  // مرحله 2: اگر Cloudinary بود → از مسیر CDN استفاده می‌کنیم
  let imageSrc = original;

  if (original.startsWith("http")) {
    const filename = original.split("/").pop().split("?")[0];
    imageSrc = `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(original)}`;
  }

  return (
    <Link href={`/business/${b.id}`} className="block group w-full">
      <div className="admin-card flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
        <img
          src={imageSrc}
          alt={`${b.name} logo`}
          className="w-24 h-24 rounded-xl object-cover border mb-2 sm:mb-0"
        />
        <div className="flex flex-col flex-1 min-w-0 items-center sm:items-start">
          <h3 className="text-[var(--text)] font-semibold text-base truncate">
            {b.name}
          </h3>
          <p className="text-sm text-muted text-center sm:text-left">
            {b.category} • {b.city}, {b.country}
          </p>
        </div>
        <div className="text-turquoise font-semibold text-sm">
          ⭐ {b.avg_rating ?? '—'}
        </div>
      </div>
    </Link>
  );
}
