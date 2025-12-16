// frontend/pages/_document.js
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* =============================
              🔐 Security Meta Headers
          ============================== */}

          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

          <meta
            name="referrer"
            content="strict-origin-when-cross-origin"
          />

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
            content="
              default-src 'self';

              script-src
                'self'
                https://www.google.com
                https://www.gstatic.com
                https://maps.googleapis.com
                https://maps.gstatic.com;

              style-src
                'self'
                'unsafe-inline';

              img-src
                'self'
                data:
                blob:
                https://api.iranconnect.org
                https://res.cloudinary.com
                https://maps.googleapis.com
                https://maps.gstatic.com
                https://*.googleusercontent.com;

              connect-src
                'self'
                https://api.iranconnect.org
                https://maps.googleapis.com
                https://api.cloudinary.com;

              frame-src
                https://www.google.com;

              font-src
                'self'
                https:;

              base-uri 'self';
              form-action 'self';
              object-src 'none';
            "
              .replace(/\s{2,}/g, " ")
              .trim()
          />

          <meta name="theme-color" content="#18224B" />
        </Head>

        <body>
          <Main />
          <NextScript />

          <noscript>
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                background: "#18224B",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              IranConnect requires JavaScript to function properly.
            </div>
          </noscript>
        </body>
      </Html>
    );
  }
}
