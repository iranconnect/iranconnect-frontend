/*frontend/pages/account/delete-business.js*/
'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";   // ✅ مسیر صحیح اصلاح شد

export default function DeleteBusinessRequest() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState("light");
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  /* تم سایت */
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);
    const obs = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme");
      setTheme(newTheme);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  /* واکشی بیزینس‌ها */
  useEffect(() => {
    apiClient
      .get("/requests/owned-businesses")
      .then((res) => setBusinesses(res.data || []))
      .catch(() => {
        setBusinesses([]);
      });
  }, []);

  useEffect(() => {
    if (!router.isReady || businesses.length === 0) {
      return;
    }
  
    const requestedBusinessId = String(
      router.query.businessId || ""
    );
  
    if (!requestedBusinessId) {
      return;
    }
  
    const isOwnedActiveBusiness = businesses.some(
      (business) =>
        String(business.id) === requestedBusinessId
    );
  
    if (isOwnedActiveBusiness) {
      setSelectedBusiness(requestedBusinessId);
    }
  }, [
    router.isReady,
    router.query.businessId,
    businesses,
  ]);

  /* ولیدیشن */
  const validateField = (name, value) => {
    let error = "";
    if (name === "customReason" && reason === "other" && !value.trim())
      error = "Please specify your reason.";
    if (name === "description" && value.length > 0 && value.length < 10)
      error = "Description must be at least 10 characters.";
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (field, value) => {
    if (field === "reason") setReason(value);
    if (field === "customReason") setCustomReason(value);
    if (field === "description") setDescription(value);
    validateField(field, value);
  };

  /* ارسال فرم حذف */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setTicket("");

    const hasErrors = Object.values(errors).some((e) => e);
    if (hasErrors) return setMsg("⚠️ Please fix validation errors before submitting.");
    if (!confirm) return setMsg("Please confirm that your information is accurate.");
    if (!selectedBusiness) return setMsg("Please select a verified business.");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("request_type", "delete");
      fd.append("business_id", selectedBusiness);
      fd.append("payload", JSON.stringify({
        reason: reason === "other" ? customReason : reason,
        description,
      }));

      const res = await apiClient.post("/requests", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Your delete request has been submitted successfully!");
      setTicket(res.data.ticket_code);

      setTimeout(() => window.location.reload(), 10000);

      setReason("");
      setCustomReason("");
      setDescription("");
      setErrors({});
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
    "w-full p-3 rounded-lg border shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
    (theme === "dark"
      ? "bg-[#153b78] text-white placeholder-gray-300 border-gray-600"
      : "bg-[#f5f7fa] text-gray-900 border-gray-300 placeholder-gray-500");

  return (
    <AccountLayout>
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-5xl">
        
          <div className="w-full max-w-5xl mx-auto">
        
            <h2
              className="text-2xl font-bold text-center mb-8"
              style={{ color: "#000000" }}
            >
              🗑️ Request Business Deletion
            </h2>
        
            <div
              className="rounded-2xl p-8 border transition-all duration-300"
              style={cardStyle}
            >
              <div
                className="
                  mb-6 rounded-xl border border-amber-300
                  bg-amber-50 p-4 text-sm leading-6
                  text-amber-950
                "
              >
                <h3 className="font-semibold">
                  What happens when you request deletion?
                </h3>
            
                <p className="mt-2">
                  If your request is approved, your business listing will be removed from IranConnect’s public search, profile pages, reviews, claims, rankings, and search-engine surfaces.
                </p>
            
                <p className="mt-2">
                  The listing will no longer be publicly available. However, its historical records will remain securely stored in the IranConnect database for audit, security, ownership-verification, billing, and operational record-keeping purposes.
                </p>
            
                <p className="mt-3">
                  <strong>
                    Need to restore a previously removed listing?
                  </strong>
                  <br />
                  Please submit a new business request and clearly state that you are requesting restoration of a previously removed IranConnect listing.
                </p>
              </div>
            
              <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select Business */}
            <div>
              <label className="block font-medium mb-1">Business Name</label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className={`${inputClass} appearance-none pr-8`}
                required
              >
                {businesses.length === 0 ? (
                  <option>No verified businesses found</option>
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

            {/* Reason */}
            <div>
              <label className="block font-medium mb-1">Reason for Deletion</label>
              <select
                value={reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                className={`${inputClass} appearance-none pr-8`}
                required
              >
                <option value="">Select reason...</option>
                <option value="closed">Business permanently closed</option>
                <option value="not_owner">I am not the owner/manager</option>
                <option value="other">Other</option>
              </select>
            </div>

            {reason === "other" && (
              <div>
                <input
                  type="text"
                  placeholder="Enter your reason"
                  value={customReason}
                  onChange={(e) => handleChange("customReason", e.target.value)}
                  className={`${inputClass} ${errors.customReason ? "border-red-500" : ""}`}
                />
                {errors.customReason && (
                  <p className="text-red-400 text-sm mt-1">{errors.customReason}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block font-medium mb-1">Notes for Admin</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`${inputClass} ${errors.description ? "border-red-500" : ""}`}
                placeholder="Explain any details for the admin..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Confirm */}
            <label className="flex items-start gap-2 text-sm leading-5">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm that the information above is accurate. I understand that, if approved, this business listing will no longer be publicly available on IranConnect.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise py-3 rounded-lg font-medium hover:bg-turquoise/90 transition-all mt-4"
              style={{ color: "#0b2149" }}
            >
              {loading ? "Submitting..." : "Submit Delete Request"}
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
