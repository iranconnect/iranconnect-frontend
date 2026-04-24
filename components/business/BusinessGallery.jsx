//frontend/components/business/BusinessGallery.jsx
import { useState, useEffect } from "react";

export default function BusinessGallery({ biz }) {
  const [activeIndex, setActiveIndex] = useState(null);

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

  
  useEffect(() => {
    function handleKey(e) {
      if (activeIndex === null) return;
  
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) =>
          prev === gallery.length - 1 ? 0 : prev + 1
        );
      }
  
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) =>
          prev === 0 ? gallery.length - 1 : prev - 1
        );
      }
  
      if (e.key === "Escape") {
        setActiveIndex(null);
      }
    }
  
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, gallery.length]);
  
  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="mt-6">



      {/* 🔥 HORIZONTAL SLIDER */}
      {gallery.length > 0 && (
        <div className="relative mt-4">

          {/* Left Arrow */}
          <button
            onClick={() => {
              document
                .getElementById("gallery-scroll")
                ?.scrollBy({ left: -300, behavior: "smooth" });
            }}
            className=className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur border border-gray-200 hover:bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center transition"
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
                onClick={() => setActiveIndex(i)}
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
            className=className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur border border-gray-200 hover:bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center transition"
          >
            →
          </button>
        </div>
      )}

      {/* 🔥 MODAL */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setActiveIndex(null)}
        >
          {/* LEFT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) =>
                prev === 0 ? gallery.length - 1 : prev - 1
              );
            }}
            className="absolute left-6 text-white text-3xl"
          >
            ‹
          </button>
      
          {/* IMAGE */}
          <img
            src={gallery[activeIndex]}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
      
          {/* RIGHT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) =>
                prev === gallery.length - 1 ? 0 : prev + 1
              );
            }}
            className="absolute right-6 text-white text-3xl"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
