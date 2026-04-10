//frontend/components/business/BusinessServices.jsx
function formatServiceMode(mode) {
  switch (mode) {
    case "on_site":
      return "🏢 On-site services";
    case "at_home":
      return "🚗 At customer location";
    case "remote":
      return "💻 Online services";
    case "hybrid":
      return "🔄 Mixed (On-site & Remote)";
    default:
      return null;
  }
}

function formatAvailability(type, note) {
  if (note) return note;

  if (type === "business_hours") return "Business hours available";
  if (type === "24_7") return "Open 24/7";

  return null;
}

export default function BusinessServices({ biz }) {
  const serviceMode = formatServiceMode(biz.service_mode);
  const availability = formatAvailability(
    biz.availability_type,
    biz.availability_note
  );

  const hasData =
    serviceMode ||
    availability ||
    biz.service_radius_km;

  if (!hasData) return null;

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Services & Availability
      </h2>

      <div className="space-y-3 text-gray-700">

        {serviceMode && (
          <p className="text-sm">{serviceMode}</p>
        )}

        {availability && (
          <p className="text-sm">🕒 {availability}</p>
        )}

        {biz.service_radius_km && (
          <p className="text-sm">
            📍 Service radius: {biz.service_radius_km} km
          </p>
        )}
      </div>
    </div>
  );
}
