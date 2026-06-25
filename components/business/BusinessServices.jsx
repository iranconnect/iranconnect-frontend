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

const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function getTodayKey() {
  const todayIndex = new Date().getDay();

  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][todayIndex];
}

function formatServiceMode(mode) {
  const labels = {
    on_site: {
      icon: "🏢",
      label: "On-site services",
      description: "Customers visit this business location.",
    },
    at_home: {
      icon: "🚗",
      label: "At customer location",
      description: "Services are provided at the customer’s location.",
    },
    remote: {
      icon: "💻",
      label: "Remote / online services",
      description: "Services are provided remotely or online.",
    },
    hybrid: {
      icon: "🔄",
      label: "Hybrid services",
      description:
        "Services are available both remotely and in person.",
    },
  };

  return labels[mode] || null;
}

function formatAvailabilityType(type) {
  const labels = {
    always_open: "Open 24/7",
    business_hours: "Business hours",
    appointment_only: "By appointment only",
  };

  return labels[type] || null;
}

function hasRealHoursData(hours) {
  if (!hours || typeof hours !== "object") {
    return false;
  }

  return Object.values(hours).some((day) => {
    if (!day) return false;

    if (Array.isArray(day)) {
      return day.length > 0;
    }

    if (typeof day === "object") {
      return (
        day.closed === true ||
        Boolean(day.open) ||
        Boolean(day.close)
      );
    }

    return false;
  });
}

function formatDayHours(dayValue) {
  if (!dayValue) {
    return "—";
  }

  if (Array.isArray(dayValue)) {
    return dayValue.length
      ? dayValue.join(" | ")
      : "—";
  }

  if (typeof dayValue === "object") {
    if (dayValue.closed) {
      return "Closed";
    }

    if (dayValue.open && dayValue.close) {
      return `${dayValue.open} – ${dayValue.close}`;
    }
  }

  return "—";
}

function DayRow({ dayKey, value }) {
  const isToday = getTodayKey() === dayKey;

  return (
    <div className="grid grid-cols-[70px_1fr] items-start gap-2">
      <span
        className={`font-medium ${
          isToday
            ? "text-turquoise font-semibold"
            : ""
        }`}
      >
        {DAY_LABELS[dayKey]}
      </span>

      <span className="text-sm text-justify-pro">
        {value}
      </span>
    </div>
  );
}

export default function BusinessServices({ biz }) {
  const serviceMode = formatServiceMode(
    biz.service_mode
  );

  const availabilityLabel = formatAvailabilityType(
    biz.availability_type
  );

  const hasHours = hasRealHoursData(
    biz.availability_hours
  );

  const hasContent =
    serviceMode ||
    availabilityLabel ||
    hasHours ||
    biz.availability_note ||
    biz.service_radius_km;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">
        Services & Availability
      </h2>

      <div className="space-y-5 text-sm text-justify-pro">
        {serviceMode && (
          <div>
            <h3 className="mb-1 font-semibold">
              Service mode
            </h3>

            <p>
              {serviceMode.icon} {serviceMode.label}
            </p>

            <p className="mt-1 opacity-75">
              {serviceMode.description}
            </p>
          </div>
        )}

        {availabilityLabel && (
          <div>
            <h3 className="mb-1 font-semibold">
              Availability
            </h3>

            <p>
              {biz.availability_type === "always_open"
                ? "🟢"
                : biz.availability_type ===
                    "appointment_only"
                  ? "📅"
                  : "🕒"}{" "}
              {availabilityLabel}
            </p>
          </div>
        )}

        {biz.availability_type === "business_hours" &&
          hasHours && (
            <div>
              <h3 className="mb-3 font-semibold">
                Opening hours
              </h3>

              <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {DAYS_ORDER.map((dayKey) => (
                  <DayRow
                    key={dayKey}
                    dayKey={dayKey}
                    value={formatDayHours(
                      biz.availability_hours?.[dayKey]
                    )}
                  />
                ))}
              </div>
            </div>
          )}

        {biz.availability_type === "appointment_only" &&
          hasHours && (
            <div>
              <h3 className="mb-3 font-semibold">
                Suggested appointment hours
              </h3>

              <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {DAYS_ORDER.map((dayKey) => (
                  <DayRow
                    key={dayKey}
                    dayKey={dayKey}
                    value={formatDayHours(
                      biz.availability_hours?.[dayKey]
                    )}
                  />
                ))}
              </div>
            </div>
          )}

        {biz.availability_note && (
          <div>
            <h3 className="mb-1 font-semibold">
              Additional availability information
            </h3>

            <p className="whitespace-pre-line">
              📝 {biz.availability_note}
            </p>
          </div>
        )}

        {biz.service_radius_km && (
          <div>
            <h3 className="mb-1 font-semibold">
              Service radius
            </h3>

            <p>
              📍 This business serves customers within{" "}
              {biz.service_radius_km} km of its service base.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
