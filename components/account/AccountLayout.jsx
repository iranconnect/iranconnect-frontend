// frontend/components/account/AccountLayout.jsx
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

import Header from "../Header";
import Footer from "../Footer";

import { getSessionRole } from "../../utils/sessionRole";

import { useSentryBaseContext } from "../../hooks/useSentryBaseContext";
import { SentryContextReady } from "../../hooks/useSentryContextStatus";
import { useSafePageEvent } from "../../hooks/useSafePageEvent";

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

  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const hasRedirectedRef = useRef(false);

  /* ----------------------------------------------------
     🔐 Auth Gate — only USER allowed
  ---------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

  async function checkRole() {
    try {
      const r = await getSessionRole();
  
      if (!mounted) return;
  
      // Allow user, admin, superadmin to access /account
      if (!["user", "admin", "superadmin"].includes(r)) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace("/auth/login");
        }
        return;
      }
      
      setRole(r);

    } catch {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace("/auth/login");
      }
    } finally {
      if (mounted) setChecking(false);
    }
  }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [router]);

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
  if (checking) {
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
