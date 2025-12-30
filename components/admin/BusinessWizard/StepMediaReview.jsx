//components/admin/BusinessWizard/StepMediaReview.jsx
export default function StepMediaReview({
  onBack,
  onSubmit,
  loading,
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Review & Submit
      </h3>

      <p className="opacity-70 mb-4">
        (Final review will be shown here)
      </p>

      <div className="flex gap-2">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Create Business"}
        </button>
      </div>
    </div>
  );
}
