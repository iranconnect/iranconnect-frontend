// frontend/pages/auth/login.js

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import ReCAPTCHA from "react-google-recaptcha";

import apiClient from "../../utils/apiClient";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ConsentReviewModal from "../../components/ConsentReviewModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] =
    useState(false);

  const [msg, setMsg] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");

  const [accountBlocked, setAccountBlocked] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState("en");

  const [showConsent, setShowConsent] = useState(false);

  const [verificationRequiredEmail, setVerificationRequiredEmail] =
  useState("");

  // ⚙️ CAPTCHA
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const router = useRouter();

  const captchaRef = useRef(null);

  const REMEMBERED_EMAIL_KEY =
    "iranconnect_remembered_login_email";

  function saveRememberedEmail() {
    if (!rememberEmail) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    try {
      localStorage.setItem(
        REMEMBERED_EMAIL_KEY,
        normalizedEmail
      );
    } catch {}
  }

  function clearPasswordState() {
    setPassword("");
  }

  function openConsentReview() {
    /*
     * Google reCAPTCHA may render its challenge outside the
     * normal React stacking context. Reset its active state
     * before opening the policy review modal.
     */
    captchaRef.current?.reset();
    setCaptchaToken(null);
    setShowConsent(true);
  }

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
     🔵 Load explicitly remembered login email
  ─────────────────────────────────────────────── */
  useEffect(() => {
    try {
      const remembered =
        localStorage.getItem(
          REMEMBERED_EMAIL_KEY
        );

      if (remembered) {
        setEmail(remembered);
        setRememberEmail(true);
      }
    } catch {}
  }, []);

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
    const saved =
      sessionStorage.getItem(
        "iran_auto_logout_msg"
      );

    if (!saved) {
      return;
    }

    const reason =
      new URLSearchParams(
        window.location.search
      ).get("reason") || "";

    const isSuspension =
      reason.startsWith(
        "ACCOUNT_SUSPENDED"
      ) ||
      reason === "account_locked";

    if (isSuspension) {
      setAccountBlocked(true);
      setMsg(saved);
    } else {
      setSecurityMsg(saved);
    }

    sessionStorage.removeItem(
      "iran_auto_logout_msg"
    );
  }, []);

  /* ───────────────────────────────────────────────
     🔵 CAPTCHA status sync
  ─────────────────────────────────────────────── */
  async function syncCaptchaStatus(typedEmail) {
    if (!typedEmail || typedEmail.length < 3) {
      setShowCaptcha(false);
      setAccountBlocked(false);
      return;
    }

    try {
      const res = await apiClient.get(
        `/auth/login-status?email=${encodeURIComponent(typedEmail)}`
      );

      /*
       * login-status exposes only CAPTCHA requirements.
       * Account suspension is handled by the actual login
       * response after credential processing.
       */
      setAccountBlocked(false);

      const required =
        res.data.captcha_required === true;

      if (required !== showCaptcha) {
        /*
         * Mounting ReCAPTCHA already creates a fresh widget.
         * Do not imperatively reset it during initial display;
         * doing so can restart the Google challenge lifecycle.
         */
        setShowCaptcha(required);
        setCaptchaToken(null);
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
     🔵 Submit Login
  ─────────────────────────────────────────────── */
  async function submit(e) {
    e.preventDefault();

    if (
      accountBlocked ||
      !email.trim() ||
      !password
    ) {
      return;
    }

    setLoading(true);
    setMsg("");
    setVerificationRequiredEmail("");

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
        clearPasswordState();
        setAccountBlocked(true);

        setMsg(
          res.data.error ||
            "Your account has been suspended. Please contact IranConnect Support."
        );

        setLoading(false);
        return;
      }

      /* ✅ SUCCESS */
      if (
        res.data.message?.toLowerCase().includes("successful")
      ) {
        saveRememberedEmail();
        clearPasswordState();
        setMsg("");

        captchaRef.current?.reset();

        setCaptchaToken(null);
        setShowCaptcha(false);

        if (!res.data.all_consents_accepted) {
          openConsentReview();
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
      if (process.env.NODE_ENV !== "production") {
        console.error("Login error:", err);
      }

      const data = err.response?.data || {};

      /* 🚫 BLOCKED */
      if (data.blocked) {
        clearPasswordState();
        setAccountBlocked(true);

        setMsg(
          data.error ||
            "Your account has been suspended. Please contact IranConnect Support."
        );

        setLoading(false);
        return;
      }

      /* 📩 VERIFIED PASSWORD, BUT EMAIL VERIFICATION IS REQUIRED */
      if (data.code === "email_verification_required") {
        clearPasswordState();

        const verifiedEmail = String(
          data.verification_email || email
        )
          .trim()
          .toLowerCase();
      
        setVerificationRequiredEmail(verifiedEmail);
      
        setMsg(
          data.error ||
            "Please verify your email before logging in."
        );
      
        setLoading(false);
        return;
      }

      /* 🚫 CONSENT REQUIRED */
      if (data.require_terms_agreement) {

        saveRememberedEmail();
        clearPasswordState();
        openConsentReview();

        setMsg(
          "Please review and accept our updated policies."
        );

        setLoading(false);
        return;
      }

      clearPasswordState();

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
              autoComplete="username"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (accountBlocked) {
                  setAccountBlocked(false);
                  setMsg("");
                }
              }}
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
              autoComplete="current-password"
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

            <label
              className="
                flex
                items-center
                gap-2
                text-sm
                cursor-pointer
                select-none
              "
            >
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => {
                  const checked =
                    e.target.checked;

                  setRememberEmail(checked);

                  if (!checked) {
                    try {
                      localStorage.removeItem(
                        REMEMBERED_EMAIL_KEY
                      );
                    } catch {}
                  }
                }}
              />

              <span>
                Remember my email on this device
              </span>
            </label>

            {showCaptcha && !showConsent && (
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
              disabled={
                loading ||
                accountBlocked ||
                !email.trim() ||
                !password
              }
              className="
                w-full
                bg-turquoise
                text-navy
                py-2
                rounded-lg
                shadow-md
                hover:bg-turquoise/90
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:bg-turquoise
              "
            >
              {loading
                ? "Logging in…"
                : "Login"}
            </button>
          </form>

          {msg && (
            accountBlocked ? (
              <div
                role="alert"
                className="
                  mt-4
                  rounded-xl
                  border
                  border-red-500/35
                  bg-red-500/10
                  px-4
                  py-3
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    leading-relaxed
                    text-red-500
                  "
                >
                  {msg}
                </p>
              </div>
            ) : (
              <p
                className="
                  mt-4
                  text-center
                  text-sm
                "
                style={{
                  color: "var(--text)",
                }}
              >
                {msg}
              </p>
            )
          )}

          {verificationRequiredEmail && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/auth/verify?email=${encodeURIComponent(
                      verificationRequiredEmail
                    )}&from=login`
                  );
                }}
                className="
                  rounded-lg
                  border
                  border-turquoise
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-turquoise
                  transition
                  hover:bg-turquoise
                  hover:text-navy
                "
              >
                Verify email
              </button>
            </div>
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
        <ConsentReviewModal
          initialLanguage={lang}
          onClose={() => {
            setShowConsent(false);
          }}
          onConfirmed={async (presentation) => {
            try {
              await apiClient.post(
                "/auth/agree-terms",
                {
                  consent_presentation_token:
                    presentation.presentationToken,
                },
                {
                  withCredentials: true,
                  requireAuth: true,
                }
              );

              setShowConsent(false);

              window.location.href =
                getSafePostLoginRedirect();
            } catch (err) {
              const status =
                err.response?.status;

              const code =
                err.response?.data?.code;

              const message =
                err.response?.data?.error ||
                "Unable to save policy acceptance.";

              if (
                status === 409 &&
                code ===
                  "POLICY_PRESENTATION_STALE"
              ) {
                setMsg(
                  "The policies changed while you were reviewing them. Please review the current versions again."
                );

                setShowConsent(false);

                setTimeout(() => {
                  setShowConsent(true);
                }, 0);

                return;
              }

              if (
                status === 400 &&
                code ===
                  "INVALID_CONSENT_PRESENTATION"
              ) {
                setMsg(
                  "Your policy review expired. Please review the policies again."
                );

                setShowConsent(false);

                setTimeout(() => {
                  setShowConsent(true);
                }, 0);

                return;
              }

              if (process.env.NODE_ENV !== "production") {
                console.error(
                  "Agree terms error:",
                  err
                );
              }

              setMsg(message);
            }
          }}
        />
      )}
    </div>
  );
}
