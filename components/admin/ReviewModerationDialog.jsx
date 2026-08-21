import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const REASONS = [
  ["spam", "Spam"],
  ["abusive_content", "Abusive content"],
  ["personal_information", "Personal information"],
  ["irrelevant", "Irrelevant"],
  ["conflict_of_interest", "Conflict of interest"],
  ["fraud_suspicion", "Fraud suspicion"],
  ["duplicate", "Duplicate"],
  ["policy_violation", "Policy violation"],
  ["other", "Other"],
];

export default function ReviewModerationDialog({
  action,
  open,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef = useRef(null);
  const initialFocusRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [reasonCode, setReasonCode] =
    useState("");
  const [note, setNote] =
    useState("");

  const requiresViolationReason =
    action === "reject" ||
    action === "hide";

  const requiresOtherNote =
    reasonCode === "other";

  const noteTooLong =
    note.length > 2000;

  const otherNoteTooShort =
    requiresOtherNote &&
    note.trim().length < 10;

  const canSubmit =
    !loading &&
    (!requiresViolationReason ||
      Boolean(reasonCode)) &&
    !noteTooLong &&
    !otherNoteTooShort;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement;

    setReasonCode(
      requiresViolationReason
        ? ""
        : "approved"
    );
    setNote("");

    requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [
    open,
    action,
    requiresViolationReason,
  ]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        if (!loading) {
          event.preventDefault();
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root =
        dialogRef.current;

      if (!root) return;

      const focusable =
        Array.from(
          root.querySelectorAll(
            [
              "button:not([disabled])",
              "select:not([disabled])",
              "textarea:not([disabled])",
              "input:not([disabled])",
              '[href]',
              '[tabindex]:not([tabindex="-1"])',
            ].join(",")
          )
        );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first =
        focusable[0];
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
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    open,
    loading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const actionLabel =
    action === "approve"
      ? "Approve Review"
      : action === "reject"
        ? "Reject Review"
        : action === "hide"
          ? "Hide Review"
          : "Restore Review";

  const submitLabel =
    loading
      ? "Saving..."
      : actionLabel;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      reasonCode:
        requiresViolationReason
          ? reasonCode
          : "approved",
      note:
        note.trim() || null,
    });
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose();
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
          admin-section
          w-full
          max-w-xl
          max-h-[90vh]
          overflow-y-auto
          bg-[var(--card-bg)]
          text-[var(--text)]
          shadow-xl
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            mb-5
          "
        >
          <div>
            <h2
              id={titleId}
              className="
                text-lg
                font-semibold
              "
            >
              {actionLabel}
            </h2>

            <p
              id={descriptionId}
              className="
                admin-muted
                text-sm
                mt-1
              "
            >
              Confirm this moderation
              action before changing the
              review status.
            </p>
          </div>

          <button
            ref={
              requiresViolationReason
                ? null
                : initialFocusRef
            }
            type="button"
            className="
              admin-btn
              admin-btn-secondary
              px-3
              py-1.5
              text-sm
            "
            disabled={loading}
            onClick={onClose}
            aria-label="Close moderation dialog"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {requiresViolationReason && (
            <div>
              <label
                htmlFor={`${titleId}-reason`}
                className="
                  block
                  text-sm
                  font-medium
                  mb-2
                "
              >
                Reason
              </label>

              <select
                ref={initialFocusRef}
                id={`${titleId}-reason`}
                className="
                  admin-input
                  w-full
                "
                value={reasonCode}
                disabled={loading}
                onChange={(event) =>
                  setReasonCode(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a reason
                </option>

                {REASONS.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {(action === "reject" ||
            action === "hide") && (
            <div>
              <label
                htmlFor={`${titleId}-note`}
                className="
                  block
                  text-sm
                  font-medium
                  mb-2
                "
              >
                Message shown to reviewer
              </label>

              <textarea
                id={`${titleId}-note`}
                className="
                  admin-input
                  w-full
                  min-h-32
                  resize-y
                "
                value={note}
                disabled={loading}
                maxLength={2001}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Optional unless reason is Other."
              />

              <div
                className="
                  mt-1
                  flex
                  justify-between
                  gap-4
                  text-xs
                "
              >
                <span
                  className={
                    otherNoteTooShort ||
                    noteTooLong
                      ? "text-red-600"
                      : "admin-muted"
                  }
                >
                  {requiresOtherNote
                    ? "Other requires at least 10 characters."
                    : "This message is visible to the reviewer."}
                </span>

                <span
                  className={
                    noteTooLong
                      ? "text-red-600"
                      : "admin-muted"
                  }
                >
                  {note.length}/2000
                </span>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="
                rounded-lg
                border
                border-red-500/30
                bg-red-500/10
                p-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          <div
            className="
              flex
              flex-col-reverse
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              className="
                admin-btn
                admin-btn-secondary
                px-4
                py-2
                text-sm
              "
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                admin-btn
                px-4
                py-2
                text-sm
                disabled:opacity-60
                ${
                  action === "reject" ||
                  action === "hide"
                    ? "admin-btn-danger"
                    : "admin-btn-primary"
                }
              `}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
