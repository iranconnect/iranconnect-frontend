const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sentry: {
    hideSourceMaps: true,
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
  }
);

