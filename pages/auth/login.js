// frontend/pages/auth/login.js

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import ReCAPTCHA from "react-google-recaptcha";

import apiClient from "../../utils/apiClient";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ConsentModal from "../../components/ConsentModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");

  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState("en");

  const [showConsent, setShowConsent] = useState(false);
  const [userId, setUserId] = useState(null);

  // ⚙️ CAPTCHA
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const router = useRouter();

  const captchaRef = useRef(null);

  function getSafePostLoginRedirect() {
    const redirect = new URLSearchParams(
      window.location.search
    ).get("redirect");
  
    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      return redirect;
    }
  
    return "/search";
  }

  /* ───────────────────────────────────────────────
     🔵 Load language
  ─────────────────────────────────────────────── */
  useEffect(() => {
    const initialLang =
      document.documentElement.getAttribute("lang") || "en";

    setLang(initialLang);
  }, []);

  /* ───────────────────────────────────────────────
     🔵 Auto logout message
  ─────────────────────────────────────────────── */
  useEffect(() => {
    const saved = sessionStorage.getItem("iran_auto_logout_msg");

    if (saved) {
      setSecurityMsg(saved);
      sessionStorage.removeItem("iran_auto_logout_msg");
    }
  }, []);

  /* ───────────────────────────────────────────────
     🔵 CAPTCHA status sync
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
          setTimeout(() => {
            captchaRef.current?.reset();
          }, 150);
        }
      }
    } catch (err) {
      console.warn("login-status sync failed:", err?.message);
    }
  }

  /* ───────────────────────────────────────────────
     🔵 Sync while typing email
  ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!email) return;

    const t = setTimeout(() => {
      syncCaptchaStatus(email);
    }, 300);

    return () => clearTimeout(t);
  }, [email]);

  /* ───────────────────────────────────────────────
     🔵 Reset CAPTCHA
  ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!showCaptcha) return;

    setCaptchaToken(null);

    setTimeout(() => {
      captchaRef.current?.reset();
    }, 150);
  }, [showCaptcha]);

  /* ───────────────────────────────────────────────
     🔵 Submit Login
  ─────────────────────────────────────────────── */
  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setMsg("");

    try {
      // 🚫 CAPTCHA required
      if (showCaptcha && !captchaToken) {
        setMsg("⚠️ Please complete the reCAPTCHA verification.");

        captchaRef.current?.reset();
        setCaptchaToken(null);

        setLoading(false);
        return;
      }

      const payload = {
        email,
        password,
      };

      if (captchaToken) {
        payload.recaptchaToken = captchaToken;
      }

      const res = await apiClient.post(
        "/auth/login",
        payload,
        {
          withCredentials: true,
        }
      );

      /* 🚫 BLOCKED */
      if (res.data.blocked) {
        setMsg("Your account has been suspended. Please contact support.");

        setLoading(false);
        return;
      }

      /* ✅ SUCCESS */
      if (
        res.data.message?.toLowerCase().includes("successful")
      ) {
        setMsg("");

        setUserId(res.data.user_id);

        captchaRef.current?.reset();

        setCaptchaToken(null);
        setShowCaptcha(false);

        if (!res.data.all_consents_accepted) {
          setShowConsent(true);
        } else {
          window.location.href =
            getSafePostLoginRedirect();
        }

        return;
      }

      /* ❌ Fallback */
      await syncCaptchaStatus(email);

      setMsg("Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);

      const data = err.response?.data || {};

      /* 🚫 BLOCKED */
      if (data.blocked) {
        setMsg("Your account has been suspended.");

        setLoading(false);
        return;
      }

      /* 🚫 CONSENT REQUIRED */
      if (data.require_terms_agreement) {
        setUserId(data.user_id);

        setShowConsent(true);

        setMsg(
          "Please review and accept our updated policies."
        );

        setLoading(false);
        return;
      }

      setMsg(data.error || "Login failed.");

      syncCaptchaStatus(email);
    }

    setLoading(false);
  }

  /* ───────────────────────────────────────────────
     🔵 UI
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
          className="
            rounded-2xl
            p-8
            w-full
            max-w-md
            border
            transition-all
            duration-300
          "
          style={{
            background: "var(--card-bg)",
            color: "var(--text)",
            borderColor: "var(--border)",
            boxShadow:
              "6px 6px 16px var(--shadow-dark), -6px -6px 16px var(--shadow-light)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">
            Welcome Back 👋
          </h2>

          {securityMsg && (
            <div
              className="mb-4"
              dangerouslySetInnerHTML={{
                __html: securityMsg,
              }}
            />
          )}

          <form
            onSubmit={submit}
            className="space-y-4"
          >
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="
                w-full
                p-3
                rounded-lg
                border
                bg-[#f5f7fa]
                text-gray-900
                focus:ring-2
                focus:ring-turquoise
              "
            />

            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="
                w-full
                p-3
                rounded-lg
                border
                bg-[#f5f7fa]
                text-gray-900
                focus:ring-2
                focus:ring-turquoise
              "
            />

            {showCaptcha && (
              <div className="flex justify-center my-3">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={
                    process.env
                      .NEXT_PUBLIC_RECAPTCHA_SITE_KEY
                  }
                  onChange={(token) =>
                    setCaptchaToken(token)
                  }
                  onExpired={() => {
                    setCaptchaToken(null);

                    setMsg(
                      "⚠️ reCAPTCHA expired. Please try again."
                    );

                    captchaRef.current?.reset();
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-turquoise
                text-navy
                py-2
                rounded-lg
                shadow-md
                hover:bg-turquoise/90
              "
            >
              {loading
                ? "Logging in…"
                : "Login"}
            </button>
          </form>

          {msg && (
            <p
              className="
                text-sm
                text-center
                mt-4
              "
              style={{
                color: "var(--text)",
              }}
            >
              {msg}
            </p>
          )}

          <div className="mt-6 text-center text-sm">
            <p>
              Forgot your password?{" "}
              <a
                href="/auth/forgot"
                className="
                  text-turquoise
                  font-medium
                "
              >
                Recover it here
              </a>
            </p>

            <p className="mt-2">
              Don’t have an account?{" "}
              <a
                href="/auth/register"
                className="
                  text-turquoise
                  font-medium
                "
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
          
            if (accepted) {
              window.location.href =
                getSafePostLoginRedirect();
            }
          }}
        />
      )}
    </div>
  );
}
