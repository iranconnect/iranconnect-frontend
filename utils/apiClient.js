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

    // صفحات عمومی که نباید redirect شوند
    const authPages = ["/auth/login", "/auth/forgot", "/auth/register", "/auth/change-password"];
    
    // --- Auto Logout (Session invalidation: login on another device)
    if (status === 440 && data?.reason === "logged_in_elsewhere") {
      if (window.location.pathname !== "/auth/login") {
        
        // پیام HTML کامل برای موبایل
        const htmlMsg = `
          <div style="
            background:#fff7d6;
            color:#6b4e00;
            padding:14px 16px;
            border:1px solid #f4e2a4;
            border-radius:12px;
            font-size:14px;
            line-height:1.5;
            margin-bottom:12px;
          ">
            <strong>Security Notice</strong><br/>
            We detected a login to your account from another device.  
            You have been logged out for your protection.
          </div>
    
          <a 
            href="/auth/forgot"
            style="
              display:block;
              width:100%;
              text-align:center;
              padding:12px;
              background:#00c4b4;
              color:#0a1b2a;
              border-radius:10px;
              font-weight:600;
              margin-bottom:18px;
              text-decoration:none;
            "
          >
            Reset Password
          </a>
        `;
    
        sessionStorage.setItem("iran_auto_logout_msg", htmlMsg);
    
        window.location.href = "/auth/login?forced=1";
      }
    
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
