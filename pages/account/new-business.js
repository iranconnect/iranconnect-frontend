//frontend/pages/account/new-business.js
'use client';

import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

const BUSINESS_TYPES = [
  { value: "freelancer", label: "Freelancer / Self-employed" },
  { value: "company", label: "Registered Company" },
  { value: "clinic", label: "Clinic / Office" },
  { value: "shop", label: "Physical Shop" },
  { value: "online", label: "Online Business" },
];

export default function NewBusinessRequest() {

  /* ================= STATE ================= */

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    subcategory_ids: [],

    legal_name: "",
    business_type: "",
    year_established: "",
    short_description: "",
    full_description: "",

    services: [],
    tags: [],
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);

  const [errors, setErrors] = useState({});
  const [theme, setTheme] = useState("light");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [buildingImage, setBuildingImage] = useState(null);

  /* ================= THEME ================= */

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const obs = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme");
      setTheme(newTheme);
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => obs.disconnect();
  }, []);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    apiClient.get("/admin/categories/all")
      .then(res => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      return;
    }

    apiClient.get("/admin/subcategories", {
      params: { category_id: form.category_id }
    })
      .then(res => setSubcategories(res.data?.data || []))
      .catch(() => setSubcategories([]));
  }, [form.category_id]);

  useEffect(() => {
    if (!form.subcategory_ids.length) {
      setServices([]);
      return;
    }

    apiClient.get("/admin/services", {
      params: { subcategory_ids: form.subcategory_ids }
    })
      .then(res => setServices(res.data?.data || []))
      .catch(() => setServices([]));
  }, [form.subcategory_ids]);

  useEffect(() => {
    apiClient.get("/admin/tags/for-business")
      .then(res => setTags(res.data?.data || []))
      .catch(() => setTags([]));
  }, []);

  /* ================= HELPERS ================= */

  const setField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArray = (key, id) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter(x => x !== id)
        : [...prev[key], id]
    }));
  };

  /* ================= VALIDATION ================= */

  const validateField = (name, value) => {
    let error = "";

    if (name === "name" && value.trim().length < 3) {
      error = "Minimum 3 characters required";
    }

    if (name === "short_description") {
      if (value.length > 160) error = "Max 160 characters";
    }

    if (name === "full_description") {
      if (value.trim().length < 50)
        error = "Minimum 50 characters required";
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
    validateField(name, value);
  };

/* ================= UI HELPERS ================= */

const sectionStyle = {
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  background: theme === "dark" ? "#0b2149" : "#ffffff",
};

const labelClass = "block text-sm font-medium mb-1";
const fieldWrap = "mb-4";

/* ================= UI ================= */

return (
  <AccountLayout>
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Add New Business Request
        </h2>

        <form onSubmit={handleSubmit}>

          {/* ================= BASIC INFO ================= */}
          <div style={sectionStyle}>
            <h3 className="font-semibold mb-4">
              Basic Information
            </h3>

            {/* Business Name */}
            <div className={fieldWrap}>
              <label className={labelClass}>Business name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                placeholder="Enter business name"
              />
              {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className={fieldWrap}>
              <label className={labelClass}>Business category *</label>
              <select
                className={inputClass}
                value={form.category_id}
                onChange={(e) => {
                  setForm(prev => ({
                    ...prev,
                    category_id: e.target.value,
                    subcategory_ids: []
                  }));
                }}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategories */}
            {form.category_id && (
              <div className={fieldWrap}>
                <label className={labelClass}>Subcategories *</label>

                <div className="grid gap-2">
                  {subcategories.map(sub => (
                    <label key={sub.id} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.subcategory_ids.includes(sub.id)}
                        onChange={() => toggleArray("subcategory_ids", sub.id)}
                      />
                      {sub.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Name */}
            <div className={fieldWrap}>
              <label className={labelClass}>Legal name</label>
              <input
                name="legal_name"
                value={form.legal_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Business Type */}
            <div className={fieldWrap}>
              <label className={labelClass}>Business type *</label>
              <select
                className={inputClass}
                value={form.business_type}
                onChange={(e) => setField("business_type", e.target.value)}
              >
                <option value="">Select type</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className={fieldWrap}>
              <label className={labelClass}>Year established</label>
              <input
                type="number"
                className={inputClass}
                value={form.year_established}
                onChange={(e) => setField("year_established", e.target.value)}
              />
            </div>

            {/* Short description */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Short description * (max 160)
              </label>
              <textarea
                name="short_description"
                maxLength={160}
                value={form.short_description}
                onChange={handleChange}
                className={inputClass}
              />
              <p className="text-xs mt-1">
                {form.short_description.length}/160
              </p>
            </div>

            {/* Full description */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Full description * (min 50)
              </label>
              <textarea
                name="full_description"
                value={form.full_description}
                onChange={handleChange}
                className={inputClass}
              />
              {form.full_description.length < 50 && (
                <p className="text-red-500 text-sm mt-1">
                  Minimum 50 characters required
                </p>
              )}
            </div>
          </div>
          {/* ================= SERVICES & TAGS ================= */}
          <div style={sectionStyle}>
            <h3 className="font-semibold mb-4">
              Services & Tags
            </h3>

            {/* Services */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Services offered *
              </label>

              {services.length === 0 ? (
                <p className="text-sm opacity-60">
                  Select subcategories first
                </p>
              ) : (
                <div className="grid gap-2">
                  {services.map(s => (
                    <label key={s.id} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.services.includes(s.id)}
                        onChange={() => toggleArray("services", s.id)}
                      />
                      <span title={s.description}>{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Tags (optional)
              </label>

              <div className="flex flex-wrap gap-3">
                {tags.map(t => (
                  <label key={t.id} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.tags.includes(t.id)}
                      onChange={() => toggleArray("tags", t.id)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          </div>


          {/* ================= LOCATION ================= */}
          <div style={sectionStyle}>
            <h3 className="font-semibold mb-4">
              Location, Availability & Contact
            </h3>

            {/* Service Mode */}
            <div className={fieldWrap}>
              <label className={labelClass}>Service mode *</label>
              <select
                className={inputClass}
                value={form.service_mode}
                onChange={(e) => setField("service_mode", e.target.value)}
              >
                <option value="">Select service mode</option>
                <option value="on_site">On-site</option>
                <option value="at_home">At customer location</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Availability */}
            <div className={fieldWrap}>
              <label className={labelClass}>Availability type *</label>
              <select
                className={inputClass}
                value={form.availability_type}
                onChange={(e) => setField("availability_type", e.target.value)}
              >
                <option value="">Select</option>
                <option value="always_open">Always open</option>
                <option value="business_hours">Business hours</option>
                <option value="appointment_only">Appointment only</option>
              </select>
            </div>

            {/* Availability Note */}
            <div className={fieldWrap}>
              <label className={labelClass}>Availability note</label>
              <textarea
                className={inputClass}
                value={form.availability_note}
                onChange={(e) =>
                  setField("availability_note", e.target.value)
                }
              />
            </div>

            {/* Location Map */}
            {(form.service_mode === "on_site" ||
              form.service_mode === "hybrid") && (
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Business location (Google Maps link) *
                </label>
                <input
                  className={inputClass}
                  value={form.location_map_url}
                  onChange={(e) =>
                    setField("location_map_url", e.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>
            )}

            {/* Base Location */}
            {(form.service_mode === "at_home" ||
              form.service_mode === "hybrid") && (
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Service base location (Google Maps link) *
                </label>

                <input
                  className={inputClass}
                  value={form.base_location_map_url}
                  onChange={(e) =>
                    setField("base_location_map_url", e.target.value)
                  }
                />

                <p className="text-xs mt-1 opacity-70">
                  This location will be shown as your service starting point.
                  If you have privacy concerns, you may choose an approximate
                  location on Google Maps.
                </p>
              </div>
            )}

            {/* Radius */}
            {(form.service_mode === "at_home" ||
              form.service_mode === "hybrid") && (
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Service radius (km)
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.service_radius_km}
                  onChange={(e) =>
                    setField("service_radius_km", e.target.value)
                  }
                />
              </div>
            )}

            {/* Address */}
            {(form.service_mode === "on_site" ||
              form.service_mode === "hybrid") && (
              <div className={fieldWrap}>
                <label className={labelClass}>Address *</label>
                <textarea
                  className={inputClass}
                  value={form.address}
                  onChange={(e) =>
                    setField("address", e.target.value)
                  }
                />

                <p className="text-xs text-red-500 mt-1">
                  Please enter the address in this order:
                  Number & Street, Postal code, City, Country
                  <br />
                  Example: 3 Rue Barralis, 06000, Nice, France
                </p>
              </div>
            )}

            {/* Phone */}
            <div className={fieldWrap}>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                placeholder="National number (no leading 0)"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            {/* Email */}
            <div className={fieldWrap}>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            {/* Website */}
            <div className={fieldWrap}>
              <label className={labelClass}>Website</label>
              <input
                className={inputClass}
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setField("website", e.target.value)}
              />
            </div>

            {/* Visibility */}
            <div className="flex gap-6 mt-2 mb-4">
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.show_phone}
                  onChange={(e) =>
                    setField("show_phone", e.target.checked)
                  }
                />
                Show phone number
              </label>

              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.show_email}
                  onChange={(e) =>
                    setField("show_email", e.target.checked)
                  }
                />
                Show email
              </label>
            </div>

            {/* Socials */}
            <div className="grid gap-3">
              <input className={inputClass} placeholder="Instagram URL"
                onChange={(e)=>setField("instagram_url", e.target.value)} />
              <input className={inputClass} placeholder="Facebook URL"
                onChange={(e)=>setField("facebook_url", e.target.value)} />
              <input className={inputClass} placeholder="LinkedIn URL"
                onChange={(e)=>setField("linkedin_url", e.target.value)} />
              <input className={inputClass} placeholder="Twitter / X URL"
                onChange={(e)=>setField("twitter_url", e.target.value)} />
              <input className={inputClass} placeholder="Telegram URL"
                onChange={(e)=>setField("telegram_url", e.target.value)} />
              <input className={inputClass} placeholder="WhatsApp number"
                onChange={(e)=>setField("whatsapp_number", e.target.value)} />
            </div>
          </div>
          {/* ================= MEDIA ================= */}
          <div style={sectionStyle}>
            <h3 className="font-semibold mb-4">
              Media, Visibility & Compliance
            </h3>

            {/* Logo */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Business logo *
              </label>

              <input
                type="file"
                onChange={(e) => setOwnershipDoc(e.target.files[0])}
                className="w-full text-sm"
              />

              <p className="text-xs mt-1 opacity-70">
                Recommended size: 500 × 500
              </p>
            </div>

            {/* Cover */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Cover image
              </label>

              <input
                type="file"
                onChange={(e) => setBuildingImage(e.target.files[0])}
                className="w-full text-sm"
              />

              <p className="text-xs mt-1 opacity-70">
                Recommended size: 900 × 1600
              </p>
            </div>

            {/* Gallery */}
            <div className={fieldWrap}>
              <label className={labelClass}>
                Gallery images (max 10)
              </label>

              <input
                type="file"
                multiple
                className="w-full text-sm"
              />

              <p className="text-xs mt-1 opacity-70">
                Recommended size: 1200 × 1200
              </p>
            </div>

            {/* Allow Reviews */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.allow_reviews}
                  onChange={(e) =>
                    setField("allow_reviews", e.target.checked)
                  }
                />
                Allow reviews
              </label>
            </div>

            {/* Confirm */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                I confirm that I am authorized to manage this business.
              </label>
            </div>
          </div>

          {/* ================= SUBMIT ================= */}
          <div style={sectionStyle}>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise py-3 rounded-lg font-medium hover:bg-turquoise/90 transition-all"
              style={{ color: "#0b2149" }}
            >
              {loading ? "Submitting..." : "Submit New Business Request"}
            </button>

            {msg && (
              <p className="text-center text-sm mt-3">
                {msg}
                {ticket && (
                  <span className="block font-semibold text-turquoise mt-1">
                    Ticket: {ticket}
                  </span>
                )}
              </p>
            )}

          </div>

        </form>
      </div>
    </main>
  </AccountLayout>
  );
}
