//frontend/hooks/useSentryPageLoad.js
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { useSentryContextStatus } from "./useSentryContextStatus";

export function useSentryPageLoad(message, options = {}) {
  const sentryReady = useSentryContextStatus();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!sentryReady) return;
    if (firedRef.current) return;

    firedRef.current = true;

    Sentry.captureMessage(message, {
      level: options.level || "info",
      tags: {
        page_event: "page_load",
        ...options.tags,
      },
    });
  }, [sentryReady, message, options]);
}
