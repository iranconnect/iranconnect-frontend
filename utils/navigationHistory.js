// frontend/utils/navigationHistory.js

const PREVIOUS_SAFE_PATH_KEY =
  "iranconnect_previous_safe_path";

export function isSafeInternalPath(path) {
  if (typeof path !== "string") return false;

  const normalizedPath = path.trim();

  if (!normalizedPath.startsWith("/")) return false;
  if (normalizedPath.startsWith("//")) return false;
  if (normalizedPath === "/403") return false;

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

export function getPreviousSafePath() {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const storedPath = sessionStorage.getItem(
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
