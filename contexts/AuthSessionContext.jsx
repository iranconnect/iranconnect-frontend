import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import apiClient from "../utils/apiClient";

export const AuthSessionContext = createContext(null);

export function AuthSessionProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");

  const mountedRef = useRef(false);
  const inFlightRef = useRef(null);

  const applyUnauthenticatedState = useCallback(() => {
    if (!mountedRef.current) return;

    setUser(null);
    setRole("guest");
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    /*
     * All callers share the same in-flight request.
     */
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const request = (async () => {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,

          /*
           * Session discovery must not trigger the global
           * interceptor redirect by itself.
           */
          skipAuthRedirect: true,

          validateStatus: (statusCode) => statusCode < 500,
        });

        if (res.status === 200 && res.data?.ok) {
          const sessionRole = res.data.role || "user";

          if (mountedRef.current) {
            setUser({
              email: res.data.email || null,
              role: sessionRole,
              hasRequests: !!res.data.has_requests,
            });

            setRole(sessionRole);
            setStatus("authenticated");
          }

          return {
            status: "authenticated",
            user: {
              email: res.data.email || null,
              role: sessionRole,
              hasRequests: !!res.data.has_requests,
            },
            role: sessionRole,
          };
        }

        applyUnauthenticatedState();

        return {
          status: "unauthenticated",
          user: null,
          role: "guest",
        };
      } catch {
        applyUnauthenticatedState();

        return {
          status: "unauthenticated",
          user: null,
          role: "guest",
        };
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, [applyUnauthenticatedState]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      status,
      user,
      role,
      refresh,
    }),
    [
      status,
      user,
      role,
      refresh,
    ]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
