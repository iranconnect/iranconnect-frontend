//frontend/pages/__debug/sentry.js
import { useEffect } from "react";

export default function SentryTest() {
  useEffect(() => {
    throw new Error("🔥 FRONTEND_SENTRY_STAGING_TEST");
  }, []);

  return <div>Sentry test page</div>;
}
