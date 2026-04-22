//frontend/components/business/Subcategories.jsx
export default function BusinessSubcategories({ subcategories }) {
  if (!subcategories?.length) return null;

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Specialties</h2>

      <div className="flex flex-wrap gap-2">
        {subcategories.map((sc) => (
          <span
            key={sc.id}
            className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800"
          >
            {sc.name}
          </span>
        ))}
      </div>
    </section>
  );
}
