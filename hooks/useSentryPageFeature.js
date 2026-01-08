//frontend/hooks/useSentryPageFeature.js
import { withSentryFeature } from "../utils/sentryContext";
import { useSentryContextStatus } from "./useSentryContextStatus";

export function useSentryPageFeature(feature) {
  const sentryReady = useSentryContextStatus();

  return (fn) => {
    if (!sentryReady) return;

    withSentryFeature(feature, fn);
  };
}
