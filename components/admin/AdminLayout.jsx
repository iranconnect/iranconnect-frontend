// frontend/components/admin/AdminLayout.jsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import { useAuthSession } from "../../hooks/useAuthSession";
import { useSentryBaseContext } from "../../hooks/useSentryBaseContext";
import { SentryContextReady } from "../../hooks/useSentryContextStatus";

import {
  rememberLastSafePath,
} from "../../utils/navigationHistory";

const DEFAULT_ALLOWED_ROLES = ["admin", "superadmin"];

export default function AdminLayout({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}) {
  const router = useRouter();

  const [theme, setTheme] = useState("light");

  const {
    status,
    role,
  } = useAuthSession();

  const isAuthenticated = status === "authenticated";
  const isRoleAllowed =
    isAuthenticated && allowedRoles.includes(role);

  /*
   * Only provide a role to Sentry after the role is actually known.
   */
  const sentryReady = useSentryBaseContext({
    role: isAuthenticated ? role : null,
  });

  /* -------------------------------------------------------
     Authentication and page-level authorization
  ---------------------------------------------------------*/
  useEffect(() => {
    if (!router.isReady || status === "checking") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    if (isAuthenticated && !isRoleAllowed) {
      router.replace("/403");
    }
  }, [
    router,
    router.isReady,
    status,
    isAuthenticated,
    isRoleAllowed,
  ]);

  /* -------------------------------------------------------
     Store Admin paths only after authentication and
     page-level role authorization have both succeeded.
  ---------------------------------------------------------*/
  useEffect(() => {
    if (!router.isReady || !isRoleAllowed) {
      return;
    }
    rememberLastSafePath(router.asPath);
  }, [
    router.isReady,
    router.asPath,
    isRoleAllowed,
  ]);

  /* -------------------------------------------------------
     Sentry — authorized Admin page view
  ---------------------------------------------------------*/
  useEffect(() => {
    if (!isRoleAllowed || !role) return;

    if (process.env.NODE_ENV !== "production") {
      Sentry.captureMessage("ADMIN_PAGE_VIEWED_DEBUG", {
        level: "info",
        tags: {
          role,
          page: router.pathname,
          layout: "admin",
        },
      });
    }
  }, [
    isRoleAllowed,
    role,
    router.pathname,
  ]);

  /* -------------------------------------------------------
     Theme
  ---------------------------------------------------------*/
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("iran_theme") || "light";

    setTheme(savedTheme);

    document.documentElement.setAttribute(
      "data-theme",
      savedTheme
    );
  }, []);

  function toggleTheme() {
    const newTheme =
      theme === "light" ? "dark" : "light";

    setTheme(newTheme);

    localStorage.setItem("iran_theme", newTheme);

    document.documentElement.setAttribute(
      "data-theme",
      newTheme
    );
  }

  /* -------------------------------------------------------
     Prevent unauthorized Admin UI flash
  ---------------------------------------------------------*/
  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <img
            src={
              theme === "dark"
                ? "/logo-light.png"
                : "/logo-dark.png"
            }
            alt="IranConnect Logo"
            className="w-28 h-28 mx-auto mb-6 animate-pulse drop-shadow-lg"
          />

          <div className="text-2xl font-semibold tracking-wide mb-3">
            IranConnect Admin
          </div>

          <div className="text-sm opacity-70">
            Verifying session, please wait…
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent border-turquoise rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * Redirect is in progress. Render no protected UI.
   */
  if (!isRoleAllowed) {
    return null;
  }

  return (
    <SentryContextReady.Provider value={sentryReady}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex transition-colors">
        <Sidebar role={role} />

        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar
            toggleTheme={toggleTheme}
            currentTheme={theme}
          />

          <main className="admin-main transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </SentryContextReady.Provider>
  );
}
