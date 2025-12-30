//components/admin/BusinessWizard/StepLocationContact.jsx
export default function StepLocationContact({ onNext, onBack }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Location & Contact
      </h3>

      <p className="opacity-70 mb-4">
        (Google Maps & contact fields will be added)
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

