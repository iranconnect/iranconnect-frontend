//frontend/pages/auth/login.js
import { useState, useEffect } from "react";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ConsentModal from "../../components/ConsentModal";
import ReCAPTCHA from "react-google-recaptcha"; // 🧩 اضافه شد

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
  const [msgType, setMsgType] = useState("info");

  // ⚙️ reCAPTCHA logic
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);


  /* ───────────── 📌 پیام امنیتی ورود هم‌زمان ───────────── */
  useEffect(() => {
    const msg = sessionStorage.getItem("iran_auto_logout_msg");
    if (msg) {
      setSecurityMsg(msg);
      sessionStorage.removeItem("iran_auto_logout_msg");
    }
  }, []);


  /* ───────────── 🎨 مدیریت تم و زبان ───────────── */
  useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const initialLang =
      document.documentElement.getAttribute("lang") || "en";
    setLang(initialLang); // ❗️ دیگر از localStorage خوانده نمی‌شود

    // 🚫 iran_security_msg از localStorage حذف شد (HttpOnly فعال)
    setSecurityMsg("");

    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme");
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ───────────── 🔑 ارسال فرم لاگین ───────────── */
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (showCaptcha && !captchaToken) {
        setMsg("⚠️ Please complete the reCAPTCHA verification.");
        setLoading(false);
        return;
      }

      const payload = { email, password };
      if (showCaptcha && captchaToken) {
        payload.recaptchaToken = captchaToken;
      }

      const res = await apiClient.post(`/auth/login`, payload, {
        withCredentials: true,
      });

      // 🚫 حساب بلاک شده
      if (res.data.blocked) {
        setMsgType("error");
        setMsg(
          <>
            {"Your account has been suspended. Please "}
            <a
              href={res.data.contact_url}
              className="text-turquoise hover:underline font-medium"
            >
              contact
            </a>{" "}
            our support team for assistance.
          </>
        );
        setLoading(false);
        return;
      }

      // ✅ ورود موفق
      if (res.data.message?.toLowerCase().includes("successful")) {
        setMsg(res.data.message || "Login successful ✅");
        setUserId(res.data.user_id);

        const allAccepted = res.data.all_consents_accepted;
        if (!allAccepted) {
          setShowConsent(true);
        } else {
          const redirect = new URLSearchParams(window.location.search).get("redirect");
          window.location.href = redirect || "/";
        }
      } else {
        handleFailedLogin();
        setMsg("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      handleFailedLogin();

      const data = err.response?.data || {};

      // 🚫 بلاک شده
      if (data.blocked) {
        setMsgType("error");
        setMsg(
          <>
            {"Your account has been suspended. Please "}
            <a
              href={data.contact_url || "/contact"}
              className="text-turquoise hover:underline font-medium"
            >
              contact
            </a>{" "}
            our support team for assistance.
          </>
        );
        setLoading(false);
        return;
      }

      // 📌 نیاز به پذیرش قوانین
      if (data.require_terms_agreement) {
        setUserId(data.user_id);
        setShowConsent(true);
        setMsg("Please review and accept our policies before continuing.");
        return;
      }

      setMsg(data.message || data.error || "Invalid credentials");
      setLoading(false);
    }

    setLoading(false);
  }

  /* ───────────── ⚙️ مدیریت تلاش‌های ناموفق ───────────── */
  function handleFailedLogin() {
    setLoginAttempts((prev) => {
      const next = prev + 1;
      if (next >= 3) setShowCaptcha(true);
      return next;
    });
  }

  /* ───────────── 🧩 رابط کاربری ───────────── */
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
                ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
                : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">
            Welcome Back 👋
          </h2>

          {/* ⚠️ پیام امنیتی یکپارچه‌شده */}
          {securityMsg && (
            <div
              className="mb-4 p-3 rounded-lg text-sm font-medium"
              style={{
                background: "#fff8e1",
                color: "#7a4e00",
                border: "1px solid #ffecb3",
                lineHeight: "1.4",
              }}
              dangerouslySetInnerHTML={{ __html: securityMsg }}
            />
          )}

          {/* 🔐 فرم ورود */}
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
            />

            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
            />

            {showCaptcha && (
              <div className="flex justify-center my-3">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => {
                    setCaptchaToken(null);
                    setMsg("⚠️ reCAPTCHA expired. Please verify again.");
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200"
            >
              {loading ? "Logging in..." : "Login"}
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

          <div
            className="mt-6 text-center text-sm"
            style={{ color: theme === "dark" ? "#cbd5e1" : "#555" }}
          >
            <p>
              Forgot your password?{" "}
              <a
                href="/auth/forgot"
                className="text-turquoise font-medium hover:underline"
              >
                Recover it here
              </a>
            </p>
            <p className="mt-2">
              Don’t have an account?{" "}
              <a
                href="/auth/register"
                className="text-turquoise font-medium hover:underline"
              >
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
            if (accepted) window.location.href = "/";
          }}
        />
      )}
    </div>
  );
}
