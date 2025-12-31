//components/admin/BusinessWizard/StepLocationContact.jsx
export default function StepLocationContact({ data, setData, onNext, onBack }) {
  function setField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const canProceed = data.service_mode;

  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 3 of 4 — Location, Availability & Contact
      </p>

      {/* Service mode */}
      <div className="mb-6">
        <label className="admin-label">
          Service mode *
        </label>
        <select
          className="admin-input"
          value={data.service_mode || ""}
          onChange={(e) => setField("service_mode", e.target.value)}
          required
        >
          <option value="">Select service mode</option>
          <option value="on_site">On-site (customers visit)</option>
          <option value="at_home">At customer location</option>
          <option value="remote">Remote / Online</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <label className="admin-label">
          Availability type
        </label>
        <select
          className="admin-input"
          value={data.availability_type || ""}
          onChange={(e) => setField("availability_type", e.target.value)}
        >
          <option value="">Select availability</option>
          <option value="always_open">Always open</option>
          <option value="business_hours">Business hours</option>
          <option value="appointment_only">Appointment only</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="admin-label">
          Availability note
        </label>
        <textarea
          className="admin-input"
          rows={2}
          value={data.availability_note || ""}
          onChange={(e) => setField("availability_note", e.target.value)}
          placeholder="e.g. Available weekends, emergency calls accepted"
        />
      </div>

      {/* Service radius */}
      {(data.service_mode === "at_home" ||
        data.service_mode === "hybrid") && (
        <div className="mb-6">
          <label className="admin-label">
            Service radius (km)
          </label>
          <input
            type="number"
            className="admin-input"
            value={data.service_radius_km || ""}
            onChange={(e) =>
              setField("service_radius_km", e.target.value)
            }
          />
        </div>
      )}

      {/* Contact visibility */}
      <div className="mb-6 flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.show_phone ?? true}
            onChange={(e) =>
              setField("show_phone", e.target.checked)
            }
          />
          Show phone number
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.show_email ?? true}
            onChange={(e) =>
              setField("show_email", e.target.checked)
            }
          />
          Show email
        </label>
      </div>

      {/* Social links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          className="admin-input"
          placeholder="Instagram URL"
          value={data.instagram_url || ""}
          onChange={(e) =>
            setField("instagram_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="LinkedIn URL"
          value={data.linkedin_url || ""}
          onChange={(e) =>
            setField("linkedin_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="Twitter / X URL"
          value={data.twitter_url || ""}
          onChange={(e) =>
            setField("twitter_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="Telegram"
          value={data.telegram_url || ""}
          onChange={(e) =>
            setField("telegram_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="WhatsApp number"
          value={data.whatsapp_number || ""}
          onChange={(e) =>
            setField("whatsapp_number", e.target.value)
          }
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="admin-btn admin-btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}
