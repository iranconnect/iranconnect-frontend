// frontend/pages/auth/login.js
import { useState, useEffect, useRef } from "react";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ConsentModal from "../../components/ConsentModal";
import ReCAPTCHA from "react-google-recaptcha";
import { useRouter } from "next/router";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");

  const [showConsent, setShowConsent] = useState(false);
  const [userId, setUserId] = useState(null);

  // ⚙️ CAPTCHA FLAGS
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const router = useRouter();

  const captchaRef = useRef(null);

  /* ───────────────────────────────────────────────
     🔵 Load auto-logout message from sessionStorage
  ─────────────────────────────────────────────── */
  useEffect(() => {
    const saved = sessionStorage.getItem("iran_auto_logout_msg");
    if (saved) {
      setSecurityMsg(saved);
      sessionStorage.removeItem("iran_auto_logout_msg");
    }
  }, []);
  
  /* ───────────────────────────────────────────────
     🔵 2) Theme & Language watcher
  ─────────────────────────────────────────────── */
  useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const initialLang = document.documentElement.getAttribute("lang") || "en";
    setLang(initialLang);

    const observer = new MutationObserver(() => {
      const updated = document.documentElement.getAttribute("data-theme");
      setTheme(updated);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ───────────────────────────────────────────────
     🔵 3) Real-time CAPTCHA Sync with Backend
  ─────────────────────────────────────────────── */
  async function syncCaptchaStatus(typedEmail) {
    if (!typedEmail || typedEmail.length < 3) {
      setShowCaptcha(false);
      return;
    }

    try {
      const res = await apiClient.get(
        `/auth/login-status?email=${encodeURIComponent(typedEmail)}`
      );

      if (res.data.blocked) {
        setMsg("Your account is suspended. Contact support.");
        return;
      }

      const required = res.data.captcha_required === true;

      if (required !== showCaptcha) {
        setShowCaptcha(required);
        setCaptchaToken(null);

        if (required) {
          setTimeout(() => captchaRef.current?.reset(), 150);
        }
      }
    } catch (err) {
      console.warn("login-status sync failed:", err?.message);
    }
  }

  // وقتی کاربر ایمیل تایپ می‌کند → Sync انجام بده
  useEffect(() => {
    if (!email) return;
    const t = setTimeout(() => syncCaptchaStatus(email), 300);
    return () => clearTimeout(t);
  }, [email]);

  /* ───────────────────────────────────────────────
     🔵 4) Reset CAPTCHA on visibility change
  ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!showCaptcha) return;
    setCaptchaToken(null);

    setTimeout(() => {
      captchaRef.current?.reset();
    }, 150);
  }, [showCaptcha]);

  /* ───────────────────────────────────────────────
     🔵 5) SUBMIT Login
  ─────────────────────────────────────────────── */
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      // اگر بک‌اند نیاز به کپچا دارد → بدون کپچا لاگین نکن
      if (showCaptcha && !captchaToken) {
        setMsg("⚠️ Please complete the reCAPTCHA verification.");
        captchaRef.current?.reset();
        setCaptchaToken(null);
        setLoading(false);
        return;
      }

      const payload = { email, password };
      if (captchaToken) payload.recaptchaToken = captchaToken;

      const res = await apiClient.post(`/auth/login`, payload, {
        withCredentials: true,
      });

      /* 🚫 BLOCKED */
      if (res.data.blocked) {
        setMsg("Your account has been suspended. Please contact support.");
        setLoading(false);
        return;
      }

      /* ✅ LOGIN SUCCESS */
      if (res.data.message?.toLowerCase().includes("successful")) {
        setMsg("");
        setUserId(res.data.user_id);

        captchaRef.current?.reset();
        setCaptchaToken(null);
        setShowCaptcha(false);

        if (!res.data.all_consents_accepted) {
          setShowConsent(true);
        } else {
          const redirect = new URLSearchParams(window.location.search).get(
            "redirect"
          );
          window.location.href = redirect || "/search";
        }
        return;
      }

      /* ❌ Unexpected fail */
      await syncCaptchaStatus(email);
      setMsg("Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      const data = err.response?.data || {};

      /* 🚫 Blocked user */
      if (data.blocked) {
        setMsg("Your account has been suspended.");
        setLoading(false);
        return;
      }

      /* 🚫 Requires consent */
      if (data.require_terms_agreement) {
        setUserId(data.user_id);
        setShowConsent(true);
        setMsg("Please review and accept our updated policies.");
        setLoading(false);
        return;
      }

      setMsg(data.error || "Login failed.");
      syncCaptchaStatus(email);
    }

    setLoading(false);
  }

  /* ───────────────────────────────────────────────
     🔵 6) UI Rendering
  ─────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#ffffff",
        color: "var(--text)",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          className="rounded-2xl p-8 w-full max-w-md border transition-all duration-300"
          style={{
            background: theme === "dark" ? "#0b2149" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#0a1b2a",
            borderColor:
              theme === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            boxShadow:
              theme === "dark"
                ? "10px 10px 25px rgba(0,0,0,0.4)"
                : "6px 6px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">
            Welcome Back 👋
          </h2>

          {securityMsg && (
            <div
              className="mb-4"
              dangerouslySetInnerHTML={{ __html: securityMsg }}
            />
          )}

          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border bg-[#f5f7fa] text-gray-900 focus:ring-2 focus:ring-turquoise"
            />

            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border bg-[#f5f7fa] text-gray-900 focus:ring-2 focus:ring-turquoise"
            />

            {showCaptcha && (
              <div className="flex justify-center my-3">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => {
                    setCaptchaToken(null);
                    setMsg("⚠️ reCAPTCHA expired. Please try again.");
                    captchaRef.current?.reset();
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise text-navy py-2 rounded-lg shadow-md hover:bg-turquoise/90"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          {msg && (
            <p
              className="text-sm text-center mt-4"
              style={{ color: theme === "dark" ? "#e2e8f0" : "#333" }}
            >
              {msg}
            </p>
          )}

          <div className="mt-6 text-center text-sm">
            <p>
              Forgot your password?{" "}
              <a href="/auth/forgot" className="text-turquoise font-medium">
                Recover it here
              </a>
            </p>
            <p className="mt-2">
              Don’t have an account?{" "}
              <a href="/auth/register" className="text-turquoise font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {showConsent && (
        <ConsentModal
          userId={userId}
          lang={lang}
          onClose={(accepted) => {
            setShowConsent(false);
            if (accepted) window.location.href = "/search";
          }}
        />
      )}
    </div>
  );
}
