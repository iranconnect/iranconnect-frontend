//frontend/components/business/BusinessServicesList.jsx
export default function BusinessServicesList({ services }) {
  if (!services?.length) return null;

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Services</h2>

      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <span
            key={s.id}
            className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
          >
            {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}
