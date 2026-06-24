//components/admin/DuplicateModal.jsx
import Link from "next/link";

export default function DuplicateModal({
  data,
  onCancel,
  onForce,
  mode = "admin-create",
}) {
  const matches = Array.isArray(data?.matches)
    ? data.matches
    : [];

  const forceLabel =
    mode === "admin-edit"
      ? "Update anyway"
      : "Create anyway";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className="
          w-full max-w-lg rounded-2xl border border-[var(--border)]
          bg-[var(--card-bg)] p-6 text-[var(--text)]
          shadow-[0_20px_60px_rgba(0,0,0,0.35)]
        "
      >
        <h3 className="mb-2 text-lg font-semibold">
          Possible duplicate business
        </h3>

        <p className="mb-5 text-sm opacity-75">
          A business with similar details already exists. Review it before
          continuing.
        </p>

        <div className="space-y-3">
          {matches.map((business) => (
            <div
              key={business.id}
              className="
                rounded-xl border border-[var(--border)]
                bg-[var(--bg)] p-3
              "
            >
              <p className="font-semibold">
                {business.name || "Unnamed business"}
                {business.city ? ` — ${business.city}` : ""}
              </p>

              {business.slug ? (
                <Link
                  href={`/business/${encodeURIComponent(business.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-turquoise hover:underline"
                >
                  Open existing profile
                </Link>
              ) : (
                <p className="mt-2 text-sm text-red-500">
                  Existing profile link is unavailable.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-lg border border-[var(--border)]
              bg-[var(--bg)] px-4 py-2 text-sm font-medium
              text-[var(--text)] transition hover:opacity-80
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onForce}
            className="
              rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold
              text-white transition hover:bg-red-700
            "
          >
            {forceLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
