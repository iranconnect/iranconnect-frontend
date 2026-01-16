// frontend/hooks/useAuthSession.js
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../utils/apiClient";

/**
 * useAuthSession — IranConnect (Future-proof)
 *
 * Centralized auth/session hook
 * - HttpOnly cookie based
 * - Race-condition safe
 * - No redirect
 * - No UI side effects
 *
 * status:
 *  - "checking"
 *  - "authenticated"
 *  - "unauthenticated"
 */
export function useAuthSession() {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchSession = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const res = await apiClient.get("/auth/me", {
        withCredentials: true,
        validateStatus: (s) => s < 500,
      });

      if (!mountedRef.current) return;

      if (res.status === 200 && res.data?.ok) {
        setUser({
          email: res.data.email || null,
          role: res.data.role || "user",
        });
        setRole(res.data.role || "user");
        setStatus("authenticated");
      } else {
        setUser(null);
        setRole("guest");
        setStatus("unauthenticated");
      }
    } catch {
      if (!mountedRef.current) return;
      setUser(null);
      setRole("guest");
      setStatus("unauthenticated");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchSession();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSession]);

  return {
    status,          // checking | authenticated | unauthenticated
    user,            // { email, role } | null
    role,            // user | admin | superadmin | guest
    refresh: fetchSession,
  };
}
