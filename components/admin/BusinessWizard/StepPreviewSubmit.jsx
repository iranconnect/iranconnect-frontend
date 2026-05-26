// components/admin/BusinessWizard/StepPreviewSubmit.jsx

const BUSINESS_TYPE_LABELS = {
  freelancer: "Freelancer / Self-employed",
  company: "Registered Company",
  clinic: "Clinic / Office",
  shop: "Physical Shop",
  online: "Online Business",
};

const SERVICE_MODE_LABELS = {
  on_site: "On-site (customers visit)",
  at_home: "At customer location",
  remote: "Remote / Online",
  hybrid: "Hybrid",
};

const AVAILABILITY_LABELS = {
  always_open: "Always open",
  business_hours: "Business hours",
  appointment_only: "Appointment only",
};

function formatBusinessHours(hours) {
  if (!hours || typeof hours !== "object") {
    return null;
  }

  const WEEK_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return WEEK_DAYS.map((day) => {
    const value = hours[day];

    if (!value) return null;

    const label =
      day.charAt(0).toUpperCase() + day.slice(1);

    if (value.closed) {
      return `${label}: Closed`;
    }

    return `${label}: ${value.open} - ${value.close}`;
  })
    .filter(Boolean)
    .join("\n");
}

export default function StepPreviewSubmit({
  data,
  onBack,
  onSubmit,
  loading,
  mode,
}) {
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Review & Confirm Business
      </h2>
      <p className="admin-muted mb-6">
        Step 5 of 5 — Preview before submission
      </p>

      {/* ─────────────────────────
         BASIC BUSINESS INFORMATION
      ───────────────────────── */}
      <Section title="Basic Business Information">
      
        <Item
          label="Business name"
          value={data.name}
        />
      
        <Item
          label="Business category"
          value={data.category_name}
        />
      
        <Item
          label="Subcategories"
          value={
            Array.isArray(data.subcategory_names)
              ? data.subcategory_names.join(", ")
              : null
          }
          multiline
        />
      
        <Item
          label="Legal name"
          value={data.legal_name}
        />
      
        <Item
          label="Business type"
          value={
            BUSINESS_TYPE_LABELS[data.business_type] ||
            data.business_type
          }
        />
      
        <Item
          label="Year established"
          value={data.year_established}
        />
      
        <Item
          label="Short description"
          value={data.short_description}
          multiline
        />
      
        <Item
          label="Full description"
          value={data.full_description}
          multiline
        />
      
      </Section>


      {/* ─────────────────────────
         SERVICES & TAGS
      ───────────────────────── */}
      <Section title="Services & Tags">
      
        <Item
          label="Services offered"
          value={
            Array.isArray(data.service_names)
              ? data.service_names.join(", ")
              : null
          }
          multiline
        />
      
        <Item
          label="Tags"
          value={
            Array.isArray(data.tag_names)
              ? data.tag_names.join(", ")
              : null
          }
          multiline
        />
      
      </Section>
      {/* ─────────────────────────
         LOCATION, AVAILABILITY & CONTACT
      ───────────────────────── */}
      <Section title="Location, Availability & Contact">
      
        {/* Service mode */}
        <Item
          label="Service mode"
          value={
            SERVICE_MODE_LABELS[data.service_mode] ||
            data.service_mode
          }
        />
      
        {/* Availability type */}
        <Item
          label="Availability type"
          value={
            AVAILABILITY_LABELS[data.availability_type] ||
            data.availability_type
          }
        />
      
        {/* Availability note */}
        <Item
          label="Availability note"
          value={data.availability_note}
          multiline
        />
      
        {/* Business hours */}
        <Item
          label="Business hours"
          value={formatBusinessHours(data.availability_hours)}
          multiline
        />
      
        {/* Business location */}
        <Item
          label="Business location (Google Maps link)"
          value={data.location_map_url}
        />
      
        {/* Base location */}
        <Item
          label="Service base location (Google Maps link)"
          value={data.base_location_map_url}
        />
      
        {/* Address */}
        <Item
          label="Address"
          value={data.address}
          multiline
        />
      
        {/* Country */}
        <Item
          label="Country"
          value={data.country}
        />
      
        {/* City */}
        <Item
          label="City"
          value={data.city}
        />
      
        {/* Postal code */}
        <Item
          label="Postal code"
          value={data.postal_code}
        />
      
        {/* Service radius */}
        <Item
          label="Service radius (km)"
          value={data.service_radius_km}
        />
      
        {/* Phone */}
        <Item
          label="Phone"
          value={data.phone}
        />
      
        {/* Email */}
        <Item
          label="Email"
          value={data.email}
        />
      
        {/* Website */}
        <Item
          label="Website"
          value={data.website}
        />
      
        {/* Show phone */}
        <Item
          label="Show phone number"
          value={
            data.show_phone === true
              ? "Yes"
              : data.show_phone === false
                ? "No"
                : null
          }
        />
      
        {/* Show email */}
        <Item
          label="Show email"
          value={
            data.show_email === true
              ? "Yes"
              : data.show_email === false
                ? "No"
                : null
          }
        />
      
        {/* Instagram */}
        <Item
          label="Instagram"
          value={data.instagram_url}
        />
      
        {/* Facebook */}
        <Item
          label="Facebook"
          value={data.facebook_url}
        />
      
        {/* LinkedIn */}
        <Item
          label="LinkedIn"
          value={data.linkedin_url}
        />
      
        {/* Twitter / X */}
        <Item
          label="Twitter / X"
          value={data.twitter_url}
        />
      
        {/* Telegram */}
        <Item
          label="Telegram"
          value={data.telegram_url}
        />
      
        {/* WhatsApp */}
        <Item
          label="WhatsApp"
          value={data.whatsapp_number}
        />
      
      </Section>
      {/* ─────────────────────────
         MEDIA
      ───────────────────────── */}
      <Section title="Media Preview">
        {data.logo_file && (
          <div>
            <strong>Logo:</strong>
            <img
              src={URL.createObjectURL(data.logo_file)}
              alt="Logo preview"
              style={{ width: 80, borderRadius: 8, marginTop: 6 }}
            />
          </div>
        )}
      
        {data.cover_file && (
          <div style={{ marginTop: 12 }}>
            <strong>Cover image:</strong>
            <img
              src={URL.createObjectURL(data.cover_file)}
              alt="Cover preview"
              style={{ width: "100%", maxWidth: 300, borderRadius: 8, marginTop: 6 }}
            />
          </div>
        )}
      
        {Array.isArray(data.gallery_files) && data.gallery_files.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Gallery:</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {data.gallery_files.map((file, idx) => (
                <img
                  key={idx}
                  src={URL.createObjectURL(file)}
                  alt={`Gallery ${idx + 1}`}
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                />
              ))}
            </div>
          </div>
        )}
      </Section>


      {/* ─────────────────────────
         ACTIONS
      ───────────────────────── */}
      <div className="flex justify-between mt-8">
        <button
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className="admin-btn admin-btn-primary"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading
            ? mode === "user-update"
              ? "Submitting update request…"
              : "Creating business…"
            : mode === "user-update"
              ? "Submit Update Request"
              : "Submit & Create Business"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────
   Helper Components
───────────────────────── */
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function Item({ label, value, multiline }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="text-sm">
      <strong>{label}:</strong>{" "}
      {multiline ? <div>{value}</div> : value}
    </div>
  );
}

