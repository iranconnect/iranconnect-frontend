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
     Google Maps — Stable Loader + Map ID
  ───────────────────────────── */
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);

  async function initMap() {
    if (mapInstanceRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "beta",
    });
    
    await loader.importLibrary("maps");
    await loader.importLibrary("places");


    await new Promise(requestAnimationFrame); // ⬅️ تضمین mount DOM
    if (!mapRef.current) return;
  
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    });

    mapInstanceRef.current = map;

    markerRef.current = new google.maps.Marker({
      map,
    });

    placesServiceRef.current =
      new google.maps.places.PlacesService(map);

    const autocompleteEl = document.getElementById(
      "wizard-location-autocomplete"
    );

    if (!autocompleteEl) return;

    // قبل از bind کردن، عنصر قبلی را تمیز می‌کنیم
    autocompleteEl.replaceWith(autocompleteEl.cloneNode(true));
    
    const freshAutocompleteEl =
      document.getElementById("wizard-location-autocomplete");
    
    const onPlaceSelect = (e) => {
      const placeId = e?.place?.placeId;
      if (!placeId || !placesServiceRef.current) return;
    
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
            x.types.forEach((t) => {
              c[t] = x.long_name;
            })
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
    };
    
    freshAutocompleteEl.addEventListener(
      "gmp-placeselect",
      onPlaceSelect
    );

  }

  useEffect(() => {
    if (!needsPhysicalAddress) return;
  
    const t = setTimeout(() => {
      initMap();
    }, 0);
  
    return () => clearTimeout(t);
  }, [needsPhysicalAddress]);
  

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
            setField(
              "availability_type",
              e.target.value
            )
          }
        >
          <option value="">Select availability</option>
          <option value="always_open">
            Always open
          </option>
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
            setField(
              "availability_note",
              e.target.value
            )
          }
          placeholder="e.g. Available weekends, emergency calls accepted"
        />
      </div>

      {/* ─────────────────────────────
         Google Map picker (AFTER availability note)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>

          {/* Fixed-size wrapper to prevent layout jump */}
          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              tabIndex="0"
              style={{
                display: "block",
                width: "100%",
                minHeight: 44,
                padding: "10px",
                cursor: "text",
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

      {/* ─────────────────────────────
         Physical address (auto-filled, read-only)
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
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              City *
            </label>
            <input
              className="admin-input"
              value={data.city || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              Address *
            </label>
            <textarea
              className="admin-input"
              rows={2}
              value={data.address || ""}
              readOnly
              placeholder="Auto-filled from map"
            />
          </div>

          <div className="mb-6">
            <label className="admin-label">
              Postal code
            </label>
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
              setField(
                "service_radius_km",
                e.target.value
              )
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
                    const nextCountry =
                      opt?.value || "FR";
                    setPhoneCountry(nextCountry);
                    updatePhone(
                      nextCountry,
                      phoneNational
                    );
                  }}
                  isSearchable
                  placeholder="Country code"
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
                validateUrl(
                  "website",
                  e.target.value
                );
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
      <div className="mb-6 flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.show_phone ?? true}
            onChange={(e) =>
              setField(
                "show_phone",
                e.target.checked
              )
            }
          />
          Show phone number
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.show_email ?? true}
            onChange={(e) =>
              setField(
                "show_email",
                e.target.checked
              )
            }
          />
          Show email
        </label>
      </div>
      {/* ─────────────────────────────
         Social media links
      ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Instagram */}
        <div>
          <input
            className="admin-input"
            placeholder="Instagram URL (https://instagram.com/username)"
            value={data.instagram_url || ""}
            onChange={(e) => {
              setField("instagram_url", e.target.value);
              validateUrl(
                "instagram_url",
                e.target.value
              );
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
              validateUrl(
                "linkedin_url",
                e.target.value
              );
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
              validateUrl(
                "twitter_url",
                e.target.value
              );
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
              validateUrl(
                "telegram_url",
                e.target.value
              );
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
              setField(
                "whatsapp_number",
                e.target.value
              )
            }
          />
        </div>
      </div>

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
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}

