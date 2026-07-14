// frontend/utils/navigationHistory.js

const LAST_SAFE_PATH_KEY =
  "iranconnect_last_safe_path";

function getPathname(path) {
  if (typeof path !== "string") {
    return "";
  }

  return path
    .trim()
    .split("?")[0]
    .split("#")[0];
}

export function isSafeInternalPath(path) {
  if (typeof path !== "string") {
    return false;
  }

  const normalizedPath = path.trim();
  const pathname = getPathname(normalizedPath);

  if (!normalizedPath.startsWith("/")) return false;
  if (normalizedPath.startsWith("//")) return false;
  if (normalizedPath.includes("\\")) return false;
  if (!pathname) return false;
  if (pathname === "/403") return false;
  if (pathname.startsWith("/auth/")) return false;

  return true;
}

export function isPublicSafePath(path) {
  if (!isSafeInternalPath(path)) {
    return false;
  }

  const pathname = getPathname(path);

  /*
   * Admin paths are stored only by AdminLayout after
   * successful authorization.
   */
  return !pathname.startsWith("/admin");
}

export function rememberLastSafePath(path) {
  if (typeof window === "undefined") return;
  if (!isSafeInternalPath(path)) return;

  try {
    sessionStorage.setItem(
      LAST_SAFE_PATH_KEY,
      path
    );
  } catch {
    // Ignore storage failures.
  }
}

export function consumeLastSafePath() {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const storedPath = sessionStorage.getItem(
      LAST_SAFE_PATH_KEY
    );

    sessionStorage.removeItem(
      LAST_SAFE_PATH_KEY
    );

    if (isSafeInternalPath(storedPath)) {
      return storedPath;
    }
  } catch {
    // Ignore storage failures.
  }

  return "/";
}
