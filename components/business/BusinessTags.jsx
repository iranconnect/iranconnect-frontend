//frontend/components/business/BusinessTags.jsx
export default function BusinessTags({ tags }) {
  if (!tags?.length) return null;

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Features</h2>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="px-3 py-1 rounded-full text-sm bg-teal-50 text-teal-700"
          >
            {t.name}
          </span>
        ))}
      </div>
    </section>
  );
}
