// frontend/utils/apiClient.js

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE is not defined"
  );
}

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 120000,
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

let handlingConcurrentLogout = false;

/*
 * Centralized session termination.
 *
 * This function must only be used for authentication/session failures,
 * never for authorization failures such as HTTP 403.
 */
function forceRedirect(message, reason = "") {
  if (handlingConcurrentLogout) return;

  handlingConcurrentLogout = true;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem("iran_user");
    sessionStorage.removeItem("iran_role");
    sessionStorage.removeItem("iran_token");

    if (message) {
      sessionStorage.setItem(
        "iran_auto_logout_msg",
        message
      );
    }
  } catch {
    // Storage may be unavailable, but redirect must continue.
  }

  const query = reason
    ? `?reason=${encodeURIComponent(reason)}`
    : "";

  window.location.replace(`/auth/login${query}`);
}

apiClient.interceptors.response.use(
  (response) => response,

  async (err) => {
    if (!err.response) {
      return Promise.reject(err);
    }

    const {
      status,
      data,
    } = err.response;

    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "";

    const AUTH_PAGES = [
      "/auth/login",
      "/auth/forgot",
      "/auth/register",
      "/auth/change-password",
    ];

    /* 🔒 IP / Account Blocked */
    if (status === 423) {
      forceRedirect(
        "Your account was temporarily locked."
      );

      return Promise.reject(err);
    }

    /* 🚨 Concurrent Login Detected */
    if (
      status === 440 &&
      data?.reason === "logged_in_elsewhere" &&
      !handlingConcurrentLogout &&
      (
        !AUTH_PAGES.includes(currentPath) ||
        err.config?.requireAuth === true
      )
    ) {
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

      forceRedirect(htmlMsg, "security");

      return Promise.reject(err);
    }

    /* ⏳ Invalid or Expired Session */
    const skipAuthRedirect =
      err.config?.skipAuthRedirect === true;

    const isProtectedPage =
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/account");
    
    const requestRequiresAuth =
      err.config?.requireAuth === true;
    
    if (
      status === 401 &&
      !skipAuthRedirect &&
      !AUTH_PAGES.includes(currentPath) &&
      (isProtectedPage || requestRequiresAuth)
    ) {
      const errorText =
        typeof data?.error === "string"
          ? data.error.toLowerCase()
          : "";

      const sessionExpired =
        errorText.includes("expired");

      forceRedirect(
        sessionExpired
          ? "Your session has expired."
          : "Please sign in again."
      );

      return Promise.reject(err);
    }

    /*
     * Do not globally redirect HTTP 403.
     *
     * Page-level 403:
     *   redirect to /403 in the page context.
     *
     * Modal/action-level 403:
     *   show a local permission error.
     */
    return Promise.reject(err);
  }
);

export default apiClient;
