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
          drop-shadow-[0_8px_18px_rgba(10,29,55,0.18)]
          animate-[iranconnect-loading-spin_2.2s_linear_infinite]
          motion-reduce:animate-none
        `}
      />

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

        @media (prefers-reduced-motion: reduce) {
          [aria-label="Loading business profile"] img {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
