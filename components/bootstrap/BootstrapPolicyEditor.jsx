import DOMPurify from "isomorphic-dompurify";

import AdminRichTextEditor from "../admin/AdminRichTextEditor";

const TYPE_LABELS = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
};

const LANGUAGE_LABELS = {
  en: "English",
  fr: "Français",
  fa: "فارسی",
};

export default function BootstrapPolicyEditor({
  type,
  lang,
  value,
  changeNote,
  published = false,
  publishing = false,
  onContentChange,
  onChangeNoteChange,
  onPublish,
}) {
  const isPersian =
    lang === "fa";

  const safePreview =
    DOMPurify.sanitize(
      value || "",
      {
        USE_PROFILES: {
          html: true,
        },
      }
    );

  return (
    <section
      className="
        rounded-2xl
        border
        p-5
        md:p-6
      "
      style={{
        borderColor: "var(--border)",
        background: "var(--card-bg)",
        boxShadow:
          "5px 5px 14px var(--shadow-dark), -5px -5px 14px var(--shadow-light)",
      }}
    >
      <div
        className="
          mb-5
          flex
          flex-wrap
          items-start
          justify-between
          gap-3
        "
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-60">
            Required legal policy
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            {TYPE_LABELS[type]}
          </h2>

          <p className="mt-1 text-sm opacity-70">
            {LANGUAGE_LABELS[lang]}
          </p>
        </div>

        <span
          className="
            rounded-full
            border
            px-3
            py-1
            text-xs
            font-semibold
          "
          style={{
            borderColor:
              published
                ? "var(--turquoise)"
                : "var(--border)",

            background:
              published
                ? "var(--turquoise)"
                : "var(--bg)",

            color:
              published
                ? "var(--navy)"
                : "var(--text)",
          }}
        >
          {published
            ? "✓ Published"
            : "Missing"}
        </span>
      </div>

      {published ? (
        <div
          className="
            rounded-xl
            border
            p-4
            text-sm
          "
          style={{
            borderColor:
              "var(--turquoise)",
            background:
              "var(--bg)",
          }}
        >
          This initial policy has already been
          published and is locked during Bootstrap.
          Revisions are available from the
          SuperAdmin policy manager after setup is
          complete.
        </div>
      ) : (
        <>
          <div
            className="
              grid
              grid-cols-1
              gap-6
              xl:grid-cols-2
            "
          >
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Policy editor
              </h3>

              <div
                dir={
                  isPersian
                    ? "rtl"
                    : "ltr"
                }
              >
                <AdminRichTextEditor
                  value={value}
                  onChange={
                    onContentChange
                  }
                  placeholder={`Write ${TYPE_LABELS[type]} in ${LANGUAGE_LABELS[lang]}...`}
                  minHeight={320}
                  enableImages={false}
                />
              </div>

              <p className="mt-2 text-xs opacity-60">
                Minimum 10 characters. Maximum
                500,000 characters.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Live preview
              </h3>

              <div
                className="
                  min-h-[320px]
                  overflow-auto
                  rounded-xl
                  border
                  p-4
                  prose
                  prose-sm
                  max-w-none
                "
                dir={
                  isPersian
                    ? "rtl"
                    : "ltr"
                }
                style={{
                  borderColor:
                    "var(--border)",
                  background:
                    "var(--bg)",
                  color:
                    "var(--text)",
                }}
                dangerouslySetInnerHTML={{
                  __html: safePreview,
                }}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Change note
            </label>

            <textarea
              value={changeNote}
              onChange={(event) =>
                onChangeNoteChange(
                  event.target.value
                )
              }
              rows={3}
              maxLength={1000}
              placeholder="Describe this initial policy publication."
              className="
                w-full
                rounded-xl
                border
                p-3
                focus:outline-none
                focus:ring-2
                focus:ring-turquoise
              "
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--bg)",
                color:
                  "var(--text)",
              }}
            />

            <div
              className="
                mt-1
                flex
                justify-between
                gap-3
                text-xs
                opacity-60
              "
            >
              <span>
                Required for the audit trail.
              </span>

              <span>
                {changeNote.length}/1000
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="
                rounded-lg
                bg-turquoise
                px-5
                py-2.5
                font-semibold
                text-navy
                shadow-md
                transition
                hover:bg-turquoise/90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {publishing
                ? "Publishing..."
                : "Publish this policy"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
