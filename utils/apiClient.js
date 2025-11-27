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

    // --- Auto Logout (Session invalidation: login on another device)
    if (status === 440 && data?.reason === "logged_in_elsewhere") {
    
      // فقط وقتی که روی صفحه لاگین نیستیم
      if (window.location.pathname !== "/auth/login") {
    
        // پیام امنیتی — با لینک به Forgot Password
        const msg = `
    We detected a new login to your account from another device. 
    For your security, you have been logged out on this device. 
    If this wasn’t you, please <a href="/auth/forgot" class="text-turquoise font-medium underline">reset your password</a>.
        `;
    
        // ذخیره پیام در sessionStorage
        sessionStorage.setItem("iran_auto_logout_msg", msg);
    
        // ریدایرکت بدون لوپ
        window.location.href = "/auth/login?forced=1";
      }
    
      return Promise.reject(error);
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
