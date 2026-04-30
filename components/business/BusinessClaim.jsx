// frontend/components/BusinessClaim.jsx
import ClaimBusinessWidget from "../ClaimBusinessWidget";

export default function BusinessClaim({
  biz,
  isLoggedIn,
  isAdminView,
}) {
  // 🟢 اگر owner verified
  if (biz.owner_verified) {
    return (
      <div className="card mt-10 p-6 text-center space-y-3">
        <div className="text-3xl">🎖️</div>
  
        <h3 className="text-lg font-semibold text-turquoise">
          Verified Business
        </h3>
  
        <p className="text-sm text-[var(--text)] max-w-xl mx-auto">
          This business has been verified by its owner.
          If you are the rightful owner of this business and believe this
          verification is incorrect, you can contact IranConnect support
          for further assistance.
        </p>
  
        <a
          href="/contact"
          className="inline-block mt-2 text-sm text-turquoise hover:underline"
        >
          Contact Support
        </a>
      </div>
    );
  }

  // ❌ اگر لاگین نیست
  if (!isLoggedIn) {
    return (
      <div className="mt-10 pt-0 text-center border-[var(--border)]">
        <button
          onClick={() =>
            window.location.href = `/auth/login?redirect=/business/${biz.slug}`
          }
          className="btn-primary inline-block px-6 py-3"
        >
          Claim this business (Login required)
        </button>
      </div>
    );
  }

  // ✅ اگر لاگین کرده
  return (
    <div className="mt-10 pt0 text-center border-[var(--border)]">
      <ClaimBusinessWidget businessId={biz.id} />
    </div>
  );
}
