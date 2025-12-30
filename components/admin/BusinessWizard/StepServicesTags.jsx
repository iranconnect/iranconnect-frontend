//components/admin/BusinessWizard/StepServicesTags.jsx
export default function StepServicesTags({ onNext, onBack }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Services & Tags
      </h3>

      <p className="opacity-70 mb-4">
        (Will be implemented next)
      </p>

      <div className="flex gap-2">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}

