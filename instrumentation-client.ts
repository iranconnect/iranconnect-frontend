import * as Sentry from "@sentry/nextjs";
import { resolveSentrySampleRate } from "./utils/sentrySampleRate";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_ENV || "development",

  tracesSampleRate: resolveSentrySampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    0.2
  ),

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
