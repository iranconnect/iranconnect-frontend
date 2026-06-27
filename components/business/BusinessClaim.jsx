// frontend/components/BusinessClaim.jsx
import ClaimBusinessWidget from "../ClaimBusinessWidget";

export default function BusinessClaim({
  biz,
  isLoggedIn,
  isAdminView,
}) {
  if (!biz) {
    return null;
  }

  if (isAdminView && biz.is_public === false) {
    return null;
  }

  if (biz.owner_verified) {
    return (
      <section className="card mt-10 p-6 text-center space-y-3">
        <div
          className="text-3xl"
          role="img"
          aria-label="Verified business owner"
        >
          🎖️
        </div>

        <h2 className="text-lg font-semibold text-turquoise">
          Verified Business
        </h2>

        <p className="mx-auto max-w-xl text-sm text-[var(--text)]">
          This business has been verified by its owner.
          If you are the rightful owner and believe this verification
          is incorrect, please contact IranConnect support.
        </p>

        <a
          href="/contact"
          className="mt-2 inline-block text-sm text-turquoise hover:underline"
        >
          Contact Support
        </a>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mt-10 border-[var(--border)] pt-0 text-center">
        <button
          type="button"
          onClick={() => {
            window.location.href =
              `/auth/login?redirect=/business/${biz.slug}`;
          }}
          className="btn-primary inline-block px-6 py-3"
        >
          Claim this business
        </button>

        <p className="mt-2 text-sm opacity-70">
          Sign in to start a business claim.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 border-[var(--border)] pt-0 text-center">
      <ClaimBusinessWidget businessId={biz.id} />
    </section>
  );
}
