// components/admin/BusinessWizard/StepPreviewSubmit.jsx

export default function StepPreviewSubmit({
  data,
  onBack,
  onSubmit,
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
         BASIC INFO
      ───────────────────────── */}
      <Section title="Business Information">
        <Item label="Name" value={data.name} />
        <Item label="Legal name" value={data.legal_name} />
        <Item label="Business type" value={data.business_type} />
        <Item label="Year established" value={data.year_established} />
      </Section>

      {/* ─────────────────────────
         DESCRIPTIONS
      ───────────────────────── */}
      <Section title="Descriptions">
        <Item label="Short description" value={data.short_description} />
        <Item label="Full description" value={data.description} multiline />
      </Section>

      {/* ─────────────────────────
         SERVICES & TAGS
      ───────────────────────── */}
      <Section title="Services & Tags">
        <Item
          label="Services"
          value={(data.services || []).length + " selected"}
        />
        <Item
          label="Tags"
          value={(data.tags || []).length + " selected"}
        />
      </Section>

      {/* ─────────────────────────
         LOCATION
      ───────────────────────── */}
      <Section title="Location & Availability">
        <Item label="Service mode" value={data.service_mode} />
        <Item label="Address" value={data.address} />
        <Item label="City" value={data.city} />
        <Item label="Country" value={data.country} />
        <Item label="Service radius (km)" value={data.service_radius_km} />
      </Section>

      {/* ─────────────────────────
         CONTACT
      ───────────────────────── */}
      <Section title="Contact & Visibility">
        <Item label="Phone" value={data.phone} />
        <Item label="Email" value={data.email} />
        <Item label="Website" value={data.website} />
        <Item label="Public profile" value={data.is_public ? "Yes" : "No"} />
        <Item label="Allow reviews" value={data.allow_reviews ? "Yes" : "No"} />
      </Section>

      {/* ─────────────────────────
         MEDIA
      ───────────────────────── */}
      <Section title="Media Preview">
        {data.logo_file && (
          <img
            src={URL.createObjectURL(data.logo_file)}
            alt="Logo preview"
            style={{ width: 80, borderRadius: 8 }}
          />
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
        >
          Submit & Create Business
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
  if (!value) return null;

  return (
    <div className="text-sm">
      <strong>{label}:</strong>{" "}
      {multiline ? <div>{value}</div> : value}
    </div>
  );
}
