// frontend/components/ClaimBusinessWidget.jsx
import { useState } from "react";
import apiClient from "../utils/apiClient";

export default function ClaimBusinessWidget({ businessId }) {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [document, setDocument] = useState(null);

  const [confirmed, setConfirmed] = useState(false); // ✅ تایید صحت اطلاعات
  const [claimToken, setClaimToken] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const texts = {
    en: {
      title: "Claim this business",
      desc: "If you are the owner or an authorized representative, please complete the form below.",
      name: "Full name",
      email: "Business email",
      phone: "Business phone (with country code)",
      role: "Your role",
      descLabel: "Additional information",
      file: "Proof of ownership (PDF, JPG, PNG)",
      confirm: "I confirm that the information above is accurate.",
      submit: "Submit claim",
      success: "✅ Your claim was successfully submitted.",
      review: "Your request is under review. We will contact you soon.",
      tokenNote: "Please keep this verification code safe:",
      error: "❌ Something went wrong. Please try again.",
    },
    fr: {
      title: "Revendiquer cette entreprise",
      desc: "Si vous êtes le propriétaire ou un représentant autorisé, veuillez compléter le formulaire.",
      name: "Nom complet",
      email: "Email professionnel",
      phone: "Téléphone professionnel",
      role: "Votre rôle",
      descLabel: "Informations complémentaires",
      file: "Preuve de propriété (PDF, JPG, PNG)",
      confirm: "Je confirme que les informations ci-dessus sont exactes.",
      submit: "Soumettre la demande",
      success: "✅ Votre demande a été envoyée avec succès.",
      review: "Votre demande est en cours d'examen.",
      tokenNote: "Veuillez conserver ce code de vérification :",
      error: "❌ Une erreur s’est produite.",
    },
    fa: {
      title: "درخواست مالکیت کسب‌وکار",
      desc: "اگر مالک یا نماینده قانونی هستید، فرم زیر را تکمیل کنید.",
      name: "نام و نام خانوادگی",
      email: "ایمیل کسب‌وکار",
      phone: "شماره تماس",
      role: "نقش شما",
      descLabel: "توضیحات تکمیلی",
      file: "مدرک مالکیت (PDF، JPG، PNG)",
      confirm: "اینجانب تأیید می‌کنم اطلاعات وارد شده صحیح است.",
      submit: "ارسال درخواست",
      success: "✅ درخواست شما با موفقیت ثبت شد.",
      review: "درخواست شما در حال بررسی است.",
      tokenNote: "این کد را در جای امن نگه دارید:",
      error: "❌ خطایی رخ داد.",
    },
  };

  const t = texts[lang];

  async function handleSubmit() {
    if (!confirmed) {
      setMsg(t.error);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("full_name", fullName);
      formData.append("applicant_role", role);
      formData.append("description", description);
      formData.append("confirmed", "true");

      if (document) formData.append("document", document);

      const res = await apiClient.post(
        `/businesses/${businessId}/claim/start`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setClaimToken(res.data.claim_token);
      setMsg(t.success);
      setStep(2);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 p-6 rounded-2xl border border-gray-200 bg-white text-[#0a1a44]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">{t.title}</h3>
        <div className="flex gap-2">
          {["en", "fr", "fa"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-2 py-1 rounded ${
                lang === l
                  ? "bg-[#0a1a44] text-white"
                  : "bg-gray-100 text-[#0a1a44]"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {step === 1 && (
        <>
          <p className="text-sm text-gray-700 mb-4">{t.desc}</p>

          <div className="flex flex-col gap-3">
            <input
              placeholder={t.name}
              className="input-default"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              placeholder={t.email}
              className="input-default"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder={t.phone}
              className="input-default"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <select
              className="input-default"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">-- {t.role} --</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
            </select>

            <textarea
              placeholder={t.descLabel}
              rows="3"
              className="input-default"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocument(e.target.files[0])}
            />

            {/* ✅ تایید صحت اطلاعات */}
            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {t.confirm}
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading || !confirmed || !email || !phone}
              className="btn-primary mt-2 disabled:opacity-60"
            >
              {loading ? "..." : t.submit}
            </button>

            {msg && <p className="text-xs mt-2">{msg}</p>}
          </div>
        </>
      )}

      {step === 2 && (
        <div className="text-center space-y-3">
          <p className="text-green-600 font-medium">{msg}</p>
          <p className="text-sm">{t.tokenNote}</p>
          <div className="text-xl font-bold text-turquoise tracking-widest">
            {claimToken}
          </div>
        </div>
      )}
    </div>
  );
}
