// frontend/components/BusinessClaim.jsx
import ClaimBusinessWidget from "../ClaimBusinessWidget";

export default function BusinessClaim({
  biz,
  isLoggedIn,
  isAdminView,
}) {
  if (isAdminView) return null;

  // 🟢 اگر owner verified
  if (biz.owner_verified) {
    return (
      <div className="mt-10 border-t pt-6 text-center">
        <p className="text-green-600 font-medium">
          🎖️ Verified by owner
        </p>
      </div>
    );
  }

  // ❌ اگر لاگین نیست
  if (!isLoggedIn) {
    return (
      <div className="mt-10 border-t pt-6 text-center">
        <button
          onClick={() =>
            window.location.href = `/auth/login?redirect=/business/${biz.slug}`
          }
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3fd0c9] to-[#2aa7a1] text-white font-medium shadow"
        >
          Claim this business (Login required)
        </button>
      </div>
    );
  }

  // ✅ اگر لاگین کرده
  return (
    <div className="mt-10 border-t pt-6 text-center">
      <ClaimBusinessWidget businessId={biz.id} />
    </div>
  );
}
