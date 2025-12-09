//frontend/pages/auth/change-password.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff } from "lucide-react";
import apiClient from "../../utils/apiClient"; // ✅ جایگزین axios

export default function ChangePassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState("light");
  const [captchaToken, setCaptchaToken] = useState(null);

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
        setMsgType("error");
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
      setMsgType("error");
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

    if (!captchaToken) {
      setMsg("Please complete CAPTCHA verification.");
      setMsgType("error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(
        "/auth/reset",
        { token, password, confirmPassword, captchaToken },
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
      }
    } catch (err) {
      setMsg(
        err.response?.data?.error ||
          "Link expired or invalid. Please try again."
      );
      setMsgType("error");
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

          {/* ❌ اگر توکن نامعتبر بود */}
          {msgType === "error" ? (
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

              {/* Google reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(t) => setCaptchaToken(t)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200"
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
