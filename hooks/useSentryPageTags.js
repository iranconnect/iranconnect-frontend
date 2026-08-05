import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";

import { useAuthSession } from "./useAuthSession";
import { getSentryPageName } from "../utils/sentryPageName";

export function useSentryPageTags({ feature }) {
  const router = useRouter();
  const { status, role } = useAuthSession();

  useEffect(() => {
    if (status === "checking") return;

    Sentry.setTag(
      "role",
      status === "authenticated" ? role : "guest"
    );

    Sentry.setTag(
      "page",
      getSentryPageName(router.pathname)
    );

    if (feature) {
      Sentry.setTag("feature", feature);
    }
  }, [
    router.pathname,
    feature,
    status,
    role,
  ]);
}
