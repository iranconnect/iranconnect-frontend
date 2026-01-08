//frontend/utils/sessionRole.js
import apiClient from "./apiClient";

let cachedRole = null;
let rolePromise = null;

export async function getSessionRole() {
  if (cachedRole) return cachedRole;

  if (!rolePromise) {
    rolePromise = apiClient
      .get("/auth/me", { withCredentials: true })
      .then((res) => {
        cachedRole = res.data?.role || "guest";
        return cachedRole;
      })
      .catch(() => {
        cachedRole = "guest";
        return cachedRole;
      });
  }

  return rolePromise;
}
