// frontend/pages/_document.js
import Document, { Html, Head, Main, NextScript } from "next/document";

const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

const API_ORIGIN = isStaging
  ? "https://api-staging.iranconnect.org"
  : "https://api.iranconnect.org";

/* =====================================================
   🔐 Content Security Policy (CSP)
   - Staging: allows vercel.live tools
   - Production: strict
   - GA allowed but executed ONLY after cookie consent
===================================================== */
const csp = `
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
    ${API_ORIGIN}
    https://res.cloudinary.com
    https://maps.googleapis.com
    https://maps.gstatic.com
    https://*.googleusercontent.com;

  connect-src
    'self'
    ${API_ORIGIN}
    https://maps.googleapis.com
    https://api.cloudinary.com
    https://www.google-analytics.com
    https://region1.google-analytics.com
    https://stats.g.doubleclick.net
    ${isStaging ? "https://vercel.live" : ""};

  frame-src
    https://www.google.com
    ${isStaging ? "https://vercel.live" : ""};

  font-src
    'self'
    https://fonts.gstatic.com
    data:;

  base-uri 'self';
  form-action 
    'self'
    ${API_ORIGIN};
  object-src 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* =============================
              🔐 Security Headers
          ============================== */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

          <meta
            name="referrer"
            content="strict-origin-when-cross-origin"
          />

          <meta
            httpEquiv="Permissions-Policy"
            content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
          />

          <meta
            httpEquiv="Content-Security-Policy"
            content={csp}
          />

          {/* =============================
              🎨 Theme
          ============================== */}
          <meta name="theme-color" content="#18224B" />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
