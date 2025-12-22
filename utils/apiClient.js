//utils/apiClient.js
import axios from "axios";

/* =====================================================
   🌐 API BASE (ENV ONLY — NO FALLBACK)
===================================================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  throw new Error("❌ NEXT_PUBLIC_API_BASE is not defined");
}

/* =====================================================
   ⚙️ Axios instance
===================================================== */
const apiClient = axios.create({
  baseURL: API_BASE, // ⬅️ فقط از ENV
  withCredentials: true, // ⬅️ الزامی برای HttpOnly cookies
  timeout: 15000,
});

/* =====================================================
   📨 REQUEST INTERCEPTOR
===================================================== */
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;

    // ⬅️ اضافه کردن هدر امنیتی مخصوص درخواست‌های Admin
    if (config.url && config.url.includes("/admin")) {
      config.headers["x-iranconnect-admin"] = "1";
    }

    return config;
  },
  (err) => Promise.reject(err)
);

/* =====================================================
   📥 RESPONSE INTERCEPTOR
===================================================== */
function forceLogoutAndRedirect(message) {
  try {
    sessionStorage.clear();
    if (message) localStorage.setItem("iran_security_msg", message);
  } catch (_) {}

  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

apiClient.interceptors.response.use(
  (res) => res,

  // ✅ فقط این تابع async است (ساختار صحیح axios)
  async (err) => {
    if (!err.response) return Promise.reject(err);

    const { status, data } = err.response;

    /* -------------------------------------------------
       🔒 IP / Account Locked
    ------------------------------------------------- */
    if (status === 423) {
      forceLogoutAndRedirect("Your account was temporarily locked.");
      return Promise.reject(err);
    }

    /* -------------------------------------------------
       🔐 صفحات عمومی احراز هویت
    ------------------------------------------------- */
    const authPages = [
      "/auth/login",
      "/auth/forgot",
      "/auth/register",
      "/auth/change-password",
      "/",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms-of-service",
      "/cookies",
    ];

    /* -------------------------------------------------
       🔐 Auto Logout — Concurrent Login Detected
    ------------------------------------------------- */
    if (status === 440 && data?.reason === "logged_in_elsewhere") {
      const currentPath = window.location.pathname || "";

      if (!authPages.includes(currentPath)) {
        const htmlMsg = `
          <div style="
            background:#fff7d6;
            color:#6b4e00;
            padding:12px 14px;
            border:1px solid #f4e2a4;
            border-radius:12px;
            font-size:13px;
            line-height:1.5;
            margin-bottom:10px;
          ">
            <strong>Security notice</strong><br/>
            You were logged out because we detected a login from another device.
            If this wasn't you, please reset your password.
          </div>

          <a 
            href="/auth/forgot"
            style="
              display:block;
              width:100%;
              text-align:center;
              padding:10px 12px;
              background:#00c4b4;
              color:#0a1b2a;
              border-radius:10px;
              font-weight:600;
              margin-bottom:16px;
              text-decoration:none;
            "
          >
            Reset password
          </a>
        `;

        try {
          // ✅ لاگ‌اوت واقعی → حذف HttpOnly cookie
          await apiClient.post(
            "/auth/logout",
            {},
            { withCredentials: true }
          );
        } catch (_) {
          // fail-safe: حتی اگر logout fail شد ادامه بده
        }

        sessionStorage.setItem("iran_auto_logout_msg", htmlMsg);
        window.location.href = "/auth/login?reason=security";
      }

      return Promise.reject(err);
    }

    /* -------------------------------------------------
       🔒 Session Invalidated (Generic)
    ------------------------------------------------- */
    if (
      status === 403 &&
      data?.error === "Session invalidated. Please log in again."
    ) {
      forceLogoutAndRedirect("Session invalidated.");
      return Promise.reject(err);
    }

    /* -------------------------------------------------
       ⏳ Expired Session
    ------------------------------------------------- */
    const PUBLIC_PATHS = [
      "/",
      "/search",
      "/business",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms-of-service",
      "/cookies",
      "/auth/login",
      "/auth/register",
      "/auth/forgot",
    ];

    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    const isPublicPage = PUBLIC_PATHS.some(
      (p) => currentPath === p || currentPath.startsWith(p + "/")
    );

    if (
      !isPublicPage &&
      status === 401 &&
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("expired")
    ) {
      forceLogoutAndRedirect("Your session has expired.");
    }

    return Promise.reject(err);
  }
);

export default apiClient;
