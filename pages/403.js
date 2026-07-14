// frontend/pages/403.js

import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAuthSession } from "../hooks/useAuthSession";
import {
  consumePreviousSafePath,
} from "../utils/navigationHistory";

export default function ForbiddenPage() {
  const router = useRouter();

  const {
    status,
  } = useAuthSession();

  /*
   * A signed-out user should not remain on the 403 page.
   */
  useEffect(() => {
    if (!router.isReady || status === "checking") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [
    router,
    router.isReady,
    status,
  ]);

  function handleGoBack() {
    const previousPath = consumePreviousSafePath();
    router.replace(previousPath);
  }

  if (status === "checking") {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl mb-5">
          🚫
        </div>

        <h1 className="text-3xl font-bold text-navy mb-3">
          403 — Access Denied
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          You are signed in, but your account does not have
          permission to access this section.
        </p>

        <button
          type="button"
          onClick={handleGoBack}
          className="admin-btn admin-btn-primary px-5 py-2"
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
