//frontend/sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV || "development",

  // ⛔️ فقط برای تست می‌گذاریم 100%
  tracesSampleRate: 1.0,

  // برای اینکه Message هم ثبت شود
  beforeSend(event) {
    console.log("[SENTRY CLIENT beforeSend]", {
      message: event.message,
      level: event.level,
    });

    return event;
  },
});
