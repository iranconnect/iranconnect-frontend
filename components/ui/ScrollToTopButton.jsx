import {
  useEffect,
  useState,
} from "react";
export default function ScrollToTopButton({
  showAfter = 360,
}) {
  const [scrolledEnough, setScrolledEnough] =
    useState(false);

  const [footerVisible, setFooterVisible] =
    useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolledEnough(
        window.scrollY > showAfter
      );
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [showAfter]);

  useEffect(() => {
    const footer =
      document.querySelector(
        "footer.site-footer"
      );

    if (
      !footer ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setFooterVisible(
            entry.isIntersecting
          );
        },
        {
          threshold: 0.01,
        }
      );

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  function handleClick() {
    const reduceMotion =
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion
        ? "auto"
        : "smooth",
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Scroll to top"
        title="Scroll to top"
        className={`
          scroll-to-top-button
          fixed
          right-4
          bottom-6
          md:right-6
          md:bottom-6
          z-50
          flex
          h-12
          w-12
          md:h-[52px]
          md:w-[52px]
          items-center
          justify-center
          rounded-full
          border
          shadow-lg
          backdrop-blur-md
          transition-[opacity,transform,box-shadow]
          duration-300
          ease-out
          motion-reduce:transition-none
          ${
            scrolledEnough
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90 pointer-events-none"
          }
          ${
            footerVisible
              ? "max-md:opacity-0 max-md:scale-90 max-md:pointer-events-none"
              : ""
          }
          hover:scale-105
          hover:shadow-xl
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-offset-2
          focus-visible:ring-[#40E0D0]
        `}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style jsx global>{`
        .scroll-to-top-button {
          color: #40e0d0;
          background: rgba(10, 29, 55, 0.88);
          border-color: rgba(64, 224, 208, 0.3);
          box-shadow:
            0 10px 30px rgba(10, 29, 55, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .scroll-to-top-button:hover {
          background: rgba(10, 29, 55, 0.95);
        }

        @media (max-width: 767px) {
          html[data-theme="dark"]
            .scroll-to-top-button {
            color: #0a1d37;
            background: rgba(
              64,
              224,
              208,
              0.84
            );
            border-color: rgba(
              64,
              224,
              208,
              0.65
            );
            box-shadow:
              0 10px 30px rgba(
                64,
                224,
                208,
                0.16
              ),
              inset 0 1px 0 rgba(
                255,
                255,
                255,
                0.24
              );
          }

          html[data-theme="dark"]
            .scroll-to-top-button:hover {
            background: rgba(
              64,
              224,
              208,
              0.94
            );
          }
        }
      `}</style>
    </>
  );
}
