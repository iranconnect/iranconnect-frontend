// frontend/components/business/ReviewRestrictionAcknowledgementModal.jsx

import {
  useEffect,
  useId,
  useRef,
} from "react";

export default function ReviewRestrictionAcknowledgementModal({
  notice,
  loading = false,
  error = "",
  onAcknowledge,
}) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef = useRef(null);
  const acknowledgeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    previousFocusRef.current =
      document.activeElement;

    requestAnimationFrame(() => {
      acknowledgeButtonRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = dialogRef.current;

      if (!root) {
        return;
      }

      const focusable =
        Array.from(
          root.querySelectorAll(
            [
              "button:not([disabled])",
              '[href]',
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
        focusable[
          focusable.length - 1
        ];

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

      requestAnimationFrame(() => {
        previousFocusRef.current?.focus?.();
      });
    };
  }, [notice]);

  if (!notice) {
    return null;
  }

  let restrictionUntilLabel = null;

  if (notice.restrictedUntil) {
    const date =
      new Date(
        notice.restrictedUntil
      );

    restrictionUntilLabel =
      Number.isNaN(date.getTime())
        ? "the restriction period ends."
        : date.toLocaleString();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/55
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          event.preventDefault();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--card-bg)]
          p-6
          text-[var(--text)]
          shadow-2xl
        "
      >
        <div
          className="
            mb-5
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-amber-500/40
            bg-amber-500/10
            text-2xl
          "
          aria-hidden="true"
        >
          ⚠
        </div>

        <h2
          id={titleId}
          className="
            text-xl
            font-semibold
          "
        >
          Review submissions temporarily disabled
        </h2>

        <p
          id={descriptionId}
          className="
            mt-3
            whitespace-pre-wrap
            text-sm
            leading-6
            text-justify-pro
          "
        >
          {notice.message}
        </p>

        {restrictionUntilLabel && (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-4
            "
          >
            <p className="text-sm font-semibold">
              Restriction period
            </p>

            <p className="mt-1 text-sm opacity-75">
              Review submissions are disabled until{" "}
              {restrictionUntilLabel}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="
              mt-4
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-3
              text-sm
            "
          >
            {error}
          </div>
        )}

        <button
          ref={acknowledgeButtonRef}
          type="button"
          disabled={loading}
          onClick={onAcknowledge}
          className="
            btn-primary
            mt-6
            w-full
            px-4
            py-2.5
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading
            ? "Recording acknowledgement..."
            : "I understand"}
        </button>

        <p
          className="
            mt-3
            text-xs
            leading-5
            opacity-65
          "
        >
          Selecting “I understand” confirms that
          you have seen this warning.
        </p>
      </div>
    </div>
  );
}
