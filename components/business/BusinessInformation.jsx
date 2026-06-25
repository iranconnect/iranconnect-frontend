//frontend/components/business/BusinessInformation.jsx
function formatBusinessType(value) {
  const labels = {
    freelancer: "Freelancer / Self-employed",
    company: "Registered Company",
    clinic: "Clinic / Office",
    shop: "Physical Shop",
    online: "Online Business",
  };

  return labels[value] || value || null;
}

export default function BusinessInformation({ biz }) {
  const hasContent =
    biz.legal_name ||
    biz.business_type ||
    biz.year_established;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">
        Business Information
      </h2>

      <div className="space-y-3 text-sm">
        {biz.legal_name && (
          <div>
            <span className="font-semibold">
              Legal business name:
            </span>{" "}
            <span>{biz.legal_name}</span>
          </div>
        )}

        {biz.business_type && (
          <div>
            <span className="font-semibold">
              Business type:
            </span>{" "}
            <span>
              {formatBusinessType(biz.business_type)}
            </span>
          </div>
        )}

        {biz.year_established && (
          <div>
            <span className="font-semibold">
              Established:
            </span>{" "}
            <span>{biz.year_established}</span>
          </div>
        )}
      </div>
    </section>
  );
}
