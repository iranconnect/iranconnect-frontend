// pages/__debug/sentry.js
export default function SentryTest() {
  return (
    <button
      onClick={() => {
        throw new Error("🔥 FRONTEND_SENTRY_STAGING_TEST");
      }}
    >
      Trigger Sentry Error
    </button>
  );
}
