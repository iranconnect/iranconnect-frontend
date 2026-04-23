//frontend/components/business/BusinessTags.jsx
export default function BusinessTags({ tags }) {
  if (!tags?.length) return null;

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-4">Features</h2>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id} className="tag">
            {t.name}
          </span>
        ))}
      </div>
    </section>
  );
}
