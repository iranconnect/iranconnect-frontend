//components/admin/BusinessWizard/StepBasicInfo.jsx
export default function StepBasicInfo({ data, setData, onNext }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

      <input
        className="admin-input mb-3"
        placeholder="Business name"
        value={data.name}
        onChange={(e) =>
          setData((d) => ({ ...d, name: e.target.value }))
        }
      />

      <button
        className="btn-primary"
        onClick={onNext}
        disabled={!data.name}
      >
        Next
      </button>
    </div>
  );
}
