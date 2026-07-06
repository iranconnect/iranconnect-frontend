//frontend/pages/auth/verify.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import apiClient from "../../utils/apiClient"; // ← axios حذف شد و apiClient اضافه شد
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReCAPTCHA from "react-google-recaptcha"; // ✅ اضافه شد

export default function Verify() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [theme, setTheme] = useState("light");
  const [captchaToken, setCaptchaToken] = useState(null);

  // 🎯 گرفتن ایمیل از URL — بدون localStorage
  useEffect(() => {
    const urlEmail = new URLSearchParams(window.location.search).get("email");

    if (urlEmail) {
      setEmail(urlEmail);
      setTimerActive(true);
      setSecondsLeft(60);
    } else {
      router.push("/auth/register");
    }
  }, [router]);

  // 🎨 تم
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

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

  // ⏱️ تایمر
  useEffect(() => {
    if (timerActive && secondsLeft > 0) {
      const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timerActive, secondsLeft]);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" + sec : sec}`;
  }

  // ✅ ارسال کد وریفای — بدون localStorage
  async function submit(e) {
    e.preventDefault();
    if (!code) return setMsg("Please enter your verification code.");

    setLoading(true);
    setMsg("");

    try {
      const res = await apiClient.post("/auth/verify", {
        email,
        code,
      });

      setMsg("✅ Email verified successfully!");

      // حذف localStorage — HttpOnly Cookie جایگزین است
      // اگر از گذشته token برگشت داده شود، برای Backward Compatibility نادیده گرفته می‌شود

      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      setMsg(err.response?.data?.error || "❌ Verification failed.");
    }

    setLoading(false);
  }

  // 🔁 ارسال مجدد کد — با reCAPTCHA و بدون localStorage
  async function resendCode() {
    if (!email) return;

    if (!captchaToken) {
      setMsg("⚠️ Please complete the reCAPTCHA before resending.");
      return;
    }

    setResending(true);
    setMsg("");

    try {
      const res = await apiClient.post("/auth/resend", {
        email,
        recaptchaToken: captchaToken,
      });

      setMsg(res.data.message || "Verification code resent successfully.");
      setSecondsLeft(60);
      setTimerActive(true);
      setCaptchaToken(null);
    } catch (err) {
      setMsg(err.response?.data?.error || "❌ Failed to resend code.");
    }

    setResending(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        background: "#ffffff",
        color: "var(--text)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
              Verify Your Email 📩
            </h2>

            <form onSubmit={submit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-[#f5f7fa] text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <div className="text-center mt-5 text-sm">
              {timerActive && secondsLeft > 0 ? (
                <p className="text-white-600">
                  You can request a new code in{" "}
                  <span className="font-semibold text-turquoise animate-pulse transition-opacity duration-300">
                    {formatTime(secondsLeft)}
                  </span>
                </p>
              ) : (
                <>
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

                  <button
                    onClick={resendCode}
                    disabled={resending}
                    className="mt-2 bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-navy/80 transition-all"
                  >
                    {resending ? "Resending..." : "Resend Code"}
                  </button>
                </>
              )}
            </div>

            {msg && (
              <p
                className={`text-sm text-center mt-4 ${
                  msg.startsWith("✅") ? "text-green-600" : "text-green-600"
                }`}
              >
                {msg}
              </p>
            )}

            <div className="mt-6 text-center text-sm text-white-600">
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
    </div>
  );
}
