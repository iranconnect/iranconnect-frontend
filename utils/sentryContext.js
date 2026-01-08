//frontend/utils/sentryContext.js
import * as Sentry from "@sentry/nextjs";

/**
 * Sets base context on CURRENT Sentry scope
 * Must be called BEFORE any event is captured
 */
export function setSentryBaseContext({ role, page }) {
  Sentry.setTag("role", role || "guest");
  Sentry.setTag("page", page);

  // Optional but future-proof
  Sentry.setContext("app", {
    role,
    page,
  });
}

/**
 * Feature-level tagging — isolated scope
 */
export function withSentryFeature(feature, fn) {
  return Sentry.withScope((scope) => {
    scope.setTag("feature", feature);
    return fn();
  });
}
