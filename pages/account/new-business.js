//frontend/pages/account/new-business.js
'use client';
import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

export default function NewBusinessRequest() {

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    subcategory_ids: "",

    legal_name: "",
    business_type: "",
    year_established: "",

    short_description: "",
    full_description: "",

    country: "",
    city: "",
    address: "",
    postal_code: "",

    phone: "",
    email: "",
    website: "",
    show_phone: true,
    show_email: false,

    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",
    twitter_url: "",
    telegram_url: "",
    whatsapp_number: "",

    service_mode: "",
    availability_type: "",
    availability_note: "",

    service_radius_km: "",
    location_map_url: "",
    base_location_map_url: "",

    is_public: true,
    allow_reviews: true,

    services: "",
    tags: ""
  });

  const [errors, setErrors] = useState({});
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [buildingImage, setBuildingImage] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState("light");
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🎨 Theme */
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const obs = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme");
      setTheme(newTheme);
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    return () => obs.disconnect();
  }, []);

  /* ✅ Validation */
  const validateField = (name, value) => {
    let error = "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+\d{6,15}$/;
    const urlRegex = /^(https?:\/\/)/;

    if (name === "email" && value && !emailRegex.test(value))
      error = "Invalid email format";

    if (name === "phone" && value && !phoneRegex.test(value))
      error = "Phone must be like +33712345678";

    if ((name === "website" || name === "location_map_url") && value && !urlRegex.test(value))
      error = "Must start with https://";

    if (name === "name" && value.trim().length < 3)
      error = "Business name must be at least 3 characters";

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const val = type === "checkbox" ? checked : value;

    setForm((p) => ({ ...p, [name]: val }));
    validateField(name, val);
  };

  /* 🔥 normalize before submit */
  const normalizeForm = (form) => {
    return {
      ...form,
      subcategory_ids: form.subcategory_ids
        ? form.subcategory_ids.split(",").map(Number)
        : [],
      services: form.services
        ? form.services.split(",").map(Number)
        : [],
      tags: form.tags
        ? form.tags.split(",").map(Number)
        : [],
      year_established: form.year_established
        ? Number(form.year_established)
        : null,
      service_radius_km: form.service_radius_km
        ? Number(form.service_radius_km)
        : null
    };
  };

  /* 📤 Submit */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setTicket("");

    const hasErrors = Object.values(errors).some((e) => e);
    if (hasErrors) return setMsg("⚠️ Fix validation errors.");

    if (!confirm) return setMsg("Please confirm your data.");
    if (!ownershipDoc || !buildingImage)
      return setMsg("Upload required files.");

    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("request_type", "new");
      fd.append("payload", JSON.stringify(normalizeForm(form)));

      fd.append("files", ownershipDoc);
      fd.append("files", buildingImage);

      const res = await apiClient.post("/requests", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setMsg("✅ Request submitted!");
      setTicket(res.data.ticket_code);

      setTimeout(() => window.location.reload(), 10000);

    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Error submitting request.");
    }

    setLoading(false);
  }

  /* 🎨 UI */
  const cardStyle = {
    background: theme === "dark" ? "#0b2149" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#0a1b2a",
  };

  const inputClass =
    "w-full p-3 rounded-lg border shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise " +
    (theme === "dark"
      ? "bg-[#153b78] text-white border-gray-600"
      : "bg-[#f5f7fa] text-gray-900 border-gray-300");

  return (
    <AccountLayout>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl p-8 w-full max-w-xl border" style={cardStyle}>

          <h2 className="text-2xl font-semibold text-center mb-6">
            🆕 Add New Business Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Basic */}
            <input name="name" placeholder="Business Name" onChange={handleChange} className={inputClass} />
            <input name="legal_name" placeholder="Legal Name" onChange={handleChange} className={inputClass} />
            <input name="business_type" placeholder="Business Type" onChange={handleChange} className={inputClass} />

            {/* Category */}
            <input name="category_id" placeholder="Category ID" onChange={handleChange} className={inputClass} />
            <input name="subcategory_ids" placeholder="Subcategories (1,2,3)" onChange={handleChange} className={inputClass} />

            {/* Description */}
            <input name="short_description" placeholder="Short Description" onChange={handleChange} className={inputClass} />
            <textarea name="full_description" placeholder="Full Description" onChange={handleChange} className={inputClass} />

            {/* Location */}
            <input name="country" placeholder="Country" onChange={handleChange} className={inputClass} />
            <input name="city" placeholder="City" onChange={handleChange} className={inputClass} />
            <input name="address" placeholder="Address" onChange={handleChange} className={inputClass} />
            <input name="postal_code" placeholder="Postal Code" onChange={handleChange} className={inputClass} />

            {/* Contact */}
            <input name="phone" placeholder="Phone" onChange={handleChange} className={inputClass} />
            <input name="email" placeholder="Email" onChange={handleChange} className={inputClass} />
            <input name="website" placeholder="Website" onChange={handleChange} className={inputClass} />

            {/* Map */}
            <input name="location_map_url" placeholder="Google Maps URL" onChange={handleChange} className={inputClass} />

            {/* Service */}
            <input name="service_mode" placeholder="service_mode (on_site, remote...)" onChange={handleChange} className={inputClass} />
            <input name="availability_type" placeholder="availability_type" onChange={handleChange} className={inputClass} />
            <textarea name="availability_note" placeholder="Availability note" onChange={handleChange} className={inputClass} />

            {/* Arrays */}
            <input name="services" placeholder="Services IDs (1,2,3)" onChange={handleChange} className={inputClass} />
            <input name="tags" placeholder="Tags IDs (1,2,3)" onChange={handleChange} className={inputClass} />

            {/* Flags */}
            <label className="flex gap-2">
              <input type="checkbox" name="show_phone" checked={form.show_phone} onChange={handleChange} />
              Show Phone
            </label>

            <label className="flex gap-2">
              <input type="checkbox" name="show_email" checked={form.show_email} onChange={handleChange} />
              Show Email
            </label>

            <label className="flex gap-2">
              <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} />
              Public
            </label>

            <label className="flex gap-2">
              <input type="checkbox" name="allow_reviews" checked={form.allow_reviews} onChange={handleChange} />
              Allow Reviews
            </label>

            {/* Files */}
            <input type="file" onChange={(e) => setOwnershipDoc(e.target.files[0])} required />
            <input type="file" onChange={(e) => setBuildingImage(e.target.files[0])} required />

            {/* Confirm */}
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              Confirm data is correct
            </label>

            <button type="submit" disabled={loading} className="w-full bg-turquoise py-3 rounded-lg">
              {loading ? "Submitting..." : "Submit Request"}
            </button>

            {msg && (
              <p className="text-center mt-2">
                {msg}
                {ticket && <span className="block">Ticket: {ticket}</span>}
              </p>
            )}

          </form>
        </div>
      </main>
    </AccountLayout>
  );
}
