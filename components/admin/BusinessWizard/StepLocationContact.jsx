//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

/* ======================================================
   Dark-mode friendly react-select styles (Enterprise)
====================================================== */
const countrySelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--bg)",
    borderColor: "var(--border)",
    color: "var(--text)",
    minHeight: 44,
    boxShadow: "none",
    ":hover": {
      borderColor: "var(--primary)",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    zIndex: 20,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "var(--primary-soft)"
      : "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--text)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--text)",
  }),
};

/* ======================================================
   Component
====================================================== */
export default function StepLocationContact({
  data,
  setData,
  onNext,
  onBack,
}) {
  function setField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const mode = data.service_mode;

  /* ─────────────────────────────
     Visibility rules (unchanged logic)
  ───────────────────────────── */
  const needsPhysicalAddress = mode === "on_site" || mode === "hybrid";
  const needsServiceRadius = mode === "at_home" || mode === "hybrid";
  const needsContactInfo = !!mode;

  /* ─────────────────────────────
     Validation state
  ───────────────────────────── */
  const [errors, setErrors] = useState({});

  const setError = (field, message) => {
    setErrors((p) => ({ ...p, [field]: message || "" }));
  };

  const validateEmail = (value) => {
    if (!value) return setError("email", "");
    setError(
      "email",
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? ""
        : "Invalid email format (e.g. name@domain.com)"
    );
  };

  const validateUrl = (field, value) => {
    if (!value) return setError(field, "");
    setError(
      field,
      /^https?:\/\/.+/i.test(value)
        ? ""
        : "Invalid URL format (must start with https://)"
    );
  };

  /* ─────────────────────────────
     Location link validation (Google Maps link)
     - Strict allowlist for google maps URLs
  ───────────────────────────── */
  const validateLocationMapUrl = (value, required) => {
    if (!value) {
      setError("location_map_url", required ? "Location link is required" : "");
      return !required;
    }

    const ok =
      /^(https:\/\/)(www\.)?(google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(
        value.trim()
      ) ||
      /^(https:\/\/)(www\.)?google\.[a-z.]+\/maps/i.test(value.trim());

    setError(
      "location_map_url",
      ok ? "" : "Please paste a valid Google Maps link"
    );

    return ok;
  };

  /* ─────────────────────────────
     Phone (libphonenumber + react-select)
  ───────────────────────────── */
  const countryOptions = useMemo(() => {
    return getCountries().map((cc) => ({
      value: cc,
      label: `${cc} (+${getCountryCallingCode(cc)})`,
    }));
  }, []);

  const [phoneCountry, setPhoneCountry] = useState("FR");
  const [phoneNational, setPhoneNational] = useState("");

  useEffect(() => {
    if (!data.phone) return;
    const parsed = parsePhoneNumberFromString(data.phone);
    if (parsed) {
      setPhoneCountry(parsed.country || "FR");
      setPhoneNational(parsed.nationalNumber || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updatePhone(country, raw) {
    const digits = raw.replace(/\D+/g, "").replace(/^0+/, "");
    setPhoneNational(digits);

    if (!digits) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    const parsed = parsePhoneNumberFromString(digits, country);

    if (!parsed || !parsed.isValid()) {
      setError("phone", "Invalid phone number for selected country");
      return;
    }

    setError("phone", "");
    setField("phone", parsed.number); // E.164
  }

  /* ─────────────────────────────
     Step-level validation before proceeding
     - keeps UX stable, improves engineering safety
  ───────────────────────────── */
  function validateStep() {
    // reset only step-critical errors if needed
    let ok = true;

    // if physical address is needed, require a map link
    if (needsPhysicalAddress) {
      const v = validateLocationMapUrl(data.location_map_url || "", true);
      if (!v) ok = false;
    } else {
      // not required => clear error
      validateLocationMapUrl(data.location_map_url || "", false);
    }

    // Optional validations that can still show errors (but not block next)
    if (data.email) {
      validateEmail(data.email);
      if (errors.email) ok = false; // best effort; errors state async
    }

    if (data.website) validateUrl("website", data.website);
    if (data.instagram_url) validateUrl("instagram_url", data.instagram_url);
    if (data.linkedin_url) validateUrl("linkedin_url", data.linkedin_url);
    if (data.twitter_url) validateUrl("twitter_url", data.twitter_url);
    if (data.telegram_url) validateUrl("telegram_url", data.telegram_url);

    // If phone entered but invalid, block
    if (phoneNational && errors.phone) ok = false;

    return ok;
  }

  const canProceed = !!mode;
  /* ─────────────────────────────
     Render — Main Form
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 3 of 4 — Location, Availability & Contact
      </p>

      {/* ─────────────────────────────
         Service mode
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">
          Service mode *
        </label>
        <select
          className="admin-input"
          value={mode || ""}
          onChange={(e) =>
            setField("service_mode", e.target.value)
          }
          required
        >
          <option value="">Select service mode</option>
          <option value="on_site">
            On-site (customers visit)
          </option>
          <option value="at_home">
            At customer location
          </option>
          <option value="remote">
            Remote / Online
          </option>
          <option value="hybrid">
            Hybrid
          </option>
        </select>
      </div>

      {/* ─────────────────────────────
         Availability
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">
          Availability type
        </label>
        <select
          className="admin-input"
          value={data.availability_type || ""}
          onChange={(e) =>
            setField("availability_type", e.target.value)
          }
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
          onChange={(e) =>
            setField("availability_note", e.target.value)
          }
          placeholder="e.g. Available weekends, emergency calls accepted"
        />
      </div>

      {/* ─────────────────────────────
         Location (Google Maps link)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location (Google Maps link) *
          </label>
          <input
            type="url"
            className="admin-input"
            value={data.location_map_url || ""}
            onChange={(e) => {
              const v = e.target.value;
              setField("location_map_url", v);
              validateLocationMapUrl(v, true);
            }}
            placeholder="Paste Google Maps link (e.g. https://maps.google.com/?q=...)"
          />
          {!errors.location_map_url && (
            <p className="admin-hint">
              Paste the location link copied from Google Maps.
            </p>
          )}
          {errors.location_map_url && (
            <p className="admin-error">
              {errors.location_map_url}
            </p>
          )}
        </div>
      )}

      {/* ─────────────────────────────
         Physical address (manual / optional)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <>
          <div className="mb-5">
            <label className="admin-label">
              Country *
            </label>
            <input
              className="admin-input"
              value={data.country || ""}
              onChange={(e) =>
                setField("country", e.target.value)
              }
              placeholder="Country"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              City *
            </label>
            <input
              className="admin-input"
              value={data.city || ""}
              onChange={(e) =>
                setField("city", e.target.value)
              }
              placeholder="City"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              Address
            </label>
            <textarea
              className="admin-input"
              rows={2}
              value={data.address || ""}
              onChange={(e) =>
                setField("address", e.target.value)
              }
              placeholder="Street and number (optional)"
            />
          </div>

          <div className="mb-6">
            <label className="admin-label">
              Postal code
            </label>
            <input
              className="admin-input"
              value={data.postal_code || ""}
              onChange={(e) =>
                setField("postal_code", e.target.value)
              }
              placeholder="Postal code"
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────
         Service radius
      ───────────────────────────── */}
      {needsServiceRadius && (
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
            min={0}
          />
        </div>
      )}

      {/* ─────────────────────────────
         Contact info
      ───────────────────────────── */}
      {needsContactInfo && (
        <>
          {/* Phone */}
          <div className="mb-6">
            <label className="admin-label">
              Phone
            </label>

            <div className="flex gap-3">
              <div style={{ minWidth: 260 }}>
                <Select
                  styles={countrySelectStyles}
                  options={countryOptions}
                  value={countryOptions.find(
                    (o) => o.value === phoneCountry
                  )}
                  onChange={(opt) => {
                    const nextCountry = opt?.value || "FR";
                    setPhoneCountry(nextCountry);
                    updatePhone(nextCountry, phoneNational);
                  }}
                  isSearchable
                  placeholder="Country code"
                />
              </div>

              <input
                className="admin-input"
                value={phoneNational}
                onChange={(e) =>
                  updatePhone(phoneCountry, e.target.value)
                }
                placeholder="National number (no leading 0)"
                inputMode="numeric"
              />
            </div>

            {errors.phone && (
              <p className="admin-error">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="admin-label">
              Email
            </label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) => {
                setField("email", e.target.value);
                validateEmail(e.target.value);
              }}
              placeholder="name@domain.com"
            />
            {errors.email && (
              <p className="admin-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* Website */}
          <div className="mb-6">
            <label className="admin-label">
              Website
            </label>
            <input
              type="url"
              className="admin-input"
              value={data.website || ""}
              onChange={(e) => {
                setField("website", e.target.value);
                validateUrl("website", e.target.value);
              }}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="admin-error">
                {errors.website}
              </p>
            )}
          </div>
        </>
      )}
      {/* ─────────────────────────────
         Contact visibility
      ───────────────────────────── */}
      {needsContactInfo && (
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
      )}

      {/* ─────────────────────────────
         Social media links
      ───────────────────────────── */}
      {needsContactInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Instagram */}
          <div>
            <input
              className="admin-input"
              placeholder="Instagram URL (https://instagram.com/username)"
              value={data.instagram_url || ""}
              onChange={(e) => {
                setField("instagram_url", e.target.value);
                validateUrl("instagram_url", e.target.value);
              }}
            />
            {errors.instagram_url && (
              <p className="admin-error">
                {errors.instagram_url}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <input
              className="admin-input"
              placeholder="LinkedIn URL (https://linkedin.com/in/username)"
              value={data.linkedin_url || ""}
              onChange={(e) => {
                setField("linkedin_url", e.target.value);
                validateUrl("linkedin_url", e.target.value);
              }}
            />
            {errors.linkedin_url && (
              <p className="admin-error">
                {errors.linkedin_url}
              </p>
            )}
          </div>

          {/* Twitter / X */}
          <div>
            <input
              className="admin-input"
              placeholder="Twitter / X URL (https://x.com/username)"
              value={data.twitter_url || ""}
              onChange={(e) => {
                setField("twitter_url", e.target.value);
                validateUrl("twitter_url", e.target.value);
              }}
            />
            {errors.twitter_url && (
              <p className="admin-error">
                {errors.twitter_url}
              </p>
            )}
          </div>

          {/* Telegram */}
          <div>
            <input
              className="admin-input"
              placeholder="Telegram URL (https://t.me/username)"
              value={data.telegram_url || ""}
              onChange={(e) => {
                setField("telegram_url", e.target.value);
                validateUrl("telegram_url", e.target.value);
              }}
            />
            {errors.telegram_url && (
              <p className="admin-error">
                {errors.telegram_url}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="md:col-span-2">
            <input
              className="admin-input"
              placeholder="WhatsApp number (optional)"
              value={data.whatsapp_number || ""}
              onChange={(e) =>
                setField("whatsapp_number", e.target.value)
              }
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────
         Navigation
      ───────────────────────────── */}
      <div className="flex justify-between">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={!canProceed}
          onClick={() => {
            const ok = validateStep();
            if (!ok) return;
            onNext();
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
