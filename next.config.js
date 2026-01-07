const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
  }
);
