// frontend/utils/apiClient.js
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://api.iranconnect.org/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    // ⬅️ اضافه کردن هدر امنیتی مخصوص درخواست‌های Admin
    if (config.url.startsWith("/admin")) {
      config.headers["x-iranconnect-admin"] = "1";
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// RESPONSE INTERCEPTOR
function forceLogoutAndRedirect(message) {
  try {
    sessionStorage.clear();
    if (message) localStorage.setItem("iran_security_msg", message);
  } catch (_) {}

    window.location.href = "/auth/login";
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) return Promise.reject(err);

    const { status, data } = err.response;

    if (status === 423)
      forceLogoutAndRedirect("Your account was temporarily locked.");

    // صفحات عمومی احراز هویت که نباید در آن‌ها redirect اجباری انجام شود
    const authPages = ["/auth/login", "/auth/forgot", "/auth/register", "/auth/change-password", "/", "/about", "/contact", "/privacy-policy", "/terms-of-service", "/cookies" ];
    
    // --- Auto Logout (Session invalidation: login on another device)
    if (status === 440 && data?.reason === "logged_in_elsewhere") {
      const currentPath = window.location.pathname || "";
    
      // فقط اگر روی صفحات غیر-auth هستیم ریدایرکت کنیم
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
    
        sessionStorage.setItem("iran_auto_logout_msg", htmlMsg);
        window.location.href = "/auth/login?forced=1";
      }
    
      // روی خود صفحات auth فقط خطا را پاس می‌دهیم، بدون redirect
      return Promise.reject(err);
    }

    if (
      status === 403 &&
      data?.error === "Session invalidated. Please log in again."
    )
      forceLogoutAndRedirect("Session invalidated.");

    if (
      status === 401 &&
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("expired")
    )
      forceLogoutAndRedirect("Your session has expired.");

    return Promise.reject(err);
  }
);

export default apiClient;
