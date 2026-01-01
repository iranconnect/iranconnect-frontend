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
          error = "Invalid email format";
        }
        break;

      case "website":
      case "instagram_url":
      case "linkedin_url":
      case "twitter_url":
      case "telegram_url":
        if (!/^https?:\/\/.+/i.test(value)) {
          error = "Invalid URL format";
        }
        break;

      case "phone":
        if (!/^\+[1-9]\d{6,14}$/.test(value)) {
          error =
            "Use international format, e.g. +33612345678";
        }
        break;

      default:
        break;
    }

    setErrors((p) => ({ ...p, [field]: error }));
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

      setData((prev) => ({
        ...prev,
        location: place.formattedAddress || "",
        country: components.country || "",
        city:
          components.locality ||
          components.postal_town ||
          "",
        address:
          [components.route, components.street_number]
            .filter(Boolean)
            .join(" "),
        postal_code: components.postal_code || "",
      }));
    });
  }

  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById(
      "wizard-location-autocomplete"
    );
    if (!el) return;

    el.addEventListener("focus", loadMap);
    return () => el.removeEventListener("focus", loadMap);
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

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
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
        <label className="admin-label">Service mode *</label>
        <select
          className="admin-input"
          value={mode || ""}
          onChange={(e) =>
            setField("service_mode", e.target.value)
          }
        >
          <option value="">Select service mode</option>
          <option value="on_site">On-site</option>
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
          onChange={(e) =>
            setField("availability_type", e.target.value)
          }
        >
          <option value="">Select availability</option>
          <option value="always_open">Always open</option>
          <option value="business_hours">
            Business hours
          </option>
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
        />
      </div>

      {/* Map picker – immediately after availability note */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>

          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              style={{
                display: "block",
                width: "100%",
                minHeight: "42px",
                padding: "10px",
              }}
              placeholder="Search business location"
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

      {/* Address (read-only) */}
      {needsPhysicalAddress && (
        <>
          {["country", "city", "address", "postal_code"].map(
            (f) => (
              <div className="mb-5" key={f}>
                <label className="admin-label">
                  {f.replace("_", " ").toUpperCase()}
                </label>
                <input
                  className="admin-input"
                  value={data[f] || ""}
                  readOnly
                />
              </div>
            )
          )}
        </>
      )}

      {/* Contact */}
      {needsContactInfo && (
        <>
          <div className="mb-5">
            <label className="admin-label">Phone</label>
            <input
              className="admin-input"
              value={data.phone || ""}
              onChange={(e) => {
                const v = e.target.value
                  .replace(/\s+/g, "")
                  .replace(/(\+\d+)0/, "$1");
                setField("phone", v);
                validateField("phone", v);
              }}
            />
            {errors.phone && (
              <p className="admin-error">{errors.phone}</p>
            )}
          </div>

          {["email", "website"].map((f) => (
            <div className="mb-5" key={f}>
              <label className="admin-label">
                {f.toUpperCase()}
              </label>
              <input
                className="admin-input"
                value={data[f] || ""}
                onChange={(e) => {
                  setField(f, e.target.value);
                  validateField(f, e.target.value);
                }}
              />
              {errors[f] && (
                <p className="admin-error">{errors[f]}</p>
              )}
            </div>
          ))}
        </>
      )}

      {/* Social */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          "instagram_url",
          "linkedin_url",
          "twitter_url",
          "telegram_url",
        ].map((f) => (
          <div key={f}>
            <input
              className="admin-input"
              placeholder={f.replace("_", " ")}
              value={data[f] || ""}
              onChange={(e) => {
                setField(f, e.target.value);
                validateField(f, e.target.value);
              }}
            />
            {errors[f] && (
              <p className="admin-error">{errors[f]}</p>
            )}
          </div>
        ))}
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
