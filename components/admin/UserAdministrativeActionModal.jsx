// frontend/components/admin/UserAdministrativeActionModal.jsx

import {
  useEffect,
  useId,
  useState,
} from "react";

const ADMIN_NOTE_MIN_LENGTH = 10;
const ADMIN_NOTE_MAX_LENGTH = 1000;

export default function UserAdministrativeActionModal({
  open,
  title,
  actionLabel,
  targetLabel,
  description = "",
  contextItems = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  children = null,
  onClose,
  onConfirm,
}) {
  const titleId = useId();
  const noteId = useId();

  const [adminNote, setAdminNote] =
    useState("");

  const normalizedNote =
    adminNote.trim();

  const noteTooShort =
    normalizedNote.length > 0 &&
    normalizedNote.length <
      ADMIN_NOTE_MIN_LENGTH;

  const noteTooLong =
    normalizedNote.length >
    ADMIN_NOTE_MAX_LENGTH;

  const noteValid =
    normalizedNote.length >=
      ADMIN_NOTE_MIN_LENGTH &&
    normalizedNote.length <=
      ADMIN_NOTE_MAX_LENGTH;

  useEffect(() => {
    if (!open) {
      setAdminNote("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, loading, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      loading ||
      !noteValid ||
      typeof onConfirm !== "function"
    ) {
      return;
    }

    await onConfirm(normalizedNote);
  };

  return (
    <div
      className="
        fixed inset-0 z-[60]
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        p-4
      "
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div
        className="
          admin-card
          max-w-lg w-full
          relative
          max-h-[90vh]
          overflow-y-auto
          p-6
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={() => onClose?.()}
          disabled={loading}
          className="
            absolute top-3 right-4
            text-turquoise
            text-lg font-bold
            disabled:opacity-50
          "
          aria-label="Close"
        >
          ✖
        </button>

        <h3
          id={titleId}
          className="
            text-lg font-semibold
            text-turquoise
            pr-8
          "
        >
          {title}
        </h3>

        {actionLabel && (
          <p className="mt-3 text-sm">
            <strong>Action:</strong>{" "}
            {actionLabel}
          </p>
        )}

        {targetLabel && (
          <p className="mt-1 text-sm break-all">
            <strong>Target:</strong>{" "}
            {targetLabel}
          </p>
        )}

        {description && (
          <p className="mt-3 text-sm opacity-80">
            {description}
          </p>
        )}

        {contextItems.length > 0 && (
          <div
            className="
              mt-4 rounded-lg border
              border-white/10 p-3
              space-y-2 text-sm
            "
          >
            {contextItems.map(
              (item, index) => (
                <div
                  key={
                    item?.key ||
                    `${item?.label || "context"}-${index}`
                  }
                  className="
                    flex flex-col
                    sm:flex-row
                    sm:gap-2
                  "
                >
                  <span className="font-semibold">
                    {item?.label}:
                  </span>

                  <span className="break-all opacity-90">
                    {item?.value ?? "—"}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          {children}

          <div>
            <label
              htmlFor={noteId}
              className="
                block text-sm
                font-semibold mb-2
              "
            >
              Admin note *
            </label>

            <textarea
              id={noteId}
              rows={5}
              value={adminNote}
              onChange={(event) =>
                setAdminNote(
                  event.target.value
                )
              }
              maxLength={
                ADMIN_NOTE_MAX_LENGTH + 1
              }
              disabled={loading}
              className="
                admin-input w-full
                resize-y
              "
              placeholder="Explain why this administrative action is being taken."
              required
            />

            <div
              className="
                mt-1 flex
                justify-between gap-3
                text-xs
              "
            >
              <span>
                {!normalizedNote
                  ? `Required — minimum ${ADMIN_NOTE_MIN_LENGTH} characters.`
                  : noteTooShort
                    ? `Enter at least ${ADMIN_NOTE_MIN_LENGTH} characters after trimming.`
                    : noteTooLong
                      ? `Maximum ${ADMIN_NOTE_MAX_LENGTH} characters allowed.`
                      : "Administrative note is valid."}
              </span>

              <span
                className={
                  noteTooLong
                    ? "text-red-500"
                    : ""
                }
              >
                {normalizedNote.length}
                {" / "}
                {ADMIN_NOTE_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div
            className="
              flex flex-wrap
              justify-end gap-3
            "
          >
            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={loading}
              className="
                admin-btn
                admin-btn-secondary
                disabled:opacity-60
              "
            >
              {cancelLabel}
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !noteValid
              }
              className={`
                admin-btn
                ${
                  danger
                    ? "admin-btn-danger"
                    : "admin-btn-primary"
                }
                disabled:opacity-60
              `}
            >
              {loading
                ? "Processing..."
                : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
