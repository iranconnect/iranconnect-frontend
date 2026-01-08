//frontend/hooks/useSentryBaseContext.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { setSentryBaseContext } from "../utils/sentryContext";

export function useSentryBaseContext({ role }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.pathname) return;
    if (!role) return;

    setSentryBaseContext({
      role,                // ❗ دیگر guest نداریم
      page: router.pathname,
    });

    setReady(true);
  }, [role, router.pathname]);

  return ready;
}

