//frontend/components/business/BusinessGallery.jsx
import { useState } from "react";

export default function BusinessGallery({ biz }) {
  const [showAll, setShowAll] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_BASE || "http://localhost:5000";

  /* ─────────────────────────────
     Resolve image (safe)
  ───────────────────────────── */
  function resolveImage(input) {
    if (!input) return null;

    const url =
      typeof input === "string"
        ? input
        : input.url || input.src || null;

    if (!url || typeof url !== "string") return null;

    if (url.startsWith("http")) return url;

    const full = `${apiBase.replace("/api", "")}${url}`;
    const filename = full.split("/").pop().split("?")[0];

    return `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(full)}`;
  }

  /* ─────────────────────────────
     Data
  ───────────────────────────── */

  const cover = resolveImage(biz.cover_image_url);
  
  let gallery = Array.isArray(biz.gallery)
    ? biz.gallery.map(resolveImage).filter(Boolean)
    : [];

  // ✅ remove cover from gallery (by filename)
  if (cover) {
    const coverName = cover.split("/").pop().split("?")[0];

    gallery = gallery.filter((img) => {
      const imgName = img.split("/").pop().split("?")[0];
      return imgName !== coverName;
    });
  }

  if (!cover && gallery.length === 0) return null;

  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="mt-6">

      {/* 🔥 HERO + PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

        {/* Cover */}
        {cover && (
          <div
            className="md:col-span-2 rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => setActiveImage(cover)}
          >
            <img
              src={cover}
              alt="Cover"
              className="w-full h-[260px] md:h-[360px] object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Preview Images */}
        <div className="grid grid-cols-2 gap-2">
          {gallery.slice(0, 4).map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Gallery ${i}`}
              className="rounded-xl h-[120px] object-cover cursor-pointer"
              onClick={() => setActiveImage(img)}
              loading="lazy"
            />
          ))}
        </div>
      </div>

      {/* 🔥 SHOW MORE BUTTON */}
      {gallery.length > 4 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          +{gallery.length - 4} more photos
        </button>
      )}

      {/* 🔥 HORIZONTAL SLIDER */}
      {showAll && gallery.length > 0 && (
        <div className="relative mt-4">

          {/* Left Arrow */}
          <button
            onClick={() => {
              document
                .getElementById("gallery-scroll")
                ?.scrollBy({ left: -300, behavior: "smooth" });
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full w-8 h-8 flex items-center justify-center"
          >
            ←
          </button>

          {/* Scroll Container */}
          <div
            id="gallery-scroll"
            className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar px-8"
          >
            {gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Gallery ${i}`}
                className="min-w-[160px] h-[120px] rounded-xl object-cover cursor-pointer"
                onClick={() => setActiveImage(img)}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => {
              document
                .getElementById("gallery-scroll")
                ?.scrollBy({ left: 300, behavior: "smooth" });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full w-8 h-8 flex items-center justify-center"
          >
            →
          </button>
        </div>
      )}

      {/* 🔥 MODAL */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
