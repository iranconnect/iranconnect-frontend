//frontend/hooks/useSentryPageFeature.js
import { useEffect } from "react";
import { withSentryFeature } from "../utils/sentryContext";

export function useSentryPageFeature(feature) {
  useEffect(() => {
    // Intentionally empty side-effect
    // Feature tag is applied only when an event is captured via withSentryFeature
  }, [feature]);

  return (fn) => withSentryFeature(feature, fn);
}
