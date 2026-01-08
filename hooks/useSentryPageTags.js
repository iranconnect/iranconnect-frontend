//frontend/hooks/useSentryPageTags.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";

import { getSessionRole } from "../utils/sessionRole";
import { getSentryPageName } from "../utils/sentryPageName";

export function useSentryPageTags({ feature }) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function apply() {
      const role = await getSessionRole();
      if (!mounted) return;

      Sentry.setTag("role", role);
      Sentry.setTag("page", getSentryPageName(router.pathname));

      if (feature) {
        Sentry.setTag("feature", feature);
      }
    }

    apply();

    return () => {
      mounted = false;
    };
  }, [router.pathname, feature]);
}
