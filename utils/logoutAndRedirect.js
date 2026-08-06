import apiClient from "./apiClient";

/**
 * Best-effort server logout followed by a full-page redirect.
 *
 * A full reload is intentional:
 * - clears all in-memory session state
 * - remounts AuthSessionProvider
 * - prevents stale authenticated UI
 */
export async function logoutAndRedirect(
  destination = "/search"
) {
  try {
    await apiClient.post(
      "/auth/logout",
      {},
      {
        withCredentials: true,
        skipAuthRedirect: true,
      }
    );
  } catch {
    // Logout navigation must continue even if the request fails.
  }

  if (typeof window !== "undefined") {
    window.location.replace(destination);
  }
}
