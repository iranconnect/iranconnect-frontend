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

function renderAvailability(biz) {
  // 1️⃣ Always open
  if (biz.availability_type === "always_open") {
    return <p className="text-sm">🟢 Open 24/7</p>;
  }

  // 2️⃣ Appointment only
  if (type === "appointment_only") {
    return (
      <div className="space-y-2">
        <p className="text-sm">📅 By appointment only</p>
  
        {biz.availability_hours &&
          typeof biz.availability_hours === "object" && (
            <div>
              <p className="text-sm font-medium mb-1">
                🕒 Suggested hours
              </p>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
                {Object.entries(biz.availability_hours).map(
                  ([day, hrs]) => (
                    <div
                      key={day}
                      className="flex justify-between"
                    >
                      <span className="font-medium capitalize">
                        {day.slice(0, 3)}
                      </span>
                      <span className="text-gray-600">
                        {hrs.length > 0
                          ? hrs.join(" | ")
                          : "Closed"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    );
  }

  // 3️⃣ Business hours (structured)
  if (
    biz.availability_type === "business_hours" &&
    biz.availability_hours &&
    typeof biz.availability_hours === "object"
  ) {
    const days = Object.entries(biz.availability_hours);

    return (
      <div className="mt-2">
        <p className="text-sm font-medium mb-2">🕒 Opening hours</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
          {days.map(([day, hours]) => (
            <div key={day} className="flex justify-between">
              <span className="font-medium capitalize">
                {day.slice(0, 3)}
              </span>
              <span className="text-gray-600">
                {Array.isArray(hours) && hours.length > 0
                  ? hours.join(" | ")
                  : "Closed"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4️⃣ fallback → note
  if (biz.availability_note) {
    return (
      <p className="text-sm whitespace-pre-line">
        📝 {biz.availability_note}
      </p>
    );
  }

  return null;
}
export default function BusinessServices({ biz }) {
  const type = biz.availability_type;
  const hours = biz.availability_hours;
  const serviceMode = formatServiceMode(biz.service_mode);
  const weeklyHours = formatAvailabilityNote(biz.availability_note);

  const hasData =
    serviceMode ||
    biz.availability_type ||
    biz.availability_note ||
    biz.availability_hours ||
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
          renderAvailability(biz)
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
