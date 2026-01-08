// frontend/hooks/useSentryPageFeature.js
import { useCallback } from "react";
import { withSentryFeature } from "../utils/sentryContext";
import { useSentryContextStatus } from "./useSentryContextStatus";

export function useSentryPageFeature(feature) {
  const sentryReady = useSentryContextStatus();

  const withFeature = useCallback(
    (fn) => {
      if (!sentryReady) return;
      withSentryFeature(feature, fn);
    },
    [sentryReady, feature]
  );

  return { withFeature, sentryReady };
}
