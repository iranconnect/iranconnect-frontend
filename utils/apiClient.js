// frontend/utils/apiClient.js
import axios from "axios";

// 🟢 آدرس صحیح بک‌اند (نباید /api آخرش وجود داشته باشد)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://api.iranconnect.org"; // ← اصلاح شد

// نمونه axios با تنظیمات امن
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// helper: خروج کامل + پیام امنیتی
function forceLogoutAndRedirect(message) {
  try {
    localStorage.removeItem("iran_token");
    localStorage.removeItem("iran_role");
    sessionStorage.clear();
    if (message) {
      localStorage.setItem("iran_security_msg", message);
    }
  } catch (e) {
    console.warn("cleanup failed", e);
  }
  window.location.href = "/auth/login";
}

// Interceptor درخواست‌ها
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (err) => Promise.reject(err)
);

// Interceptor پاسخ‌ها
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) return Promise.reject(error);

    const { status, data } = error.response;

    if (status === 423) {
      forceLogoutAndRedirect(
        "Your account was temporarily locked due to unusual activity. Please change your password or contact support."
      );
    }

    if (status === 440 || data?.reason === "logged_in_elsewhere") {
      forceLogoutAndRedirect(
        "We detected a new login to your account from another device."
      );
    }

    if (
      status === 403 &&
      data?.error === "Session invalidated. Please log in again."
    ) {
      forceLogoutAndRedirect(
        "Your session is no longer valid. Please log in again."
      );
    }

    if (
      status === 401 &&
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("expired")
    ) {
      forceLogoutAndRedirect("Your session expired. Please log in again.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
