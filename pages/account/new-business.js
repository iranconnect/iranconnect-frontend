//frontend/pages/account/new-business.js
'use client';
import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";
import categoriesData from "../../data/categories";

export default function NewBusinessRequest() {

  const [form, setForm] = useState({
    name: "",
    category: "",
    sub_category: "",
    country: "",
    city: "",
    address: "",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    map_link: "",
    description: "",

    // ✅ NEW FIELDS
    legal_name: "",
    business_type: "",
    year_established: "",

    short_description: "",
    full_description: "",

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

    show_phone: true,
    show_email: false,
    is_public: true,
    allow_reviews: true,
  });

  const [errors, setErrors] = useState({});
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [buildingImage, setBuildingImage] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState("light");
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🎨 تم */
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

  /* ✅ ولیدیشن */
  const validateField = (name, value) => {
    let error = "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+\d{6,15}$/;
    const urlRegex = /^(https?:\/\/)/;

    if (name === "email" && value && !emailRegex.test(value))
      error = "Invalid email format";

    if (name === "phone" && value && !phoneRegex.test(value))
      error = "Use +33712345678 format";

    if (name === "website" && value && !urlRegex.test(value))
      error = "Website must start with https://";

    if (name === "map_link" && value && !value.startsWith("https://maps"))
      error = "Must be valid Google Maps link";

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

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setTicket("");

    const hasErrors = Object.values(errors).some((e) => e);
    if (hasErrors) return setMsg("⚠️ Please fix validation errors before submitting.");
    if (!confirm) return setMsg("Please confirm that your information is accurate.");
    if (!ownershipDoc || !buildingImage) return setMsg("Please upload both required files.");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("request_type", "new");
      fd.append("payload", JSON.stringify(form));
      fd.append("files", ownershipDoc);
      fd.append("files", buildingImage);

      const res = await apiClient.post("/requests", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setMsg("✅ Your new business request has been submitted successfully!");
      setTicket(res.data.ticket_code);

      setTimeout(() => window.location.reload(), 10000);

      setForm({
        name: "", category: "", sub_category: "", country: "", city: "",
        address: "", postal_code: "", phone: "", email: "", website: "", map_link: "", description: "",
      });

      setErrors({});
      setOwnershipDoc(null);
      setBuildingImage(null);
      setConfirm(false);

    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Error submitting request.");
    }

    setLoading(false);
  }

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

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 🔹 BASIC */}
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <input name="name" placeholder="Business Name" onChange={handleChange} className={inputClass} />
              <input name="legal_name" placeholder="Legal Name" onChange={handleChange} className={inputClass} />
              <input name="business_type" placeholder="Business Type" onChange={handleChange} className={inputClass} />
            </div>

            {/* 🔹 CATEGORY */}
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <select name="category" onChange={handleChange} className={inputClass}>
                <option value="">Select category</option>
                {categoriesData.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select name="sub_category" onChange={handleChange} className={inputClass}>
                <option value="">Select subcategory</option>
                {categoriesData
                  .find(c => c.name === form.category)?.subcategories?.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
              </select>
            </div>

            {/* 🔹 DESCRIPTION */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <input name="short_description" placeholder="Short description" onChange={handleChange} className={inputClass} />
              <textarea name="full_description" placeholder="Full description" onChange={handleChange} className={inputClass} />
            </div>

            {/* 🔹 LOCATION */}
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <input name="country" placeholder="Country" onChange={handleChange} className={inputClass} />
              <input name="city" placeholder="City" onChange={handleChange} className={inputClass} />
              <input name="address" placeholder="Address" onChange={handleChange} className={inputClass} />
              <input name="postal_code" placeholder="Postal Code" onChange={handleChange} className={inputClass} />
              <input name="map_link" placeholder="Google Maps Link" onChange={handleChange} className={inputClass} />
            </div>

            {/* 🔹 CONTACT */}
            <div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <input name="phone" placeholder="Phone" onChange={handleChange} className={inputClass} />
              <input name="email" placeholder="Email" onChange={handleChange} className={inputClass} />
              <input name="website" placeholder="Website" onChange={handleChange} className={inputClass} />
            </div>

            {/* 🔹 SOCIAL */}
            <div>
              <h3 className="font-semibold mb-2">Social Media</h3>
              <input name="instagram_url" placeholder="Instagram URL" onChange={handleChange} className={inputClass} />
              <input name="facebook_url" placeholder="Facebook URL" onChange={handleChange} className={inputClass} />
              <input name="linkedin_url" placeholder="LinkedIn URL" onChange={handleChange} className={inputClass} />
            </div>

            {/* 🔹 FILES */}
            <div>
              <label>Proof of Ownership</label>
              <input type="file" onChange={(e) => setOwnershipDoc(e.target.files[0])} required />
            </div>

            <div>
              <label>Building Photo</label>
              <input type="file" onChange={(e) => setBuildingImage(e.target.files[0])} required />
            </div>

            {/* 🔹 CONFIRM */}
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              I confirm that the information provided above is accurate.
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
