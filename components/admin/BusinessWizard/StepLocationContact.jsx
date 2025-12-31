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
  const [mapLoaded, setMapLoaded] = useState(false);
  
  async function loadMap() {
    if (mapLoaded) return;
    setMapLoaded(true);
  
    if (typeof window !== "undefined" && !window.google) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=beta`;
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
  
    const autocompleteEl = document.getElementById(
      "wizard-location-autocomplete"
    );
    
    autocompleteRef.current = autocompleteEl;
    
    autocompleteEl.addEventListener("gmp-placeselect", (event) => {
      const place = event.place;
      if (!place.location) return;
    
      map.setCenter(place.location);
      map.setZoom(15);
    
      setField("location", place.formattedAddress);
    });

  }

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
         Physical address
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
              onChange={(e) =>
                setField("address", e.target.value)
              }
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
            />
          </div>

          {/* Google Map picker – استفاده از کامپوننت فعلی پروژه */}
          <div className="mb-6">
            <label className="admin-label">
              Business location on map *
            </label>
        
            <gmp-place-autocomplete
              id="wizard-location-autocomplete"
              class="admin-input"
              placeholder="Search business location"
              onFocus={loadMap}
            ></gmp-place-autocomplete>

        
            {mapLoaded && (
              <div
                ref={mapRef}
                className="mt-3 h-64 w-full rounded-lg border border-[var(--border)]"
              />
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────
         Contact info
      ───────────────────────────── */}
      {needsContactInfo && (
        <>
          <div className="mb-5">
            <label className="admin-label">
              Phone
            </label>
            <input
              className="admin-input"
              value={data.phone || ""}
              onChange={(e) =>
                setField("phone", e.target.value)
              }
            />
          </div>

          <div className="mb-5">
            <label className="admin-label">
              Email
            </label>
            <input
              type="email"
              className="admin-input"
              value={data.email || ""}
              onChange={(e) =>
                setField("email", e.target.value)
              }
            />
          </div>

          <div className="mb-6">
            <label className="admin-label">
              Website
            </label>
            <input
              type="url"
              className="admin-input"
              value={data.website || ""}
              onChange={(e) =>
                setField("website", e.target.value)
              }
            />
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
         Social links
      ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          className="admin-input"
          placeholder="Instagram URL"
          value={data.instagram_url || ""}
          onChange={(e) =>
            setField("instagram_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="LinkedIn URL"
          value={data.linkedin_url || ""}
          onChange={(e) =>
            setField("linkedin_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="Twitter / X URL"
          value={data.twitter_url || ""}
          onChange={(e) =>
            setField("twitter_url", e.target.value)
          }
        />
        <input
          className="admin-input"
          placeholder="Telegram"
          value={data.telegram_url || ""}
          onChange={(e) =>
            setField("telegram_url", e.target.value)
          }
        />
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
