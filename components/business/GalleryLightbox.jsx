import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const CLOSE_TRANSITION_MS = 220;

export default function GalleryLightbox({
  images,
  activeIndex,
  businessName,
  onActiveIndexChange,
  onClose,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeTimerRef = useRef(null);
  const scrollPositionRef = useRef({
    x: 0,
    y: 0,
  });

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] || null;

  const requestClose = useCallback(() => {
    if (closing) {
      return;
    }

    setClosing(true);
    setVisible(false);

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, CLOSE_TRANSITION_MS);
  }, [closing, onClose]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;

    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY,
    };

    const previousBodyOverflow =
      document.body.style.overflow;
    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      document.body.style.overflow =
        previousBodyOverflow;
      document.documentElement.style.overflow =
        previousHtmlOverflow;

      const { x, y } =
        scrollPositionRef.current;

      window.scrollTo(x, y);

      window.requestAnimationFrame(() => {
        previousFocusRef.current?.focus?.({
          preventScroll: true,
        });

        window.scrollTo(x, y);
      });
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (closing) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (
        hasMultipleImages &&
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        onActiveIndexChange(
          activeIndex === images.length - 1
            ? 0
            : activeIndex + 1
        );

        return;
      }

      if (
        hasMultipleImages &&
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        onActiveIndexChange(
          activeIndex === 0
            ? images.length - 1
            : activeIndex - 1
        );

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = dialogRef.current;

      if (!root) {
        return;
      }

      const focusable = Array.from(
        root.querySelectorAll(
          [
            "button:not([disabled])",
            '[href]',
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        )
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    activeIndex,
    closing,
    hasMultipleImages,
    images.length,
    onActiveIndexChange,
    requestClose,
  ]);

  if (
    typeof document === "undefined" ||
    !activeImage
  ) {
    return null;
  }

  function showPreviousImage() {
    onActiveIndexChange(
      activeIndex === 0
        ? images.length - 1
        : activeIndex - 1
    );
  }

  function showNextImage() {
    onActiveIndexChange(
      activeIndex === images.length - 1
        ? 0
        : activeIndex + 1
    );
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${businessName} gallery preview`}
      className={`
        fixed inset-0 z-[10000]
        flex items-center justify-center
        bg-black/90 p-4
      `}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={requestClose}
        aria-label="Close gallery preview"
        className="
          absolute z-20
          flex h-11 w-11
          items-center justify-center
          rounded-full
          bg-black/45 text-white
          transition
          hover:bg-black/65
          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-white
        "
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          right:
            "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <X size={28} aria-hidden="true" />
      </button>

      {hasMultipleImages && (
        <button
          type="button"
          onClick={showPreviousImage}
          aria-label="Previous gallery image"
          className="
            absolute left-4 z-20
            flex h-11 w-11
            items-center justify-center
            rounded-full
            bg-black/45 text-white
            transition
            hover:bg-black/65
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            md:left-8
          "
        >
          <ChevronLeft
            size={30}
            aria-hidden="true"
          />
        </button>
      )}

      <div
        className={`
          flex max-h-full max-w-full
          items-center justify-center
          transition-[opacity,transform]
          duration-[220ms]
          ease-[cubic-bezier(0.22,1,0.36,1)]
          motion-reduce:transition-none
          motion-reduce:transform-none
          ${
            visible && !closing
              ? "scale-100 opacity-100"
              : "scale-[0.94] opacity-0"
          }
        `}
      >
        <img
          src={activeImage}
          alt={`Gallery image ${
            activeIndex + 1
          } for ${businessName}`}
          draggable={false}
          className="
            max-h-[90vh]
            max-h-[calc(100dvh-2rem)]
            max-w-[90vw]
            max-w-[calc(100vw-2rem)]
            object-contain
            rounded-xl
          "
        />
      </div>

      {hasMultipleImages && (
        <button
          type="button"
          onClick={showNextImage}
          aria-label="Next gallery image"
          className="
            absolute right-4 z-20
            flex h-11 w-11
            items-center justify-center
            rounded-full
            bg-black/45 text-white
            transition
            hover:bg-black/65
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            md:right-8
          "
        >
          <ChevronRight
            size={30}
            aria-hidden="true"
          />
        </button>
      )}
    </div>,
    document.body
  );
}
