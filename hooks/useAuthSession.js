// frontend/hooks/useAuthSession.js

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../utils/apiClient";

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

        // Custom Axios config consumed by apiClient interceptor.
        skipAuthRedirect: true,

        validateStatus: (statusCode) => statusCode < 500,
      });

      if (!mountedRef.current) return;

      if (res.status === 200 && res.data?.ok) {
        const sessionRole = res.data.role || "user";

        setUser({
          email: res.data.email || null,
          role: sessionRole,
        });

        setRole(sessionRole);
        setStatus("authenticated");
        return;
      }

      setUser(null);
      setRole("guest");
      setStatus("unauthenticated");
    } catch {
      if (!mountedRef.current) return;

      /*
       * فعلاً network/5xx نیز unauthenticated تلقی می‌شود.
       * در فاز error-state می‌توان status مستقل "error" اضافه کرد.
       */
      setUser(null);
      setRole("guest");
      setStatus("unauthenticated");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSession();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchSession]);

  return {
    status,
    user,
    role,
    refresh: fetchSession,
  };
}
