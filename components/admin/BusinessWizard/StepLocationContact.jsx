//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

/* ======================================================
   Dark-mode friendly styles for react-select
====================================================== */
const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--bg)",
    borderColor: "var(--border)",
    color: "var(--text)",
    minHeight: 42,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--bg)",
    color: "var(--text)",
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
     Visibility rules
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
  const setError = (k, v) =>
    setErrors((p) => ({ ...p, [k]: v || "" }));

  /* ─────────────────────────────
     Phone (react-select + libphonenumber-js)
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
  }, []);

  function updatePhone(nextCountry, nextNational) {
    const digits = (nextNational || "")
      .replace(/\D+/g, "")
      .replace(/^0+/, "");

    setPhoneNational(digits);

    if (!digits) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    const parsed = parsePhoneNumberFromString(
      digits,
      nextCountry
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
  }

  /* ─────────────────────────────
     Google Maps (Map ID + PlacesService)
  ───────────────────────────── */
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  async function ensureGoogleLoaded() {
    if (window.google?.maps?.places) return;

    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` +
        `&libraries=places&v=beta`;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initMap() {
    if (mapReady || !mapRef.current) return;

    await ensureGoogleLoaded();

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID, // 🔑 حیاتی
    });

    mapInstanceRef.current = map;

    markerRef.current = new window.google.maps.Marker({
      map,
    });

    placesServiceRef.current =
      new window.google.maps.places.PlacesService(map);

    const autocompleteEl = document.getElementById(
      "wizard-location-autocomplete"
    );
    if (!autocompleteEl) return;

    autocompleteEl.addEventListener("gmp-placeselect", (e) => {
      const placeId = e?.place?.placeId;
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
            !details?.geometry?.location
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

          setData((prev) => ({
            ...prev,
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

    setMapReady(true);
  }

  useEffect(() => {
    if (needsPhysicalAddress) initMap();
  }, [needsPhysicalAddress]);

  /* ─────────────────────────────
     Remote reset
  ───────────────────────────── */
  useEffect(() => {
    if (mode === "remote") {
      setData((p) => ({
        ...p,
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
        <label className="admin-label">
          Service mode *
        </label>
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

      {/* Map picker */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>

          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              tabIndex="0"
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
            className="mt-3 h-64 w-full rounded-lg border border-[var(--border)]"
          />
        </div>
      )}

      {/* Address (auto-filled, read-only) */}
      {needsPhysicalAddress &&
        ["country", "city", "address", "postal_code"].map(
          (f) => (
            <div className="mb-5" key={f}>
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

      {/* Service radius */}
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

      {/* Contact info */}
      {needsContactInfo && (
        <>
          <div className="mb-6">
            <label className="admin-label">Phone</label>
            <div className="flex gap-3">
              <div style={{ minWidth: 260 }}>
                <Select
                  options={countryOptions}
                  styles={selectStyles}
                  value={countryOptions.find(
                    (o) => o.value === phoneCountry
                  )}
                  onChange={(opt) => {
                    setPhoneCountry(opt.value);
                    updatePhone(
                      opt.value,
                      phoneNational
                    );
                  }}
                  isSearchable
                />
              </div>
              <input
                className="admin-input"
                value={phoneNational}
                onChange={(e) =>
                  updatePhone(
                    phoneCountry,
                    e.target.value
                  )
                }
                placeholder="National number (no leading 0)"
                inputMode="numeric"
              />
            </div>
            {errors.phone && (
              <p className="admin-error">{errors.phone}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) =>
                setField("email", e.target.value)
              }
              placeholder="name@domain.com"
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
