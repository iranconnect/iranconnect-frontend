import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found — IranConnect</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="not-found-page">
        <section className="not-found-card">
          <p className="error-code">404</p>
          <h1>Page Not Found</h1>
          <p className="description">
            The page you are looking for could not be found.
          </p>
          <Link href="/" className="home-link">
            Back to Homepage
          </Link>
        </section>
      </main>

      <style jsx>{`
        .not-found-page {
          min-height: 75vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          color: inherit;
        }

        .not-found-card {
          width: 100%;
          max-width: 520px;
          padding: 48px 32px;
          text-align: center;
          border: 1px solid rgba(128, 128, 128, 0.28);
          border-radius: 18px;
          background: rgba(128, 128, 128, 0.06);
        }

        .error-code {
          margin: 0 0 12px;
          font-size: 64px;
          font-weight: 800;
          line-height: 1;
          color: #27bdb8;
        }

        h1 {
          margin: 0 0 16px;
          font-size: 30px;
          line-height: 1.25;
        }

        .description {
          margin: 0 0 28px;
          line-height: 1.7;
          opacity: 0.8;
        }

        .home-link {
          display: inline-block;
          padding: 12px 22px;
          border-radius: 9px;
          background: #27bdb8;
          color: #071d2b;
          font-weight: 700;
          text-decoration: none;
        }

        .home-link:hover {
          background: #46d5cf;
        }

        @media (max-width: 600px) {
          .not-found-page {
            padding: 20px 16px;
          }

          .not-found-card {
            padding: 36px 20px;
          }

          .error-code {
            font-size: 52px;
          }

          h1 {
            font-size: 25px;
          }
        }
      `}</style>
    </>
  );
}
