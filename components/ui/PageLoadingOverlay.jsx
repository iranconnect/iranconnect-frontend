export default function PageLoadingOverlay({
  visible = false,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading business profile"
      className={`
        fixed
        inset-0
        z-[10000]
        flex
        items-center
        justify-center
        bg-white/20
        backdrop-blur-[6px]
        motion-reduce:backdrop-blur-sm
      `}
    >
      <div
        className={`
          flex
          h-[104px]
          w-[104px]
          sm:h-[116px]
          sm:w-[116px]
          items-center
          justify-center
          rounded-full
          border
          border-white/50
          bg-white/55
          shadow-2xl
          backdrop-blur-md
        `}
      >
        <img
          src="/loading-logo.png"
          alt=""
          aria-hidden="true"
          draggable="false"
          className={`
            h-[72px]
            w-[72px]
            sm:h-[84px]
            sm:w-[84px]
            select-none
            object-contain
            animate-[iranconnect-loading-spin_1.35s_linear_infinite]
            motion-reduce:animate-none
          `}
        />
      </div>

      <span className="sr-only">
        Loading business profile
      </span>

      <style jsx global>{`
        @keyframes iranconnect-loading-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        html[data-theme="dark"]
          [aria-label="Loading business profile"] {
          background: rgba(10, 29, 55, 0.3);
        }

        html[data-theme="dark"]
          [aria-label="Loading business profile"]
          > div {
          background: rgba(10, 29, 55, 0.58);
          border-color: rgba(64, 224, 208, 0.22);
        }

        @media (prefers-reduced-motion: reduce) {
          [aria-label="Loading business profile"] img {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
