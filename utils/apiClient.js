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

    if (status === 440 || data?.reason === "logged_in_elsewhere")
      forceLogoutAndRedirect("New login detected.");

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
