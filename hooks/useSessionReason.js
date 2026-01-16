// frontend/hooks/useSessionReason.js
import { useMemo } from "react";
import { useRouter } from "next/router";

/**
 * useSessionReason — IranConnect
 *
 * Normalizes session termination reasons
 * Source of truth: router.query.reason
 *
 * Does NOT:
 * - redirect
 * - mutate state
 * - touch storage
 */
export function useSessionReason() {
  const router = useRouter();
  const rawReason = router.query?.reason;

  const reason = useMemo(() => {
    if (typeof rawReason !== "string") return null;

    switch (rawReason) {
      case "security":
      case "inactive":
      case "expired":
        return rawReason;
      default:
        return null;
    }
  }, [rawReason]);

  return {
    reason,                       // "security" | "inactive" | "expired" | null
    isSecurity: reason === "security",
    isInactive: reason === "inactive",
    isExpired: reason === "expired",
    hasReason: Boolean(reason),
  };
}
