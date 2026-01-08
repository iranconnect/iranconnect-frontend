//frontend/hooks/useSentryBaseContext.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { setSentryBaseContext } from "../utils/sentryContext";

export function useSentryBaseContext({ role }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.pathname) return;

    setSentryBaseContext({
      role: role || "guest",
      page: router.pathname,
    });
  }, [role, router.pathname]);
}
