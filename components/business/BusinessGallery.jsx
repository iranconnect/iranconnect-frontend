//frontend/components/business/BusinessGallery.jsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import GalleryLightbox from "./GalleryLightbox";

export default function BusinessGallery({ biz }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [stripState, setStripState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const scrollRef = useRef(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE;
  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_BASE;

  if (!apiBase || !cdnBase) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE and NEXT_PUBLIC_CDN_BASE must be defined"
    );
  }

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

    const apiOrigin = apiBase.replace(/\/api\/?$/, "");
    const fullUrl = `${apiOrigin}${url}`;
    const filename = fullUrl
      .split("/")
      .pop()
      .split("?")[0];

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
      const proxiedOriginal =
        parsed.searchParams.get("url");

      return proxiedOriginal || parsed.href;
    } catch {
      return url;
    }
  }

  const coverImage = resolveImage(
    biz.cover_image_url
  );

  const coverIdentity =
    getImageIdentity(coverImage);

  const rawGallery = Array.isArray(biz.gallery)
    ? biz.gallery
        .map(resolveImage)
        .filter(Boolean)
    : [];

  const uniqueGallery = Array.from(
    new Set(rawGallery)
  );

  const gallery = uniqueGallery.filter(
    (image) =>
      getImageIdentity(image) !== coverIdentity
  );

  const hasMultipleImages =
    gallery.length > 1;

  const updateStripState = useCallback(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const maxScrollLeft = Math.max(
      0,
      element.scrollWidth -
        element.clientWidth
    );

    const epsilon = 2;

    setStripState({
      hasOverflow: maxScrollLeft > epsilon,
      canScrollLeft:
        element.scrollLeft > epsilon,
      canScrollRight:
        element.scrollLeft <
        maxScrollLeft - epsilon,
    });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        updateStripState
      );

    element.addEventListener(
      "scroll",
      updateStripState,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      updateStripState
    );

    let resizeObserver = null;

    if (
      typeof ResizeObserver !== "undefined"
    ) {
      resizeObserver = new ResizeObserver(
        updateStripState
      );

      resizeObserver.observe(element);
    }

    return () => {
      window.cancelAnimationFrame(frame);

      element.removeEventListener(
        "scroll",
        updateStripState
      );

      window.removeEventListener(
        "resize",
        updateStripState
      );

      resizeObserver?.disconnect();
    };
  }, [gallery.length, updateStripState]);

  if (gallery.length === 0) {
    return null;
  }

  function scrollGallery(direction) {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    if (
      direction < 0 &&
      !stripState.canScrollLeft
    ) {
      return;
    }

    if (
      direction > 0 &&
      !stripState.canScrollRight
    ) {
      return;
    }

    element.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  }

  const showStripControls =
    hasMultipleImages &&
    stripState.hasOverflow;

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Gallery
      </h2>

      <div className="relative mt-4">
        {showStripControls && (
          <button
            type="button"
            onClick={() =>
              scrollGallery(-1)
            }
            disabled={
              !stripState.canScrollLeft
            }
            aria-label="Scroll gallery left"
            className="
              absolute left-2 top-1/2 z-10
              flex h-10 w-10
              -translate-y-1/2
              items-center justify-center
              rounded-full
              border border-gray-200
              bg-white/90
              shadow-md backdrop-blur
              transition-all duration-200
              hover:scale-105
              hover:bg-white
              hover:shadow-lg
              disabled:cursor-not-allowed
              disabled:opacity-40
              disabled:hover:scale-100
              disabled:hover:shadow-md
            "
          >
            <ChevronLeft
              size={18}
              className="text-black"
              aria-hidden="true"
            />
          </button>
        )}

        <div
          ref={scrollRef}
          className="
            flex gap-3 overflow-x-auto
            scroll-smooth no-scrollbar px-8
          "
        >
          {gallery.map(
            (image, index) => (
              <button
                key={image}
                type="button"
                onClick={() =>
                  setActiveIndex(index)
                }
                className="
                  min-w-[160px]
                  overflow-hidden
                  rounded-xl
                "
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
                  className="
                    h-[120px] w-full
                    object-cover
                    transition-transform
                    duration-200
                    hover:scale-105
                  "
                />
              </button>
            )
          )}
        </div>

        {showStripControls && (
          <button
            type="button"
            onClick={() =>
              scrollGallery(1)
            }
            disabled={
              !stripState.canScrollRight
            }
            aria-label="Scroll gallery right"
            className="
              absolute right-2 top-1/2 z-10
              flex h-10 w-10
              -translate-y-1/2
              items-center justify-center
              rounded-full
              border border-gray-200
              bg-white/90
              shadow-md backdrop-blur
              transition-all duration-200
              hover:scale-105
              hover:bg-white
              hover:shadow-lg
              disabled:cursor-not-allowed
              disabled:opacity-40
              disabled:hover:scale-100
              disabled:hover:shadow-md
            "
          >
            <ChevronRight
              size={18}
              className="text-black"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          images={gallery}
          activeIndex={activeIndex}
          businessName={biz.name}
          onActiveIndexChange={
            setActiveIndex
          }
          onClose={() =>
            setActiveIndex(null)
          }
        />
      )}
    </section>
  );
}
