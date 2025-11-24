// frontend/utils/apiClient.js
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

// توجه کن: API_BASE باید همیشه به /api ختم شود
// چون همه روت‌های بک‌اند با /api شروع می‌شوند

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ░░░░ REQUEST INTERCEPTOR ░░░░
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (err) => Promise.reject(err)
);

// ░░░░ RESPONSE INTERCEPTOR ░░░░
function forceLogoutAndRedirect(message) {
  try {
    localStorage.removeItem("iran_token");
    localStorage.removeItem("iran_role");
    sessionStorage.clear();

    if (message) localStorage.setItem("iran_security_msg", message);
  } catch (_) {}

  window.location.href = "/auth/login";
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) return Promise.reject(error);

    const { status, data } = error.response;

    if (status === 423) {
      forceLogoutAndRedirect("Your account was temporarily locked.");
    }

    if (status === 440 || data?.reason === "logged_in_elsewhere") {
      forceLogoutAndRedirect("New login detected.");
    }

    if (
      status === 403 &&
      data?.error === "Session invalidated. Please log in again."
    ) {
      forceLogoutAndRedirect("Session invalidated.");
    }

    if (
      status === 401 &&
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("expired")
    ) {
      forceLogoutAndRedirect("Your session has expired.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
