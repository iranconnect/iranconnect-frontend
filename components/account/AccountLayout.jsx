// frontend/components/account/AccountLayout.jsx
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

import Header from "../Header";
import Footer from "../Footer";

import { useAuthSession } from "../../hooks/useAuthSession";

import { useSentryBaseContext } from "../../hooks/useSentryBaseContext";
import { SentryContextReady } from "../../hooks/useSentryContextStatus";
import { useSafePageEvent } from "../../hooks/useSafePageEvent";

function buildLoginRedirectUrl(returnTo) {
  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/account";

  return `/auth/login?redirect=${encodeURIComponent(safeReturnTo)}`;
}

/**
 * AccountLayout — IranConnect
 *
 * Responsibilities:
 * - Enforce authenticated USER access
 * - Set Sentry base context (role, page)
 * - Emit ACCOUNT_PAGE_VIEWED event
 * - Provide consistent Header / Footer
 *
 * ❗ Does NOT:
 * - Handle logout
 * - Handle inactivity
 * - Touch business logic of pages
 */
export default function AccountLayout({ children }) {
  const router = useRouter();

  const { status, role } = useAuthSession();
  const hasRedirectedRef = useRef(false);

  const checking = status === "checking";
  const isAllowed =
    status === "authenticated" &&
    ["user", "admin", "superadmin"].includes(role);

  /* ----------------------------------------------------
     🔐 Auth Gate — authenticated account roles only
  ---------------------------------------------------- */
  useEffect(() => {
    if (!router.isReady || status === "checking") {
      return;
    }

    if (!isAllowed && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;

      router.replace(
        buildLoginRedirectUrl(router.asPath)
      );
    }
  }, [
    router,
    router.isReady,
    router.asPath,
    status,
    isAllowed,
  ]);

  /* ----------------------------------------------------
     🧠 Sentry Base Context
  ---------------------------------------------------- */
  const sentryReady = useSentryBaseContext({
    role,
  });

  /* ----------------------------------------------------
     📊 Observability — Page Viewed
  ---------------------------------------------------- */
  useSafePageEvent("ACCOUNT_PAGE_VIEWED", {
    tags: {
      layout: "account",
    },
  });

  /* ----------------------------------------------------
     ⏳ Loading state (auth check)
  ---------------------------------------------------- */
  if (checking || !isAllowed) {
    return (
      <div className="min-h-screen flex flex-col bg-pagebg text-text">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading account...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  /* ----------------------------------------------------
     ✅ Authenticated Account Render
  ---------------------------------------------------- */
  return (
    <SentryContextReady.Provider value={!!sentryReady}>
      <div className="min-h-screen flex flex-col bg-pagebg text-text">
        <Header />
        <main className="flex-1 section-gap">
          <div className="container-app">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </SentryContextReady.Provider>
  );
}
