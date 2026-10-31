//frontend/components/business/BusinessInformation.jsx
function formatBusinessType(value) {
  const labels = {
    freelancer: "Freelancer / Self-Employed",
    company: "Company",
    partnership: "Partnership",
    association: "Association / Nonprofit",
    organization: "Organization / Institution",
    cooperative: "Cooperative",
    clinic: "Clinic",
    private_practice: "Private Practice",
    shop: "Shop / Retail Store",
    online_store: "Online Store",
    salon: "Salon / Beauty Center",
    studio: "Studio",
    workshop: "Workshop",
    restaurant_cafe: "Restaurant / Café",
    agency: "Agency",
    consultancy: "Consultancy",
    training_center: "Educational / Training Center",
    fitness_center: "Sports / Fitness Center",
    manufacturing: "Manufacturing Business",
    wholesale: "Wholesale Business",
    distribution: "Distribution Business",
    contracting: "Construction / Contracting Business",
    rental: "Rental Business",
    agriculture: "Agricultural / Farming Business",
    hospitality: "Hospitality / Accommodation Business",
    other: "Other Business",
    online: "Online Business",
  };

  return labels[value] || null;
}

export default function BusinessInformation({ biz }) {
  const businessType = formatBusinessType(
    biz.business_type
  );

  const yearEstablished = Number(
    biz.year_established
  );

  const hasValidYear =
    Number.isInteger(yearEstablished) &&
    yearEstablished >= 1000 &&
    yearEstablished <= new Date().getFullYear();

  const hasContent =
    Boolean(biz.legal_name) ||
    Boolean(businessType) ||
    hasValidYear;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">
        Business Information
      </h2>

      <dl className="space-y-3 text-sm">
        {biz.legal_name && (
          <div>
            <dt className="inline font-semibold">
              Legal business name:
            </dt>{" "}
            <dd className="inline">
              {biz.legal_name}
            </dd>
          </div>
        )}

        {businessType && (
          <div>
            <dt className="inline font-semibold">
              Business type:
            </dt>{" "}
            <dd className="inline">
              {businessType}
            </dd>
          </div>
        )}

        {hasValidYear && (
          <div>
            <dt className="inline font-semibold">
              Established:
            </dt>{" "}
            <dd className="inline">
              {yearEstablished}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
