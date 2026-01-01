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

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placeListenerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  /* ─────────────────────────────
     ✅ Enterprise UX — Live validation state
     (EXTEND ONLY — no refactor)
  ───────────────────────────── */
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  function touch(field) {
    setTouched((p) => ({ ...p, [field]: true }));
  }

  function setError(field, msg) {
    setErrors((p) => ({ ...p, [field]: msg || "" }));
  }

  function isValidEmail(v) {
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isValidURL(v) {
    if (!v) return true;
    return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v);
  }

  function isValidPhoneE164(v) {
    if (!v) return true;
    return /^\+[1-9]\d{6,14}$/.test(v);
  }

  function validateNow(field, value) {
    if (field === "email") {
      setError(field, isValidEmail(value) ? "" : "Invalid email format.");
      return;
    }

    if (field === "website") {
      setError(field, isValidURL(value) ? "" : "Invalid website URL.");
      return;
    }

    if (
      field === "instagram_url" ||
      field === "linkedin_url" ||
      field === "twitter_url" ||
      field === "telegram_url"
    ) {
      setError(field, isValidURL(value) ? "" : "Invalid URL format.");
      return;
    }

    if (field === "phone") {
      setError(field, isValidPhoneE164(value) ? "" : "Use E.164 format like +33612345678");
      return;
    }
  }

  /* ─────────────────────────────
     ✅ Enterprise UX — Phone country code selector
     (EXTEND ONLY — no dependency)
  ───────────────────────────── */
  const COUNTRY_CALLING_CODES = [
    { label: "France (+33)", value: "+33" },
    { label: "Iran (+98)", value: "+98" },
    { label: "Germany (+49)", value: "+49" },
    { label: "UK (+44)", value: "+44" },
    { label: "USA (+1)", value: "+1" },
    { label: "Canada (+1)", value: "+1" },
    { label: "UAE (+971)", value: "+971" },
    { label: "Turkey (+90)", value: "+90" },
  ];

  const [phoneCode, setPhoneCode] = useState("+33");
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    // keep in sync if data.phone already has value
    if (!data?.phone) return;

    const v = String(data.phone).trim();
    if (!v.startsWith("+")) return;

    // naive split: match known codes first
    const found = COUNTRY_CALLING_CODES
      .map((x) => x.value)
      .sort((a, b) => b.length - a.length)
      .find((code) => v.startsWith(code));

    if (found) {
      setPhoneCode(found);
      setPhoneLocal(v.slice(found.length));
    }
  }, []); // EXTEND ONLY — do not refactor existing behavior

  useEffect(() => {
    // update E.164 phone in data whenever parts change
    if (!phoneLocal) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    const normalizedLocal = String(phoneLocal).replace(/\s+/g, "").replace(/^\+/, "");
    const full = `${phoneCode}${normalizedLocal}`;
    setField("phone", full);
    validateNow("phone", full);
  }, [phoneCode, phoneLocal]); // EXTEND ONLY

  /* ─────────────────────────────
     ✅ Google map + Place Autocomplete (beta)
     (EXTEND ONLY — no refactor)
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

    mapInstanceRef.current = map;

    const autocompleteEl = document.getElementById(
      "wizard-location-autocomplete"
    );

    if (!autocompleteEl) return;

    autocompleteRef.current = autocompleteEl;

    // Remove old listener if any (EXTEND ONLY)
    if (placeListenerRef.current) {
      try {
        autocompleteEl.removeEventListener("gmp-placeselect", placeListenerRef.current);
      } catch {}
      placeListenerRef.current = null;
    }

    const onPlaceSelect = (event) => {
      const place = event.place;
      if (!place) return;

      // place.location is LatLng-like
      if (place.location && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(place.location);
        mapInstanceRef.current.setZoom(15);
      }

      // always store formatted address in location
      setField("location", place.formattedAddress || "");

      // ✅ Auto-fill address fields (readOnly in UI)
      // addressComponents exists in beta place object
      const comps = place.addressComponents || [];
      const getComp = (type) => {
        const c = comps.find((x) => (x.types || []).includes(type));
        return c ? (c.longText || c.shortText || "") : "";
      };

      const country = getComp("country");
      const city =
        getComp("locality") ||
        getComp("postal_town") ||
        getComp("administrative_area_level_2") ||
        getComp("administrative_area_level_1");

      const postal = getComp("postal_code");

      // Construct a human address (street number + route) if available
      const streetNumber = getComp("street_number");
      const route = getComp("route");
      const line1 =
        [streetNumber, route].filter(Boolean).join(" ").trim() ||
        (place.formattedAddress || "");

      setField("country", country);
      setField("city", city);
      setField("postal_code", postal);
      setField("address", line1);
    };

    placeListenerRef.current = onPlaceSelect;

    autocompleteEl.addEventListener("gmp-placeselect", onPlaceSelect, {
      once: false,
    });
  }

  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    const handleFocus = () => loadMap();

    el.addEventListener("focus", handleFocus);

    return () => {
      el.removeEventListener("focus", handleFocus);
    };
  }, [needsPhysicalAddress]);

  useEffect(() => {
    return () => {
      // cleanup listeners (EXTEND ONLY)
      if (autocompleteRef.current && placeListenerRef.current) {
        try {
          autocompleteRef.current.removeEventListener(
            "gmp-placeselect",
            placeListenerRef.current
          );
        } catch {}
        placeListenerRef.current = null;
      }

      if (autocompleteRef.current) {
        autocompleteRef.current.replaceWith(
          autocompleteRef.current.cloneNode(true)
        );
        autocompleteRef.current = null;
      }

      mapInstanceRef.current = null;
    };
  }, []);

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

  // ─────────────────────────────
  // ✅ Enterprise UX — keep errors updated live (EXTEND ONLY)
  // ─────────────────────────────
  useEffect(() => {
    validateNow("email", data.email || "");
  }, [data.email]);

  useEffect(() => {
    validateNow("website", data.website || "");
  }, [data.website]);

  useEffect(() => {
    validateNow("instagram_url", data.instagram_url || "");
  }, [data.instagram_url]);

  useEffect(() => {
    validateNow("linkedin_url", data.linkedin_url || "");
  }, [data.linkedin_url]);

  useEffect(() => {
    validateNow("twitter_url", data.twitter_url || "");
  }, [data.twitter_url]);

  useEffect(() => {
    validateNow("telegram_url", data.telegram_url || "");
  }, [data.telegram_url]);
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

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placeListenerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  /* ─────────────────────────────
     ✅ Enterprise UX — Live validation state
     (EXTEND ONLY — no refactor)
  ───────────────────────────── */
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  function touch(field) {
    setTouched((p) => ({ ...p, [field]: true }));
  }

  function setError(field, msg) {
    setErrors((p) => ({ ...p, [field]: msg || "" }));
  }

  function isValidEmail(v) {
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isValidURL(v) {
    if (!v) return true;
    return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v);
  }

  function isValidPhoneE164(v) {
    if (!v) return true;
    return /^\+[1-9]\d{6,14}$/.test(v);
  }

  function validateNow(field, value) {
    if (field === "email") {
      setError(field, isValidEmail(value) ? "" : "Invalid email format.");
      return;
    }

    if (field === "website") {
      setError(field, isValidURL(value) ? "" : "Invalid website URL.");
      return;
    }

    if (
      field === "instagram_url" ||
      field === "linkedin_url" ||
      field === "twitter_url" ||
      field === "telegram_url"
    ) {
      setError(field, isValidURL(value) ? "" : "Invalid URL format.");
      return;
    }

    if (field === "phone") {
      setError(field, isValidPhoneE164(value) ? "" : "Use E.164 format like +33612345678");
      return;
    }
  }

  /* ─────────────────────────────
     ✅ Enterprise UX — Phone country code selector
     (EXTEND ONLY — no dependency)
  ───────────────────────────── */
  const COUNTRY_CALLING_CODES = [
    { label: "France (+33)", value: "+33" },
    { label: "Iran (+98)", value: "+98" },
    { label: "Germany (+49)", value: "+49" },
    { label: "UK (+44)", value: "+44" },
    { label: "USA (+1)", value: "+1" },
    { label: "Canada (+1)", value: "+1" },
    { label: "UAE (+971)", value: "+971" },
    { label: "Turkey (+90)", value: "+90" },
  ];

  const [phoneCode, setPhoneCode] = useState("+33");
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    // keep in sync if data.phone already has value
    if (!data?.phone) return;

    const v = String(data.phone).trim();
    if (!v.startsWith("+")) return;

    // naive split: match known codes first
    const found = COUNTRY_CALLING_CODES
      .map((x) => x.value)
      .sort((a, b) => b.length - a.length)
      .find((code) => v.startsWith(code));

    if (found) {
      setPhoneCode(found);
      setPhoneLocal(v.slice(found.length));
    }
  }, []); // EXTEND ONLY — do not refactor existing behavior

  useEffect(() => {
    // update E.164 phone in data whenever parts change
    if (!phoneLocal) {
      setField("phone", "");
      setError("phone", "");
      return;
    }

    const normalizedLocal = String(phoneLocal).replace(/\s+/g, "").replace(/^\+/, "");
    const full = `${phoneCode}${normalizedLocal}`;
    setField("phone", full);
    validateNow("phone", full);
  }, [phoneCode, phoneLocal]); // EXTEND ONLY

  /* ─────────────────────────────
     ✅ Google map + Place Autocomplete (beta)
     (EXTEND ONLY — no refactor)
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

    mapInstanceRef.current = map;

    const autocompleteEl = document.getElementById(
      "wizard-location-autocomplete"
    );

    if (!autocompleteEl) return;

    autocompleteRef.current = autocompleteEl;

    // Remove old listener if any (EXTEND ONLY)
    if (placeListenerRef.current) {
      try {
        autocompleteEl.removeEventListener("gmp-placeselect", placeListenerRef.current);
      } catch {}
      placeListenerRef.current = null;
    }

    const onPlaceSelect = (event) => {
      const place = event.place;
      if (!place) return;

      // place.location is LatLng-like
      if (place.location && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(place.location);
        mapInstanceRef.current.setZoom(15);
      }

      // always store formatted address in location
      setField("location", place.formattedAddress || "");

      // ✅ Auto-fill address fields (readOnly in UI)
      // addressComponents exists in beta place object
      const comps = place.addressComponents || [];
      const getComp = (type) => {
        const c = comps.find((x) => (x.types || []).includes(type));
        return c ? (c.longText || c.shortText || "") : "";
      };

      const country = getComp("country");
      const city =
        getComp("locality") ||
        getComp("postal_town") ||
        getComp("administrative_area_level_2") ||
        getComp("administrative_area_level_1");

      const postal = getComp("postal_code");

      // Construct a human address (street number + route) if available
      const streetNumber = getComp("street_number");
      const route = getComp("route");
      const line1 =
        [streetNumber, route].filter(Boolean).join(" ").trim() ||
        (place.formattedAddress || "");

      setField("country", country);
      setField("city", city);
      setField("postal_code", postal);
      setField("address", line1);
    };

    placeListenerRef.current = onPlaceSelect;

    autocompleteEl.addEventListener("gmp-placeselect", onPlaceSelect, {
      once: false,
    });
  }

  useEffect(() => {
    if (!needsPhysicalAddress) return;

    const el = document.getElementById("wizard-location-autocomplete");
    if (!el) return;

    const handleFocus = () => loadMap();

    el.addEventListener("focus", handleFocus);

    return () => {
      el.removeEventListener("focus", handleFocus);
    };
  }, [needsPhysicalAddress]);

  useEffect(() => {
    return () => {
      // cleanup listeners (EXTEND ONLY)
      if (autocompleteRef.current && placeListenerRef.current) {
        try {
          autocompleteRef.current.removeEventListener(
            "gmp-placeselect",
            placeListenerRef.current
          );
        } catch {}
        placeListenerRef.current = null;
      }

      if (autocompleteRef.current) {
        autocompleteRef.current.replaceWith(
          autocompleteRef.current.cloneNode(true)
        );
        autocompleteRef.current = null;
      }

      mapInstanceRef.current = null;
    };
  }, []);

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

  // ─────────────────────────────
  // ✅ Enterprise UX — keep errors updated live (EXTEND ONLY)
  // ─────────────────────────────
  useEffect(() => {
    validateNow("email", data.email || "");
  }, [data.email]);

  useEffect(() => {
    validateNow("website", data.website || "");
  }, [data.website]);

  useEffect(() => {
    validateNow("instagram_url", data.instagram_url || "");
  }, [data.instagram_url]);

  useEffect(() => {
    validateNow("linkedin_url", data.linkedin_url || "");
  }, [data.linkedin_url]);

  useEffect(() => {
    validateNow("twitter_url", data.twitter_url || "");
  }, [data.twitter_url]);

  useEffect(() => {
    validateNow("telegram_url", data.telegram_url || "");
  }, [data.telegram_url]);
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
            setField("availability_note", e.target.value)
          }
          placeholder="e.g. Available weekends, emergency calls accepted"
        />
      </div>

      {/* ─────────────────────────────
         Enterprise UX — Location first (source of truth)
      ───────────────────────────── */}
      {needsPhysicalAddress && (
        <div className="mb-6">
          <label className="admin-label">
            Business location on map *
          </label>

          <gmp-place-autocomplete
            id="wizard-location-autocomplete"
            class="admin-input"
            tabindex="0"
            placeholder="Search business location"
          ></gmp-place-autocomplete>

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
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────
         Contact info
      ───────────────────────────── */}
      {needsContactInfo && (
        <>
          {/* Phone with country code */}
          <div className="mb-5">
            <label className="admin-label">
              Phone
            </label>

            <div className="flex gap-2">
              <select
                className="admin-input w-[160px]"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
              >
                {COUNTRY_CALLING_CODES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                className="admin-input flex-1"
                placeholder="612345678"
                value={phoneLocal}
                onChange={(e) => {
                  setPhoneLocal(e.target.value);
                  touch("phone");
                }}
                onBlur={() => touch("phone")}
              />
            </div>

            {touched.phone && errors.phone && (
              <p className="admin-error mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="admin-label">
              Email
            </label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) => {
                setField("email", e.target.value);
                touch("email");
              }}
              onBlur={() => touch("email")}
            />
            {touched.email && errors.email && (
              <p className="admin-error mt-1">
                {errors.email}
              </p>
            )}
          </div>

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
                touch("website");
              }}
              onBlur={() => touch("website")}
            />
            {touched.website && errors.website && (
              <p className="admin-error mt-1">
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
         Social links (validated in realtime)
      ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            className="admin-input"
            placeholder="Instagram URL"
            value={data.instagram_url || ""}
            onChange={(e) => {
              setField("instagram_url", e.target.value);
              touch("instagram");
            }}
            onBlur={() => touch("instagram")}
          />
          {touched.instagram && errors.instagram && (
            <p className="admin-error mt-1">
              {errors.instagram}
            </p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="LinkedIn URL"
            value={data.linkedin_url || ""}
            onChange={(e) => {
              setField("linkedin_url", e.target.value);
              touch("linkedin");
            }}
            onBlur={() => touch("linkedin")}
          />
          {touched.linkedin && errors.linkedin && (
            <p className="admin-error mt-1">
              {errors.linkedin}
            </p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="Twitter / X URL"
            value={data.twitter_url || ""}
            onChange={(e) => {
              setField("twitter_url", e.target.value);
              touch("twitter");
            }}
            onBlur={() => touch("twitter")}
          />
          {touched.twitter && errors.twitter && (
            <p className="admin-error mt-1">
              {errors.twitter}
            </p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="Telegram"
            value={data.telegram_url || ""}
            onChange={(e) => {
              setField("telegram_url", e.target.value);
              touch("telegram");
            }}
            onBlur={() => touch("telegram")}
          />
          {touched.telegram && errors.telegram && (
            <p className="admin-error mt-1">
              {errors.telegram}
            </p>
          )}
        </div>

        <div>
          <input
            className="admin-input"
            placeholder="WhatsApp number"
            value={data.whatsapp_number || ""}
            onChange={(e) => {
              setField("whatsapp_number", e.target.value);
              touch("whatsapp");
            }}
            onBlur={() => touch("whatsapp")}
          />
          {touched.whatsapp && errors.whatsapp && (
            <p className="admin-error mt-1">
              {errors.whatsapp}
            </p>
          )}
        </div>
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
          disabled={!canProceed || hasErrors}
        >
          Next
        </button>
      </div>
    </div>
  );
}
