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

          {/* جلوگیری از MIME sniffing */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

          {/* کنترل ارسال referrer */}
          <meta
            name="referrer"
            content="strict-origin-when-cross-origin"
          />

          {/* محدودسازی APIهای مرورگر */}
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

          {/* Content Security Policy (Frontend Layer) */}
          <meta
            httpEquiv="Content-Security-Policy"
            content="
              default-src 'self';
              script-src 'self' https://www.google.com https://www.gstatic.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https:;
              font-src 'self' https:;
              connect-src 'self' https:;
              frame-src https://www.google.com;
              base-uri 'self';
              form-action 'self';
              object-src 'none';
            "
          />

          {/* SEO / Accessibility baseline */}
          <meta name="theme-color" content="#18224B" />
        </Head>

        <body>
          <Main />
          <NextScript />

          {/* 🛑 Fallback if JS disabled */}
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
