//frontend/pages/account/new-business.js
'use client';
import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

export default function NewBusinessRequest() {

  /* ================================
     STATE
  ================================= */
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    sub_category: "",
    subcategory_ids: [],
    services: [],
    tags: [],

    legal_name: "",
    business_type: "",
    year_established: "",

    short_description: "",
    full_description: "",

    country: "",
    city: "",
    address: "",
    postal_code: "",
    map_link: "",

    phone: "",
    email: "",
    website: "",

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
    show_email: true,
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

  /* ================================
     THEME (UNCHANGED)
  ================================= */
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

  /* ================================
     LOAD DATA (ADMIN APIs)
  ================================= */
  useEffect(() => {
    apiClient.get("/admin/categories/all")
      .then(res => setCategories(res.data?.data || []))
      .catch(()=>{});
  }, []);

  useEffect(() => {
    if (!form.category) return;

    apiClient.get("/admin/subcategories", {
      params: { category_id: form.category }
    }).then(res => setSubcategories(res.data?.data || []))
      .catch(()=>{});
  }, [form.category]);

  useEffect(() => {
    if (!form.subcategory_ids.length) return;

    apiClient.get("/admin/services", {
      params: { subcategory_ids: form.subcategory_ids }
    }).then(res => setServices(res.data?.data || []))
      .catch(()=>{});
  }, [form.subcategory_ids]);

  useEffect(() => {
    apiClient.get("/admin/tags/for-business")
      .then(res => setTags(res.data?.data || []))
      .catch(()=>{});
  }, []);

  /* ================================
     VALIDATION (UNCHANGED + EXTENDED)
  ================================= */
  const validateField = (name, value) => {
    let error = "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+\d{6,15}$/;
    const urlRegex = /^https?:\/\//;

    if (name === "email" && value && !emailRegex.test(value))
      error = "Invalid email format";

    if (name === "phone" && value && !phoneRegex.test(value))
      error = "Use +337 format";

    if ((name === "website" || name.includes("_url")) && value && !urlRegex.test(value))
      error = "Must start with https://";

    if (name === "name" && value.trim().length < 3)
      error = "Min 3 characters";

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setForm((p) => ({ ...p, [name]: val }));
    validateField(name, val);
  };

  const toggleArray = (field, id) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(x => x !== id)
        : [...prev[field], id]
    }));
  };

  /* ================================
     SUBMIT (UNCHANGED)
  ================================= */
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

    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Error submitting request.");
    }

    setLoading(false);
  }

  /* ================================
     UI (UNCHANGED STYLE)
  ================================= */
  const cardStyle = {
    background: theme === "dark" ? "#0b2149" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#0a1b2a",
  };

  const inputClass =
    "w-full p-3 rounded-lg border shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
    (theme === "dark"
      ? "bg-[#153b78] text-white placeholder-gray-300 border-gray-600"
      : "bg-[#f5f7fa] text-gray-900 border-gray-300 placeholder-gray-500");

  /* ================================
     RENDER
  ================================= */
  return (
    <AccountLayout>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl p-8 w-full max-w-xl border" style={cardStyle}>

          <h2 className="text-2xl font-semibold text-center mb-6">
            🆕 Add New Business Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* BASIC */}
            <div>
              <h3 className="font-semibold mb-3">Basic Information</h3>
              <div className="space-y-3">
                <input name="name" placeholder="Business Name" onChange={handleChange} className={inputClass}/>
                <input name="legal_name" placeholder="Legal Name" onChange={handleChange} className={inputClass}/>
                <input name="business_type" placeholder="Business Type" onChange={handleChange} className={inputClass}/>
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-3">
                <select name="category" onChange={handleChange} className={inputClass}>
                  <option value="">Select category</option>
                  {categories.map(c=>(
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {subcategories.map(s=>(
                  <label key={s.id} className="flex gap-2 text-sm">
                    <input type="checkbox"
                      onChange={()=>toggleArray("subcategory_ids",s.id)}/>
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <h3 className="font-semibold mb-3">Description</h3>
              <div className="space-y-3">
                <textarea name="short_description" maxLength={160}
                  onChange={handleChange} className={inputClass}/>
                <p className="text-xs">{form.short_description.length}/160</p>

                <textarea name="full_description"
                  onChange={handleChange} className={inputClass}/>
              </div>
            </div>

            {/* SERVICES */}
            <div>
              <h3 className="font-semibold mb-3">Services</h3>
              {services.map(s=>(
                <label key={s.id} className="flex gap-2 text-sm">
                  <input type="checkbox"
                    onChange={()=>toggleArray("services",s.id)}/>
                  {s.name}
                </label>
              ))}
            </div>

            {/* TAGS */}
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              {tags.map(t=>(
                <label key={t.id} className="inline-flex gap-2 mr-3 text-sm">
                  <input type="checkbox"
                    onChange={()=>toggleArray("tags",t.id)}/>
                  {t.name}
                </label>
              ))}
            </div>

            {/* FILES */}
            <div>
              <input type="file" onChange={(e)=>setOwnershipDoc(e.target.files[0])} required />
              <input type="file" onChange={(e)=>setBuildingImage(e.target.files[0])} required />
            </div>

            <label className="flex gap-2 text-sm">
              <input type="checkbox" onChange={(e)=>setConfirm(e.target.checked)} />
              Confirm
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-turquoise py-3 rounded-lg">
              {loading ? "Submitting..." : "Submit"}
            </button>

            {msg && <p className="text-center">{msg}</p>}
            {ticket && <p className="text-center">{ticket}</p>}

          </form>
        </div>
      </main>
    </AccountLayout>
  );
}
