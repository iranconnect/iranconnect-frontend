//frontend/components/ConsentModal.js
import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

export default function ConsentModal({ userId, lang = "en", onClose }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  /* ----------------------------------------------------
     🎨 Sync with global theme (light / dark)
  ---------------------------------------------------- */
  useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ----------------------------------------------------
     🌍 Texts (safe fallback)
  ---------------------------------------------------- */
  const texts = {
    en: {
      title: "Before continuing",
      desc: "Please review and accept our Privacy Policy, Terms of Service, and Cookies Policy.",
      agree: "I agree to all the above policies.",
      button: "Accept & Continue",
      error: "Please confirm agreement first.",
    },
    fa: {
      title: "پیش از ادامه",
      desc: "لطفاً سیاست‌های حریم خصوصی، شرایط استفاده و سیاست کوکی‌ها را مطالعه و تأیید کنید.",
      agree: "تمام سیاست‌های فوق را مطالعه کرده و می‌پذیرم.",
      button: "تأیید و ادامه",
      error: "لطفاً ابتدا قوانین را تأیید کنید.",
    },
  };

  const t = texts[lang] || texts.en;

  /* ----------------------------------------------------
     🧩 Submit user consent (HttpOnly session)
  ---------------------------------------------------- */
  const submitConsent = async () => {
    if (!checked || loading) {
      alert(t.error);
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(
        "/users/consent",
        {
          consent_type: "all_policies",
          version: "v1", // 🔐 should match backend policy version
          choice: "accepted",
        },
        { withCredentials: true }
      );

      // 🔒 Consent is mandatory → close only on success
      onClose(true);
    } catch (err) {
      console.error("❌ Consent save error:", err);

      const status = err.response?.status;
      const msg = err.response?.data?.error || "";

      if (
        status === 401 ||
        status === 403 ||
        msg.toLowerCase().includes("expired")
      ) {
        alert("⚠️ Session expired. Please log in again.");
        window.location.href = "/auth/login";
        return;
      }

      alert("❌ Error saving consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------
     🚫 Prevent accidental close (legal requirement)
  ---------------------------------------------------- */
  const blockClose = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={blockClose}
      style={{
        background:
          theme === "dark"
            ? "rgba(10, 29, 55, 0.85)"
            : "rgba(0, 0, 0, 0.6)",
        direction: lang === "fa" ? "rtl" : "ltr",
      }}
    >
      <div
        className="rounded-2xl shadow-xl p-8 w-full max-w-md text-center border transition-all"
        onClick={blockClose}
        style={{
          background: theme === "dark" ? "var(--card-bg)" : "var(--bg)",
          color: "var(--text)",
          borderColor: "var(--border)",
        }}
      >
        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4">{t.title}</h2>

        {/* Description */}
        <p className="text-sm mb-4 opacity-90">{t.desc}</p>

        {/* Legal Links */}
        <div className="text-sm mb-4 space-x-1">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-turquoise underline mx-1"
          >
            Privacy Policy
          </a>
          •
          <a
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-turquoise underline mx-1"
          >
            Terms of Service
          </a>
          •
          <a
            href="/cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-turquoise underline mx-1"
          >
            Cookies
          </a>
        </div>

        {/* Checkbox */}
        <label className="block text-sm mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mr-2 accent-turquoise"
          />
          {t.agree}
        </label>

        {/* Submit */}
        <button
          onClick={submitConsent}
          disabled={!checked || loading}
          className="py-2 px-6 rounded-lg font-medium transition bg-turquoise text-navy"
          style={{
            opacity: !checked || loading ? 0.6 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {loading ? "..." : t.button}
        </button>
      </div>
    </div>
  );
}
