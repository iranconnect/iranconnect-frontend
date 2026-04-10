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

function formatAvailabilityNote(note) {
  if (!note) return [];

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const result = [];

  days.forEach((day) => {
    const regex = new RegExp(`\\d*\\s*${day}:(.*?)(?=${days.join("|")}|$)`, "i");
    const match = note.match(regex);

    if (match) {
      result.push({
        day,
        hours: match[1].trim(),
      });
    }
  });

  return result;
}

export default function BusinessServices({ biz }) {
  const serviceMode = formatServiceMode(biz.service_mode);
  const availability = formatAvailability(
    biz.availability_type,
    biz.availability_note
  );
  const weeklyHours = formatAvailabilityNote(biz.availability_note);

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

        {weeklyHours.length > 0 ? (
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">🕒 Opening hours</p>
        
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm text-gray-700">
              {weeklyHours.map((item) => (
                <div key={item.day} className="flex justify-between">
                  <span className="font-medium">
                    {item.day.slice(0, 3)}
                  </span>
                  <span className="text-gray-600">
                    {item.hours || "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          availability && (
            <p className="text-sm">🕒 {availability}</p>
          )
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
