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

function toPlainText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    if (!day) {
      return false;
    }

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
    return "Not specified";
  }

  if (Array.isArray(dayValue)) {
    return dayValue.length
      ? dayValue.join(" | ")
      : "Not specified";
  }

  if (typeof dayValue === "object") {
    if (dayValue.closed === true) {
      return "Closed";
    }

    if (dayValue.open && dayValue.close) {
      return `${dayValue.open} – ${dayValue.close}`;
    }
  }

  return "Not specified";
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

function TagList({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.slug || item.id || item.name}
          className="tag"
        >
          {item.name}
        </span>
      ))}
    </div>
  );
}

export default function BusinessServices({ biz }) {
  const subcategories = Array.isArray(biz.subcategories)
    ? biz.subcategories.filter((item) => item?.name)
    : [];

  const services = Array.isArray(biz.services)
    ? biz.services.filter((item) => item?.name)
    : [];

  const tags = Array.isArray(biz.tags)
    ? biz.tags.filter((item) => item?.name)
    : [];

  const serviceMode = formatServiceMode(
    biz.service_mode
  );

  const availabilityLabel = formatAvailabilityType(
    biz.availability_type
  );

  const hasHours = hasRealHoursData(
    biz.availability_hours
  );

  const availabilityNote = toPlainText(
    biz.availability_note
  );

  const serviceRadius = Number(
    biz.service_radius_km
  );

  const hasServiceRadius =
    Number.isFinite(serviceRadius) &&
    serviceRadius >= 1 &&
    ["at_home", "hybrid"].includes(
      biz.service_mode
    );

  const showHours =
    ["business_hours", "appointment_only"].includes(
      biz.availability_type
    ) && hasHours;

  const hasContent =
    subcategories.length > 0 ||
    services.length > 0 ||
    tags.length > 0 ||
    Boolean(serviceMode) ||
    Boolean(availabilityLabel) ||
    showHours ||
    Boolean(availabilityNote) ||
    hasServiceRadius;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-5">
        Services & Availability
      </h2>

      <div className="space-y-6 text-sm text-justify-pro">
        {subcategories.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              Specialties
            </h3>

            <TagList items={subcategories} />
          </div>
        )}

        {services.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              Services
            </h3>

            <TagList items={services} />
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              Additional details
            </h3>

            <TagList items={tags} />
          </div>
        )}

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

        {showHours && (
          <div>
            <h3 className="mb-3 font-semibold">
              {biz.availability_type === "appointment_only"
                ? "Suggested appointment hours"
                : "Opening hours"}
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

        {availabilityNote && (
          <div>
            <h3 className="mb-1 font-semibold">
              Additional availability information
            </h3>

            <p className="whitespace-pre-line">
              📝 {availabilityNote}
            </p>
          </div>
        )}

        {hasServiceRadius && (
          <div>
            <h3 className="mb-1 font-semibold">
              Service radius
            </h3>

            <p>
              📍 This business serves customers within{" "}
              {serviceRadius} km of its service base.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
