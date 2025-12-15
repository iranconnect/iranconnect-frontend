// frontend/components/CookieConsent.js
import { useEffect, useState } from "react";
import CookieSettingsModal from "./CookieSettingsModal";
import apiClient from "../utils/apiClient";

/* ───────────────────────────────────────────────
   🔐 Cookie helpers (first-party technical cookie)
─────────────────────────────────────────────── */
const CONSENT_COOKIE = "ic_cookie_consent_uuid";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days = 365) {
  const maxAge = days * 24 * 60 * 60;

  document.cookie = `${name}=${encodeURIComponent(value)};
    Max-Age=${maxAge};
    Path=/;
    Domain=.iranconnect.org;
    SameSite=Lax;
    Secure`;
}


export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lang, setLang] = useState("en");
  const [texts, setTexts] = useState(null);
  const [loading, setLoading] = useState(false);

  /* 🌍 Detect language */
  useEffect(() => {
    const stored =
      localStorage.getItem("iran_lang") ||
      document.documentElement.getAttribute("lang") ||
      "en";
    setLang(stored);
  }, []);

  /* 📄 Load cookie banner texts */
  useEffect(() => {
    if (!lang) return;

    apiClient
      .get("/policies/cookie_banner", {
        params: { lang },
        withCredentials: true,
      })
      .then((res) => {
        try {
          const data = JSON.parse(res.data.content);
          setTexts(data);
        } catch {
          setTexts(null);
        }
      })
      .catch(() => setTexts(null));
  }, [lang]);

  /* 🔍 Show banner only if no consent cookie exists */
  useEffect(() => {
     async function checkConsent() {
       const cookie = getCookie(CONSENT_COOKIE);
   
       // اگر کوکی هست → بنر نده
       if (cookie) return;
   
       // اگر کاربر لاگین است → backend تصمیم می‌گیرد
       try {
         const res = await apiClient.get("/auth/me", {
           withCredentials: true,
         });
   
         if (res.data?.ok) {
           return; // لاگین است → بنر نده
         }
       } catch {
         // ignore
       }
   
       // فقط در این حالت بنر را نشان بده
       setVisible(true);
     }
   
     checkConsent();
   }, []);


  /* ✅ Accept / Reject handler */
  async function handleChoice(choice) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await apiClient.post(
        "/consents/cookies/anonymous",
        {
          choice,
          version: "v1.0",
        },
        { withCredentials: true }
      );

      if (res.data?.consent_uuid) {
        setCookie(CONSENT_COOKIE, res.data.consent_uuid);
      }

      // Load analytics فقط در صورت Accept
      if (choice === "accepted") {
        const script = document.createElement("script");
        script.src =
          "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
        script.async = true;
        document.body.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        gtag("js", new Date());
        gtag("config", "G-XXXXXXX");
      }

      setVisible(false);
    } catch (err) {
      console.error("❌ Cookie consent error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!visible || !texts) return null;
  const t = texts;

  return (
    <>
      {showSettings && (
        <CookieSettingsModal
          lang={lang}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[600px]
                   bg-white border border-gray-200 shadow-lg rounded-2xl p-5 z-50 text-[#0a1a44]"
        style={{ direction: lang === "fa" ? "rtl" : "ltr" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{t.title}</h2>
            <p className="text-sm mt-1">{t.desc}</p>
          </div>

          <div className="flex gap-2 flex-row">
            <button
              onClick={() => handleChoice("accepted")}
              disabled={loading}
              className="bg-[#00bfa6] hover:bg-[#00a48f] text-white px-4 py-2 rounded-md text-sm disabled:opacity-60"
            >
              {t.accept}
            </button>

            <button
              onClick={() => handleChoice("rejected")}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-[#0a1a44] px-4 py-2 rounded-md text-sm disabled:opacity-60"
            >
              {t.reject}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="underline text-sm text-[#0a1a44]"
            >
              {t.manage}
            </button>
          </div>
        </div>

        <div
          className="flex justify-center mt-3 gap-2"
          style={{ direction: "ltr" }}
        >
          {["en", "fr", "fa"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-2 py-1 rounded-md transition-all ${
                lang === l
                  ? "bg-[#0a1a44] text-white"
                  : "bg-gray-100 text-[#0a1a44]"
              }`}
            >
              {l === "en"
                ? "English"
                : l === "fr"
                ? "Français"
                : "فارسی"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
