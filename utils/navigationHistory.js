// frontend/utils/navigationHistory.js

const PREVIOUS_SAFE_PATH_KEY =
  "iranconnect_previous_safe_path";

function getPathname(path) {
  if (typeof path !== "string") return "";

  return path
    .trim()
    .split("?")[0]
    .split("#")[0];
}

export function isSafeInternalPath(path) {
  if (typeof path !== "string") return false;

  const normalizedPath = path.trim();
  const pathname = getPathname(normalizedPath);

  if (!normalizedPath.startsWith("/")) return false;
  if (normalizedPath.startsWith("//")) return false;
  if (normalizedPath.includes("\\")) return false;

  if (!pathname) return false;
  if (pathname === "/403") return false;

  return true;
}

export function rememberPreviousSafePath(path) {
  if (typeof window === "undefined") return;
  if (!isSafeInternalPath(path)) return;

  try {
    sessionStorage.setItem(
      PREVIOUS_SAFE_PATH_KEY,
      path
    );
  } catch {
    // Ignore storage failures.
  }
}

export function consumePreviousSafePath() {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const storedPath = sessionStorage.getItem(
      PREVIOUS_SAFE_PATH_KEY
    );

    sessionStorage.removeItem(
      PREVIOUS_SAFE_PATH_KEY
    );

    if (isSafeInternalPath(storedPath)) {
      return storedPath;
    }
  } catch {
    // Ignore storage failures.
  }

  return "/";
}
