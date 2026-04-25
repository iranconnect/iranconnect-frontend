//frontend/components/business/BusinessServices.jsx
const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// 🔥 تشخیص روز جاری
function getTodayKey() {
  const todayIndex = new Date().getDay(); // 0=Sunday
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[todayIndex];
}

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

// 🔥 parse note
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

// 🔥 shared UI renderer
function DayRow({ dayKey, label, hours }) {
  const today = getTodayKey();
  const isToday = dayKey.toLowerCase() === today;

  return (
    <div className="grid grid-cols-[80px_1fr] items-start">
      <span
        className={`font-medium capitalize ${
          isToday ? "text-[#2aa7a1] font-semibold" : ""
        }`}
      >
        {label}
      </span>

      <span className="text-[var(--text)] opacity-80">
        {hours}
      </span>
    </div>
  );
}

function renderAvailability(biz) {
  // 1️⃣ Always open
  if (biz.availability_type === "always_open") {
    return <p className="text-sm">🟢 Open 24/7</p>;
  }

  // 2️⃣ Appointment only
  if (biz.availability_type === "appointment_only") {
    const days = Object.entries(biz.availability_hours || {}).sort(
      ([a], [b]) =>
        DAYS_ORDER.indexOf(a.toLowerCase()) -
        DAYS_ORDER.indexOf(b.toLowerCase())
    );

    return (
      <div className="space-y-2">
        <p className="text-sm">📅 By appointment only</p>

        <div>
          <p className="text-sm font-medium mb-2">🕒 Suggested hours</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {days.map(([day, hrs]) => (
              <DayRow
                key={day}
                dayKey={day}
                label={day.slice(0, 3)}
                hours={hrs.length > 0 ? hrs.join(" | ") : "Closed"}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3️⃣ Business hours
  if (
    biz.availability_type === "business_hours" &&
    biz.availability_hours
  ) {
    const days = Object.entries(biz.availability_hours).sort(
      ([a], [b]) =>
        DAYS_ORDER.indexOf(a.toLowerCase()) -
        DAYS_ORDER.indexOf(b.toLowerCase())
    );

    return (
      <div className="mt-2">
        <p className="text-sm font-medium mb-2">🕒 Opening hours</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {days.map(([day, hours]) => (
            <DayRow
              key={day}
              dayKey={day}
              label={day.slice(0, 3)}
              hours={
                !hours.closed
                  ? `${hours.open} - ${hours.close}`
                  : "Closed"
              }
            />
          ))}
        </div>
      </div>
    );
  }

  // 4️⃣ fallback note
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
  const serviceMode = formatServiceMode(biz.service_mode);
  const weeklyHoursRaw = formatAvailabilityNote(biz.availability_note);

  // 🔥 sort weeklyHours
  const weeklyHours = weeklyHoursRaw.sort(
    (a, b) =>
      DAYS_ORDER.indexOf(a.day.toLowerCase()) -
      DAYS_ORDER.indexOf(b.day.toLowerCase())
  );

  const hasData =
    serviceMode ||
    biz.availability_type ||
    biz.availability_note ||
    biz.availability_hours ||
    biz.service_radius_km;

  if (!hasData) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">
        Services & Availability
      </h2>

      <div className="space-y-3 text-[var(--text)] opacity-80">

        {serviceMode && <p className="text-sm">{serviceMode}</p>}

        {weeklyHours.length > 0 ? (
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">🕒 Opening hours</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {weeklyHours.map((item) => (
                <DayRow
                  key={item.day}
                  dayKey={item.day}
                  label={item.day.slice(0, 3)}
                  hours={item.hours || "Closed"}
                />
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
