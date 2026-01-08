//frontend/sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

const isEnabled =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENV === "staging";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_ENV,

  enabled: isEnabled,

  /* 📊 Performance control */
  tracesSampleRate: 0.2,

  /* 🎥 Session Replay (GDPR-safe defaults) */
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  /* 🔐 GDPR & Noise control */
  beforeSend(event, hint) {
    /* ⛔ Drop expected auth errors */
    const status =
      event?.contexts?.response?.status_code ||
      hint?.originalException?.status;

    if (status === 401 || status === 403) {
      return null;
    }

    /* ⛔ Drop aborted fetch/navigation */
    const msg =
      event.message ||
      hint?.originalException?.message ||
      "";

    if (
      msg.includes("AbortError") ||
      msg.includes("aborted") ||
      msg.includes("canceled")
    ) {
      return null;
    }

    /* 🔐 Mask PII */
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    if (event.request?.url) {
      event.request.url = event.request.url.split("?")[0];
    }

    return event;
  },
});
