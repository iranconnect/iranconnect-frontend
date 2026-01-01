//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useRef, useState } from "react";

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
     Visibility rules (engineering logic)
  ───────────────────────────── */
  const needsPhysicalAddress =
    mode === "on_site" || mode === "hybrid";

  const needsServiceRadius =
    mode === "at_home" || mode === "hybrid";

  const needsContactInfo = !!mode;

  const canProceed = !!mode;

  /* ─────────────────────────────
     Validation state
  ───────────────────────────── */
  const [errors, setErrors] = useState({});

  function validateField(field, value) {
    let error = "";

    if (!value) {
      setErrors((p) => ({ ...p, [field]: "" }));
      return;
    }

    switch (field) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format (e.g. name@domain.com)";
        }
        break;

      case "website":
      case "instagram_url":
      case "linkedin_url":
      case "twitter_url":
      case "telegram_url":
        if (!/^https?:\/\/.+/i.test(value)) {
          error = "Invalid URL format (must start with https://)";
        }
        break;

      case "phone":
        if (!/^\+[1-9]\d{6,14}$/.test(value)) {
          error = "Use international format, e.g. +33612345678";
        }
        break;

      default:
        break;
    }

    setErrors((p) => ({ ...p, [field]: error }));
  }

  /* ─────────────────────────────
     Phone (country code select + normalized storage)
  ───────────────────────────── */
  const COUNTRY_CODE_OPTIONS = [
    { label: "France (+33)", value: "+33" },
    { label: "Iran (+98)", value: "+98" },
    { label: "United Kingdom (+44)", value: "+44" },
    { label: "United States (+1)", value: "+1" },
    { label: "Canada (+1)", value: "+1" },
    { label: "Germany (+49)", value: "+49" },
    { label: "Italy (+39)", value: "+39" },
    { label: "Spain (+34)", value: "+34" },
    { label: "Belgium (+32)", value: "+32" },
    { label: "Netherlands (+31)", value: "+31" },
    { label: "Turkey (+90)", value: "+90" },
  ];

  const [phoneCode, setPhoneCode] = useState("+33");
  const [phoneNational, setPhoneNational] = useState("");

  function parsePhoneToParts(phoneValue) {
    const v = (phoneValue || "").replace(/\s+/g, "");
    const m = v.match(/^\+(\d{1,3})(\d*)$/);
    if (!m) return { code: "+33", national: "" };

    const codeCandidate = `+${m[1]}`;
    const isKnown = COUNTRY_CODE_OPTIONS.some(
      (x) => x.value === codeCandidate
    );

    return {
      code: isKnown ? codeCandidate : codeCandidate,
      national: (m[2] || "").replace(/^0+/, ""),
    };
  }

  function syncPhoneFromData() {
    const parts = parsePhoneToParts(data.phone || "");
    setPhoneCode(parts.code || "+33");
    setPhoneNational(parts.national || "");
  }

  useEffect(() => {
    // initial sync (and when returning to this step)
    syncPhoneFromData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updatePhoneE164(nextCode, nextNational) {
    const nationalClean = (nextNational || "")
      .replace(/\D+/g, "") // digits only
      .replace(/^0+/, ""); // no leading zero

    const codeClean = (nextCode || "+33").replace(/\s+/g, "");

    const full = nationalClean ? `${codeClean}${nationalClean}` : "";
    setField("phone", full);

    validateField("phone", full);
  }

  /* ─────────────────────────────
     Google Maps
  ───────────────────────────── */
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  async function loadMap() {
    if (mapLoaded) return;
    setMapLoaded(true);

    if (typeof window !== "undefined" && !window.google) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          `https://maps.googleapis.com/maps/api/js` +
          `?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` +
          `&libraries=places&v=beta`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
    });

    const el = document.getElementById(
      "wizard-location-autocomplete"
    );
    if (!el) return;

    autocompleteRef.current = el;

    el.addEventListener("gmp-placeselect", (event) => {
      const place = event.place;
      if (!place || !place.location) return;

      map.setCenter(place.location);
      map.setZoom(15);

      const components = {};
      place.addressComponents?.forEach((c) => {
        c.types.forEach((t) => {
          components[t] = c.longText;
        });
      });

      const country = components.country || "";
      const city =
        components.locality ||
        components.postal_town ||
        components.administrative_area_level_2 ||
        "";

      const route = components.route || "";
      const streetNumber = components.street_number || "";

      const addressLine = [streetNumber, route]
        .filter(Boolean)
        .join(" ")
        .trim();

      setData((prev) => ({
        ...prev,
        location: place.formattedAddress || "",
        country,
        city,
        address: addressLine,
        postal_code: components.postal_code || "",
      }));
    });
  }

  // Robust activation: when section appears, preload once (prevents "not active on first click/tab")
  useEffect(() => {
    if (!needsPhysicalAddress) return;
    loadMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsPhysicalAddress]);

  // Fallback listeners in case React handlers don't bind as expected to the custom element
  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    const handler = () => loadMap();

    el.addEventListener("focusin", handler);
    el.addEventListener("click", handler);

    return () => {
      el.removeEventListener("focusin", handler);
      el.removeEventListener("click", handler);
    };
  }, [needsPhysicalAddress]);

  useEffect(() => {
    if (mode === "remote") {
      setData((prev) => ({
        ...prev,
        country: "",
        city: "",
        address: "",
        postal_code: "",
        location: "",
        service_radius_km: null,
      }));
    }
  }, [mode]);

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
        <label className="admin-label">Service mode *</label>
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
          <option value="hybrid">Hybrid</option>
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
          <option value="appointment_only">
            Appointment only
          </option>
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
         Map picker – immediately after availability note
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>

          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              tabIndex={0}
              onFocus={loadMap}
              onClick={loadMap}
              style={{
                display: "block",
                width: "100%",
                minHeight: "42px",
                padding: "10px",
              }}
              placeholder="Search (e.g. 10 Rue Massena, Nice)"
            ></gmp-place-autocomplete>
          </div>

          {mapLoaded && (
            <div
              ref={mapRef}
              className="mt-3 h-64 w-full rounded-lg border border-[var(--border)]"
            />
          )}
        </div>
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
         Physical address (read-only autofill)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <>
          <div className="mb-5">
            <label className="admin-label">Country *</label>
            <input
              className="admin-input"
              value={data.country || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">City *</label>
            <input
              className="admin-input"
              value={data.city || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">Address *</label>
            <textarea
              className="admin-input"
              rows={2}
              value={data.address || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-6">
            <label className="admin-label">Postal code</label>
            <input
              className="admin-input"
              value={data.postal_code || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────
         Contact info
      ───────────────────────────── */}
      {needsContactInfo && (
        <>
          <div className="mb-5">
            <label className="admin-label">Phone</label>

            <div className="flex gap-3">
              <select
                className="admin-input"
                style={{ maxWidth: 220 }}
                value={phoneCode}
                onChange={(e) => {
                  const nextCode = e.target.value;
                  setPhoneCode(nextCode);
                  updatePhoneE164(nextCode, phoneNational);
                }}
              >
                {COUNTRY_CODE_OPTIONS.map((c) => (
                  <option key={c.label} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                className="admin-input"
                value={phoneNational}
                onChange={(e) => {
                  const raw = e.target.value || "";
                  const clean = raw
                    .replace(/\D+/g, "")
                    .replace(/^0+/, "");
                  setPhoneNational(clean);
                  updatePhoneE164(phoneCode, clean);
                }}
                placeholder="National number (no leading 0) — e.g. 612345678"
                inputMode="numeric"
              />
            </div>

            {!!data.phone && (
              <p className="admin-muted mt-1">
                Saved format: {data.phone}
              </p>
            )}

            {errors.phone && (
              <p className="admin-error">{errors.phone}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) => {
                setField("email", e.target.value);
                validateField("email", e.target.value);
              }}
              placeholder="name@domain.com"
            />
            {errors.email && (
              <p className="admin-error">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="admin-label">Website</label>
            <input
              type="url"
              className="admin-input"
              value={data.website || ""}
              onChange={(e) => {
                setField("website", e.target.value);
                validateField("website", e.target.value);
              }}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="admin-error">{errors.website}</p>
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────
         Contact visibility
      ───────────────────────────── */}
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

      {/* ─────────────────────────────
         Social links (with real-time validation + placeholders)
      ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            className="admin-input"
            placeholder="Instagram URL (https://instagram.com/username)"
            value={data.instagram_url || ""}
            onChange={(e) => {
              setField("instagram_url", e.target.value);
              validateField("instagram_url", e.target.value);
            }}
          />
          {errors.instagram_url && (
            <p className="admin-error">{errors.instagram_url}</p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="LinkedIn URL (https://linkedin.com/in/username)"
            value={data.linkedin_url || ""}
            onChange={(e) => {
              setField("linkedin_url", e.target.value);
              validateField("linkedin_url", e.target.value);
            }}
          />
          {errors.linkedin_url && (
            <p className="admin-error">{errors.linkedin_url}</p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="Twitter/X URL (https://x.com/username)"
            value={data.twitter_url || ""}
            onChange={(e) => {
              setField("twitter_url", e.target.value);
              validateField("twitter_url", e.target.value);
            }}
          />
          {errors.twitter_url && (
            <p className="admin-error">{errors.twitter_url}</p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="Telegram URL (https://t.me/username)"
            value={data.telegram_url || ""}
            onChange={(e) => {
              setField("telegram_url", e.target.value);
              validateField("telegram_url", e.target.value);
            }}
          />
          {errors.telegram_url && (
            <p className="admin-error">{errors.telegram_url}</p>
          )}
        </div>

        <input
          className="admin-input"
          placeholder="WhatsApp number"
          value={data.whatsapp_number || ""}
          onChange={(e) =>
            setField("whatsapp_number", e.target.value)
          }
        />
      </div>

      {/* ─────────────────────────────
         Navigation
      ───────────────────────────── */}
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
