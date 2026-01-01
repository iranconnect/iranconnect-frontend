//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { Loader } from "@googlemaps/js-api-loader";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

/* ======================================================
   react-select styles (dark-mode safe)
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

export default function StepLocationContact({
  data,
  setData,
  onNext,
  onBack,
}) {
  const setField = (k, v) =>
    setData((p) => ({ ...p, [k]: v }));

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
     Validation
  ───────────────────────────── */
  const [errors, setErrors] = useState({});
  const setError = (k, v) =>
    setErrors((p) => ({ ...p, [k]: v || "" }));

  const validateUrl = (k, v) => {
    if (!v) return setError(k, "");
    setError(
      k,
      /^https?:\/\/.+/i.test(v)
        ? ""
        : "Invalid URL format (https://...)"
    );
  };

  /* ─────────────────────────────
     Phone (libphonenumber)
  ───────────────────────────── */
  const countryOptions = useMemo(
    () =>
      getCountries().map((cc) => ({
        value: cc,
        label: `${cc} (+${getCountryCallingCode(cc)})`,
      })),
    []
  );

  const [phoneCountry, setPhoneCountry] = useState("FR");
  const [phoneNational, setPhoneNational] = useState("");

  useEffect(() => {
    if (!data.phone) return;
    const p = parsePhoneNumberFromString(data.phone);
    if (p) {
      setPhoneCountry(p.country || "FR");
      setPhoneNational(p.nationalNumber || "");
    }
  }, []);

  function updatePhone(country, raw) {
    const digits = raw.replace(/\D+/g, "").replace(/^0+/, "");
    setPhoneNational(digits);

    if (!digits) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    const parsed = parsePhoneNumberFromString(
      digits,
      country
    );
    if (!parsed || !parsed.isValid()) {
      setError("phone", "Invalid phone number");
      return;
    }

    setError("phone", "");
    setField("phone", parsed.number);
  }

  /* ─────────────────────────────
     Google Maps (Loader + Map ID)
  ───────────────────────────── */
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const placesService = useRef(null);

  async function initMap() {
    if (mapInstance.current || !mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      libraries: ["places"],
      version: "beta",
    });

    const google = await loader.load();

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    });

    mapInstance.current = map;
    markerRef.current = new google.maps.Marker({ map });
    placesService.current =
      new google.maps.places.PlacesService(map);

    const el = document.getElementById(
      "wizard-location-autocomplete"
    );
    if (!el) return;

    el.addEventListener("gmp-placeselect", (e) => {
      const placeId = e?.place?.placeId;
      if (!placeId) return;

      placesService.current.getDetails(
        {
          placeId,
          fields: [
            "geometry",
            "formatted_address",
            "address_components",
          ],
        },
        (d, status) => {
          if (
            status !==
              google.maps.places.PlacesServiceStatus.OK ||
            !d?.geometry
          )
            return;

          const loc = d.geometry.location;
          map.setCenter(loc);
          map.setZoom(16);
          markerRef.current.setPosition(loc);

          const c = {};
          d.address_components.forEach((x) =>
            x.types.forEach(
              (t) => (c[t] = x.long_name)
            )
          );

          setData((p) => ({
            ...p,
            location: d.formatted_address || "",
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
          <option value="at_home">
            At customer location
          </option>
          <option value="remote">
            Remote / Online
          </option>
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
              placeholder="Search address (e.g. 10 Rue Massena, Nice)"
            />
          </div>
          <div
            ref={mapRef}
            className="mt-3 h-64 w-full rounded-lg border"
          />
        </div>
      )}

      {/* Address */}
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

      {/* Contact */}
      {needsContactInfo && (
        <>
          <div className="mb-6">
            <label className="admin-label">Phone</label>
            <div className="flex gap-3">
              <Select
                styles={selectStyles}
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
                onChange={(e) =>
                  updatePhone(
                    phoneCountry,
                    e.target.value
                  )
                }
                placeholder="National number"
              />
            </div>
            {errors.phone && (
              <p className="admin-error">{errors.phone}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="admin-label">Email</label>
            <input
              className="admin-input"
              value={data.email || ""}
              onChange={(e) =>
                setField("email", e.target.value)
              }
            />
          </div>
        </>
      )}

      {/* Social Media */}
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
                validateUrl(f, e.target.value);
              }}
            />
            {errors[f] && (
              <p className="admin-error">{errors[f]}</p>
            )}
          </div>
        ))}
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

