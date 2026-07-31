//frontend/sentry.server.config.js
import * as Sentry from "@sentry/nextjs";
import { resolveSentrySampleRate } from "./utils/sentrySampleRate";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV || "development",
  tracesSampleRate: resolveSentrySampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    1.0
  ),
});
