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

  /* ================= UI ================= */

  const inputClass =
    "w-full p-3 rounded-lg border shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
    (theme === "dark"
      ? "bg-[#153b78] text-white"
      : "bg-[#f5f7fa] text-gray-900");

  return (
    <AccountLayout>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl p-8 w-full max-w-xl border">

          <h2 className="text-2xl font-semibold text-center mb-6">
            Add New Business Request
          </h2>

          <form className="space-y-6">

            {/* ================= BASIC INFO ================= */}

            <div>
              <h3 className="font-semibold mb-3">Basic Information</h3>

              {/* Business Name */}
              <input
                name="name"
                placeholder="Business name *"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />

              {/* Category */}
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
                <option value="">Select category *</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Subcategories */}
              {form.category_id && (
                <div className="space-y-2">
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
              )}

              {/* Legal Name */}
              <input
                name="legal_name"
                placeholder="Legal name"
                value={form.legal_name}
                onChange={handleChange}
                className={inputClass}
              />

              {/* Business Type */}
              <select
                className={inputClass}
                value={form.business_type}
                onChange={(e) => setField("business_type", e.target.value)}
              >
                <option value="">Business type *</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Year */}
              <input
                type="number"
                placeholder="Year established"
                className={inputClass}
                value={form.year_established}
                onChange={(e) => setField("year_established", e.target.value)}
              />

              {/* Short description */}
              <textarea
                name="short_description"
                maxLength={160}
                placeholder="Short description (max 160)"
                value={form.short_description}
                onChange={handleChange}
                className={inputClass}
              />

              <p className="text-xs">
                {form.short_description.length}/160
              </p>

              {/* Full description */}
              <textarea
                name="full_description"
                placeholder="Full description (min 50)"
                value={form.full_description}
                onChange={handleChange}
                className={inputClass}
              />

              {form.full_description.length < 50 && (
                <p className="text-red-500 text-sm">
                  Minimum 50 characters required
                </p>
              )}
            </div>

            {/* ================= SERVICES ================= */}

            <div>
              <h3 className="font-semibold mb-3">Services & Tags</h3>

              {/* Services */}
              {services.map(s => (
                <label key={s.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.services.includes(s.id)}
                    onChange={() => toggleArray("services", s.id)}
                  />
                  {s.name}
                </label>
              ))}

              {/* Tags */}
              <div className="mt-3">
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
            {/* ================= LOCATION ================= */}

            <div>
              <h3 className="font-semibold mb-3">
                Location, Availability & Contact
              </h3>

              {/* Service Mode */}
              <select
                className={inputClass}
                value={form.service_mode}
                onChange={(e) => setField("service_mode", e.target.value)}
              >
                <option value="">Service mode *</option>
                <option value="on_site">On-site</option>
                <option value="at_home">At customer location</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>

              {/* Availability Type */}
              <select
                className={inputClass}
                value={form.availability_type}
                onChange={(e) => setField("availability_type", e.target.value)}
              >
                <option value="">Availability type *</option>
                <option value="always_open">Always open</option>
                <option value="business_hours">Business hours</option>
                <option value="appointment_only">Appointment only</option>
              </select>

              {/* Availability Note */}
              <textarea
                placeholder="Availability note"
                className={inputClass}
                value={form.availability_note}
                onChange={(e) =>
                  setField("availability_note", e.target.value)
                }
              />

              {/* Location Map */}
              {(form.service_mode === "on_site" ||
                form.service_mode === "hybrid") && (
                <input
                  className={inputClass}
                  placeholder="Google Maps link *"
                  value={form.location_map_url}
                  onChange={(e) =>
                    setField("location_map_url", e.target.value)
                  }
                />
              )}

              {/* Base Location */}
              {(form.service_mode === "at_home" ||
                form.service_mode === "hybrid") && (
                <>
                  <input
                    className={inputClass}
                    placeholder="Service base location (Google Maps link) *"
                    value={form.base_location_map_url}
                    onChange={(e) =>
                      setField("base_location_map_url", e.target.value)
                    }
                  />

                  <p className="text-xs mt-1">
                    This location will be shown as your service starting point.
                    If you have privacy concerns, you may choose an approximate
                    location on Google Maps.
                  </p>
                </>
              )}

              {/* Radius */}
              {(form.service_mode === "at_home" ||
                form.service_mode === "hybrid") && (
                <input
                  type="number"
                  className={inputClass}
                  placeholder="Service radius (km)"
                  value={form.service_radius_km}
                  onChange={(e) =>
                    setField("service_radius_km", e.target.value)
                  }
                />
              )}

              {/* Address */}
              {(form.service_mode === "on_site" ||
                form.service_mode === "hybrid") && (
                <>
                  <textarea
                    className={inputClass}
                    placeholder="Address *"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />

                  <p className="text-xs text-red-500">
                    Please enter the address in this order: Number & Street,
                    Postal code, City, Country
                    <br />
                    Example: 3 Rue Barralis, 06000, Nice, France
                  </p>
                </>
              )}

              {/* Phone */}
              <input
                className={inputClass}
                placeholder="Phone (+337...)"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />

              {/* Email */}
              <input
                className={inputClass}
                placeholder="Email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />

              {/* Website */}
              <input
                className={inputClass}
                placeholder="Website (https://...)"
                value={form.website}
                onChange={(e) => setField("website", e.target.value)}
              />

              {/* Visibility */}
              <div className="flex gap-4 mt-2">
                <label>
                  <input
                    type="checkbox"
                    checked={form.show_phone}
                    onChange={(e) =>
                      setField("show_phone", e.target.checked)
                    }
                  />
                  Show phone number
                </label>

                <label>
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
              <input
                className={inputClass}
                placeholder="Instagram URL"
                onChange={(e) =>
                  setField("instagram_url", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Facebook URL"
                onChange={(e) =>
                  setField("facebook_url", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="LinkedIn URL"
                onChange={(e) =>
                  setField("linkedin_url", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Twitter / X URL"
                onChange={(e) =>
                  setField("twitter_url", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Telegram URL"
                onChange={(e) =>
                  setField("telegram_url", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="WhatsApp number"
                onChange={(e) =>
                  setField("whatsapp_number", e.target.value)
                }
              />
            </div>

            {/* ================= MEDIA ================= */}

            <div>
              <h3 className="font-semibold mb-3">
                Media, Visibility & Compliance
              </h3>

              {/* Logo */}
              <div>
                <label>Business logo *</label>
                <input
                  type="file"
                  onChange={(e) => setOwnershipDoc(e.target.files[0])}
                />
                <p className="text-xs">Recommended size: 500x500</p>
              </div>

              {/* Cover */}
              <div>
                <label>Cover image</label>
                <input
                  type="file"
                  onChange={(e) => setBuildingImage(e.target.files[0])}
                />
                <p className="text-xs">
                  Recommended size: 900x1600
                </p>
              </div>

              {/* Gallery */}
              <div>
                <label>Gallery images (max 10)</label>
                <input type="file" multiple />
                <p className="text-xs">
                  Recommended size: 1200x1200
                </p>
              </div>

              {/* Reviews */}
              <label>
                <input
                  type="checkbox"
                  checked={form.allow_reviews}
                  onChange={(e) =>
                    setField("allow_reviews", e.target.checked)
                  }
                />
                Allow reviews
              </label>

              {/* Confirm */}
              <label>
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                I confirm that I am authorized to manage this business.
              </label>
            </div>

            {/* ================= SUBMIT ================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise py-3 rounded-lg mt-4"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>

            {msg && (
              <p className="text-center mt-3">
                {msg}
                {ticket && <span>Ticket: {ticket}</span>}
              </p>
            )}
          </form>
        </div>
      </main>
    </AccountLayout>
  );
}
