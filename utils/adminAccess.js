// frontend/utils/adminAccess.js

export const LAST_ALLOWED_ADMIN_PATH_KEY =
  "iranconnect_last_allowed_admin_path";

export const DEFAULT_ADMIN_RETURN_PATH = "/admin/dashboard";

export function isSafeAdminPath(value) {
  if (typeof value !== "string") return false;

  const path = value.trim();

  if (!path.startsWith("/admin")) return false;
  if (path.startsWith("//")) return false;
  if (path === "/403") return false;
  if (path.startsWith("/auth/")) return false;

  return true;
}

export function rememberLastAllowedAdminPath(path) {
  if (typeof window === "undefined") return;
  if (!isSafeAdminPath(path)) return;

  try {
    sessionStorage.setItem(LAST_ALLOWED_ADMIN_PATH_KEY, path);
  } catch {
    // Storage may be unavailable; fallback will be used.
  }
}

export function getLastAllowedAdminPath() {
  if (typeof window === "undefined") {
    return DEFAULT_ADMIN_RETURN_PATH;
  }

  try {
    const storedPath = sessionStorage.getItem(
      LAST_ALLOWED_ADMIN_PATH_KEY
    );

    if (isSafeAdminPath(storedPath)) {
      return storedPath;
    }
  } catch {
    // Ignore storage errors.
  }

  return DEFAULT_ADMIN_RETURN_PATH;
}
