//frontend/components/business/BusinessGallery.jsx
import { useState } from "react";

export default function BusinessGallery({ biz }) {
  const [activeImage, setActiveImage] = useState(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_BASE || "http://localhost:5000";

  function resolveImage(input) {
    if (!input) return null;
  
    // اگر object بود → url رو استخراج کن
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

  const cover = resolveImage(biz.cover_image_url);
  const gallery = Array.isArray(biz.gallery)
    ? biz.gallery.map(resolveImage).filter(Boolean)
    : [];

  if (!cover && gallery.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">

      {/* Cover */}
      {cover && (
        <div
          className="rounded-2xl overflow-hidden cursor-pointer"
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

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.slice(0, 6).map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Gallery ${i}`}
              className="rounded-xl h-32 object-cover cursor-pointer hover:opacity-90"
              onClick={() => setActiveImage(img)}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
