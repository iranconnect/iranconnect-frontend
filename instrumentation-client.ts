import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_ENV || "development",

  tracesSampleRate: 0.2,

  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[SENTRY]",
        event.message
      );
    }

    return event;
  },
});

export const onRouterTransitionStart =
  Sentry.captureRouterTransitionStart;
