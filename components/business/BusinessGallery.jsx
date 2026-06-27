//frontend/components/business/BusinessGallery.jsx
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function BusinessGallery({ biz }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const scrollRef = useRef(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_BASE || "http://localhost:5000";

  function resolveImage(input) {
    if (!input) {
      return null;
    }

    const url =
      typeof input === "string"
        ? input
        : input.url || input.src || null;

    if (!url || typeof url !== "string") {
      return null;
    }

    if (url.startsWith("http")) {
      return url;
    }

    const fullUrl = `${apiBase.replace("/api", "")}${url}`;
    const filename = fullUrl.split("/").pop().split("?")[0];

    return `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(
      fullUrl
    )}`;
  }

  function getImageIdentity(url) {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url);
      const proxiedOriginal = parsed.searchParams.get("url");

      return proxiedOriginal || parsed.href;
    } catch {
      return url;
    }
  }

  const coverImage = resolveImage(biz.cover_image_url);

  const coverIdentity = getImageIdentity(
    coverImage
  );

  const rawGallery = Array.isArray(biz.gallery)
    ? biz.gallery.map(resolveImage).filter(Boolean)
    : [];

  const uniqueGallery = Array.from(
    new Set(rawGallery)
  );

  const gallery = uniqueGallery.filter((image) => {
    return getImageIdentity(image) !== coverIdentity;
  });

  const hasMultipleImages = gallery.length > 1;

  useEffect(() => {
    function handleKeyDown(event) {
      if (activeIndex === null || gallery.length === 0) {
        return;
      }

      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((previous) =>
          previous === gallery.length - 1
            ? 0
            : previous + 1
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((previous) =>
          previous === 0
            ? gallery.length - 1
            : previous - 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [activeIndex, gallery.length]);

  if (gallery.length === 0) {
    return null;
  }

  function scrollGallery(direction) {
    scrollRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  }

  function showPreviousImage() {
    setActiveIndex((previous) =>
      previous === 0
        ? gallery.length - 1
        : previous - 1
    );
  }

  function showNextImage() {
    setActiveIndex((previous) =>
      previous === gallery.length - 1
        ? 0
        : previous + 1
    );
  }

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Gallery
      </h2>

      <div className="relative mt-4">
        {hasMultipleImages && (
          <button
            type="button"
            onClick={() => scrollGallery(-1)}
            aria-label="Scroll gallery left"
            className="
              absolute left-2 top-1/2 z-10
              flex h-10 w-10 -translate-y-1/2 items-center justify-center
              rounded-full border border-gray-200 bg-white/90
              shadow-md backdrop-blur transition-all duration-200
              hover:scale-105 hover:bg-white hover:shadow-lg
            "
          >
            <ChevronLeft size={18} className="text-black" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar px-8"
        >
          {gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="min-w-[160px] overflow-hidden rounded-xl"
              aria-label={`Open gallery image ${
                index + 1
              } for ${biz.name}`}
            >
              <img
                src={image}
                alt={`Gallery image ${
                  index + 1
                } for ${biz.name}`}
                loading="lazy"
                decoding="async"
                className="h-[120px] w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </button>
          ))}
        </div>

        {hasMultipleImages && (
          <button
            type="button"
            onClick={() => scrollGallery(1)}
            aria-label="Scroll gallery right"
            className="
              absolute right-2 top-1/2 z-10
              flex h-10 w-10 -translate-y-1/2 items-center justify-center
              rounded-full border border-gray-200 bg-white/90
              shadow-md backdrop-blur transition-all duration-200
              hover:scale-105 hover:bg-white hover:shadow-lg
            "
          >
            <ChevronRight size={18} className="text-black" />
          </button>
        )}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${biz.name} gallery preview`}
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close gallery preview"
            className="absolute right-4 top-4 text-white"
          >
            <X size={28} />
          </button>

          {hasMultipleImages && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              aria-label="Previous gallery image"
              className="absolute left-4 text-4xl text-white md:left-8"
            >
              ‹
            </button>
          )}

          <img
            src={gallery[activeIndex]}
            alt={`Gallery image ${
              activeIndex + 1
            } for ${biz.name}`}
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
            onClick={(event) => event.stopPropagation()}
          />

          {hasMultipleImages && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label="Next gallery image"
              className="absolute right-4 text-4xl text-white md:right-8"
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}
