// frontend/instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV || "development",

    tracesSampleRate: 0.2,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    beforeSend(event) {
      // Guard: never send events without page
      if (!event.tags?.page) return null;
      return event;
    },
  });
}
