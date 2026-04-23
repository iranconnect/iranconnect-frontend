//frontend/components/business/BusinessServicesList.jsx
export default function BusinessServicesList({ services }) {
  if (!services?.length) return null;

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-4">Services</h2>

      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <span className="tag">
        ))}
      </div>
    </section>
  );
}
