//frontend/sentry.server.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_ENV,

  enabled: process.env.NODE_ENV === "production" ||
           process.env.NEXT_PUBLIC_ENV === "staging",

  tracesSampleRate: 0.2,

  beforeSend(event) {
    /* 🔐 Mask IP & headers */
    if (event.user) {
      delete event.user.ip_address;
    }

    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }

    return event;
  },
});
