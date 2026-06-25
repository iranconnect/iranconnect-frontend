//frontend/components/business/BusinessAbout.jsx
export default function BusinessAbout({ biz }) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">
        About
      </h2>

      {biz.full_description ? (
        <p className="text-sm text-justify-pro">
          {biz.full_description}
        </p>
      ) : (
        <p className="text-sm text-justify-pro">
          No detailed description has been added for this business yet.
        </p>
      )}
    </div>
  );
}
