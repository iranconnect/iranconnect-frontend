//frontend/utils/sentryPageName.js
export function getSentryPageName(pathname) {
  if (!pathname) return "unknown";

  return pathname
    .replace(/\[.*?\]/g, "dynamic")
    .replace(/\//g, "-")
    .replace(/^-/, "");
}
