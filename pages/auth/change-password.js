//frontend/pages/auth/change-password.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff } from "lucide-react";
import apiClient from "../../utils/apiClient"; // ✅ جایگزین axios
import PageLoadingOverlay from "../../components/ui/PageLoadingOverlay";

export default function ChangePassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("validating");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState("light");
  const [captchaToken, setCaptchaToken] = useState(null);

  const captchaRef = useRef(null);

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordPolicyValid =
    passwordChecks.length &&
    passwordChecks.letter &&
    passwordChecks.number;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const strengthSignals = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const strengthScore =
    strengthSignals.filter(Boolean).length;

  const strengthLabel =
    !password
      ? ""
      : strengthScore <= 2
        ? "Weak"
        : strengthScore <= 3
          ? "Fair"
          : strengthScore <= 4
            ? "Good"
            : "Strong";

  const strengthPercent =
    Math.round((strengthScore / strengthSignals.length) * 100);

  /* 🔍 توکن را از بک‌اند چک می‌کنیم */
useEffect(() => {
  if (!token) return;

  async function validate() {
    try {
      const res = await apiClient.get(`/auth/validate-reset/${token}`, {
        withCredentials: true,
      });

      // اگر لینک نامعتبر است
      if (!res.data.valid) {
        setMsg(res.data.error || "Invalid or expired link.");
        setMsgType("link-error");
        return;
      }

      // اگر فقط IP/UA متفاوت بود → بلاک نکن!
      if (res.data.suspicious) {
        console.warn("⚠ Reset from different IP or device.");
      }

      // لینک معتبر است
      setMsg("");
      setMsgType("success");

    } catch (err) {
      setMsg(err.response?.data?.error || "Invalid or expired link.");
      setMsgType("link-error");
    }
  }

  validate();
}, [token]);


  /* 🎨 تم */
  useEffect(() => {
    const t =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(t);

    const observer = new MutationObserver(() => {
      const nt = document.documentElement.getAttribute("data-theme");
      setTheme(nt);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* 🔐 ارسال رمز جدید */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMsg("Please fill out both fields.");
      setMsgType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      setMsgType("error");
      return;
    }

    if (!passwordPolicyValid) {
      setMsg(
        "Choose a password with at least 8 characters, including a letter and a number."
      );
      setMsgType("error");
      return;
    }

    if (!captchaToken) {
      setMsg("Please complete CAPTCHA verification.");
      setMsgType("error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(
        "/auth/reset",
        { token, password, confirmPassword, recaptchaToken: captchaToken },
        { withCredentials: true }
      );

      if (res.data.success) {
        setMsg(res.data.message || "Password reset successful!");
        setMsgType("success");

        setTimeout(() => {
          router.push(res.data.redirect || "/auth/login");
        }, 2000);
      } else {
        setMsg(res.data.error || "Error resetting password.");
        setMsgType("error");

        setCaptchaToken(null);
        captchaRef.current?.reset();
      }
    } catch (err) {
      const data = err.response?.data || {};

      const linkRejected =
        data.code === "RESET_LINK_INVALID" ||
        data.code === "RESET_LINK_EXPIRED" ||
        data.valid === false;

      setMsg(
        data.error ||
          (linkRejected
            ? "Link expired or invalid. Please request a new reset link."
            : "Unable to reset the password. Please review the form and try again.")
      );

      setMsgType(
        linkRejected
          ? "link-error"
          : "error"
      );

      setCaptchaToken(null);
      captchaRef.current?.reset();
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff", color: "var(--text)" }}
    >
      <Header />

      <main className="flex flex-1 items-center justify-center p-6">
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
            Set a New Password
          </h2>

          {msgType === "validating" ? (
            <PageLoadingOverlay
              visible
              label="Validating reset link"
            />
          ) : msgType === "link-error" ? (
            <div className="text-center">
              <p className="text-lg mb-4">{msg}</p>
              <button
                onClick={() => router.push("/auth/forgot")}
                className="bg-turquoise text-navy px-4 py-2 rounded-lg font-medium hover:bg-turquoise/90 transition duration-200"
              >
                Request a new reset link
              </button>
            </div>
          ) : (
            /* ✅ فرم تغییر رمز */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-turquoise"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background:
                    theme === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "#f8fafc",
                }}
                aria-live="polite"
              >
                <p className="font-medium mb-3">
                  Password requirements
                </p>

                <div className="space-y-1.5">
                  <p>
                    {passwordChecks.length ? "✓" : "○"}{" "}
                    At least 8 characters
                  </p>

                  <p>
                    {passwordChecks.letter ? "✓" : "○"}{" "}
                    At least one letter
                  </p>

                  <p>
                    {passwordChecks.number ? "✓" : "○"}{" "}
                    At least one number
                  </p>
                </div>

                {password && (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span>Password strength</span>
                      <span className="font-medium">
                        {strengthLabel}
                      </span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-gray-200"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-turquoise transition-all duration-200"
                        style={{
                          width: `${strengthPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-turquoise"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <p
                  className="text-sm"
                  aria-live="polite"
                >
                  {passwordsMatch
                    ? "✓ Passwords match"
                    : "○ Passwords do not match yet"}
                </p>
              )}

              {/* Google reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(t) => {
                    setCaptchaToken(t);

                    if (t && msgType === "error") {
                      setMsg("");
                    }
                  }}
                  onExpired={() => {
                    setCaptchaToken(null);
                    setMsg(
                      "reCAPTCHA expired. Please verify again."
                    );
                    setMsgType("error");
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !passwordPolicyValid ||
                  !passwordsMatch ||
                  !captchaToken
                }
                className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Processing..." : "Change Password"}
              </button>

              {msg && (
                <p className="text-center text-sm mt-3">{msg}</p>
              )}
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
