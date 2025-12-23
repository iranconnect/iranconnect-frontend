// frontend/utils/apiClient.js
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not defined");

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

/* ================= REQUEST ================= */
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;

    if (config.url?.includes("/admin")) {
      config.headers["x-iranconnect-admin"] = "1";
    }

    return config;
  },
  (err) => Promise.reject(err)
);

/* ================= RESPONSE ================= */

let handlingConcurrentLogout = false; // 🔐 anti-loop flag

function forceRedirect(message, reason = "") {
  try {
    
    // پاکسازی امن فقط کلیدهای auth
    sessionStorage.removeItem("iran_user");
    sessionStorage.removeItem("iran_role");
    sessionStorage.removeItem("iran_token");

    if (message) {
      sessionStorage.setItem("iran_auto_logout_msg", message);
    }
  } catch {}

  if (typeof window !== "undefined") {
    const q = reason ? `?reason=${reason}` : "";
    window.location.replace(`/auth/login${q}`);
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!err.response) return Promise.reject(err);

    const { status, data } = err.response;
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    const AUTH_PAGES = [
      "/auth/login",
      "/auth/forgot",
      "/auth/register",
      "/auth/change-password",
    ];

    /* 🔒 IP / Account Blocked */
    if (status === 423) {
      forceRedirect("Your account was temporarily locked.");
      return Promise.reject(err);
    }

    /* 🚨 Concurrent Login Detected */
    if (
      status === 440 &&
      data?.reason === "logged_in_elsewhere" &&
      !handlingConcurrentLogout &&
      !AUTH_PAGES.includes(currentPath)
    ) {
      handlingConcurrentLogout = true;

      const htmlMsg = `
        <div style="
          background:#fff7d6;
          color:#6b4e00;
          padding:12px 14px;
          border:1px solid #f4e2a4;
          border-radius:12px;
          font-size:13px;
          margin-bottom:10px;
        ">
          <strong>Security notice</strong><br/>
          You were logged out because we detected a login from another device.
          If this wasn't you, please reset your password.
        </div>

        <a href="/auth/forgot"
           style="
             display:block;
             text-align:center;
             padding:10px;
             background:#00c4b4;
             color:#0a1b2a;
             border-radius:10px;
             font-weight:600;
             text-decoration:none;
           ">
          Reset password
        </a>
      `;

      sessionStorage.setItem("iran_auto_logout_msg", htmlMsg);
      forceRedirect(null, "security");

      return Promise.reject(err);
    }

    /* ⏳ Expired Session */
    if (
      status === 401 &&
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("expired")
    ) {
      forceRedirect("Your session has expired.");
    }

    return Promise.reject(err);
  }
);

export default apiClient;
