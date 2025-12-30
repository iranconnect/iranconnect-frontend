//components/admin/DuplicateModal.jsx
export default function DuplicateModal({ data, onCancel, onForce }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-3">
          Possible duplicate business
        </h3>

        {data.matches.map((b) => (
          <div key={b.id} className="border p-2 rounded mb-2">
            <strong>{b.name}</strong> — {b.city}
            <a
              href={`/admin/businesses/edit/${b.id}`}
              className="text-turquoise block"
            >
              Open existing
            </a>
          </div>
        ))}

        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onForce} className="btn-danger">
            Create anyway
          </button>
        </div>
      </div>
    </div>
  );
}
