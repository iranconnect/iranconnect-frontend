//components/admin/BusinessWizard/StepLocationContact.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

  function setError(field, message) {
    setErrors((p) => ({ ...p, [field]: message || "" }));
  }

  function validateUrlField(field, value) {
    if (!value) return setError(field, "");
    const ok = /^https?:\/\/.+/i.test(value.trim());
    setError(
      field,
      ok ? "" : "Invalid URL format (must start with https://)"
    );
  }

  function validateEmailField(value) {
    if (!value) return setError("email", "");
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    setError("email", ok ? "" : "Invalid email format (e.g. name@domain.com)");
  }

  /* ─────────────────────────────
     Phone (react-select + libphonenumber-js)
  ───────────────────────────── */
  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      return null;
    }
  }, []);

  function flagEmojiFromCountryCode(cc) {
    // cc: "FR"
    try {
      const A = 0x1f1e6;
      const codePoints = cc
        .toUpperCase()
        .split("")
        .map((c) => A + (c.charCodeAt(0) - 65));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "";
    }
  }

  const countryOptions = useMemo(() => {
    const list = getCountries().map((cc) => {
      const calling = getCountryCallingCode(cc);
      const name = displayNames ? displayNames.of(cc) : cc;
      const flag = flagEmojiFromCountryCode(cc);
      return {
        value: cc,
        label: `${flag ? flag + " " : ""}${name} (+${calling})`,
      };
    });

    // Put France and Iran near top for IranConnect usage (still searchable for all)
    const top = ["FR", "IR"];
    list.sort((a, b) => {
      const ai = top.indexOf(a.value);
      const bi = top.indexOf(b.value);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }
      return a.label.localeCompare(b.label);
    });

    return list;
  }, [displayNames]);

  const [phoneCountry, setPhoneCountry] = useState("FR");
  const [phoneNational, setPhoneNational] = useState("");

  function syncPhoneFromData() {
    const raw = (data.phone || "").trim();
    if (!raw) return;

    const parsed = parsePhoneNumberFromString(raw);
    if (!parsed) return;

    if (parsed.country) setPhoneCountry(parsed.country);
    if (parsed.nationalNumber) setPhoneNational(parsed.nationalNumber);
  }

  useEffect(() => {
    syncPhoneFromData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updatePhoneE164(nextCountry, nextNationalDigits) {
    const national = (nextNationalDigits || "")
      .replace(/\D+/g, "") // digits only
      .replace(/^0+/, ""); // no leading zeros

    // Keep input in sync (UX)
    setPhoneNational(national);

    if (!national) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    try {
      const parsed = parsePhoneNumberFromString(national, nextCountry);
      if (!parsed || !parsed.isValid()) {
        setError("phone", "Invalid phone number for selected country");
        return;
      }
      setError("phone", "");
      setField("phone", parsed.number); // E.164
    } catch {
      setError("phone", "Invalid phone number");
    }
  }

  /* ─────────────────────────────
     Google Maps (gmp-place-autocomplete + PlacesService.getDetails)
  ───────────────────────────── */
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteElRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  async function ensureGoogleLoaded() {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) return;

    await new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-iranconnect="google-maps"]'
      );
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.dataset.iranconnect = "google-maps";
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

  async function loadMap() {
    if (mapLoaded) return;
    setMapLoaded(true);

    await ensureGoogleLoaded();

    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.7102, lng: 7.262 },
      zoom: 13,
    });

    mapInstanceRef.current = map;

    markerRef.current = new window.google.maps.Marker({
      map,
    });

    placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    autocompleteElRef.current = el;

    const onPlaceSelect = (event) => {
      const placeId = event?.place?.placeId;
      if (!placeId || !placesServiceRef.current) return;

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ["geometry", "formatted_address", "address_components"],
        },
        (details, status) => {
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !details ||
            !details.geometry ||
            !details.geometry.location
          )
            return;

          const loc = details.geometry.location;

          map.setCenter(loc);
          map.setZoom(16);

          if (markerRef.current) {
            markerRef.current.setPosition(loc);
          }

          const components = {};
          (details.address_components || []).forEach((c) => {
            (c.types || []).forEach((t) => {
              components[t] = c.long_name;
            });
          });

          const country = components.country || "";
          const city =
            components.locality ||
            components.postal_town ||
            components.administrative_area_level_2 ||
            "";

          const addressLine = [components.street_number, components.route]
            .filter(Boolean)
            .join(" ")
            .trim();

          setData((prev) => ({
            ...prev,
            location: details.formatted_address || "",
            country,
            city,
            address: addressLine,
            postal_code: components.postal_code || "",
          }));
        }
      );
    };

    // Ensure we don't duplicate listeners if loadMap is called again for any reason
    el.addEventListener("gmp-placeselect", onPlaceSelect);

    // Cleanup handler stored on element for later
    el.__iranconnect_onPlaceSelect = onPlaceSelect;
  }

  // preload map when the physical address section becomes visible
  useEffect(() => {
    if (!needsPhysicalAddress) return;
    loadMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsPhysicalAddress]);

  // Robust focus/click activation for custom element
  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    const handle = () => loadMap();
    el.addEventListener("focusin", handle);
    el.addEventListener("click", handle);

    return () => {
      el.removeEventListener("focusin", handle);
      el.removeEventListener("click", handle);
    };
  }, [needsPhysicalAddress]);

  // Cleanup place listener on unmount
  useEffect(() => {
    return () => {
      const el = autocompleteElRef.current;
      if (el && el.__iranconnect_onPlaceSelect) {
        el.removeEventListener("gmp-placeselect", el.__iranconnect_onPlaceSelect);
        delete el.__iranconnect_onPlaceSelect;
      }
      autocompleteElRef.current = null;
    };
  }, []);

  /* ─────────────────────────────
     Remote reset (existing behavior)
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
        service_radius_km: null,
      }));
    }
  }, [mode]);

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">Add New Business (Advanced)</h2>
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

      {/* ─────────────────────────────
         Availability
      ───────────────────────────── */}
      <div className="mb-6">
        <label className="admin-label">Availability type</label>
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
        <label className="admin-label">Availability note</label>
        <textarea
          className="admin-input"
          rows={2}
          value={data.availability_note || ""}
          onChange={(e) => setField("availability_note", e.target.value)}
          placeholder="e.g. Available weekends, emergency calls accepted"
        />
      </div>

      {/* ─────────────────────────────
         Google Map picker (must be immediately after availability note)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">Business location on map *</label>

          {/* Keep size consistent from first render */}
          <div className="admin-input p-0">
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              tabIndex="0"
              style={{
                display: "block",
                width: "100%",
                minHeight: "42px",
                padding: "10px",
              }}
              placeholder="Search address (e.g. 10 Rue Massena, Nice)"
            ></gmp-place-autocomplete>
          </div>

          {/* Show map container when section is visible; map will attach when loaded */}
          <div
            ref={mapRef}
            className="mt-3 h-64 w-full rounded-lg border border-[var(--border)]"
          />
        </div>
      )}

      {/* ─────────────────────────────
         Service radius
      ───────────────────────────── */}
      {needsServiceRadius && (
        <div className="mb-6">
          <label className="admin-label">Service radius (km)</label>
          <input
            type="number"
            className="admin-input"
            value={data.service_radius_km || ""}
            onChange={(e) => setField("service_radius_km", e.target.value)}
            min={0}
          />
        </div>
      )}

      {/* ─────────────────────────────
         Physical address (auto-filled + read-only)
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
              <div style={{ minWidth: 260 }}>
                <Select
                  classNamePrefix="react-select"
                  options={countryOptions}
                  value={countryOptions.find((o) => o.value === phoneCountry) || null}
                  onChange={(opt) => {
                    const next = opt?.value || "FR";
                    setPhoneCountry(next);
                    updatePhoneE164(next, phoneNational);
                  }}
                  isSearchable
                  placeholder="Country code"
                />
              </div>

              <input
                className="admin-input"
                value={phoneNational || ""}
                onChange={(e) => updatePhoneE164(phoneCountry, e.target.value)}
                placeholder="National number (no leading 0) — e.g. 612345678"
                inputMode="numeric"
              />
            </div>

            {!!data.phone && (
              <p className="admin-muted mt-1">Saved format: {data.phone}</p>
            )}

            {errors.phone && <p className="admin-error">{errors.phone}</p>}
          </div>

          <div className="mb-5">
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("email", v);
                validateEmailField(v);
              }}
              placeholder="name@domain.com"
            />
            {errors.email && <p className="admin-error">{errors.email}</p>}
          </div>

          <div className="mb-6">
            <label className="admin-label">Website</label>
            <input
              type="url"
              className="admin-input"
              value={data.website || ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("website", v);
                validateUrlField("website", v);
              }}
              placeholder="https://example.com"
            />
            {errors.website && <p className="admin-error">{errors.website}</p>}
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
            onChange={(e) => setField("show_phone", e.target.checked)}
          />
          Show phone number
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.show_email ?? true}
            onChange={(e) => setField("show_email", e.target.checked)}
          />
          Show email
        </label>
      </div>

      {/* ─────────────────────────────
         Social links (real-time validation + placeholders)
      ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            className="admin-input"
            placeholder="Instagram URL (https://instagram.com/username)"
            value={data.instagram_url || ""}
            onChange={(e) => {
              const v = e.target.value;
              setField("instagram_url", v);
              validateUrlField("instagram_url", v);
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
              const v = e.target.value;
              setField("linkedin_url", v);
              validateUrlField("linkedin_url", v);
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
              const v = e.target.value;
              setField("twitter_url", v);
              validateUrlField("twitter_url", v);
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
              const v = e.target.value;
              setField("telegram_url", v);
              validateUrlField("telegram_url", v);
            }}
          />
          {errors.telegram_url && (
            <p className="admin-error">{errors.telegram_url}</p>
          )}
        </div>

        <input
          className="admin-input"
          placeholder="WhatsApp number (optional)"
          value={data.whatsapp_number || ""}
          onChange={(e) => setField("whatsapp_number", e.target.value)}
        />
      </div>

      {/* ─────────────────────────────
         Navigation
      ───────────────────────────── */}
      <div className="flex justify-between">
        <button className="admin-btn admin-btn-secondary" onClick={onBack}>
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
