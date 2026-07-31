// pages/__debug/sentry.js

import { useState } from "react";

export default function SentryTest() {
  const [triggered, setTriggered] = useState(false);

  function triggerSentryError() {
    if (triggered) return;

    setTriggered(true);

    /*
     * Throw asynchronously so React can first render the confirmation
     * message before Sentry captures the unhandled exception.
     */
    window.setTimeout(() => {
      throw new Error(
        "🔥 FRONTEND_SENTRY_STAGING_TEST"
      );
    }, 0);
  }

  return (
    <main className="sentry-page">
      <section className="sentry-card">
        <div className="sentry-icon" aria-hidden="true">
          !
        </div>

        <div className="environment-badge">
          Staging diagnostics
        </div>

        <h1>Sentry Error Test</h1>

        <p className="description">
          This page generates a controlled frontend error to verify
          that the Sentry monitoring integration is receiving events
          correctly.
        </p>

        <div className="warning-box">
          <strong>Test only:</strong> clicking the button intentionally
          creates an unhandled browser error. No application data will
          be modified.
        </div>

        <button
          type="button"
          className="trigger-button"
          onClick={triggerSentryError}
          disabled={triggered}
        >
          <span aria-hidden="true">⚡</span>

          {triggered
            ? "Test event triggered"
            : "Trigger Sentry test error"}
        </button>

        {triggered && (
          <p className="result-message" role="status">
            The test error was triggered. Check the Sentry Issues
            dashboard for a new event named
            <code> FRONTEND_SENTRY_STAGING_TEST</code>.
          </p>
        )}

        <p className="footer-note">
          Reload this page to run another test.
        </p>
      </section>

      <style jsx>{`
        .sentry-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background:
            radial-gradient(
              circle at top right,
              rgba(64, 224, 208, 0.16),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #07162a 0%,
              #0a1d37 55%,
              #102b4f 100%
            );
        }

        .sentry-card {
          width: 100%;
          max-width: 620px;
          padding: 42px;
          text-align: center;
          color: #0a1d37;
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 24px;
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .sentry-icon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          color: #0a1d37;
          font-size: 32px;
          font-weight: 800;
          background: #40e0d0;
          border-radius: 20px;
          box-shadow: 0 12px 28px rgba(64, 224, 208, 0.32);
        }

        .environment-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          margin-bottom: 16px;
          color: #096b63;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(64, 224, 208, 0.16);
          border: 1px solid rgba(64, 224, 208, 0.45);
          border-radius: 999px;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 40px);
          line-height: 1.15;
        }

        .description {
          max-width: 500px;
          margin: 18px auto 24px;
          color: #506078;
          font-size: 16px;
          line-height: 1.7;
        }

        .warning-box {
          padding: 15px 17px;
          margin-bottom: 26px;
          color: #755100;
          font-size: 14px;
          line-height: 1.6;
          text-align: left;
          background: #fff8df;
          border: 1px solid #f0d98b;
          border-radius: 14px;
        }

        .trigger-button {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px 22px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 750;
          cursor: pointer;
          background: #0a1d37;
          border: 0;
          border-radius: 14px;
          box-shadow: 0 12px 26px rgba(10, 29, 55, 0.25);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .trigger-button:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #12345d;
          box-shadow: 0 16px 32px rgba(10, 29, 55, 0.3);
        }

        .trigger-button:focus-visible {
          outline: 3px solid rgba(64, 224, 208, 0.75);
          outline-offset: 4px;
        }

        .trigger-button:disabled {
          color: #24465f;
          cursor: default;
          background: #9ceee6;
          box-shadow: none;
        }

        .result-message {
          padding: 14px 16px;
          margin: 20px 0 0;
          color: #126158;
          font-size: 14px;
          line-height: 1.6;
          background: #e9fffb;
          border: 1px solid #91ded5;
          border-radius: 13px;
        }

        code {
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .footer-note {
          margin: 18px 0 0;
          color: #7a8798;
          font-size: 13px;
        }

        @media (max-width: 640px) {
          .sentry-card {
            padding: 30px 22px;
            border-radius: 20px;
          }

          .warning-box {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}

export function getServerSideProps() {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
}
