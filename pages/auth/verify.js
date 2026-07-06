//frontend/pages/auth/verify.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import ReCAPTCHA from "react-google-recaptcha";

import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const RESEND_COOLDOWN_SECONDS = 60;

function readQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string"
    ? value
    : "";
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function Verify() {
  const router = useRouter();
  const captchaRef = useRef(null);
  const initializedRef = useRef(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [theme, setTheme] = useState("light");
  const [captchaToken, setCaptchaToken] = useState(null);

  /* ----------------------------------------------------
     Initial query handling
     - Register flow with delivery=sent starts cooldown.
     - Login flow starts with immediate resend availability.
  ---------------------------------------------------- */
  useEffect(() => {
    if (!router.isReady || initializedRef.current) {
      return;
    }

    const queryEmail = normalizeEmail(
      readQueryValue(router.query.email)
    );

    const delivery = readQueryValue(
      router.query.delivery
    );

    if (queryEmail) {
      setEmail(queryEmail);
    }

    if (delivery === "sent") {
      setMessage(
        "A verification code has been sent to your email."
      );
      setMessageType("success");

      setSecondsLeft(
        RESEND_COOLDOWN_SECONDS
      );
      setTimerActive(true);
    }

    if (delivery === "failed") {
      setMessage(
        "Your account was created, but we could not send the verification email yet. Please request a new code."
      );
      setMessageType("error");
    }

    initializedRef.current = true;
  }, [router.isReady, router.query]);

  /* ----------------------------------------------------
     Theme sync
  ---------------------------------------------------- */
  useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute(
        "data-theme"
      ) || "light";

    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const nextTheme =
        document.documentElement.getAttribute(
          "data-theme"
        ) || "light";

      setTheme(nextTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ----------------------------------------------------
     Resend cooldown
  ---------------------------------------------------- */
  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${
      remainingSeconds < 10
        ? `0${remainingSeconds}`
        : remainingSeconds
    }`;
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    setCaptchaToken(null);
    captchaRef.current?.reset();

    /*
      When the email changes manually, allow the user
      to request a code for the new address.
      Backend cooldown still remains the source of truth.
    */
    setTimerActive(false);
    setSecondsLeft(0);
  }

  async function submitVerification(event) {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = String(code || "").trim();

    if (!normalizedEmail) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    if (!normalizedCode) {
      setMessage("Please enter your verification code.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await apiClient.post(
        "/auth/verify",
        {
          email: normalizedEmail,
          code: normalizedCode,
        },
        {
          withCredentials: true,
        }
      );

      setMessage("Email verified successfully.");
      setMessageType("success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Verification failed."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function requestNewCode() {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setMessage("Please enter your email address first.");
      setMessageType("error");
      return;
    }

    if (!captchaToken) {
      setMessage(
        "Please complete the reCAPTCHA before requesting a new code."
      );
      setMessageType("error");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      const response = await apiClient.post(
        "/auth/resend",
        {
          email: normalizedEmail,
          recaptchaToken: captchaToken,
        },
        {
          withCredentials: true,
        }
      );

      setMessage(
        response.data?.message ||
          "A new verification code has been sent."
      );
      setMessageType("success");

      setSecondsLeft(
        RESEND_COOLDOWN_SECONDS
      );
      setTimerActive(true);

      setCaptchaToken(null);
      captchaRef.current?.reset();
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "We could not send a verification code right now."
      );
      setMessageType("error");

      setCaptchaToken(null);
      captchaRef.current?.reset();
    } finally {
      setResending(false);
    }
  }

  const canRequestNewCode =
    !timerActive && secondsLeft === 0;

  const messageColor =
    messageType === "error"
      ? "text-red-600"
      : messageType === "success"
      ? "text-green-600"
      : "text-gray-600";

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
            background:
              theme === "dark"
                ? "#0b2149"
                : "#ffffff",
            color:
              theme === "dark"
                ? "#ffffff"
                : "#0a1b2a",
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
          <h2 className="text-2xl font-semibold text-center mb-2">
            Verify Your Email 📩
          </h2>

          <p className="text-sm text-center mb-6 opacity-75">
            Enter your email and verification code below.
          </p>

          <form
            onSubmit={submitVerification}
            className="space-y-4"
          >
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
            />

            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter verification code"
              value={code}
              onChange={(event) => {
                const digitsOnly =
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                setCode(digitsOnly);
              }}
              className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200 disabled:opacity-60"
            >
              {loading
                ? "Verifying..."
                : "Verify Email"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            {timerActive && secondsLeft > 0 ? (
              <p className="opacity-80">
                You can request a new code in{" "}
                <span className="font-semibold text-turquoise">
                  {formatTime(secondsLeft)}
                </span>
              </p>
            ) : (
              <>
                <p className="mb-3 opacity-80">
                  Need a new verification code?
                </p>

                <div className="flex justify-center my-3">
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={
                      process.env
                        .NEXT_PUBLIC_RECAPTCHA_SITE_KEY
                    }
                    onChange={(token) => {
                      setCaptchaToken(token);
                    }}
                    onExpired={() => {
                      setCaptchaToken(null);

                      setMessage(
                        "reCAPTCHA expired. Please verify again."
                      );
                      setMessageType("error");
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={requestNewCode}
                  disabled={
                    resending ||
                    !canRequestNewCode
                  }
                  className="bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-navy/80 transition-all disabled:opacity-60"
                >
                  {resending
                    ? "Sending..."
                    : "Send verification code"}
                </button>
              </>
            )}
          </div>

          {message && (
            <p
              className={`text-sm text-center mt-4 ${messageColor}`}
            >
              {message}
            </p>
          )}

          <div className="mt-6 text-center text-sm opacity-90">
            <p>
              Didn’t register yet?{" "}
              <a
                href="/auth/register"
                className="text-turquoise font-medium hover:underline"
              >
                Sign up
              </a>
            </p>

            <p className="mt-2">
              Back to{" "}
              <a
                href="/auth/login"
                className="text-turquoise font-medium hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
