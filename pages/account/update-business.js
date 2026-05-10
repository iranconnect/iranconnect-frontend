/*frontend/pages/account/update-business.js*/
'use client';
import { useEffect, useState } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient"; // ✅ مسیر صحیح

export default function UpdateBusinessRequest() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [form, setForm] = useState({
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
  });
  const [errors, setErrors] = useState({});
  const [buildingImage, setBuildingImage] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState("light");
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🎨 تم سایت */
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const obs = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => obs.disconnect();
  }, []);

  /* 🧩 واکشی بیزینس‌های تایید شده */
  useEffect(() => {
    // دیگر localStorage استفاده نمی‌کنیم. سشن از طریق کوکی HttpOnly مدیریت می‌شود.

    apiClient
      .get("/requests/owned-businesses")
      .then((res) => setBusinesses(res.data || []))
      .catch(() => {
        // اگر سشن نامعتبر باشد، apiClient خودش logout امن انجام می‌دهد
        setBusinesses([]);
      });
  }, []);

  /* ⬇️ بقیه کدها بدون کوچک‌ترین تغییر (UI/UX/logic untouched) */
  
  const validateField = (name, value) => {
    let error = "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+\d{6,15}$/;
    const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/.*)?$/;

    if (name === "email" && value && !emailRegex.test(value))
      error = "Invalid email format (example@mail.com)";

    if (name === "phone" && value && !phoneRegex.test(value))
      error = "Use +33712345678 format (no 0)";

    if (name === "website" && value && !urlRegex.test(value))
      error = "Website must start with https://";

    if (name === "map_link" && value && !value.startsWith("https://maps"))
      error = "Must be a valid Google Maps link";

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setTicket("");

    const hasErrors = Object.values(errors).some((e) => e);
    if (hasErrors)
      return setMsg("⚠️ Please fix validation errors before submitting.");

    if (!confirm)
      return setMsg("Please confirm that the information is accurate.");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("request_type", "update");
      fd.append("business_id", selectedBusiness);
      fd.append("payload", JSON.stringify(form));

      if (buildingImage) {
        fd.append("files", buildingImage);
      }

      const res = await apiClient.post("/requests", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMsg("✅ Your update request has been submitted successfully!");
      setTicket(res.data.ticket_code);

      setTimeout(() => window.location.reload(), 10000);

      setForm({
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
      });

      setErrors({});
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
    borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    boxShadow:
      theme === "dark"
        ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
        : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
  };

  const inputClass =
    "w-full p-3 rounded-lg border border-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
    (theme === "dark"
      ? "bg-[#153b78] text-white placeholder-gray-300"
      : "bg-[#f5f7fa] text-gray-900 placeholder-gray-500");

  return (
    <AccountLayout>
      <main className="flex-1 px-4 py-6 md:py-8">
  
        <div className="mx-auto w-full max-w-5xl">
  
          <div className="w-full max-w-5xl mx-auto">
  
            <h2
              className="text-2xl font-bold text-center mb-8"
              style={{ color: "#000000" }}
            >
              ✏️ Update Your Business Information
            </h2>
  
            <div
              className="rounded-2xl p-8 w-full border transition-all duration-300"
              style={cardStyle}
            >
  
              <form onSubmit={handleSubmit} className="space-y-4">
  
                <div>
                  <label className="block font-medium mb-1">
                    Business Name
                  </label>
  
                  <select
                    name="business_id"
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    className={`${inputClass} appearance-none pr-8`}
                    required
                  >
                    {businesses.length === 0 ? (
                      <option>
                        No verified businesses found for your account
                      </option>
                    ) : (
                      <>
                        <option value="">Select a business...</option>
  
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
  
                {/* فیلدهای فرم */}
                {Object.keys(form).map((f) => (
                  <div key={f}>
                    <label className="block font-medium capitalize mb-1">
                      {f.replace("_", " ")}
                    </label>
  
                    <input
                      name={f}
                      value={form[f]}
                      onChange={handleChange}
                      className={`${inputClass} ${
                        errors[f] ? "border-red-500" : ""
                      }`}
                      placeholder={`Enter ${f.replace("_", " ")}`}
                    />
  
                    {errors[f] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[f]}
                      </p>
                    )}
                  </div>
                ))}
  
                <div>
                  <label className="block font-medium mb-1">
                    Building Photo (optional)
                  </label>
  
                  <input
                    type="file"
                    onChange={(e) => setBuildingImage(e.target.files[0])}
                    className="w-full text-sm"
                    accept="image/*"
                  />
                </div>
  
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={confirm}
                    onChange={(e) => setConfirm(e.target.checked)}
                  />
  
                  I confirm that the information entered above is accurate.
                </label>
  
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-turquoise py-3 rounded-lg font-medium hover:bg-turquoise/90 transition-all mt-4"
                  style={{ color: "#0b2149" }}
                >
                  {loading ? "Submitting..." : "Submit Update Request"}
                </button>
  
                {msg && (
                  <p className="text-center text-sm mt-3 text-[var(--text)]">
                    {msg}
  
                    {ticket && (
                      <span className="block font-semibold text-turquoise mt-1">
                        Ticket: {ticket}
                      </span>
                    )}
                  </p>
                )}
  
              </form>
  
            </div>
  
          </div>
  
        </div>
  
      </main>
    </AccountLayout>
  );
}
