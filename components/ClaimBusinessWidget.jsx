//frontend/components/ClaimBusinessWidget.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  const [claimToken, setClaimToken] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [humanAnswer, setHumanAnswer] = useState("");
  const router = useRouter();

  // 🧠 Human check generator
  function generateQuestion() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * 3)];

    let result;
    switch (op) {
      case "+": result = n1 + n2; break;
      case "-": result = n1 - n2; break;
      case "*": result = n1 * n2; break;
    }

    setQuestion(`What is ${n1} ${op} ${n2}?`);
    setCorrectAnswer(result.toString());
  }

  useEffect(() => {
    generateQuestion();
  }, []);

  // 🌍 Language texts
  const texts = {
    en: {
      title: "Claim this business",
      desc: "If you are the owner or authorized representative, please verify your information.",
      nameLabel: "Full name",
      emailLabel: "Business email",
      phoneLabel: "Business phone (with country code)",
      roleLabel: "Your role",
      descLabel: "Additional information",
      fileLabel: "Proof of ownership (PDF, JPG, PNG)",
      humanCheck: "Answer this to verify you're human:",
      refresh: "Refresh",
      send: "Submit claim",
      success: "✅ Your claim was successfully submitted.",
      review: "Your request is under review. We will contact you soon.",
      tokenNote: "Keep this verification code safe:",
      error: "❌ Something went wrong. Please try again.",
      reviewPending: "Your request is pending admin review. Please keep your code safe until contacted.",
    },
    fr: {
      title: "Revendiquer cette entreprise",
      desc: "Si vous êtes le propriétaire ou un représentant autorisé, veuillez vérifier vos informations.",
      nameLabel: "Nom complet",
      emailLabel: "E-mail professionnel",
      phoneLabel: "Téléphone professionnel (avec indicatif du pays)",
      roleLabel: "Votre rôle",
      descLabel: "Informations complémentaires",
      fileLabel: "Preuve de propriété (PDF, JPG, PNG)",
      humanCheck: "Répondez pour vérifier que vous êtes humain :",
      refresh: "Rafraîchir",
      send: "Soumettre la demande",
      success: "✅ Votre demande a été soumise avec succès.",
      review: "Votre demande est en cours d'examen. Nous vous contacterons bientôt.",
      tokenNote: "Conservez ce code de vérification en lieu sûr :",
      error: "❌ Une erreur s’est produite. Veuillez réessayer.",
      reviewPending: "Votre demande est en attente d'examen par un administrateur. Veuillez conserver votre code jusqu'à ce que nous vous contactions.",
    },
    fa: {
      title: "درخواست مالکیت این کسب‌وکار",
      desc: "اگر مالک یا نماینده قانونی این کسب‌وکار هستید، لطفاً اطلاعات خود را وارد کنید.",
      nameLabel: "نام و نام خانوادگی",
      emailLabel: "ایمیل کسب‌وکار",
      phoneLabel: "شماره تماس کسب‌وکار (همراه با کد کشور)",
      roleLabel: "نقش شما",
      descLabel: "توضیحات تکمیلی",
      fileLabel: "مدرک مالکیت (PDF، JPG، PNG)",
      humanCheck: "برای تأیید انسان بودن، به این سؤال پاسخ دهید:",
      refresh: "تغییر سؤال",
      send: "ارسال درخواست",
      success: "✅ درخواست شما با موفقیت ثبت شد.",
      review: "درخواست شما در حال بررسی است. به‌زودی با شما تماس گرفته می‌شود.",
      tokenNote: "این کد را در جای امن نگه دارید:",
      error: "❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.",
      reviewPending: "درخواست شما در انتظار بررسی مدیر است. لطفاً کد خود را تا زمان تماس با شما نگه دارید.",
    },
  };

  const t = texts[lang];
async function handleSubmit() {
    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("full_name", fullName);
      formData.append("applicant_role", role);
      formData.append("description", description);
      formData.append("humanAnswer", humanAnswer);
      formData.append("correctAnswer", correctAnswer);

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

      // Localized auto-detection
      const raw = res.data.message || "";
      let localizedMsg = raw;
      if (raw.includes("pending admin review")) localizedMsg = t.reviewPending;
      if (raw.includes("received successfully")) localizedMsg = t.success;

      setMsg(localizedMsg);
      setStep(2);
    } catch (e) {
      console.error(e);
      setMsg(e.response?.data?.error || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-8 p-5 rounded-2xl border border-gray-200 bg-white text-[#0a1a44] shadow-sm"
      style={{
        textAlign: lang === "fa" ? "right" : "left",
        direction: lang === "fa" ? "rtl" : "ltr",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">{t.title}</h3>

        {/* زبان‌ها */}
        {step === 1 && (
          <div className="flex gap-2">
            {["en", "fr", "fa"].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`text-xs px-2 py-1 rounded ${
                  lang === code
                    ? "bg-[#0a1a44] text-white"
                    : "bg-gray-100 text-[#0a1a44]"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {step === 1 && <p className="text-sm text-gray-700 mb-4">{t.desc}</p>}

      {/* فرم مرحله 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <label className="text-sm">{t.nameLabel}</label>
          <input type="text" className="input-default" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label className="text-sm">{t.emailLabel}</label>
          <input type="email" className="input-default" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="text-sm">{t.phoneLabel}</label>
          <input type="tel" placeholder="+33 612345678" className="input-default" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label className="text-sm">{t.roleLabel}</label>
          <select className="input-default" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">--</option>
            <option value="owner">Owner</option>
          </select>

          <label className="text-sm">{t.descLabel}</label>
          <textarea className="input-default" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label className="text-sm">{t.fileLabel}</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocument(e.target.files[0])} />

          <label className="text-sm flex items-center gap-2">
            {t.humanCheck}
            <button type="button" className="text-turquoise text-xs underline" onClick={generateQuestion}>
              🔄 {t.refresh}
            </button>
          </label>

          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">{question}</span>
            <input type="text" className="input-default w-24" value={humanAnswer} onChange={(e) => setHumanAnswer(e.target.value)} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !phone || !humanAnswer}
            className="btn-primary font-bold disabled:opacity-60"
          >
            {loading ? "..." : t.send}
          </button>
        </div>
      )}

      {/* مرحله 2 */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-green-600 font-medium">{msg}</p>
          <p className="text-sm text-gray-600">{t.tokenNote}</p>

          <div className="text-lg font-bold text-turquoise tracking-widest">
            {claimToken}
          </div>

          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => {
                setStep(1);
                setClaimToken("");
                setMsg("");
                setEmail("");
                setPhone("");
                setFullName("");
                setRole("");
                setDescription("");
                setDocument(null);
                setHumanAnswer("");
                generateQuestion();
              }, 600);
            }}
            className="btn-primary mt-4 font-semibold px-6 py-2"
          >
            {lang === "fa"
              ? "بازگشت به صفحه بیزینس"
              : lang === "fr"
              ? "Retour à la page de l’entreprise"
              : "Back to business details"}
          </button>
        </div>
      )}

      {msg && step === 1 && <p className="text-xs mt-3">{msg}</p>}
    </div>
  );
}
