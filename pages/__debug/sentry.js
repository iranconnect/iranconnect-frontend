// pages/__debug/sentry.js

export default function SentryTest() {
  return (
    <button
      onClick={() => {
        throw new Error(
          "🔥 FRONTEND_SENTRY_STAGING_TEST"
        );
      }}
    >
      Trigger Sentry Error
    </button>
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
