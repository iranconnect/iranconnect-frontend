// frontend/hooks/useSafePageEvent.js
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { useSentryContextStatus } from "./useSentryContextStatus";

/**
 * useSafePageEvent — IranConnect
 *
 * Safe wrapper for page-level Sentry events
 *
 * Guarantees:
 * - Context is ready
 * - Event fires only once
 * - No need for manual guards in pages
 *
 * Does NOT:
 * - set tags
 * - set context
 * - handle auth
 */
export function useSafePageEvent(message, options = {}) {
  const sentryReady = useSentryContextStatus();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!message) return;
    if (!sentryReady) return;
    if (firedRef.current) return;

    firedRef.current = true;

    Sentry.captureMessage(message, {
      level: options.level || "info",
      tags: {
        page_event: "page_view",
        ...options.tags,
      },
    });
  }, [message, sentryReady, options]);
}
