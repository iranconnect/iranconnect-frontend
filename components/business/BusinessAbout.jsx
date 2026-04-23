//frontend/components/business/BusinessAbout.jsx
export default function BusinessAbout({ biz }) {
  const hasContent =
    biz.short_description || biz.full_description;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">About</h2>

      {hasContent ? (
        <>
          {biz.short_description && (
            <p className="text-[var(--text)] opacity-80">
              {biz.short_description}
            </p>
          )}

          {biz.full_description && (
            <p className="text-gray-600 whitespace-pre-line">
              {biz.full_description}
            </p>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-sm">
          No description has been added for this business yet.
        </p>
      )}
    </div>
  );
}
