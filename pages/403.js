//frontend/pages/403.js
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl mb-5">🚫</div>

        <h1 className="text-3xl font-bold text-navy mb-3">
          403 — Access Denied
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          You are signed in, but your account does not have permission
          to access this section.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="admin-btn admin-btn-primary px-5 py-2"
          >
            Go to Home
          </Link>

          <Link
            href="/admin"
            className="admin-btn admin-btn-secondary px-5 py-2"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
