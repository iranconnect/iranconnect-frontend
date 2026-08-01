const { withSentryConfig } = require("@sentry/nextjs");

const isStaging =
  process.env.NEXT_PUBLIC_ENV === "staging";

const apiOrigin = isStaging
  ? "https://api-staging.iranconnect.org"
  : "https://api.iranconnect.org";

const contentSecurityPolicy = `
  default-src 'self';

  script-src
    'self'
    'unsafe-inline'
    https://www.google.com
    https://www.gstatic.com
    https://maps.googleapis.com
    https://maps.gstatic.com
    https://www.googletagmanager.com
    https://www.google-analytics.com
    ${isStaging ? "https://vercel.live" : ""};

  style-src
    'self'
    'unsafe-inline'
    https://fonts.googleapis.com;

  img-src
    'self'
    data:
    blob:
    ${apiOrigin}
    https://res.cloudinary.com
    https://maps.googleapis.com
    https://maps.gstatic.com
    https://www.google.com
    https://www.gstatic.com
    https://*.googleusercontent.com;

  connect-src
    'self'
    ${apiOrigin}
    https://*.sentry.io
    https://maps.googleapis.com
    https://places.googleapis.com
    https://api.cloudinary.com
    https://www.google.com
    https://www.recaptcha.net
    https://www.gstatic.com
    https://www.google-analytics.com
    https://region1.google-analytics.com
    https://stats.g.doubleclick.net
    ${isStaging ? "https://vercel.live" : ""};

  frame-src
    https://www.google.com
    https://www.recaptcha.net
    ${isStaging ? "https://vercel.live" : ""};

  font-src
    'self'
    https://fonts.gstatic.com
    data:;

  base-uri 'self';
  form-action 'self' ${apiOrigin};
  frame-ancestors 'none';
  object-src 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  async redirects() {
    return [
      {
        source: "/intro",
        destination: "/",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: false,
      },
      {
        source: "/admin/add",
        destination: "/admin/add-v2",
        permanent: false,
      },
      {
        source: "/admin/new",
        destination: "/admin/add-v2",
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    silent: true,

    widenClientFileUpload: true,

    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  }
);
