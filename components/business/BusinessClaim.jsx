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
      <div className="mt-10 pt-0 text-center border-[var(--border)]">
        <p className="text-turquoise font-medium">
          🎖️ Verified by owner
        </p>
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
