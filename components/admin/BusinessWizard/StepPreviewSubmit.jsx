// components/admin/BusinessWizard/StepPreviewSubmit.jsx

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
        <Item label="Full description" value={data.full_description} multiline />
      </Section>

      {/* ─────────────────────────
         SERVICES & TAGS
      ───────────────────────── */}
      <Section title="Services & Tags">
        <Item
          label="Subcategories"
          value={(data.subcategory_ids || []).length + " selected"}
        />

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
        <Item
          label="Business location (Google Maps)"
          value={data.location_map_url}
        />
        
        <Item
          label="Base location (Google Maps)"
          value={data.base_location_map_url}
        />

        <Item label="Address" value={data.address} />
        <Item label="City" value={data.city} />
        <Item label="Country" value={data.country} />
        <Item label="Service radius (km)" value={data.service_radius_km} />
        <Item label="Availability type" value={data.availability_type} />
        <Item label="Availability note" value={data.availability_note} />
        <Item
          label="Availability hours"
          value={
            data.availability_hours
              ? JSON.stringify(data.availability_hours)
              : null
          }
          multiline
        />

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
        <Item label="Instagram" value={data.instagram_url} />
        <Item label="Facebook" value={data.facebook_url} />
        <Item label="LinkedIn" value={data.linkedin_url} />
        <Item label="Twitter / X" value={data.twitter_url} />
        <Item label="Telegram" value={data.telegram_url} />
        <Item label="WhatsApp" value={data.whatsapp_number} />
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

