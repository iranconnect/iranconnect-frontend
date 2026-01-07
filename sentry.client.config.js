//frontend/sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_ENV,

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,

  enabled: process.env.NODE_ENV === "production" ||
           process.env.NEXT_PUBLIC_ENV === "staging",
});
