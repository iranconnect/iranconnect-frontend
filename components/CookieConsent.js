// frontend/components/CookieConsent.js
import { useEffect, useState } from "react";
import CookieSettingsModal from "./CookieSettingsModal";
import apiClient from "../utils/apiClient";

/* ───────────────────────────────────────────────
   🔐 Cookie helpers (first-party technical cookie)
─────────────────────────────────────────────── */
function setDecisionCookie(choice) {
  document.cookie =
    `ic_cookie_banner_decided=${choice}; path=/; max-age=31536000; SameSite=Lax`;
}

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
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

  /* 🔍 Show banner only if no consent cookie exists
     ✅ FIX: after logout banner must NOT reappear
  */
  useEffect(() => {
    const DECISION_COOKIE = "ic_cookie_banner_decided";

    async function checkConsent() {
      // ✅ اگر کاربر قبلاً تصمیم گرفته → هرگز بنر نشان داده نشود
      const decision = getCookie(DECISION_COOKIE);
      if (decision === "accepted" || decision === "rejected") {
        return;
      }
   
      // اگر تصمیمی نیست، فقط وقتی لاگین نیست بنر نشان بده
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });
    
        if (res.data?.ok) {
          // کاربر لاگین است → بنر نده
          return;
        }
      } catch {
        // لاگین نیست → بنر مجاز است
      }
   
      setVisible(true);
    }
    checkConsent();
  }, []);

  /* 🔁 Re-open cookie settings from footer (GDPR review) */
  useEffect(() => {
    function openFromFooter() {
      setVisible(true);
      setShowSettings(true);
    }

    window.addEventListener("open-cookie-settings", openFromFooter);

    return () => {
      window.removeEventListener("open-cookie-settings", openFromFooter);
    };
  }, []);


  /* ✅ Accept / Reject handler */
  async function handleChoice(choice) {
    if (loading) return;
    setLoading(true);
   
    try {
      // ✅ ONLY local cookie — NO API — NO DB
      setDecisionCookie(choice);
   
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
      console.error("❌ Cookie banner error:", err);
    } finally {
      setLoading(false);
    }
  }


  if (!visible) return null;
  const t =
    texts ||
    ({
      title: "Cookies",
      desc: "You can manage your cookie preferences.",
      accept: "Accept",
      reject: "Reject",
      manage: "Manage",
    });


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
