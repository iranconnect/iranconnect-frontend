//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

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

  const needsPhysicalAddress =
    mode === "on_site" || mode === "hybrid";
  const needsServiceRadius =
    mode === "at_home" || mode === "hybrid";
  const needsContactInfo = !!mode;
  const canProceed = !!mode;

  /* ─────────────────────────────
     Validation
  ───────────────────────────── */
  const [errors, setErrors] = useState({});

  function setError(field, msg) {
    setErrors((p) => ({ ...p, [field]: msg }));
  }

  /* ─────────────────────────────
     Phone (libphonenumber-js)
  ───────────────────────────── */
  const countryOptions = getCountries().map((c) => ({
    value: c,
    label: `${c} (+${getCountryCallingCode(c)})`,
  }));

  const [phoneCountry, setPhoneCountry] = useState("FR");
  const [phoneNational, setPhoneNational] = useState("");

  useEffect(() => {
    if (!data.phone) return;
    const parsed = parsePhoneNumberFromString(data.phone);
    if (parsed) {
      setPhoneCountry(parsed.country || "FR");
      setPhoneNational(parsed.nationalNumber || "");
    }
  }, []);

  function updatePhone(country, national) {
    try {
      const parsed = parsePhoneNumberFromString(
        national,
        country
      );
      if (!parsed || !parsed.isValid()) {
        setError(
          "phone",
          "Invalid phone number for selected country"
        );
        return;
      }
      setError("phone", "");
      setField("phone", parsed.number); // E.164
    } catch {
      setError("phone", "Invalid phone number");
    }
  }

  /* ─────────────────────────────
     Google Maps
  ───────────────────────────── */
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  async function loadMap() {
    if (mapLoaded) return;
    setMapLoaded(true);

    if (!window.google) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=beta`;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
    });

    markerRef.current = new window.google.maps.Marker({ map });
    placesServiceRef.current =
      new window.google.maps.places.PlacesService(map);

    const el = document.getElementById(
      "wizard-location-autocomplete"
    );
    if (!el) return;

    el.addEventListener("gmp-placeselect", (e) => {
      const placeId = e.place?.placeId;
      if (!placeId) return;

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: [
            "geometry",
            "formatted_address",
            "address_components",
          ],
        },
        (details, status) => {
          if (
            status !==
              window.google.maps.places.PlacesServiceStatus.OK ||
            !details
          )
            return;

          const loc = details.geometry.location;
          map.setCenter(loc);
          map.setZoom(16);
          markerRef.current.setPosition(loc);

          const c = {};
          details.address_components.forEach((x) =>
            x.types.forEach(
              (t) => (c[t] = x.long_name)
            )
          );

          setData((p) => ({
            ...p,
            location: details.formatted_address || "",
            country: c.country || "",
            city:
              c.locality ||
              c.postal_town ||
              c.administrative_area_level_2 ||
              "",
            address: [c.street_number, c.route]
              .filter(Boolean)
              .join(" "),
            postal_code: c.postal_code || "",
          }));
        }
      );
    });
  }

  useEffect(() => {
    if (needsPhysicalAddress) loadMap();
  }, [needsPhysicalAddress]);

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

      {/* Availability */}
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
          placeholder="e.g. Available weekends"
        />
      </div>

      {/* Map */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>
          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              tabIndex={0}
              style={{
                display: "block",
                width: "100%",
                minHeight: 42,
                padding: 10,
              }}
              placeholder="Search address (e.g. 10 Rue Massena, Nice)"
            />
          </div>
          <div
            ref={mapRef}
            className="mt-3 h-64 w-full rounded-lg border"
          />
        </div>
      )}

      {/* Address (read only) */}
      {needsPhysicalAddress &&
        ["country", "city", "address", "postal_code"].map(
          (f) => (
            <div className="mb-4" key={f}>
              <label className="admin-label">
                {f.toUpperCase()}
              </label>
              <input
                className="admin-input"
                value={data[f] || ""}
                readOnly
                placeholder="Auto-filled from map"
              />
            </div>
          )
        )}

      {/* Phone */}
      {needsContactInfo && (
        <div className="mb-6">
          <label className="admin-label">Phone</label>
          <div className="flex gap-3">
            <Select
              className="w-56"
              options={countryOptions}
              value={countryOptions.find(
                (o) => o.value === phoneCountry
              )}
              onChange={(o) => {
                setPhoneCountry(o.value);
                updatePhone(o.value, phoneNational);
              }}
              isSearchable
            />
            <input
              className="admin-input"
              value={phoneNational}
              onChange={(e) => {
                const v = e.target.value
                  .replace(/\D+/g, "")
                  .replace(/^0+/, "");
                setPhoneNational(v);
                updatePhone(phoneCountry, v);
              }}
              placeholder="National number (no leading 0)"
            />
          </div>
          {errors.phone && (
            <p className="admin-error">{errors.phone}</p>
          )}
        </div>
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
