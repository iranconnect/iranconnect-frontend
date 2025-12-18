// frontend/pages/_document.js
import Document, { Html, Head, Main, NextScript } from "next/document";

const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

const API_ORIGIN = isStaging
  ? "https://iranconnect-backend-staging.onrender.com"
  : "https://api.iranconnect.org";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* =============================
              🔐 Security Headers
          ============================== */}

          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

          <meta name="referrer" content="strict-origin-when-cross-origin" />

          <meta
            httpEquiv="Permissions-Policy"
            content="
              camera=(),
              microphone=(),
              geolocation=(),
              payment=(),
              usb=(),
              interest-cohort=()
            "
          />

          {/* =============================
              🔐 Content Security Policy
          ============================== */}
          <meta
            httpEquiv="Content-Security-Policy"
            content={`
              default-src 'self';

              script-src
                'self'
                https://www.google.com
                https://www.gstatic.com
                https://maps.googleapis.com
                https://maps.gstatic.com
                ${isStaging ? "https://vercel.live" : ""};

              style-src
                'self'
                'unsafe-inline';

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
                ${isStaging ? "https://vercel.live" : ""};

              frame-src
                https://www.google.com;

              font-src
                'self'
                https:;

              base-uri 'self';
              form-action 'self';
              object-src 'none';
            `
              .replace(/\s{2,}/g, " ")
              .trim()}
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
