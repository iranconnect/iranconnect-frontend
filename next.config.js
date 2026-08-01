const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

module.exports = withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Temporarily expose Sentry build output so source-map upload
    // failures and permission problems are visible in Vercel logs.
    silent: true,

    widenClientFileUpload: true,

    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  }
);
