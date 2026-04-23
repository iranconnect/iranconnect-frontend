//frontend/components/business/BusinessSubcategories.jsx
export default function BusinessSubcategories({ subcategories }) {
  if (!subcategories?.length) return null;

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-4">Specialties</h2>

      <div className="flex flex-wrap gap-2">
        {subcategories.map((sc) => (
          <span key={sc.id} className="tag">
            {sc.name}
          </span>
        ))}
      </div>
    </section>
  );
}
