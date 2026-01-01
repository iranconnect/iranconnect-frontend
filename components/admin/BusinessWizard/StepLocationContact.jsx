// components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useRef, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export default function StepLocationContact({
  data,
  setData,
  onNext,
  onBack,
}) {
  function setField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  /* ─────────────────────────────
     Service mode logic
  ───────────────────────────── */
  const mode = data.service_mode;

  const needsPhysicalAddress =
    mode === "on_site" || mode === "hybrid";

  const needsServiceRadius =
    mode === "at_home" || mode === "hybrid";

  const needsContactInfo = !!mode;

  /* ─────────────────────────────
     Map refs
  ───────────────────────────── */
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  /* ─────────────────────────────
     Validation states (Enterprise UX)
  ───────────────────────────── */
  const [locationValid, setLocationValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [websiteValid, setWebsiteValid] = useState(true);

  /* ─────────────────────────────
     Validation helpers
  ───────────────────────────── */
  function isValidEmail(v) {
    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isValidUrl(v) {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }

  function validatePhone(value) {
    if (!value) return true;
    const phone = parsePhoneNumberFromString(value);
    return phone?.isValid() ?? false;
  }
  /* ─────────────────────────────
     Load Google Map + Autocomplete
  ───────────────────────────── */
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

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    autocompleteRef.current = el;

    el.addEventListener("gmp-placeselect", (event) => {
      const place = event.place;
      if (!place || !place.location) return;

      const components = place.addressComponents || [];

      const get = (type) =>
        components.find((c) => c.types.includes(type))?.longText || "";

      map.setCenter(place.location);
      map.setZoom(15);

      setData((prev) => ({
        ...prev,
        location: place.formattedAddress || "",
        country: get("country"),
        city:
          get("locality") ||
          get("administrative_area_level_2"),
        postal_code: get("postal_code"),
        address: [
          get("route"),
          get("street_number"),
        ]
          .filter(Boolean)
          .join(" "),
      }));

      setLocationValid(true);
    });
  }

  /* ─────────────────────────────
     Focus handler for autocomplete
  ───────────────────────────── */
  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    el.addEventListener("focus", loadMap);
    return () => el.removeEventListener("focus", loadMap);
  }, [needsPhysicalAddress]);

  /* ─────────────────────────────
     Cleanup
  ───────────────────────────── */
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.replaceWith(
          autocompleteRef.current.cloneNode(true)
        );
        autocompleteRef.current = null;
      }
    };
  }, []);

  /* ─────────────────────────────
     Reset on remote mode
  ───────────────────────────── */
  useEffect(() => {
    if (mode === "remote") {
      setData((prev) => ({
        ...prev,
        country: "",
        city: "",
        address: "",
        postal_code: "",
        location: "",
      }));
      setLocationValid(false);
    }
  }, [mode]);
  const canProceed =
    !!mode &&
    (!needsPhysicalAddress || locationValid) &&
    phoneValid &&
    emailValid &&
    websiteValid;

  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        Add New Business (Advanced)
      </h2>
      <p className="admin-muted mb-6">
        Step 3 of 4 — Location, Availability & Contact
      </p>

      {/* Availability note */}
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

      {/* Location autocomplete */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
            {locationValid && (
              <span className="ml-2 text-green-500">✔</span>
            )}
          </label>

          <gmp-place-autocomplete
            id="wizard-location-autocomplete"
            class="admin-input"
            placeholder="Search business location"
          ></gmp-place-autocomplete>

          {!locationValid && (
            <p className="text-xs text-red-500 mt-1">
              Please select a location from suggestions
            </p>
          )}

          {mapLoaded && (
            <div
              ref={mapRef}
              className="mt-3 h-64 w-full rounded-lg border"
            />
          )}
        </div>
      )}

      {/* Read-only address fields */}
      {needsPhysicalAddress && (
        <>
          <input className="admin-input" value={data.country || ""} readOnly />
          <input className="admin-input mt-2" value={data.city || ""} readOnly />
          <input className="admin-input mt-2" value={data.address || ""} readOnly />
          <input className="admin-input mt-2" value={data.postal_code || ""} readOnly />
        </>
      )}

      {/* Contact */}
      {needsContactInfo && (
        <>
          <div className="mb-5">
            <label className="admin-label">
              Phone
              {phoneValid && data.phone && (
                <span className="ml-2 text-green-500">✔</span>
              )}
            </label>
            <input
              className={`admin-input ${
                !phoneValid ? "border-red-500" : ""
              }`}
              value={data.phone || ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("phone", v);
                setPhoneValid(validatePhone(v));
              }}
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              Email
              {emailValid && data.email && (
                <span className="ml-2 text-green-500">✔</span>
              )}
            </label>
            <input
              className={`admin-input ${
                !emailValid ? "border-red-500" : ""
              }`}
              value={data.email || ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("email", v);
                setEmailValid(isValidEmail(v));
              }}
            />
          </div>

          <div className="mb-6">
            <label className="admin-label">
              Website
              {websiteValid && data.website && (
                <span className="ml-2 text-green-500">✔</span>
              )}
            </label>
            <input
              className={`admin-input ${
                !websiteValid ? "border-red-500" : ""
              }`}
              value={data.website || ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("website", v);
                setWebsiteValid(isValidUrl(v));
              }}
            />
          </div>
        </>
      )}

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
